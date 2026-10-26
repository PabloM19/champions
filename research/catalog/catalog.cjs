'use strict';

const {createHash} = require('node:crypto');
const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const id = value => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function parseOfficial(html, expectedSha) {
  if (digest(html) !== expectedSha) throw new Error('Official input hash changed; review a new dataset version.');
  const match = html.toString().match(/const pokemons\s*=\s*(\[.*?\]);\s*const/s);
  if (!match) throw new Error('Official eligibility array not found.');
  const entries = JSON.parse(match[1]);
  if (!Array.isArray(entries) || !entries.length) throw new Error('Empty official eligibility list.');
  return entries;
}

function mechanics(species, dex) {
  return {
    types: [...species.types],
    baseStats: Object.fromEntries(STATS.map(stat => [stat, species.baseStats[stat]])),
    weightKg: species.weightkg,
    gender: species.gender || 'variable',
    abilities: Object.entries(species.abilities).map(([slot, name]) => {
      if (!dex.abilities.get(name).exists) throw new Error('Unknown ability: ' + name);
      return {slot, id: id(name), name};
    }),
    verification: 'community_source_pending_game_reference',
    sourceId: 'showdown',
  };
}

function compareCalculator(species, calc, aliases = {}) {
  const alias = aliases[species.id];
  const calcId = alias ? alias.id : species.id;
  const other = calc.species.get(calcId);
  if (!other) throw new Error('Missing calculator form: ' + calcId);
  for (const stat of STATS) {
    if (other.baseStats[stat] !== species.baseStats[stat]) {
      throw new Error('Base stat mismatch for ' + species.id + '.' + stat);
    }
  }
  if (other.types.join('/') !== species.types.join('/')) {
    throw new Error('Type mismatch for ' + species.id);
  }
  const defaultAbilityMatches = other.abilities?.[0] === species.abilities[0];
  return {
    id: calcId,
    method: alias ? 'reviewed_alias' : 'exact_id',
    ...(alias ? {reason: alias.reason} : {}),
    matchingFields: ['types', 'six_base_stats', ...(defaultAbilityMatches ? ['default_ability'] : [])],
    defaultAbility: {
      status: defaultAbilityMatches ? 'matching' : 'conflict',
      showdown: species.abilities[0],
      calculator: other.abilities?.[0] ?? null,
    },
    explicitSetAbilityRequired: true,
  };
}

function mapOfficialEntry(row, dex, byNumber, calc, lock) {
  if (!Array.isArray(row) || row.length !== 3 || !/^\d{4}-\d{3}$/.test(row[0]) ||
      row[1] !== 1 || typeof row[2] !== 'string' || !row[2].trim()) {
    throw new Error('Unexpected official entry structure: ' + JSON.stringify(row));
  }
  const [officialId, , officialName] = row;
  const [number, formIndex] = officialId.split('-').map(Number);
  const bases = byNumber.get(number) || [];
  if (bases.length !== 1) throw new Error('Ambiguous base species for ' + officialId);
  const base = bases[0];
  if (id(officialName.split('(')[0].trim()) !== id(base.name)) {
    throw new Error('Official label and species number disagree: ' + officialId);
  }
  const name = base.formeOrder ? base.formeOrder[formIndex] : formIndex === 0 ? base.name : undefined;
  if (!name) throw new Error('Unresolved official form index: ' + officialId);
  const species = dex.species.get(name);
  if (!species.exists || species.num !== number || species.battleOnly || species.isNonstandard) {
    throw new Error('Incompatible roster form: ' + officialId + ' -> ' + name);
  }
  return {
    id: 'pokemon-form:' + officialId,
    officialId,
    nationalDexNumber: number,
    officialFormIndex: formIndex,
    officialName,
    canonicalName: species.name,
    showdownId: species.id,
    kind: 'roster',
    selectableAtTeamPreview: true,
    eligibility: {status: 'official_listed', regulationId: 'champions-m-c', sourceId: 'official-eligibility'},
    mapping: {method: 'national_dex_and_pinned_game_form_order', sourceId: 'showdown', recordId: base.id},
    calculator: compareCalculator(species, calc, lock.calcAliases),
    mechanics: mechanics(species, dex),
  };
}

function buildCatalog({entries, dex, calc, lock}) {
  const errors = [];
  const all = dex.species.all();
  const byNumber = new Map();
  for (const species of all.filter(species => !species.forme && !species.battleOnly)) {
    const values = byNumber.get(species.num) || [];
    values.push(species);
    byNumber.set(species.num, values);
  }
  const rosterForms = [];
  const seenOfficial = new Set();
  for (const row of entries) {
    try {
      if (seenOfficial.has(row[0])) throw new Error('Duplicate official ID: ' + row[0]);
      seenOfficial.add(row[0]);
      rosterForms.push(mapOfficialEntry(row, dex, byNumber, calc, lock));
    } catch (error) {
      errors.push({stage: 'roster_mapping', officialId: row?.[0], message: error.message});
    }
  }
  if (entries.length !== lock.official.expectedEntries) errors.push({stage: 'coverage', message: 'Official entry count changed.'});
  if (new Set(rosterForms.map(form => form.nationalDexNumber)).size !== lock.official.expectedSpecies) {
    errors.push({stage: 'coverage', message: 'National dex species count changed.'});
  }
  if (new Set(rosterForms.map(form => form.showdownId)).size !== rosterForms.length) {
    errors.push({stage: 'coverage', message: 'Different official forms collapsed to the same technical ID.'});
  }
  const rosterByShowdown = new Map(rosterForms.map(form => [form.showdownId, form]));
  const battleForms = new Map();
  const megaStones = new Map();
  const transitions = [];

  function addBattleForm(species) {
    if (!battleForms.has(species.id)) battleForms.set(species.id, {
      id: 'battle-form:' + species.id,
      showdownId: species.id,
      nationalDexNumber: species.num,
      canonicalName: species.name,
      kind: species.isMega ? 'mega' : 'ability_transformation',
      selectableAtTeamPreview: false,
      officialId: null,
      eligibility: {
        status: lock.official.newlyAnnouncedMegas.includes(species.id) ? 'officially_announced' : 'technical_candidate',
        sourceId: lock.official.newlyAnnouncedMegas.includes(species.id) ? 'official-regulation' : 'showdown',
      },
      calculator: compareCalculator(species, calc, lock.calcAliases),
      mechanics: mechanics(species, dex),
    });
    return battleForms.get(species.id);
  }

  for (const item of dex.items.all().filter(item => item.megaStone && !item.isNonstandard)) {
    for (const [fromName, toName] of Object.entries(item.megaStone)) {
      const from = rosterByShowdown.get(id(fromName));
      if (!from) continue;
      try {
        const target = dex.species.get(toName);
        if (!target.exists || !target.isMega || target.isNonstandard ||
            ![].concat(target.battleOnly || []).some(name => id(name) === from.showdownId)) {
          throw new Error('Inconsistent mega source/target: ' + item.id);
        }
        if (id(target.requiredItem) !== item.id) throw new Error('Required item mismatch: ' + target.id);
        const calcItem = calc.items.get(item.id);
        if (id(calcItem?.megaStone?.[fromName]) !== target.id) throw new Error('Calculator mega item mismatch: ' + item.id);
        const battle = addBattleForm(target);
        const stoneId = 'item:' + item.id;
        if (!megaStones.has(item.id)) megaStones.set(item.id, {
          id: stoneId, showdownId: item.id, name: item.name,
          eligibility: {status: 'technical_candidate', sourceId: 'showdown'},
          verification: 'matching_showdown_and_calc',
        });
        transitions.push({
          id: from.id + '->' + battle.id,
          fromFormId: from.id, toFormId: battle.id, kind: 'mega_evolution',
          requiredItemId: stoneId, requiredAbilityId: null,
          consumesMegaEvolutionUse: true, activationTimingVerified: false,
          sourceId: 'showdown',
        });
      } catch (error) {
        errors.push({stage: 'mega_mapping', itemId: item.id, message: error.message});
      }
    }
  }

  for (const species of all.filter(species => species.battleOnly && !species.isMega && !species.isNonstandard)) {
    for (const fromName of [].concat(species.battleOnly)) {
      const from = rosterByShowdown.get(id(fromName));
      if (!from) continue;
      try {
        if (!species.requiredAbility) throw new Error('Transformation trigger requires explicit review: ' + species.id);
        const fromSpecies = dex.species.get(from.showdownId);
        if (!Object.values(fromSpecies.abilities).includes(species.requiredAbility)) {
          throw new Error('Required ability absent on source form: ' + species.id);
        }
        const battle = addBattleForm(species);
        transitions.push({
          id: from.id + '->' + battle.id,
          fromFormId: from.id, toFormId: battle.id, kind: 'ability_transformation',
          requiredItemId: null, requiredAbilityId: id(species.requiredAbility),
          consumesMegaEvolutionUse: false, activationTimingVerified: false,
          sourceId: 'showdown',
        });
      } catch (error) {
        errors.push({stage: 'battle_form_mapping', showdownId: species.id, message: error.message});
      }
    }
  }
  for (const announced of lock.official.newlyAnnouncedMegas) {
    if (!battleForms.has(announced)) errors.push({stage: 'official_mega_coverage', showdownId: announced, message: 'Missing newly announced mega.'});
  }
  const sortById = values => [...values].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const catalog = {
    schemaVersion: 1, datasetVersion: lock.datasetVersion, status: 'candidate',
    reviewedOn: lock.reviewedOn,
    runtimeReady: false,
    regulation: {
      id: 'champions-m-c', battleMode: 'doubles', period: lock.official.period,
      maxMegaEvolutionsPerBattle: 1, duplicateHeldItemsAllowed: false,
      maxMegaStonesPerRoster: null,
    },
    sources: {
      'official-eligibility': {url: lock.official.eligibilityUrl, sha256: lock.official.sha256},
      'official-regulation': {url: lock.official.regulationUrl},
      showdown: {repository: 'https://github.com/smogon/pokemon-showdown', commit: lock.showdown.commit,
        mod: lock.showdown.mod, archiveSha256: lock.showdown.archiveSha256, license: 'MIT'},
      calculator: {package: lock.calc.package, version: lock.calc.version, generation: lock.calc.generation},
    },
    rosterForms: sortById(rosterForms),
    battleForms: sortById(battleForms.values()),
    megaStones: sortById(megaStones.values()),
    transitions: sortById(transitions),
    remainingValidation: ['held_item_and_move_legality', 'complete_ability_effects',
      'official_evidence_for_all_mega_stones', 'activation_sequences_in_game', 'spanish_translations'],
  };
  const conflicts = [...rosterForms, ...battleForms.values()]
    .filter(form => form.calculator.defaultAbility.status === 'conflict')
    .map(form => ({formId: form.id, showdownId: form.showdownId, field: 'default_ability',
      ...form.calculator.defaultAbility, resolution: 'unresolved_use_no_implicit_calculator_default'}));
  const report = {
    schemaVersion: 1, datasetVersion: lock.datasetVersion,
    status: errors.length ? 'failed' : conflicts.length ? 'mapped_with_explicit_conflicts' : 'mapped_and_cross_checked',
    officialEntries: entries.length, mappedEntries: rosterForms.length,
    nationalDexSpecies: new Set(rosterForms.map(form => form.nationalDexNumber)).size,
    battleForms: battleForms.size, megaForms: [...battleForms.values()].filter(form => form.kind === 'mega').length,
    megaStones: megaStones.size, transitions: transitions.length,
    calculatorAliases: rosterForms.filter(form => form.calculator.method === 'reviewed_alias').map(form => ({
      officialId: form.officialId, showdownId: form.showdownId, calculatorId: form.calculator.id,
    })),
    errors, conflicts, gameValidation: 'pending', runtimeReady: false,
  };
  return {catalog, report};
}

module.exports = {parseOfficial, mapOfficialEntry, compareCalculator, buildCatalog, digest};
