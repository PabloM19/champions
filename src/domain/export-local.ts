import {db} from './storage';
import {APP_VERSION} from './practice';
export async function exportPersonalData(theme:string){
  const contents=await db.transaction('r',[db.teams,db.revisions,db.exercises,db.attempts,db.selfReviews,db.practiceDrafts,db.settings],async()=>({
    teams:await db.teams.toArray(),revisions:await db.revisions.toArray(),exercises:await db.exercises.toArray(),attempts:await db.attempts.toArray(),
    selfReviews:await db.selfReviews.toArray(),practiceDrafts:await db.practiceDrafts.toArray(),settings:(await db.settings.toArray()).filter(s=>s.key!=='activeLibrary'),theme,
  }));
  const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(contents))))).map(v=>v.toString(16).padStart(2,'0')).join('');
  return {schemaVersion:2,appVersion:APP_VERSION,exportedAt:new Date().toISOString(),checksum,contents,excluded:'Cached public libraries; each exercise includes its own opponent snapshot.'};
}
