'use strict';

const {digest} = require('../catalog/catalog.cjs');
const MOVE_FIELDS = [
  'accuracy', 'basePower', 'category', 'type', 'priority', 'target', 'flags',
  'multihit', 'multiaccuracy', 'recoil', 'drain', 'status', 'volatileStatus',
  'sideCondition', 'slotCondition', 'weather', 'terrain', 'pseudoWeather',
  'boosts', 'self', 'secondary', 'secondaries', 'selfSwitch', 'forceSwitch',
  'heal', 'willCrit', 'critRatio', 'ohko', 'ignoreAbility', 'ignoreDefensive',
  'ignoreOffensive', 'breaksProtect', 'hasCrashDamage', 'mindBlownRecoil',
  'struggleRecoil', 'smartTarget', 'tracksTarget', 'nonGhostTarget',
  'condition', 'damage', 'noPPBoosts',
];
const ITEM_FIELDS = ['isBerry', 'isGem', 'isPokeball', 'megaStone', 'megaEvolves',
  'itemUser', 'fling', 'naturalGift', 'boosts', 'condition', 'flags'];
const ABILITY_FIELDS = ['flags', 'suppressWeather', 'affectsFainted', 'condition'];
const toID = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sort = values => [...values].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function serialize(value) {
  if (typeof value === 'function') return {upstreamHandlerSha256: digest(value.toString()), implementation: 'reference_only'};
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([, nested]) => nested !== undefined)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, nested]) => [key, serialize(nested)]));
  return null;
}

function effectReference(record, fields) {
  const selected = new Set([...fields, ...Object.keys(record).filter(key =>
    key.startsWith('on') || key.endsWith('Callback'))]);
  const data = Object.fromEntries([...selected].sort().filter(key => record[key] !== undefined)
    .map(key => [key, serialize(record[key])]));
  const handlers = [];
  function visit(value, currentPath) {
    if (typeof value === 'function') {
      handlers.push({path: currentPath, sha256: digest(value.toString())});
    } else if (value && typeof value === 'object') {
      for (const [key, nested] of Object.entries(value)) visit(nested, currentPath ? currentPath + '.' + key : key);
    }
  }
  for (const key of selected) visit(record[key], key);
  return {data, handlers: handlers.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
    implementation: 'reference_only', turnEvaluationImplemented: false};
}

function recordOrigin(kind, record) {
  return {sourceId: 'showdown', resolvedMod: 'champions', recordKey: kind + '.' + record.id,
    verification: 'community_source_pending_game_reference'};
}

function buildCorpus({dex, calc, Move, catalog, lock}) {
  const errors = [];
  const moves = sort(dex.moves.all().filter(record => !record.isNonstandard).map(move => {
    const effectivePP = dex.data.Scripts.calculatePP(move, 0);
    if (!Number.isInteger(effectivePP) || effectivePP < 1) errors.push({code: 'invalid_pp', moveId: move.id});
    return {
      id: move.id, name: move.name, type: move.type, category: move.category,
      basePower: move.basePower, accuracy: move.accuracy, priority: move.priority, target: move.target,
      pp: {reference: move.pp, champions: effectivePP, sourceId: 'showdown_scripts_calculate_pp'},
      availability: 'simulator_candidate', source: recordOrigin('Moves', move),
      effects: effectReference(move, MOVE_FIELDS),
    };
  }));
  const referencedAbilities = new Set([...catalog.rosterForms, ...catalog.battleForms]
    .flatMap(form => form.mechanics.abilities.map(ability => ability.id)));
  const abilities = sort(dex.abilities.all().filter(record => !record.isNonstandard || referencedAbilities.has(record.id)).map(ability => ({
    id: ability.id, name: ability.name,
    availability: ability.isNonstandard ? 'referenced_with_availability_conflict' : 'simulator_candidate',
    upstreamAvailabilityFlag: ability.isNonstandard,
    source: recordOrigin('Abilities', ability), effects: effectReference(ability, ABILITY_FIELDS),
  })));
  const items = sort(dex.items.all().filter(record => !record.isNonstandard).map(item => ({
    id: item.id, name: item.name, availability: 'simulator_candidate',
    megaStone: item.megaStone || null, source: recordOrigin('Items', item),
    effects: effectReference(item, ITEM_FIELDS),
  })));
  const moveIds = new Set(moves.map(move => move.id));
  const itemIds = new Set(items.map(item => item.id));
  const abilityIds = new Set(abilities.map(ability => ability.id));
  const learnsets = catalog.rosterForms.map(form => {
    const pool = [...dex.species.getMovePool(form.showdownId)].sort();
    const upstream = dex.species.getFullLearnset(form.showdownId);
    const sourceByMove = Object.fromEntries(pool.map(moveId => [moveId, upstream
      .filter(source => source.learnset[moveId]?.some(code => code.startsWith('9')))
      .map(source => ({speciesId: source.species.id,
        sourceCodes: source.learnset[moveId].filter(code => code.startsWith('9'))}))]));
    if (!pool.length) errors.push({code: 'empty_learnset', formId: form.id});
    for (const moveId of pool) if (!moveIds.has(moveId)) errors.push({code: 'unavailable_learnset_move', formId: form.id, moveId});
    return {id: form.id, showdownId: form.showdownId, moves: pool, sourcesByMove: sourceByMove,
      sourceId: 'showdown', method: 'champions_native_get_move_pool',
      scope: 'individual_move_membership_no_joint_event_validation'};
  });
  for (const form of [...catalog.rosterForms, ...catalog.battleForms]) {
    for (const ability of form.mechanics.abilities) {
      if (!abilityIds.has(ability.id)) errors.push({code: 'missing_form_ability', formId: form.id, abilityId: ability.id});
    }
  }
  for (const stone of catalog.megaStones) {
    if (!itemIds.has(stone.showdownId)) errors.push({code: 'missing_mega_stone', itemId: stone.showdownId});
  }
  const patchChecks = [];
  for (const removed of lock.officialPatch.removedLearnsetEntries) {
    const relevant = learnsets.filter(learnset => learnset.showdownId === removed.species);
    const passed = relevant.length === 1 && !relevant[0].moves.includes(removed.move);
    patchChecks.push({kind: 'removed_learnset_move', ...removed, passed});
  }
  for (const moveId of lock.officialPatch.availableMoves) {
    patchChecks.push({kind: 'available_move', moveId, passed: moveIds.has(moveId)});
  }
  for (const [moveId, expectedPP] of Object.entries(lock.officialPatch.effectivePP)) {
    const observedPP = moves.find(move => move.id === moveId)?.pp.champions;
    patchChecks.push({kind: 'effective_pp', moveId, expectedPP, observedPP, passed: observedPP === expectedPP});
  }
  for (const check of patchChecks) if (!check.passed) errors.push({code: 'official_patch_mismatch', check});
  const calculatorDifferences = [], calculatorMissingMoves = [];
  for (const move of moves) {
    if (!calc.moves.get(move.id)) {calculatorMissingMoves.push(move.id); continue;}
    const other = new Move(calc, move.name);
    const fields = {};
    for (const key of ['basePower', 'type', 'category', 'priority']) {
      const value = key === 'basePower' ? other.bp : other[key];
      if (move[key] !== value) fields[key] = {showdown: move[key], calculator: value};
    }
    if (Object.keys(fields).length) calculatorDifferences.push({moveId: move.id, fields,
      interpretation: 'Implementation difference; requires review in context, not an automatic gameplay verdict.'});
  }
  const availabilityConflicts = abilities.filter(ability => ability.upstreamAvailabilityFlag).map(ability => ({
    kind: 'ability', id: ability.id, upstreamFlag: ability.upstreamAvailabilityFlag,
    referencedBy: [...catalog.rosterForms, ...catalog.battleForms]
      .filter(form => form.mechanics.abilities.some(candidate => candidate.id === ability.id)).map(form => form.id),
    resolution: 'unresolved_do_not_treat_as_available_or_unavailable_automatically',
  }));
  const reachableMoves = new Set(learnsets.flatMap(learnset => learnset.moves));
  const corpus = {
    schemaVersion: 1, corpusVersion: lock.corpusVersion, catalogVersion: catalog.datasetVersion,
    catalogSha256: lock.catalogSha256, reviewedOn: lock.reviewedOn, status: 'candidate', runtimeReady: false,
    sources: {...catalog.sources,
      'showdown_scripts_calculate_pp': {sourceId: 'showdown', path: 'data/mods/champions/scripts.ts', method: 'calculatePP'},
      'official-september-patch': {url: lock.officialPatch.url, effectiveOn: '2026-09-09'}},
    moves, abilities, items, learnsets: sort(learnsets),
    natures: sort(dex.natures.all().map(nature => ({
      id: nature.id, name: nature.name, plus: nature.plus || null, minus: nature.minus || null, sourceId: 'showdown',
    }))),
    battleLearnsets: catalog.transitions.map(transition => ({
      battleFormId: transition.toFormId, rosterFormId: transition.fromFormId, sourceId: 'catalog_transition',
      interpretation: 'Use the pre-battle set; transformation does not grant a new set of moves.',
    })),
    coverage: {turnEffectsImplemented: 0, effectRecordsAreReferences: true,
      unresolved: ['in_game_references', 'joint_move_constraints', 'full_battle_order',
        'all_item_legality_from_official_source', 'ability_conflicts_in_catalog']},
  };
  const report = {
    schemaVersion: 1, corpusVersion: lock.corpusVersion, status: errors.length ? 'failed' : 'candidate_generated',
    moves: moves.length, movesReachableFromRoster: reachableMoves.size, abilities: abilities.length,
    items: items.length, natures: corpus.natures.length, learnsets: learnsets.length,
    learnsetMemberships: learnsets.reduce((sum, learnset) => sum + learnset.moves.length, 0),
    effectRecords: moves.length + abilities.length + items.length,
    handlerReferences: [...moves, ...abilities, ...items].reduce((sum, record) => sum + record.effects.handlers.length, 0),
    patchChecks, calculatorDifferences, calculatorMissingMoves, availabilityConflicts, errors,
    gameValidation: 'pending', runtimeReady: false,
  };
  return {corpus, report};
}

module.exports = {buildCorpus, effectReference, toID};
