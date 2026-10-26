import {toID} from './ids.js';
const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const VALIDATOR_VERSION = 'candidate-fields-0.1.0';

function validateTeam(input, catalog, corpus) {
  if (corpus.catalogVersion !== catalog.datasetVersion) {
    throw new Error('Corpus and catalogue versions do not match.');
  }
  const issues = [], members = [];
  const exactForms = new Map(catalog.rosterForms.map(form => [form.showdownId, form]));
  const moves = new Map(corpus.moves.map(move => [move.id, move]));
  const abilities = new Map(corpus.abilities.map(ability => [ability.id, ability]));
  const items = new Map(corpus.items.map(item => [item.id, item]));
  const natures = new Set(corpus.natures.map(nature => nature.id));
  const learnsets = new Map(corpus.learnsets.map(learnset => [learnset.id, new Set(learnset.moves)]));
  const usedItems = new Map(), usedSpecies = new Map();
  const add = (kind, code, memberIndex, field, sourceId = 'showdown') => issues.push({kind, code, memberIndex, field, sourceId});
  if (!Array.isArray(input)) {
    return {validatorVersion: VALIDATOR_VERSION, status: 'published_fields_conflict', trainingReady: false,
      issues: [{kind: 'error', code: 'team_not_array', field: 'team', memberIndex: null, sourceId: 'input_schema'}], members};
  }
  if (input.length !== 6) add('error', 'team_size_not_six', null, 'team', 'specification');
  input.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      add('error', 'invalid_member', index, 'member', 'input_schema');
      return;
    }
    const result = {index, formId: null, candidateFormIds: [], sp: null, knownFields: [], unknownFields: []};
    members.push(result);
    function unknown(field, code = 'missing_' + field) {
      if (!result.unknownFields.includes(field)) result.unknownFields.push(field);
      add('unknown', code, index, field, 'source_completeness');
    }
    const rawSpecies = raw.species ?? raw.id ?? raw.name;
    const providedId = toID(rawSpecies);
    const form = exactForms.get(providedId);
    if (form) {
      result.formId = form.id;
      result.knownFields.push('species');
      if (usedSpecies.has(form.nationalDexNumber)) add('error', 'duplicate_species_candidate_rule', index, 'species');
      usedSpecies.set(form.nationalDexNumber, index);
    } else if (!providedId) {
      unknown('species');
    } else {
      const candidates = catalog.rosterForms.filter(candidate =>
        toID(candidate.officialName.split('(')[0].trim()) === providedId);
      result.candidateFormIds = candidates.map(candidate => candidate.id);
      if (candidates.length) unknown('species', 'provider_form_requires_confirmation');
      else if (catalog.battleForms.some(candidate => candidate.showdownId === providedId)) {
        unknown('species', 'battle_form_requires_import_normalization');
      } else add('error', 'species_not_in_official_roster', index, 'species', 'official-eligibility');
    }
    const abilityId = toID(raw.ability);
    if (!abilityId) unknown('ability');
    else if (!abilities.has(abilityId)) add('error', 'unknown_or_unavailable_ability', index, 'ability');
    else {
      result.knownFields.push('ability');
      if (abilities.get(abilityId).availability === 'referenced_with_availability_conflict') {
        unknown('ability', 'ability_availability_conflict');
      }
      if (form && !form.mechanics.abilities.some(ability => ability.id === abilityId)) {
        const matchingMega = catalog.transitions.filter(transition => transition.fromFormId === form.id &&
          transition.kind === 'mega_evolution' && transition.requiredItemId === 'item:' + toID(raw.item))
          .map(transition => catalog.battleForms.find(candidate => candidate.id === transition.toFormId))
          .some(candidate => candidate.mechanics.abilities.some(ability => ability.id === abilityId));
        if (matchingMega) unknown('abilityStage', 'ability_stage_requires_confirmation');
        else add('error', 'ability_not_on_roster_form', index, 'ability');
      }
    }
    const itemId = toID(raw.item);
    if (!itemId) unknown('item', 'item_absent_or_unspecified');
    else if (!items.has(itemId)) add('error', 'unknown_or_unavailable_item', index, 'item');
    else {
      result.knownFields.push('item');
      if (usedItems.has(itemId)) add('error', 'duplicate_held_item', index, 'item', 'official-regulation');
      usedItems.set(itemId, index);
      if (form && items.get(itemId).megaStone && !Object.keys(items.get(itemId).megaStone)
        .some(name => toID(name) === form.showdownId)) {
        add('warning', 'mega_stone_has_no_transformation_for_holder', index, 'item');
      }
    }
    const natureId = toID(raw.nature);
    if (!natureId) unknown('nature');
    else if (!natures.has(natureId)) add('error', 'unknown_nature', index, 'nature');
    else result.knownFields.push('nature');

    const rawMoves = raw.moves ?? raw.attacks;
    if (!Array.isArray(rawMoves)) unknown('moves');
    else {
      const ids = rawMoves.map(toID);
      if (ids.length > 4) add('error', 'too_many_moves', index, 'moves', 'input_schema');
      if (ids.length < 4 || ids.some(moveId => !moveId)) unknown('moves', 'move_slots_not_complete');
      else result.knownFields.push('moves');
      if (new Set(ids.filter(Boolean)).size !== ids.filter(Boolean).length) add('error', 'duplicate_move', index, 'moves');
      for (const moveId of ids.filter(Boolean)) {
        if (!moves.has(moveId)) add('error', 'unknown_or_unavailable_move', index, 'moves');
        else if (form && !learnsets.get(form.id)?.has(moveId)) add('error', 'move_not_in_champions_learnset', index, 'moves');
      }
    }
    if (raw.tera) add('warning', 'legacy_tera_field_not_enabled', index, 'tera', 'input_schema');
    if (raw.evs !== undefined) unknown('sp', 'ev_input_requires_explicit_conversion');
    if (raw.sp === undefined || raw.sp === null) unknown('sp');
    else if (typeof raw.sp !== 'object' || Array.isArray(raw.sp)) add('error', 'invalid_sp_object', index, 'sp', 'sp_input_contract');
    else {
      result.sp = structuredClone(raw.sp);
      if (Object.keys(raw.sp).some(key => !STATS.includes(key))) add('error', 'unknown_sp_stat', index, 'sp', 'sp_input_contract');
      const values = STATS.map(stat => raw.sp[stat]);
      if (values.some(value => value === undefined)) unknown('sp', 'sp_distribution_incomplete');
      const present = values.filter(value => value !== undefined);
      if (present.some(value => !Number.isInteger(value) || value < 0 || value > 32)) {
        add('error', 'sp_out_of_range', index, 'sp', 'sp_input_contract');
      } else if (present.reduce((sum, value) => sum + value, 0) > 66) {
        add('error', 'sp_total_above_66', index, 'sp', 'sp_input_contract');
      } else if (present.length === 6) result.knownFields.push('sp');
    }
  });
  const errors = issues.filter(issue => issue.kind === 'error').length;
  const unknowns = issues.filter(issue => issue.kind === 'unknown').length;
  return {
    validatorVersion: VALIDATOR_VERSION,
    status: errors ? 'published_fields_conflict' : unknowns ? 'incomplete_candidate' : 'candidate_checks_passed',
    trainingReady: false,
    versions: {catalog: catalog.datasetVersion, corpus: corpus.corpusVersion},
    validationScope: 'Published fields and candidate corpus. Joint move constraints, battle mechanics and game equivalence are pending.',
    issues, members,
  };
}

export {validateTeam, VALIDATOR_VERSION};
