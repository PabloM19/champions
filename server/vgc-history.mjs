import {parse} from 'acorn';
import {z} from 'zod';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {validateTeam} from '../src/domain/validate-team.js';
import {toID} from '../src/domain/ids.js';

const BASE='https://vgchistory.com';
const sha=text=>createHash('sha256').update(text).digest('hex');
const CACHE_MS=5*60*1000;
export const ADAPTER_VERSION='vgc-history-0.1.1';
const eventSchema=z.object({id:z.string().regex(/^[a-z0-9-]+$/),name:z.string(),dates:z.string(),year:z.number(),season:z.number().optional(),reg:z.string(),game:z.string(),division:z.string().optional(),sheets:z.number().optional(),verified:z.boolean().optional(),stKind:z.string().optional()}).passthrough();
const sheetMember=z.object({s:z.string(),item:z.string().nullable().optional(),ab:z.string().nullable().optional(),nature:z.string().nullable().optional(),moves:z.array(z.string()).max(4),tera:z.string().nullable().optional()}).passthrough();
const sheetsSchema=z.record(z.string().regex(/^\d+$/),z.unknown());
const completeSheetSchema=z.array(sheetMember).length(6);
const rowSchema=z.tuple([z.number().int(),z.string(),z.string(),z.string(),z.string(),z.array(z.string()),z.union([z.number(),z.boolean()])]).rest(z.unknown());

// Interpret only literal values from the named declaration. Never execute the remote JS wrapper.
export function staticValue(node) {
  if(!node)throw new Error('Dato estático ausente.');
  if(node.type==='Literal' && !node.regex && ['string','number','boolean','object'].includes(typeof node.value))return node.value;
  if(node.type==='ArrayExpression')return node.elements.map(staticValue);
  if(node.type==='UnaryExpression'&&node.operator==='-'&&node.argument.type==='Literal'&&typeof node.argument.value==='number')return -node.argument.value;
  if(node.type==='ObjectExpression')return Object.fromEntries(node.properties.map(property=>{
    if(property.type!=='Property'||property.kind!=='init'||property.computed||property.method)throw new Error('El registro contiene una expresión no estática.');
    const key=property.key.name??property.key.value;
    if(['__proto__','prototype','constructor'].includes(String(key)))throw new Error('Clave no admitida.');
    return [key,staticValue(property.value)];
  }));
  throw new Error('El formato del registro ha cambiado; no se ejecutará código remoto.');
}
export function parseEvents(source) {
  const ast=parse(source,{ecmaVersion:'latest'});
  let declarations=[];
  function visit(node) {
    if(!node||typeof node!=='object')return;
    if(node.type==='VariableDeclarator'&&node.id?.type==='Identifier'&&node.id.name==='T')declarations.push(node);
    for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
  }
  visit(ast);
  if(declarations.length!==1)throw new Error('No se reconoce el registro de torneos.');
  return z.array(eventSchema).parse(staticValue(declarations[0].init));
}
export function selectLatestEvents(events,limit=3) {
  // Source order is recent-first. Keep that order instead of inventing timestamps from date labels.
  return events.filter(e=>e.game==='Pokémon Champions'&&e.reg==='M-C'&&e.sheets===1&&e.verified===true&&(!e.division||e.division==='Masters')&&e.stKind==='final').slice(0,limit);
}
export function normalizeMember(raw,catalog) {
  const originalSpecies=raw.s;
  let species=raw.s,normalization=null;
  const battle=catalog.battleForms.find(f=>f.showdownId===toID(raw.s));
  if(battle) {
    const transitions=catalog.transitions.filter(t=>t.toFormId===battle.id&&t.kind==='mega_evolution'&&t.requiredItemId==='item:'+toID(raw.item));
    const origins=[...new Set(transitions.map(t=>t.fromFormId))];
    if(origins.length===1) {
      species=catalog.rosterForms.find(f=>f.id===origins[0]).canonicalName;
      normalization={originalSpecies,baseSpecies:species,method:'unique_mega_transition_and_matching_stone',battleFormId:battle.id};
    }
  }
  return {species,item:raw.item??'',ability:raw.ab??'',nature:raw.nature??'',moves:raw.moves,sp:null,
    conversionConfirmed:false,notes:[],...(raw.tera?{tera:raw.tera}:{}),sourceRecord:raw,normalization};
}
export function normalizeTournament(event,rawSheets,rawStandings,catalog,corpus,retrievedAt) {
  const sheets=sheetsSchema.parse(rawSheets);
  const rows=z.array(rowSchema).parse(Array.isArray(rawStandings)?rawStandings:rawStandings.rows);
  const byOrder=new Map();
  for(const row of rows) {
    if(byOrder.has(String(row[0])))throw new Error('Claves de clasificación duplicadas.');
    byOrder.set(String(row[0]),row);
  }
  const teams=[];let unjoined=0,excludedSheets=0;
  for(const [order,rawSheet] of Object.entries(sheets)) {
    const parsed=completeSheetSchema.safeParse(rawSheet);
    if(!parsed.success){excludedSheets++;continue;}
    const rawMembers=parsed.data;
    const row=byOrder.get(order);
    // Join only if the published six species agree, including original mega labels.
    if(!row||row[6]!==1||row[5].map(toID).sort().join('|')!==rawMembers.map(m=>toID(m.s)).sort().join('|')){unjoined++;continue;}
    const members=rawMembers.map(m=>normalizeMember(m,catalog));
    const validation=validateTeam(members,catalog,corpus);
    const range=row.slice(7).find(value=>Array.isArray(value)&&value.length===2&&value.every(Number.isInteger));
    teams.push({id:`vgc-history:${event.id}:${order}`,order:Number(order),placement:range??[row[0],row[0]],members,
      validation,kind:'real',actualLeads:null,
      provenance:{sourceId:'vgc-history',sourceUrl:`${BASE}/tournaments/${event.id}#sheet=${encodeURIComponent(event.id+':'+order)}`,
        eventId:event.id,eventName:event.name,eventDates:event.dates,eventYear:event.year,season:event.season??null,
        regulation:event.reg,division:'Masters',retrievedAt,setConfidence:'observed_published_fields',statistics:'unknown',
        licenseNote:'Project use offered at https://vgchistory.com/data; cache and link credit requested. No sprite licence granted.'}});
  }
  if(!teams.length)throw new Error(`Aún no se pueden relacionar las fichas de ${event.name}.`);
  return {id:event.id,name:event.name,dates:event.dates,regulation:event.reg,sourceUrl:`${BASE}/tournaments/${event.id}`,sheetCount:Object.keys(sheets).length,joinedTeams:teams.length,unjoined,excludedSheets,teams};
}
export function createUpdater({root=process.cwd(),fetcher=fetch,now=()=>new Date()}={}) {
  const directory=path.join(root,'.cache','live-library');
  const latestFile=path.join(directory,'latest.json');
  let running=null;
  const readLatest=async()=>{try{return JSON.parse(await readFile(latestFile,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
  async function getRemote(relative) {
    if(!/^\/(data\.js|(?:sheets|standings)\/[a-z0-9-]+\.json)$/.test(relative))throw new Error('Ruta externa no permitida.');
    const key=sha(relative),bodyFile=path.join(directory,key+'.body'),metaFile=path.join(directory,key+'.json');
    let cached=null;try{cached=JSON.parse(await readFile(metaFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
    const headers={'User-Agent':'ChampionsHero/0.1 (personal cached tournament library)'};
    if(cached?.etag)headers['If-None-Match']=cached.etag;
    else if(cached?.lastModified)headers['If-Modified-Since']=cached.lastModified;
    const response=await fetcher(BASE+relative,{headers,signal:AbortSignal.timeout(30_000),redirect:'error'});
    if(response.status===304&&cached){const body=await readFile(bodyFile,'utf8');if(sha(body)!==cached.sha256)throw new Error('Caché corrupta.');return {body,...cached};}
    if(!response.ok)throw new Error(`VGC History respondió ${response.status}. Se conserva la biblioteca anterior.`);
    if(Number(response.headers.get('content-length'))>12_000_000)throw new Error('Archivo demasiado grande.');
    const reader=response.body.getReader();const chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12_000_000){await reader.cancel();throw new Error('Archivo demasiado grande.');}chunks.push(value);}
    const body=Buffer.concat(chunks).toString('utf8');
    const meta={url:BASE+relative,etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified'),sha256:sha(body),retrievedAt:now().toISOString()};
    await writeFile(bodyFile+'.tmp',body);await rename(bodyFile+'.tmp',bodyFile);
    await writeFile(metaFile,JSON.stringify(meta));
    return {body,...meta};
  }
  async function perform() {
    const previous=await readLatest();
    if(previous?.adapterVersion===ADAPTER_VERSION&&now().getTime()-Date.parse(previous.checkedAt)<CACHE_MS)return {...previous,fromCache:true};
    await mkdir(directory,{recursive:true});
    const [{catalog,corpus},index]=await Promise.all([
      readFile(path.join(root,'src/data/candidates.json'),'utf8').then(JSON.parse),getRemote('/data.js')]);
    const events=selectLatestEvents(parseEvents(index.body));
    if(!events.length)throw new Error('No hay torneos M-C finales y verificados con fichas disponibles.');
    const tournaments=[],files=[{url:index.url,sha256:index.sha256,lastModified:index.lastModified}],warnings=[];
    const checkedAt=now().toISOString();
    for(const event of events) {
      try {
        const sheets=await getRemote(`/sheets/${event.id}.json`);
        const standings=await getRemote(`/standings/${event.id}.json`);
        const normalized=normalizeTournament(event,JSON.parse(sheets.body),JSON.parse(standings.body),catalog,corpus,checkedAt);
        tournaments.push(normalized);
        if(normalized.excludedSheets||normalized.unjoined)warnings.push(`${event.name}: ${normalized.excludedSheets} fichas incompletas o no reconocidas y ${normalized.unjoined} sin unión segura; se conservan fuera de la biblioteca.`);
        for(const file of [sheets,standings])files.push({url:file.url,sha256:file.sha256,lastModified:file.lastModified});
      }catch(e){warnings.push(`${event.name}: ${e instanceof z.ZodError?'El formato de datos no se reconoce; se conserva la versión anterior si existe.':e.message}`);}
    }
    if(!tournaments.length)throw new Error(warnings.join(' '));
    // A failure may add successful new events, but never removes an older event's last good data.
    for(const event of events)if(!tournaments.some(t=>t.id===event.id)){
      const retained=previous?.tournaments.find(t=>t.id===event.id);if(retained)tournaments.push({...retained,retainedAfterFailure:true});
    }
    const contentHash=sha(JSON.stringify({adapterVersion:ADAPTER_VERSION,catalogVersion:catalog.datasetVersion,corpusVersion:corpus.corpusVersion,files:files.map(f=>[f.url,f.sha256]),retained:tournaments.filter(t=>t.retainedAfterFailure).map(t=>[t.id,previous.datasetVersion])}));
    const snapshot={schemaVersion:1,adapterVersion:ADAPTER_VERSION,id:'vgc-history:'+contentHash,source:'VGC History',sourceUrl:BASE,
      checkedAt,datasetVersion:contentHash,catalogVersion:catalog.datasetVersion,corpusVersion:corpus.corpusVersion,
      scope:'latest_three_published_final_verified_M-C_Masters_events',files,warnings,tournaments,
      trainingReady:false,fromCache:false};
    await mkdir(path.join(directory,'snapshots'),{recursive:true});
    const history=path.join(directory,'snapshots',contentHash+'.json');
    try{await writeFile(history,JSON.stringify(snapshot),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
    await writeFile(latestFile+'.tmp',JSON.stringify(snapshot));await rename(latestFile+'.tmp',latestFile);
    return snapshot;
  }
  return {readLatest,refresh:()=>{if(!running)running=perform().finally(()=>{running=null;});return running;}};
}
