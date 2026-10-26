'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {tmpdir} = require('node:os');
const {loadInputs, writeVersionedFiles} = require('./build.cjs');
const {buildCatalog, parseOfficial, digest, compareCalculator} = require('./catalog.cjs');
const inputs = loadInputs();
const {catalog, report} = buildCatalog(inputs);
const roster = officialId => catalog.rosterForms.find(form => form.officialId === officialId);
const target = showdownId => catalog.battleForms.find(form => form.showdownId === showdownId);

test('The official snapshot maps all 262 entries and 231 species without collapsing forms', () => {
  assert.equal(report.errors.length, 0);
  assert.equal(catalog.rosterForms.length, 262);
  assert.equal(new Set(catalog.rosterForms.map(form => form.officialId)).size, 262);
  assert.equal(new Set(catalog.rosterForms.map(form => form.showdownId)).size, 262);
  assert.equal(new Set(catalog.rosterForms.map(form => form.nationalDexNumber)).size, 231);
});

test('Ambiguous visible names retain the correct in-game form index', () => {
  const expectations = {
    '0666-018': 'vivillonfancy', '0670-005': 'floetteeternal', '0925-001': 'mausholdfour',
    '0931-000': 'squawkabilly', '0931-002': 'squawkabillyyellow',
    '0080-002': 'slowbrogalar', '0711-003': 'gourgeistsuper',
  };
  for (const [officialId, expected] of Object.entries(expectations)) assert.equal(roster(officialId).showdownId, expected);
  assert.equal(roster('0931-002').mechanics.abilities.find(ability => ability.slot === 'H').name, 'Sheer Force');
  assert.equal(roster('0931-000').mechanics.abilities.find(ability => ability.slot === 'H').name, 'Guts');
});

test('Female forms and regional Tauros are distinct', () => {
  assert.equal(roster('0128-003').showdownId, 'taurospaldeaaqua');
  assert.equal(roster('0678-001').showdownId, 'meowsticf');
  assert.equal(roster('0876-001').showdownId, 'indeedeef');
  assert.equal(roster('0902-001').showdownId, 'basculegionf');
  assert.notDeepEqual(roster('0902-000').mechanics.baseStats, roster('0902-001').mechanics.baseStats);
});

test('No unlisted default or cosmetic variant is silently made eligible', () => {
  const ids = new Set(catalog.rosterForms.map(form => form.showdownId));
  for (const notListed of ['floette', 'vivillon', 'maushold', 'squawkabillyblue', 'squawkabillywhite']) {
    assert.equal(ids.has(notListed), false, notListed);
  }
});

test('Aegislash uses the reviewed Shield alias, with defensive stats intact', () => {
  const shield = roster('0681-000');
  assert.equal(shield.calculator.id, 'aegislashshield');
  assert.equal(shield.mechanics.baseStats.def, 140);
  assert.equal(shield.mechanics.baseStats.atk, 50);
  assert.equal(target('aegislashblade').mechanics.baseStats.atk, 140);
});

test('A renamed official label cannot be joined using only its species number', () => {
  const entries = structuredClone(inputs.entries);
  entries[0][2] = 'Charizard';
  const result = buildCatalog({...inputs, entries});
  assert.ok(result.report.errors.some(error => error.message.includes('label and species number disagree')));
});

test('An unknown form index fails rather than falling back to the default form', () => {
  const entries = structuredClone(inputs.entries);
  entries[0][0] = '0003-999';
  const result = buildCatalog({...inputs, entries});
  assert.ok(result.report.errors.some(error => error.message.includes('Unresolved official form index')));
});

test('Duplicate official IDs and changed coverage fail the build', () => {
  const result = buildCatalog({...inputs, entries: [...inputs.entries, inputs.entries[0]]});
  assert.ok(result.report.errors.some(error => error.message.includes('Duplicate official ID')));
  assert.ok(result.report.errors.some(error => error.message.includes('entry count changed')));
});

test('A battle-only form cannot enter the team-preview roster through its form index', () => {
  const result = buildCatalog({...inputs, entries: [...inputs.entries, ['0003-001', 1, 'Venusaur']]});
  assert.ok(result.report.errors.some(error => error.message.includes('Incompatible roster form')));
});

test('A modified official snapshot is rejected before parsing', () => {
  assert.throws(() => parseOfficial(Buffer.from('changed'), inputs.lock.official.sha256), /hash changed/);
  const empty = Buffer.from('<script>const pokemons = [];const noPrefix = "";</script>');
  assert.throws(() => parseOfficial(empty, digest(empty)), /Empty official/);
});

test('Base stats cannot be replaced by calculated values from a provider', () => {
  const species = inputs.dex.species.get('garchomp');
  const fakeCalc = {species: {get: () => ({
    ...inputs.calc.species.get('garchomp'),
    baseStats: {...species.baseStats, hp: 183},
  })}};
  assert.throws(() => compareCalculator(species, fakeCalc), /Base stat mismatch/);
});

test('Mega and ability transformations stay out of the initial roster', () => {
  assert.equal(catalog.battleForms.length, 89);
  assert.equal(report.megaForms, 82);
  assert.equal(catalog.megaStones.length, 81);
  for (const form of catalog.battleForms) {
    assert.equal(form.selectableAtTeamPreview, false);
    assert.equal(form.officialId, null);
  }
  assert.equal(target('palafinhero').kind, 'ability_transformation');
  assert.equal(catalog.rosterForms.some(form => form.showdownId === 'palafinhero'), false);
});

test('Every transition references existing forms and its exact required stone or ability', () => {
  const rosterIds = new Set(catalog.rosterForms.map(form => form.id));
  const battleIds = new Set(catalog.battleForms.map(form => form.id));
  const itemIds = new Set(catalog.megaStones.map(item => item.id));
  assert.equal(new Set(catalog.transitions.map(transition => transition.id)).size, catalog.transitions.length);
  for (const transition of catalog.transitions) {
    assert.ok(rosterIds.has(transition.fromFormId));
    assert.ok(battleIds.has(transition.toFormId));
    if (transition.kind === 'mega_evolution') {
      assert.ok(itemIds.has(transition.requiredItemId));
      assert.equal(transition.consumesMegaEvolutionUse, true);
    } else {
      const form = catalog.rosterForms.find(form => form.id === transition.fromFormId);
      assert.ok(form.mechanics.abilities.some(ability => ability.id === transition.requiredAbilityId));
      assert.equal(transition.consumesMegaEvolutionUse, false);
    }
  }
});

test('One Meowsticite preserves separate male and female targets', () => {
  const links = catalog.transitions.filter(transition => transition.requiredItemId === 'item:meowsticite');
  assert.equal(links.length, 2);
  assert.deepEqual(links.map(link => link.fromFormId).sort(), ['pokemon-form:0678-000', 'pokemon-form:0678-001']);
  assert.equal(new Set(links.map(link => link.toFormId)).size, 2);
});

test('Mega stones are not incorrectly applied to regional forms or ordinary Floette', () => {
  assert.equal(catalog.transitions.some(link => link.kind === 'mega_evolution' &&
    ['pokemon-form:0026-001', 'pokemon-form:0080-002'].includes(link.fromFormId)), false);
  const floette = catalog.transitions.find(link => link.requiredItemId === 'item:floettite');
  assert.equal(floette.fromFormId, 'pokemon-form:0670-005');
});

test('The six newly announced megas retain official evidence without elevating other candidates', () => {
  for (const id of inputs.lock.official.newlyAnnouncedMegas) assert.equal(target(id).eligibility.status, 'officially_announced');
  assert.equal(target('charizardmegay').eligibility.status, 'technical_candidate');
  assert.equal(catalog.regulation.maxMegaEvolutionsPerBattle, 1);
  assert.equal(catalog.regulation.maxMegaStonesPerRoster, null);
});

test('Ability conflicts are visible and never reported as matching fields', () => {
  assert.deepEqual(report.conflicts.map(conflict => conflict.showdownId).sort(), ['hawluchamega', 'skarmorymega']);
  assert.equal(target('hawluchamega').calculator.defaultAbility.showdown, 'No Guard');
  assert.equal(target('hawluchamega').calculator.defaultAbility.calculator, 'Limber');
  assert.equal(target('skarmorymega').calculator.defaultAbility.showdown, 'Stalwart');
  assert.equal(target('skarmorymega').calculator.defaultAbility.calculator, 'Keen Eye');
  for (const conflict of report.conflicts) {
    const form = target(conflict.showdownId);
    assert.equal(form.calculator.matchingFields.includes('default_ability'), false);
    assert.equal(form.calculator.explicitSetAbilityRequired, true);
  }
});

test('Provenance and pending game validation are preserved on all technical data', () => {
  assert.equal(catalog.status, 'candidate');
  assert.equal(catalog.runtimeReady, false);
  for (const form of [...catalog.rosterForms, ...catalog.battleForms]) {
    assert.equal(form.mechanics.sourceId, 'showdown');
    assert.equal(form.mechanics.verification, 'community_source_pending_game_reference');
    assert.equal(form.calculator.explicitSetAbilityRequired, true);
  }
});

test('The generated snapshot is deterministic and matches its recorded checksum', () => {
  const output = path.join(__dirname, '../../data/catalog', inputs.lock.datasetVersion);
  const stored = fs.readFileSync(path.join(output, 'catalog.json'), 'utf8');
  const storedReport = JSON.parse(fs.readFileSync(path.join(output, 'report.json'), 'utf8'));
  assert.equal(stored, JSON.stringify(catalog, null, 2) + '\n');
  assert.equal(digest(stored), storedReport.catalogSha256);
  const rebuilt = buildCatalog(inputs).catalog;
  assert.deepEqual(rebuilt, catalog);
});

test('A changed version is rejected before any sibling file can be published', () => {
  const directory = fs.mkdtempSync(path.join(tmpdir(), 'champions-version-'));
  try {
    writeVersionedFiles(directory, {'catalog.json': 'original', 'report.json': 'original report'});
    assert.throws(() => writeVersionedFiles(directory, {
      'new-file.json': 'must not be written', 'catalog.json': 'changed',
    }), /Existing dataset version differs/);
    assert.equal(fs.readFileSync(path.join(directory, 'catalog.json'), 'utf8'), 'original');
    assert.equal(fs.readFileSync(path.join(directory, 'report.json'), 'utf8'), 'original report');
    assert.equal(fs.existsSync(path.join(directory, 'new-file.json')), false);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('An identical generation can be repeated without changing version contents', () => {
  const directory = fs.mkdtempSync(path.join(tmpdir(), 'champions-repeat-'));
  try {
    const files = {'catalog.json': 'same catalogue', 'report.json': 'same report'};
    writeVersionedFiles(directory, files);
    writeVersionedFiles(directory, files);
    for (const [name, expected] of Object.entries(files)) {
      assert.equal(fs.readFileSync(path.join(directory, name), 'utf8'), expected);
    }
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
