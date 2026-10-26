'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadCorpusInputs} = require('./build.cjs');
const {buildCorpus} = require('./corpus.cjs');
const {digest} = require('../catalog/catalog.cjs');
const {validateTeam} = require('./validate-team.cjs');
const {summarizeTournament} = require('./probe-tournament.cjs');
const inputs = loadCorpusInputs();
const {corpus, report} = buildCorpus(inputs);
const {catalog} = inputs;
const move = id => corpus.moves.find(record => record.id === id);
const pool = id => corpus.learnsets.find(record => record.showdownId === id).moves;

function syntheticTeam() {
  const spread = {hp: 2, atk: 0, def: 0, spa: 32, spd: 0, spe: 32};
  return [
    {species: 'Gengar', ability: 'Cursed Body', item: 'Gengarite', nature: 'Modest',
      moves: ['Shadow Ball', 'Sludge Bomb', 'Protect', 'Perish Song'], sp: {...spread}},
    {species: 'Rillaboom', ability: 'Grassy Surge', item: 'Miracle Seed', nature: 'Adamant',
      moves: ['Wood Hammer', 'Grassy Glide', 'Fake Out', 'Protect'], sp: {...spread, atk: 32, spa: 0}},
    {species: 'Incineroar', ability: 'Intimidate', item: 'Leftovers', nature: 'Careful',
      moves: ['Flare Blitz', 'Parting Shot', 'Fake Out', 'Protect'], sp: {...spread, hp: 32, spa: 0, spd: 2}},
    {species: 'Primarina', ability: 'Liquid Voice', item: 'Sitrus Berry', nature: 'Modest',
      moves: ['Moonblast', 'Hyper Voice', 'Perish Song', 'Protect'], sp: {...spread}},
    {species: 'Garchomp', ability: 'Rough Skin', item: 'Life Orb', nature: 'Jolly',
      moves: ['Dragon Claw', 'Earthquake', 'Rock Slide', 'Protect'], sp: {...spread, atk: 32, spa: 0}},
    {species: 'Whimsicott', ability: 'Prankster', item: 'Focus Sash', nature: 'Timid',
      moves: ['Moonblast', 'Encore', 'Tailwind', 'Protect'], sp: {...spread}},
  ];
}
const validate = team => validateTeam(team, catalog, corpus);
const hasIssue = (result, code) => result.issues.some(issue => issue.code === code);

test('A corpus from another catalogue version is rejected before validating a team', () => {
  assert.throws(() => validateTeam(syntheticTeam(), catalog, {
    ...corpus, catalogVersion: 'another-version',
  }), /versions do not match/);
});

test('The candidate corpus covers the pinned catalogue and every referenced ability', () => {
  assert.equal(report.errors.length, 0);
  assert.equal(corpus.moves.length, 515);
  assert.equal(corpus.abilities.length, 317);
  assert.equal(corpus.items.length, 166);
  assert.equal(corpus.natures.length, 25);
  assert.equal(corpus.learnsets.length, 262);
  assert.equal(report.learnsetMemberships, 15987);
  assert.equal(report.movesReachableFromRoster, 510);
  for (const form of [...catalog.rosterForms, ...catalog.battleForms]) {
    for (const ability of form.mechanics.abilities) assert.ok(corpus.abilities.some(candidate => candidate.id === ability.id));
  }
});

test('The six September patch assertions pass, using effective Champions PP', () => {
  assert.equal(report.patchChecks.length, 6);
  assert.ok(report.patchChecks.every(check => check.passed));
  assert.equal(move('wish').pp.reference, 5);
  assert.equal(move('wish').pp.champions, 8);
  assert.equal(move('strengthsap').pp.champions, 8);
  assert.equal(pool('politoed').includes('pound'), false);
  assert.equal(pool('archaludon').includes('mirrorcoat'), false);
  assert.equal(pool('archaludon').includes('metalburst'), false);
});

test('A failed official patch assertion prevents the corpus from being accepted', () => {
  const lock = structuredClone(inputs.lock);
  lock.officialPatch.effectivePP.wish = 12;
  const broken = buildCorpus({...inputs, lock});
  assert.equal(broken.report.status, 'failed');
  assert.ok(broken.report.errors.some(error => error.code === 'official_patch_mismatch'));
});

test('Form-specific learnsets preserve Rotom-Wash and female Indeedee distinctions', () => {
  assert.ok(pool('rotomwash').includes('hydropump'));
  assert.equal(pool('rotom').includes('hydropump'), false);
  assert.ok(pool('indeedeef').includes('followme'));
  assert.equal(pool('indeedee').includes('followme'), false);
  assert.ok(pool('vivillonfancy').includes('ragepowder'));
  assert.ok(pool('mausholdfour').includes('followme'));
});

test('Every learnset membership has a known move and an upstream generation-nine source', () => {
  const ids = new Set(corpus.moves.map(move => move.id));
  for (const learnset of corpus.learnsets) {
    assert.ok(learnset.moves.length);
    for (const moveId of learnset.moves) {
      assert.ok(ids.has(moveId));
      assert.ok(learnset.sourcesByMove[moveId].length);
      for (const source of learnset.sourcesByMove[moveId]) {
        assert.ok(source.speciesId);
        assert.ok(source.sourceCodes.length);
        assert.ok(source.sourceCodes.every(code => code.startsWith('9')));
      }
    }
  }
});

test('Nested effect conditions and event handlers remain traceable references', () => {
  assert.equal(move('followme').effects.data.condition.duration, 1);
  assert.equal(move('trickroom').effects.data.condition.duration, 5);
  assert.ok(move('protect').effects.handlers.some(handler => handler.path.startsWith('condition.')));
  for (const record of [...corpus.moves, ...corpus.abilities, ...corpus.items]) {
    assert.equal(record.effects.turnEvaluationImplemented, false);
    assert.equal(record.effects.implementation, 'reference_only');
    for (const handler of record.effects.handlers) assert.match(handler.sha256, /^[a-f0-9]{64}$/);
  }
  assert.equal(corpus.coverage.turnEffectsImplemented, 0);
});

test('Aura Guard is preserved with its upstream availability conflict', () => {
  const ability = corpus.abilities.find(ability => ability.id === 'auraguard');
  assert.equal(ability.upstreamAvailabilityFlag, 'Future');
  assert.equal(ability.availability, 'referenced_with_availability_conflict');
  assert.ok(report.availabilityConflicts.some(conflict => conflict.id === 'auraguard' &&
    conflict.referencedBy.includes('battle-form:lucariomegaz')));
});

test('Priority data comes from the corpus and differences with the calculator stay visible', () => {
  assert.equal(move('fakeout').priority, 3);
  assert.equal(move('protect').priority, 4);
  assert.equal(move('trickroom').priority, -7);
  assert.equal(report.calculatorDifferences.length, 12);
  const trickRoom = report.calculatorDifferences.find(record => record.moveId === 'trickroom');
  assert.deepEqual(trickRoom.fields.priority, {showdown: -7, calculator: 0});
  assert.deepEqual(report.calculatorMissingMoves, ['pound']);
});

test('The corpus is deterministic, checksummed and leaves the catalogue snapshot intact', () => {
  const output = path.join(__dirname, '../../data/corpus', inputs.lock.corpusVersion);
  const stored = fs.readFileSync(path.join(output, 'corpus.json'));
  const storedReport = JSON.parse(fs.readFileSync(path.join(output, 'report.json')));
  assert.equal(stored.toString(), JSON.stringify(corpus, null, 2) + '\n');
  assert.equal(digest(stored), storedReport.corpusSha256);
  assert.equal(digest(fs.readFileSync(path.join(__dirname, '../..', inputs.lock.catalogPath))), inputs.lock.catalogSha256);
  assert.equal(corpus.runtimeReady, false);
  assert.equal(corpus.status, 'candidate');
});

test('Complete known fields can pass candidate checks without being approved for training', () => {
  const result = validate(syntheticTeam());
  assert.equal(result.status, 'candidate_checks_passed');
  assert.deepEqual(result.issues, []);
  assert.equal(result.trainingReady, false);
});

test('Missing SP remains unknown and validation never mutates the supplied sets', () => {
  const team = syntheticTeam();
  for (const member of team) delete member.sp;
  const original = structuredClone(team);
  const result = validate(team);
  assert.equal(result.status, 'incomplete_candidate');
  assert.ok(result.members.every(member => member.sp === null));
  assert.equal(result.issues.filter(issue => issue.code === 'missing_sp').length, 6);
  assert.deepEqual(team, original);
});

test('Partial SP is not silently filled with zero and classic EVs are not interpreted as SP', () => {
  const team = syntheticTeam();
  team[0].sp = {hp: 2};
  delete team[1].sp;
  team[1].evs = {atk: 252, spe: 252, hp: 4};
  const result = validate(team);
  assert.ok(hasIssue(result, 'sp_distribution_incomplete'));
  assert.deepEqual(result.members[0].sp, {hp: 2});
  assert.equal(result.members[1].sp, null);
  assert.ok(hasIssue(result, 'ev_input_requires_explicit_conversion'));
});

test('SP limits reject 33, negative, fractional, string values and totals above 66', () => {
  for (const value of [33, -1, 1.5, '32']) {
    const team = syntheticTeam();
    team[0].sp.spa = value;
    assert.ok(hasIssue(validate(team), 'sp_out_of_range'));
  }
  const team = syntheticTeam();
  team[0].sp = {hp: 32, atk: 32, def: 32, spa: 0, spd: 0, spe: 0};
  assert.ok(hasIssue(validate(team), 'sp_total_above_66'));
});

test('A known global move cannot be assigned to a species that cannot learn it', () => {
  const team = syntheticTeam();
  team[4].moves[0] = 'Fake Out';
  assert.ok(move('fakeout'));
  assert.ok(hasIssue(validate(team), 'move_not_in_champions_learnset'));
});

test('Duplicate moves and more than four slots are rejected', () => {
  const team = syntheticTeam();
  team[0].moves = ['Protect', 'protect', 'Shadow Ball', 'Sludge Bomb', 'Perish Song'];
  const result = validate(team);
  assert.ok(hasIssue(result, 'duplicate_move'));
  assert.ok(hasIssue(result, 'too_many_moves'));
});

test('Duplicate held items fail but distinct mega stones are not capped at one per roster', () => {
  const team = syntheticTeam();
  team[1].item = 'Gengarite';
  assert.ok(hasIssue(validate(team), 'duplicate_held_item'));
  const twoMegas = syntheticTeam();
  twoMegas[4].item = 'Garchompite';
  assert.equal(validate(twoMegas).status, 'candidate_checks_passed');
});

test('A provider generic form is left for confirmation rather than being guessed', () => {
  const team = syntheticTeam();
  team[5] = {...team[5], species: 'Vivillon', ability: 'Compound Eyes',
    moves: ['Hurricane', 'Sleep Powder', 'Rage Powder', 'Protect']};
  const result = validate(team);
  assert.equal(result.members[5].formId, null);
  assert.deepEqual(result.members[5].candidateFormIds, ['pokemon-form:0666-018']);
  assert.ok(hasIssue(result, 'provider_form_requires_confirmation'));
  assert.equal(result.status, 'incomplete_candidate');
});

test('A post-mega ability with a matching stone requires stage confirmation, not a silent correction', () => {
  const team = syntheticTeam();
  team[0].ability = 'Shadow Tag';
  const result = validate(team);
  assert.ok(hasIssue(result, 'ability_stage_requires_confirmation'));
  assert.equal(hasIssue(result, 'ability_not_on_roster_form'), false);
  assert.equal(team[0].ability, 'Shadow Tag');
  assert.equal(result.status, 'incomplete_candidate');
});

test('An incorrect ability without the matching transformation still conflicts with the candidate corpus', () => {
  const team = syntheticTeam();
  team[0].ability = 'Shadow Tag';
  team[0].item = 'Mystic Water';
  assert.ok(hasIssue(validate(team), 'ability_not_on_roster_form'));
});

test('A battle-only species requires import normalization before becoming a preview member', () => {
  const team = syntheticTeam();
  team[0].species = 'Gengar-Mega';
  const result = validate(team);
  assert.equal(result.members[0].formId, null);
  assert.ok(hasIssue(result, 'battle_form_requires_import_normalization'));
});

test('Malformed inputs, unknown items, unknown natures and duplicate species produce explicit diagnostics', () => {
  assert.ok(hasIssue(validate(null), 'team_not_array'));
  assert.ok(hasIssue(validate([]), 'team_size_not_six'));
  const team = syntheticTeam();
  team[1].species = 'Gengar';
  team[2].item = 'Not An Item';
  team[3].nature = 'Not A Nature';
  const result = validate(team);
  assert.ok(hasIssue(result, 'duplicate_species_candidate_rule'));
  assert.ok(hasIssue(result, 'unknown_or_unavailable_item'));
  assert.ok(hasIssue(result, 'unknown_nature'));
});

test('Legacy tera data is reported without enabling a different mechanic', () => {
  const team = syntheticTeam();
  team[0].tera = 'Ghost';
  const result = validate(team);
  assert.ok(hasIssue(result, 'legacy_tera_field_not_enabled'));
  assert.equal(result.trainingReady, false);
});

test('A tournament summary omits player identities and raw sets, and rejects other formats', () => {
  const details = {id: 'synthetic-event', game: 'VGC', format: 'M-C', platform: 'SWITCH',
    isPublic: true, name: 'Synthetic test event', date: '2026-10-19'};
  const standings = [{name: 'Private Fixture Name', player: 'private-fixture-id', decklist: syntheticTeam()}];
  const result = summarizeTournament({details, standings, catalog, corpus, sourceHash: 'fixture'});
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes('Private Fixture Name'), false);
  assert.equal(serialized.includes('private-fixture-id'), false);
  assert.equal(serialized.includes('Shadow Ball'), false);
  assert.equal(result.playerNamesPublished, false);
  assert.equal(result.rawSetsPublished, false);
  assert.throws(() => summarizeTournament({
    details: {...details, format: 'SVI'}, standings, catalog, corpus, sourceHash: 'fixture',
  }), /does not match/);
});
