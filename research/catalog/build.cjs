'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {parseOfficial, buildCatalog, digest} = require('./catalog.cjs');
const lock = require('./input-lock.json');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, lock.showdown.directory);

function loadInputs() {
  const archive = fs.readFileSync(path.join(root, lock.showdown.archivePath));
  if (digest(archive) !== lock.showdown.archiveSha256) throw new Error('Source archive checksum mismatch.');
  const entries = parseOfficial(fs.readFileSync(path.join(root, lock.official.cachedHtml)), lock.official.sha256);
  require('tsx/cjs');
  const {Dex} = require(path.join(source, 'sim/dex.ts'));
  const {Generations} = require('@smogon/calc');
  const packageVersion = require('@smogon/calc/package.json').version;
  if (packageVersion !== lock.calc.version) throw new Error('Calculator version mismatch.');
  return {entries, dex: Dex.mod(lock.showdown.mod), calc: Generations.get(lock.calc.generation), lock};
}

function writeVersionedFiles(output, files) {
  fs.mkdirSync(output, {recursive: true});
  for (const [name, content] of Object.entries(files)) {
    const destination = path.join(output, name);
    if (fs.existsSync(destination) && fs.readFileSync(destination, 'utf8') !== content) {
      throw new Error('Existing dataset version differs. Review and create a new datasetVersion: ' + name);
    }
  }
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(output, name), content);
}

function main() {
  const {catalog, report} = buildCatalog(loadInputs());
  if (report.errors.length) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }
  const output = path.join(root, 'data/catalog', lock.datasetVersion);
  const serialized = JSON.stringify(catalog, null, 2) + '\n';
  report.catalogSha256 = digest(serialized);
  const files = {
    'catalog.json': serialized,
    'report.json': JSON.stringify(report, null, 2) + '\n',
    'NOTICE.txt': 'Technical data derived from Pokémon Showdown at ' + lock.showdown.commit +
      '.\n\n' + fs.readFileSync(path.join(source, 'LICENSE'), 'utf8') +
      '\nPokémon names and marks belong to their respective rights holders. No images are included.\n',
  };
  writeVersionedFiles(output, files);
  console.log(JSON.stringify(report, null, 2));
}

if (require.main === module) main();
module.exports = {loadInputs, writeVersionedFiles, main};
