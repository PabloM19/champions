import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
const BASE='https://championsbattledata.com';
const TTL=6*60*60*1000;
const fields={hp:'hp_points',atk:'attack_points',def:'defense_points',spa:'sp_atk_points',spd:'sp_def_points',spe:'speed_points'};
const natures=new Set(['adamant','bashful','bold','brave','calm','careful','docile','gentle','hardy','hasty','impish','jolly','lax','lonely','mild','modest','naive','naughty','quiet','quirky','rash','relaxed','sassy','serious','timid']);
const id=value=>String(value).toLowerCase().replace(/[^a-z0-9]/g,'');
export function normalizeReferences(raw,species,checkedAt){
  const input=z.object({showdownId:z.string(),format:z.literal('Doubles'),season:z.string(),date:z.string().nullable().optional(),rows:z.array(z.record(z.string(),z.unknown())).max(5000)}).parse(raw);
  if(input.showdownId!==species)throw new Error('La fuente no distingue la forma solicitada.');
  const percentage=row=>typeof row.percentage_value==='number'&&Number.isFinite(row.percentage_value)&&row.percentage_value>=0&&row.percentage_value<=100?row.percentage_value:null;
  const spreads=input.rows.filter(r=>r.category==='stat_points').map(row=>{
    const values=Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,row[field]]));
    if(Object.values(values).some(n=>!Number.isInteger(n)||n<0||n>32)||Object.values(values).reduce((a,b)=>a+b,0)>66)return null;
    return {sp:values,percentage:percentage(row)};
  }).filter(Boolean).slice(0,3);
  return {schemaVersion:1,species,format:'Doubles',season:input.season,sourceDate:input.date??null,checkedAt,stale:false,
    sourceUrl:`${BASE}/api/battle/Doubles/${species}`,attribution:'Battle data provided by Pokémon Champions Battle Data',
    natures:input.rows.filter(r=>r.category==='stat_alignment'&&natures.has(id(r.name))).slice(0,3).map(r=>({nature:r.name,percentage:percentage(r)})),
    spreads,items:input.rows.filter(r=>r.category==='held_item'&&typeof r.name==='string').slice(0,3).map(r=>({item:r.name,percentage:percentage(r)})),
    jointSet:false};
}
export function createSpeedReferences({root=process.cwd(),fetcher=fetch,now=()=>new Date()}={}){
  const cache=path.join(root,'.cache','speed-references'),pending=new Map();
  async function get(species,refresh=false){
    if(!/^[a-z0-9]{1,60}$/.test(species))throw new Error('Identificador no válido.');
    const file=path.join(cache,species+'.json');let previous=null;
    try{previous=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
    if(previous&&now().getTime()-Date.parse(previous.checkedAt)<(refresh?5*60*1000:TTL))return previous;
    try{
      const response=await fetcher(`${BASE}/api/battle/Doubles/${species}`,{signal:AbortSignal.timeout(8000),redirect:'error'});
      if(!response.ok)throw new Error('La fuente no tiene referencias disponibles para esta forma.');
      const reader=response.body.getReader();let size=0;const chunks=[];
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000){await reader.cancel();throw new Error('Respuesta demasiado grande.');}chunks.push(value);}
      const value=normalizeReferences(JSON.parse(Buffer.concat(chunks).toString('utf8')),species,now().toISOString());
      await mkdir(cache,{recursive:true});await writeFile(file+'.tmp',JSON.stringify(value));await rename(file+'.tmp',file);return value;
    }catch(e){if(previous)return {...previous,stale:true};throw e;}
  }
  return {get:(species,refresh=false)=>{if(!pending.has(species))pending.set(species,get(species,refresh).finally(()=>pending.delete(species)));return pending.get(species);}};
}
