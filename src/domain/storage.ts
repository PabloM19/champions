import Dexie,{type EntityTable} from 'dexie';
import {teamSchema,type UserTeam,pendingConversion} from './team';
import {librarySchema,type LibrarySnapshot} from './library';
import {exerciseSchema,createAttempt,reviewSchema,type Exercise,type Attempt,type SelfReview,type DecisionDraft} from './practice';
export function createDatabase(name='champions-hero'){
const database=new Dexie(name) as Dexie & {
  teams:EntityTable<UserTeam,'id'>;
  revisions:EntityTable<UserTeam & {key:string},'key'>;
  libraries:EntityTable<LibrarySnapshot,'id'>;
  settings:EntityTable<{key:string;value:string},'key'>;
  exercises:EntityTable<Exercise,'id'>;
  attempts:EntityTable<Attempt,'id'>;
  selfReviews:EntityTable<SelfReview,'id'>;
  practiceDrafts:EntityTable<DecisionDraft,'exerciseId'>;
};
database.version(1).stores({teams:'id,updatedAt',revisions:'key,id',libraries:'id',settings:'key'});
database.version(2).stores({exercises:'id,createdAt',attempts:'id,&exerciseId,createdAt',selfReviews:'id,attemptId,createdAt',practiceDrafts:'exerciseId'});
return database;
}
export const db=createDatabase();
export async function saveTeam(input:UserTeam){
  const team=teamSchema.parse(input);
  if(team.members.some(pendingConversion))throw new Error('Confirma las conversiones EV → SP antes de guardar.');
  return db.transaction('rw',db.teams,db.revisions,async()=>{
    const current=await db.teams.get(team.id);
    if(current&&current.revision!==team.revision)throw new Error('Este equipo cambió en otra pestaña. Vuelve a abrirlo antes de guardar.');
    const saved={...team,revision:current?current.revision+1:1,updatedAt:new Date().toISOString()};
    await db.revisions.add({...saved,key:saved.id+':'+saved.revision});
    await db.teams.put(saved);return saved;
  });
}
export async function cacheLibrary(input:LibrarySnapshot){
  const value=librarySchema.parse(input);
  await db.transaction('rw',db.libraries,db.settings,async()=>{
    await db.libraries.put(value);await db.settings.put({key:'activeLibrary',value:value.id});
  });return value;
}
export async function loadLibrary(){const active=await db.settings.get('activeLibrary');return active?await db.libraries.get(active.value)??null:null;}
export async function saveExercise(input:Exercise){
  const exercise=exerciseSchema.parse(input);
  await db.transaction('rw',db.exercises,db.settings,async()=>{await db.exercises.add(exercise);await db.settings.put({key:'activeExercise',value:exercise.id});});
  return exercise;
}
export async function submitDecision(exerciseId:string,decision:{leads:number[];prediction:number[]|null;reason:string}){
  return db.transaction('rw',db.exercises,db.attempts,db.practiceDrafts,async()=>{
    const exercise=await db.exercises.get(exerciseId);if(!exercise)throw new Error('No se encuentra el ejercicio guardado.');
    if(await db.attempts.where('exerciseId').equals(exerciseId).first())throw new Error('Este ejercicio ya está confirmado. Abre su resultado desde el historial.');
    const attempt=createAttempt(exercise,decision);await db.attempts.add(attempt);await db.practiceDrafts.delete(exerciseId);return attempt;
  });
}
export async function saveReview(input:SelfReview){
  const review=reviewSchema.parse(input);
  if(!await db.attempts.get(review.attemptId))throw new Error('No se encuentra la decisión que quieres revisar.');
  await db.selfReviews.add(review);return review;
}
