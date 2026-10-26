'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {digest} = require('../catalog/catalog.cjs');
const {writeVersionedFiles} = require('../catalog/build.cjs');
const {validateTeam, VALIDATOR_VERSION} = require('./validate-team.cjs');
const lock = require('./input-lock.json');
const root = path.resolve(__dirname, '../..');

function summarizeTournament({details, standings, catalog, corpus, sourceHash}) {
  if (details.format !== 'M-C' || details.game !== 'VGC' || details.platform !== 'SWITCH' || !details.isPublic) {
    throw new Error('Tournament does not match the audited public Champions M-C sample.');
  }
  const results = standings.map((row, index) => ({index, validation: validateTeam(row.decklist, catalog, corpus)}));
  const countCodes = kind => {
    const counts = {};
    for (const {validation} of results) for (const issue of validation.issues) {
      if (issue.kind === kind) counts[issue.code] = (counts[issue.code] || 0) + 1;
    }
    return counts;
  };
  const totals = {};
  for (const {validation} of results) totals[validation.status] = (totals[validation.status] || 0) + 1;
  return {
    schemaVersion: 1,
    validatorVersion: VALIDATOR_VERSION,
    source: {eventId: details.id, name: details.name, date: details.date, format: details.format, platform: details.platform,
      url: 'https://play.limitlesstcg.com/api/tournaments/' + details.id + '/standings', sha256: sourceHash},
    versions: {catalog: catalog.datasetVersion, corpus: corpus.corpusVersion},
    totalTeamlists: standings.length, totals,
    unknownCounts: countCodes('unknown'), conflictCounts: countCodes('error'), warningCounts: countCodes('warning'),
    rows: results.map(({index, validation}) => ({
      sourceRowIndex: index, status: validation.status, memberCount: validation.members.length,
      membersWithoutSp: validation.members.filter(member => member.sp === null).length,
      unresolvedForms: validation.members.filter(member => !member.formId).map(member => ({
        memberIndex: member.index, candidateFormIds: member.candidateFormIds,
      })),
      conflicts: validation.issues.filter(issue => issue.kind === 'error'),
      warnings: validation.issues.filter(issue => issue.kind === 'warning'),
    })),
    playerNamesPublished: false, rawSetsPublished: false, trainingReady: false,
    interpretation: 'Read-only review of a cached source sample; this is not an approved training bank.',
  };
}

function main() {
  const rawCatalog = fs.readFileSync(path.join(root, lock.catalogPath));
  if (digest(rawCatalog) !== lock.catalogSha256) throw new Error('Catalogue checksum changed.');
  const catalog = JSON.parse(rawCatalog);
  const corpusDirectory = path.join(root, 'data/corpus', lock.corpusVersion);
  const rawCorpus = fs.readFileSync(path.join(corpusDirectory, 'corpus.json'));
  const corpusReport = JSON.parse(fs.readFileSync(path.join(corpusDirectory, 'report.json')));
  if (digest(rawCorpus) !== corpusReport.corpusSha256) throw new Error('Corpus checksum changed.');
  const rawDetails = fs.readFileSync(path.join(root, '.cache/audit/limitless-details.json'));
  const details = JSON.parse(rawDetails);
  const raw = fs.readFileSync(path.join(root, '.cache/audit/limitless-standings.json'));
  const evidence = JSON.parse(fs.readFileSync(path.join(root, 'research/evidence/source-probes-2026-10-19.json')));
  const expected = evidence.probes.find(probe => probe.id === 'limitless-standings').sha256;
  const expectedDetails = evidence.probes.find(probe => probe.id === 'limitless-details').sha256;
  if (digest(rawDetails) !== expectedDetails) throw new Error('Cached tournament details changed.');
  if (digest(raw) !== expected) throw new Error('Cached source sample changed; review new evidence.');
  const report = summarizeTournament({details, standings: JSON.parse(raw), catalog, corpus: JSON.parse(rawCorpus), sourceHash: digest(raw)});
  writeVersionedFiles(path.join(root, 'research/evidence', VALIDATOR_VERSION), {
    'tournament-review.json': JSON.stringify(report, null, 2) + '\n',
  });
  console.log(JSON.stringify({...report, rows: undefined}, null, 2));
}

if (require.main === module) main();
module.exports = {summarizeTournament, main};
