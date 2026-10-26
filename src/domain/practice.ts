import {z} from 'zod';
import {catalog,corpus,checkMembers,formFor} from './data';
import {toID} from './ids.js';
import {emptyMember,memberSchema,teamSchema,pendingConversion,STATS,type Member,type UserTeam} from './team';
import type {LibrarySnapshot} from './library';

export const APP_VERSION='0.2.0';
export const PRACTICE_VERSION='reading-practice-0.1.0';
export const ENGINE_VERSION='coverage-only-0.1.0';
export const configSchema=z.object({realPercent:z.number().int().min(0).max(100),profile:z.enum(['balanced','conservative','aggressive']),
  difficulty:z.enum(['easy','medium','hard']),pokemon:z.string(),archetype:z.enum(['any','sun','rain','trickroom']),predict:z.boolean()});
export type PracticeConfig=z.infer<typeof configSchema>;
export const DEFAULT_CONFIG:PracticeConfig={realPercent:70,profile:'balanced',difficulty:'medium',pokemon:'',archetype:'any',predict:false};
export const PROFILE_NAMES={balanced:'Equilibrado',conservative:'Conservador',aggressive:'Agresivo'};
export const DIFFICULTY_NAMES={easy:'Fácil',medium:'Media',hard:'Difícil'};
const originSchema=z.object({kind:z.enum(['real','synthetic']),label:z.string(),sourceUrl:z.string().url().nullable(),eventDates:z.string().nullable(),policyVersion:z.string().nullable()});
const opponentSchema=z.object({id:z.string(),members:z.array(memberSchema).length(6),origin:originSchema});
export type Opponent=z.infer<typeof opponentSchema>;
export const exerciseSchema=z.object({id:z.string().uuid(),createdAt:z.string().datetime(),ownTeam:teamSchema,opponent:opponentSchema,
  config:configSchema,seed:z.number().int().min(0).max(0xffffffff),versions:z.object({app:z.string(),practice:z.string(),engine:z.string(),catalog:z.string(),corpus:z.string(),library:z.string().nullable()}),
  mode:z.literal('reading_practice'),mechanicalAssessmentReady:z.literal(false)});
export type Exercise=z.infer<typeof exerciseSchema>;
const pairSchema=z.array(z.number().int().min(0).max(5)).length(2).refine(pair=>new Set(pair).size===2,'Elige dos Pokémon diferentes.');
const criterionSchema=z.object({id:z.string(),title:z.string(),status:z.literal('indeterminado'),explanation:z.string(),ruleId:z.string()});
export const attemptSchema=z.object({id:z.string().uuid(),exerciseId:z.string().uuid(),createdAt:z.string().datetime(),leads:pairSchema,prediction:pairSchema.nullable(),reason:z.string().refine(s=>!!s.trim(),'Escribe tu razonamiento.'),
  assessment:z.object({engineVersion:z.string(),profile:z.enum(['balanced','conservative','aggressive']),criteria:z.array(criterionSchema),observations:z.array(z.object({text:z.string(),ruleId:z.string()})),alternatives:z.array(z.string()).length(0),alternativesReason:z.string(),semanticAnalysis:z.literal(false),actualOpponentLeads:z.null()})});
export type Attempt=z.infer<typeof attemptSchema>;
const draftPair=z.array(z.number().int().min(0).max(5)).max(2).refine(pair=>new Set(pair).size===pair.length);
export const decisionDraftSchema=z.object({exerciseId:z.string().uuid(),leads:draftPair,prediction:draftPair,reason:z.string()});
export type DecisionDraft=z.infer<typeof decisionDraftSchema>;
export const REVIEW_ITEMS=[{id:'speed',label:'Pensé cómo gestionar la velocidad.'},{id:'safety',label:'Contemplé una amenaza o interrupción del primer turno.'},{id:'plan',label:'Describí una primera acción y un plan alternativo.'},{id:'uncertainty',label:'Separé lo que sé del rival de lo que supongo.'},{id:'reserves',label:'No di por seguro un cambio a una reserva sin elegir.'}] as const;
export const reviewSchema=z.object({id:z.string().uuid(),attemptId:z.string().uuid(),createdAt:z.string().datetime(),answers:z.record(z.string(),z.enum(['considered','omitted'])).refine(a=>REVIEW_ITEMS.every(item=>item.id in a)&&Object.keys(a).length===REVIEW_ITEMS.length,'Completa los cinco criterios.')});
export type SelfReview=z.infer<typeof reviewSchema>;

function set(species:string,item:string,ability:string,nature:string,moves:string[]):Member{return {...emptyMember(),species,item,ability,nature,moves};}
const POLICY='archetype-templates-0.1.0';
// Authored scenarios, never attributed to a player. Missing distributions stay unknown.
export const SYNTHETIC_TEAMS:Opponent[]=[{
  id:'synthetic:sun-tr:1',origin:{kind:'synthetic',label:'Sol con un segundo ritmo',sourceUrl:null,eventDates:null,policyVersion:POLICY},members:[
    set('Charizard','Charizardite Y','Blaze','Modest',['Heat Wave','Weather Ball','Ancient Power','Protect']),
    set('Venusaur','Focus Sash','Chlorophyll','Modest',['Leaf Storm','Sludge Bomb','Sleep Powder','Protect']),
    set('Farigiraf','Sitrus Berry','Armor Tail','Quiet',['Psychic','Thunderbolt','Helping Hand','Trick Room']),
    set('Incineroar','Chople Berry','Intimidate','Adamant',['Flare Blitz','Darkest Lariat','Parting Shot','Fake Out']),
    set('Sylveon','Fairy Feather','Pixilate','Modest',['Hyper Voice','Moonblast','Yawn','Protect']),
    set('Garchomp','Choice Scarf','Rough Skin','Adamant',['Rock Slide','Stomping Tantrum','Dragon Claw','Earthquake']),
  ]},{id:'synthetic:rain:1',origin:{kind:'synthetic',label:'Lluvia con presión física',sourceUrl:null,eventDates:null,policyVersion:POLICY},members:[
    set('Pelipper','Damp Rock','Drizzle','Modest',['Hurricane','Weather Ball','Tailwind','Protect']),
    set('Basculegion','Choice Scarf','Swift Swim','Adamant',['Wave Crash','Last Respects','Flip Turn','Aqua Jet']),
    set('Archaludon','Leftovers','Stamina','Modest',['Electro Shot','Flash Cannon','Draco Meteor','Protect']),
    set('Rillaboom','Miracle Seed','Grassy Surge','Adamant',['Wood Hammer','Grassy Glide','Fake Out','Protect']),
    set('Kingambit','Black Glasses','Defiant','Adamant',['Kowtow Cleave','Sucker Punch','Iron Head','Protect']),
    set('Sneasler','White Herb','Unburden','Jolly',['Close Combat','Dire Claw','Acrobatics','Protect']),
  ]},
];
export function archetypes(members:Member[]){
  const result:string[]=[];
  const hasAbility=(...ids:string[])=>members.some(m=>ids.includes(toID(m.ability)));
  const hasMegaSun=members.some(m=>toID(m.species)==='charizard'&&toID(m.item)==='charizarditey');
  if(hasAbility('drought')||hasMegaSun)result.push('sun');
  if(hasAbility('drizzle'))result.push('rain');
  if(members.some(m=>m.moves.some(move=>toID(move)==='trickroom')))result.push('trickroom');
  return result;
}
export function readingDifficulty(members:Member[]):PracticeConfig['difficulty']{
  const count=archetypes(members).length;
  return count===1?'easy':count===2?'medium':'hard';
}
function eligible(members:Member[]){
  const checked=checkMembers(members);
  return !checked.issues.some(i=>i.kind==='error')&&checked.members.length===6&&checked.members.every(m=>m.formId!==null);
}
const realCache=new WeakMap<LibrarySnapshot,Opponent[]>();
const syntheticPool=SYNTHETIC_TEAMS.filter(t=>eligible(t.members));
export function getPools(library:LibrarySnapshot|null,config:PracticeConfig){
  const compatible=library?.catalogVersion===catalog.datasetVersion&&library?.corpusVersion===corpus.corpusVersion;
  if(compatible&&!realCache.has(library!))realCache.set(library!,library!.tournaments.flatMap(t=>t.teams).filter(t=>t.provenance.regulation==='M-C').map(t=>({id:t.id,members:t.members.map(m=>memberSchema.parse(m)),origin:{kind:'real' as const,label:t.provenance.eventName,sourceUrl:t.provenance.sourceUrl,eventDates:t.provenance.eventDates,policyVersion:null}})).filter(t=>eligible(t.members)));
  const real=compatible?realCache.get(library!)!:[];
  const matches=(team:Opponent)=>readingDifficulty(team.members)===config.difficulty&&(!config.pokemon||team.members.some(m=>toID(m.species)===toID(config.pokemon)))&&(config.archetype==='any'||archetypes(team.members).includes(config.archetype));
  return {real:real.filter(matches),synthetic:syntheticPool.filter(matches)};
}
export class InsufficientCases extends Error{}
export function makeExercise({ownTeam,library,config,seed,recentIds=[],id=crypto.randomUUID(),createdAt=new Date().toISOString()}:{ownTeam:UserTeam;library:LibrarySnapshot|null;config:PracticeConfig;seed:number;recentIds?:string[];id?:string;createdAt?:string}):Exercise{
  config=configSchema.parse(config);teamSchema.parse(ownTeam);
  if(ownTeam.catalogVersion!==catalog.datasetVersion||ownTeam.corpusVersion!==corpus.corpusVersion)throw new Error('Vuelve a revisar y guardar tu equipo con el catálogo actual.');
  if(ownTeam.members.some(pendingConversion))throw new Error('Confirma primero las conversiones EV a SP de tu equipo.');
  if(!eligible(ownTeam.members))throw new Error('Revisa las especies, formas y campos incompatibles de tu equipo antes de practicar.');
  const pools=getPools(library,config);
  if(config.realPercent>0&&!pools.real.length)throw new InsufficientCases('No hay equipos reales aptos para estos filtros. Actualiza la biblioteca o cambia los filtros o el porcentaje de reales.');
  if(config.realPercent<100&&!pools.synthetic.length)throw new InsufficientCases('No hay equipos generados aptos para estos filtros. Cambia los filtros o elige explícitamente 100 % reales.');
  let state=seed>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const kind=random()*100<config.realPercent?'real':'synthetic';
  const unseen=pools[kind].filter(t=>!recentIds.includes(t.id)),pool=unseen.length?unseen:pools[kind];
  const sampled=pool[Math.floor(random()*pool.length)];
  const opponent={...sampled,members:sampled.members.map(m=>({...m,species:formFor(m.species)!.canonicalName}))};
  return exerciseSchema.parse(structuredClone({id,createdAt,ownTeam,opponent,config,seed:seed>>>0,versions:{app:APP_VERSION,practice:PRACTICE_VERSION,engine:ENGINE_VERSION,catalog:catalog.datasetVersion,corpus:corpus.corpusVersion,library:kind==='real'?library!.datasetVersion:null},mode:'reading_practice',mechanicalAssessmentReady:false}));
}
export function opponentPreview(exercise:Exercise){return exercise.opponent.members.map((m,index)=>({index,species:m.species}));}
export function createAttempt(exercise:Exercise,{leads,prediction,reason}:{leads:number[];prediction:number[]|null;reason:string}):Attempt{
  exerciseSchema.parse(exercise);pairSchema.parse(leads);
  if(!reason.trim())throw new Error('Escribe tu razonamiento antes de confirmar.');
  if(exercise.config.predict)pairSchema.parse(prediction);
  else if(prediction!==null)throw new Error('La predicción está desactivada en este ejercicio.');
  const moves=leads.flatMap(i=>exercise.ownTeam.members[i].moves);
  const observations:{text:string;ruleId:string}[]=[];
  for(const move of ['Tailwind','Trick Room','Fake Out','Protect','Helping Hand'])if(moves.some(m=>toID(m)===toID(move)))observations.push({text:`Tu pareja lleva ${move}. Su utilidad depende del objetivo, las acciones y los recursos del rival.`,ruleId:'known_own_move:'+toID(move)});
  if(leads.some(i=>STATS.some(stat=>exercise.ownTeam.members[i].sp?.[stat]===undefined)))observations.push({text:'Faltan repartos SP completos en la pareja elegida; no se calculan velocidades ni rangos de daño.',ruleId:'unknown_own_sp'});
  const criteria=[['speed','Control de velocidad','Falta resolver prioridades, velocidades y escenarios de control.'],['safety','Seguridad del primer turno','La presencia de un recurso no garantiza que se pueda ejecutar frente al rival.'],['offense','Presión ofensiva','Los rangos de daño y amenazas de KO todavía no están contrastados.'],['synergy','Sinergia','Las interacciones de clima, campo, habilidades y objetivos requieren cobertura mecánica.'],['coverage','Cobertura de aperturas','No hay todavía una comparación contrastada de las 15 parejas rivales.'],['flexibility','Flexibilidad','Solo están elegidas estas dos leads. Los otros cuatro son apoyos posibles, no reservas garantizadas.'],['uncertainty','Incertidumbre','Una ficha de torneo no revela la elección rival ni sus acciones. Los SP ausentes siguen siendo desconocidos.']].map(([id,title,explanation])=>({id,title,status:'indeterminado' as const,explanation,ruleId:'coverage_pending:'+id}));
  return attemptSchema.parse({id:crypto.randomUUID(),exerciseId:exercise.id,createdAt:new Date().toISOString(),leads:[...leads],prediction:exercise.config.predict?[...prediction!]:null,reason,
    assessment:{engineVersion:ENGINE_VERSION,profile:exercise.config.profile,criteria,observations,alternatives:[],alternativesReason:'No hay comparaciones mecánicas contrastadas para ordenar tres alternativas. No se propone un ranking.',semanticAnalysis:false,actualOpponentLeads:null}});
}
