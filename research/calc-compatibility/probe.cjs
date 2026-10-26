'use strict';

// Checks the published package API. These are not validations against the game.
const assert = require('node:assert/strict');
const {writeFileSync} = require('node:fs');
const {resolve} = require('node:path');
const {Generations, Pokemon, Move, Field, calculate} = require('@smogon/calc');
const pkg = require('@smogon/calc/package.json');
const gen = Generations.get(0);
const checks = [];

function check(id, description, run) {
  try {
    const observed = run();
    checks.push({id, description, status: 'passed', observed: observed ?? null});
  } catch (error) {
    checks.push({id, description, status: 'failed', error: error.message});
  }
}

function damage(attacker, defender, move, field = {}) {
  return calculate(gen, attacker, defender, new Move(gen, move), new Field(field));
}

check('C01', 'Modo Champions disponible como generación 0', () => {
  assert.equal(gen.num, 0);
  return gen.num;
});
check('C02', 'Garchomp neutral sin SP coincide con aritmética candidata', () => {
  const stats = new Pokemon(gen, 'Garchomp').rawStats;
  assert.deepEqual(stats, {hp: 183, atk: 150, def: 115, spa: 100, spd: 105, spe: 122});
  return stats;
});
check('C03', 'Reparto de 66 SP y naturaleza Jolly', () => {
  const stats = new Pokemon(gen, 'Garchomp', {
    nature: 'Jolly', evs: {hp: 2, atk: 32, spe: 32},
  }).rawStats;
  assert.deepEqual(stats, {hp: 185, atk: 182, def: 115, spa: 90, spd: 105, spe: 169});
  return stats;
});
check('C04', 'Un SP aumenta los PS de 183 a 184', () => {
  const hp = new Pokemon(gen, 'Garchomp', {evs: {hp: 1}}).rawStats.hp;
  assert.equal(hp, 184);
  return hp;
});
check('C05', 'Naturaleza Adamant con 32 SP en ataque', () => {
  const attack = new Pokemon(gen, 'Garchomp', {nature: 'Adamant', evs: {atk: 32}}).rawStats.atk;
  assert.equal(attack, 200);
  return attack;
});
check('C06', 'El modo Champions fija nivel 50 e ignora IVs proporcionados', () => {
  const pokemon = new Pokemon(gen, 'Garchomp', {level: 1, ivs: {hp: 0, atk: 0, spe: 0}});
  assert.equal(pokemon.level, 50);
  assert.equal(pokemon.rawStats.hp, 183);
  assert.equal(pokemon.rawStats.atk, 150);
  return {level: pokemon.level, hp: pokemon.rawStats.hp, attack: pokemon.rawStats.atk};
});
check('C07', 'Las seis megas citadas como novedades M-C están en el catálogo de la biblioteca', () => {
  const ids = ['absolmegaz', 'salamencemega', 'garchompmegaz', 'lucariomegaz', 'golisopodmega', 'baxcaliburmega'];
  const present = ids.map(id => ({id, present: !!gen.species.get(id)}));
  assert.ok(present.every(entry => entry.present));
  return present;
});

const garchomp = new Pokemon(gen, 'Garchomp', {nature: 'Jolly', evs: {hp: 2, atk: 32, spe: 32}});
const incineroar = new Pokemon(gen, 'Incineroar');
check('C08', 'Protección devuelve daño cero en el escenario proporcionado', () => {
  const result = damage(garchomp, incineroar, 'Earthquake', {
    gameType: 'Doubles', defenderSide: {isProtected: true},
  });
  assert.deepEqual(result.range(), [0, 0]);
  return result.range();
});
check('C09', 'Inmunidad de tipo Volador frente a Terremoto', () => {
  const result = damage(garchomp, new Pokemon(gen, 'Corviknight', {ability: 'Pressure'}), 'Earthquake');
  assert.deepEqual(result.range(), [0, 0]);
  return result.range();
});
check('C10', 'Campo Psíquico bloquea Sorpresa contra un objetivo en tierra', () => {
  const result = damage(incineroar, garchomp, 'Fake Out', {terrain: 'Psychic', gameType: 'Doubles'});
  assert.deepEqual(result.range(), [0, 0]);
  return result.range();
});
check('C11', 'Armor Tail bloquea Sorpresa dirigida al propio Farigiraf', () => {
  const target = new Pokemon(gen, 'Farigiraf', {ability: 'Armor Tail'});
  const result = damage(incineroar, target, 'Fake Out', {gameType: 'Doubles'});
  assert.deepEqual(result.range(), [0, 0]);
  return result.range();
});
check('C12', 'El cálculo diferencia daño de área en dobles e individuales', () => {
  const singles = damage(garchomp, incineroar, 'Earthquake', {gameType: 'Singles'}).range();
  const doubles = damage(garchomp, incineroar, 'Earthquake', {gameType: 'Doubles'}).range();
  assert.ok(doubles[1] > 0 && doubles[1] < singles[1]);
  return {singles, doubles};
});
check('C13', 'Espacio Raro devuelve daño cero sin resolver una secuencia de turnos', () => {
  const result = damage(new Pokemon(gen, 'Farigiraf'), garchomp, 'Trick Room');
  assert.deepEqual(result.range(), [0, 0]);
  return {damage: result.range(), interpretation: 'No demuestra que Espacio Raro llegue a activarse.'};
});
check('C14', 'Sorpresa conserva prioridad +3 en los datos de la biblioteca', () => {
  const priority = new Move(gen, 'Fake Out').priority;
  assert.equal(priority, 3);
  return priority;
});

// Boundary observations: the calculator is deliberately not a legality validator.
const boundaries = [];
for (const [id, evs] of [
  ['SP_ABOVE_32', {spe: 33}],
  ['SP_TOTAL_ABOVE_66', {hp: 32, atk: 32, def: 32}],
  ['RAW_EVS_PASSED_AS_SP', {spe: 252}],
]) {
  try {
    const pokemon = new Pokemon(gen, 'Garchomp', {evs});
    boundaries.push({id, acceptedByLibrary: true, input: evs, stats: pokemon.rawStats});
  } catch (error) {
    boundaries.push({id, acceptedByLibrary: false, error: error.message});
  }
}

const report = {
  schemaVersion: 1,
  executedAt: new Date().toISOString(),
  package: {name: pkg.name, version: pkg.version, license: pkg.license},
  nodeVersion: process.version,
  validationScope: 'Published library API and candidate arithmetic; no independent in-game ground truth.',
  gameValidation: 'pending',
  passed: checks.filter(check => check.status === 'passed').length,
  failed: checks.filter(check => check.status === 'failed').length,
  checks,
  boundaries,
};
if (process.argv[2]) writeFileSync(resolve(process.argv[2]), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
