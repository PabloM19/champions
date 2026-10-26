import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const inputs = [
  ['data/catalog/m-c-2026-10-19.1/catalog.json', '01fc28d8d3ea59ae01c5ebc8054c67cd425ab80189df61edff0960c54712962e'],
  ['data/corpus/m-c-2026-10-19.corpus.1/corpus.json', '44de1314a229868e8d742ed011a2217ad1e4914005f57d605535eb9f688611d6'],
];
const loaded = [];
for (const [path, hash] of inputs) {
  const raw = await readFile(new URL('../' + path, import.meta.url));
  if (createHash('sha256').update(raw).digest('hex') !== hash) throw new Error('Dataset checksum mismatch: ' + path);
  loaded.push(JSON.parse(raw));
}
const [sourceCatalog, full] = loaded;
const catalog={datasetVersion:sourceCatalog.datasetVersion,regulation:sourceCatalog.regulation,
  rosterForms:sourceCatalog.rosterForms.map(({id,nationalDexNumber,officialName,canonicalName,showdownId,mechanics})=>
    ({id,nationalDexNumber,officialName,canonicalName,showdownId,mechanics:{types:mechanics.types,abilities:mechanics.abilities,baseStats:mechanics.baseStats}})),
  battleForms:sourceCatalog.battleForms.map(({id,showdownId,canonicalName,mechanics})=>({id,showdownId,canonicalName,mechanics:{abilities:mechanics.abilities,baseStats:mechanics.baseStats}})),
  transitions:sourceCatalog.transitions,
};
const corpus = {...full,
  moves: full.moves.map(({id, name, type}) => ({id, name, type})),
  abilities: full.abilities.map(({id, name, availability}) => ({id, name, availability})),
  items: full.items.map(({id, name, megaStone}) => ({id, name, megaStone})),
  learnsets: full.learnsets.map(({id, moves}) => ({id, moves})),
};
delete corpus.battleLearnsets;
await mkdir(new URL('../src/data/', import.meta.url), {recursive:true});
await writeFile(new URL('../src/data/candidates.json', import.meta.url), JSON.stringify({catalog, corpus}));
console.log('Client candidate dataset generated from verified snapshots.');
