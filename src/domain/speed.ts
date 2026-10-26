import {catalog,corpus} from './data';
import {toID} from './ids.js';
import type {Member} from './team';
import type {LibrarySnapshot} from './library';
import {z} from 'zod';
export const SPEED_VERSION='champions-speed-0.1.0';
export const SPEED_FORMS=[...catalog.rosterForms.map(f=>({id:f.showdownId,name:f.canonicalName,base:f.mechanics.baseStats.spe,battle:false,abilities:f.mechanics.abilities})),...catalog.battleForms.map(f=>({id:f.showdownId,name:f.canonicalName,base:f.mechanics.baseStats.spe,battle:true,abilities:f.mechanics.abilities}))];
export const speedForm=(value:string)=>SPEED_FORMS.find(f=>f.id===toID(value));
export const NATURE_ES:Record<string,string>={adamant:'Firme',bashful:'Tímida',bold:'Osada',brave:'Audaz',calm:'Serena',careful:'Cauta',docile:'Dócil',gentle:'Amable',hardy:'Fuerte',hasty:'Activa',impish:'Agitada',jolly:'Alegre',lax:'Floja',lonely:'Huraña',mild:'Afable',modest:'Modesta',naive:'Ingenua',naughty:'Pícara',quiet:'Mansa',quirky:'Rara',rash:'Alocada',relaxed:'Plácida',sassy:'Grosera',serious:'Seria',timid:'Miedosa'};
export type SpeedInput={species:string;sp:number|null;nature:string;stage:number;item:'none'|'scarf'|'ironball';tailwind:boolean;paralyzed:boolean;ability:string;abilityActive:boolean};
export type SpeedWeather='none'|'sun'|'rain'|'sand'|'snow';
export const blankSpeed=():SpeedInput=>({species:'',sp:null,nature:'',stage:0,item:'none',tailwind:false,paralyzed:false,ability:'',abilityActive:false});
const speedInputSchema=z.object({species:z.string().refine(s=>s===''||!!speedForm(s)),sp:z.number().int().min(0).max(32).nullable(),nature:z.string().refine(n=>!n||corpus.natures.some(x=>x.id===toID(n))),stage:z.number().int().min(-6).max(6),item:z.enum(['none','scarf','ironball']),tailwind:z.boolean(),paralyzed:z.boolean(),ability:z.string(),abilityActive:z.boolean()});
export const speedStateSchema=z.object({own:speedInputSchema,opponent:speedInputSchema,weather:z.enum(['none','sun','rain','sand','snow']),trickRoom:z.boolean(),ownOrigin:z.string(),rivalOrigin:z.string()});
export function natureMultiplier(nature:string){const n=corpus.natures.find(n=>n.id===toID(nature));if(!n)throw new Error('Naturaleza no reconocida.');return n.plus===n.minus?10:n.plus==='spe'?11:n.minus==='spe'?9:10;}
export function baseSpeedStat(base:number,sp:number,nature:string){if(!Number.isInteger(base)||base<1||!Number.isInteger(sp)||sp<0||sp>32)throw new Error('Los SP de velocidad deben ser enteros entre 0 y 32.');return Math.floor((base+20+sp)*natureMultiplier(nature)/10);}
export function effectiveSpeed(base:number,sp:number,nature:string,input:SpeedInput,weather:SpeedWeather){
  if(!Number.isInteger(input.stage)||input.stage< -6||input.stage>6)throw new Error('El nivel de velocidad debe estar entre −6 y +6.');
  const stat=baseSpeedStat(base,sp,nature);
  const staged=Math.floor(stat*(input.stage>=0?2+input.stage:2)/(input.stage>=0?2:2-input.stage));
  const ability=toID(input.ability),unburden=ability==='unburden'&&input.abilityActive;
  const double=unburden||(ability==='chlorophyll'&&weather==='sun')||(ability==='swiftswim'&&weather==='rain')||(ability==='sandrush'&&weather==='sand')||(ability==='slushrush'&&weather==='snow');
  // Chain fixed-point modifiers, then round halves down as in the pinned simulator/calculator.
  const modifiers=[...(input.tailwind?[8192]:[]),...(double?[8192]:ability==='quickfeet'&&input.paralyzed?[6144]:[]),...(!unburden&&input.item==='scarf'?[6144]:!unburden&&input.item==='ironball'?[2048]:[])];
  let modifier=4096;for(const m of modifiers)modifier=Math.floor((modifier*m+2048)/4096);
  let effective=Math.ceil(staged*modifier/4096-0.5);
  if(input.paralyzed&&ability!=='quickfeet')effective=Math.floor(effective/2);
  return {stat,effective:Math.max(0,Math.min(10000,effective))};
}
export function speedRange(input:SpeedInput,weather:SpeedWeather){
  const form=speedForm(input.species);if(!form)return null;
  const sps=input.sp===null?[0,32]:[input.sp];const natures=input.nature?[input.nature]:['Brave','Serious','Jolly'];
  const results=sps.flatMap(sp=>natures.map(nature=>effectiveSpeed(form.base,sp,nature,input,weather)));
  return {base:form.base,min:Math.min(...results.map(r=>r.effective)),max:Math.max(...results.map(r=>r.effective)),statMin:Math.min(...results.map(r=>r.stat)),statMax:Math.max(...results.map(r=>r.stat)),exact:input.sp!==null&&!!input.nature};
}
export function compareSpeeds(left:SpeedInput,right:SpeedInput,weather:SpeedWeather,trickRoom:boolean){
  const a=speedRange(left,weather),b=speedRange(right,weather);if(!a||!b)return {kind:'empty',text:'Selecciona los dos Pokémon para comparar.'};
  if(a.exact&&b.exact&&a.min===b.min)return {kind:'tie',text:'Empate de velocidad'};
  const aOrders=orderRange(left,weather,trickRoom),bOrders=orderRange(right,weather,trickRoom);
  const winner=aOrders.min>bOrders.max?'own':bOrders.min>aOrders.max?'opponent':null;
  return winner?{kind:winner,text:winner==='own'?'Tu Pokémon actúa antes por velocidad':'El rival actúa antes por velocidad'}:{kind:'uncertain',text:'El orden depende del reparto desconocido'};
}
export const orderValue=(speed:number,trickRoom:boolean)=>trickRoom?(10000-speed)%8192:speed;
function orderRange(input:SpeedInput,weather:SpeedWeather,trickRoom:boolean){
  const form=speedForm(input.species)!;
  const values=(input.sp===null?Array.from({length:33},(_,sp)=>sp):[input.sp]).flatMap(sp=>(input.nature?[input.nature]:['Brave','Serious','Jolly']).map(n=>orderValue(effectiveSpeed(form.base,sp,n,input,weather).effective,trickRoom)));
  return {min:Math.min(...values),max:Math.max(...values)};
}
export function inputFromMember(member:Member):SpeedInput{
  return {...blankSpeed(),species:speedForm(member.species)?.id??'',sp:member.evs&&!member.conversionConfirmed?null:member.sp?.spe??null,nature:corpus.natures.some(n=>n.id===toID(member.nature))?member.nature:'',item:toID(member.item)==='choicescarf'?'scarf':toID(member.item)==='ironball'?'ironball':'none',ability:member.ability};
}
export function tournamentSpeedReferences(species:string,library:LibrarySnapshot|null){
  if(library?.catalogVersion!==catalog.datasetVersion||library?.corpusVersion!==corpus.corpusVersion)return [];
  const rows=library.tournaments.flatMap(t=>t.teams).filter(t=>t.validation.status!=='published_fields_conflict').flatMap(t=>t.members.filter(m=>toID(m.species)===toID(species)).map(m=>({member:m,source:t.provenance})));
  const groups=new Map<string,{member:Member;count:number;url:string;event:string}>();
  for(const r of rows){const key=[toID(r.member.nature),toID(r.member.item),r.member.sp?.spe??'?'].join(':');const found=groups.get(key);if(found)found.count++;else groups.set(key,{member:r.member,count:1,url:r.source.sourceUrl,event:r.source.eventName});}
  return [...groups.values()].sort((a,b)=>b.count-a.count).slice(0,3);
}
export function minimumSpToBeat(input:SpeedInput,target:SpeedInput,weather:SpeedWeather,trickRoom:boolean){
  const form=speedForm(input.species),other=speedRange(target,weather);if(!form||!other?.exact||!input.nature)return null;
  const values=Array.from({length:33},(_,sp)=>({sp,speed:effectiveSpeed(form.base,sp,input.nature,input,weather).effective})).filter(v=>orderValue(v.speed,trickRoom)>orderValue(other.min,trickRoom));
  return values[0]??{sp:null,speed:null};
}
