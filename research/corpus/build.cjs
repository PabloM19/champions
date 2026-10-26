'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {loadInputs, writeVersionedFiles} = require('../catalog/build.cjs');
const {digest} = require('../catalog/catalog.cjs');
const {buildCorpus} = require('./corpus.cjs');
const lock = require('./input-lock.json');
const root = path.resolve(__dirname, '../..');

function loadCorpusInputs() {
  const inputs = loadInputs();
  const raw = fs.readFileSync(path.join(root, lock.catalogPath));
  if (digest(raw) !== lock.catalogSha256) throw new Error('Catalogue snapshot checksum changed.');
  const {Move} = require('../catalog/node_modules/@smogon/calc');
  return {...inputs, lock, Move, catalog: JSON.parse(raw)};
}

function main() {
  const inputs = loadCorpusInputs();
  const {corpus, report} = buildCorpus(inputs);
  if (report.errors.length) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }
  const serialized = JSON.stringify(corpus, null, 2) + '\n';
  report.corpusSha256 = digest(serialized);
  writeVersionedFiles(path.join(root, 'data/corpus', lock.corpusVersion), {
    'corpus.json': serialized,
    'report.json': JSON.stringify(report, null, 2) + '\n',
    'NOTICE.txt': fs.readFileSync(path.join(root, 'data/catalog', inputs.catalog.datasetVersion, 'NOTICE.txt'), 'utf8'),
  });
  console.log(JSON.stringify(report, null, 2));
}

if (require.main === module) main();
module.exports = {loadCorpusInputs, main};
