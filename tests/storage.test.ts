import 'fake-indexeddb/auto';
import {beforeEach,describe,it,expect} from 'vitest';
import {db,saveTeam,cacheLibrary,loadLibrary} from '../src/domain/storage';
import {catalog,corpus} from '../src/domain/data';
import {emptyMember,type UserTeam} from '../src/domain/team';
const input=():UserTeam=>({id:crypto.randomUUID(),name:'Mi equipo',members:Array.from({length:6},()=>({...emptyMember(),species:'Garchomp'})),revision:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),catalogVersion:catalog.datasetVersion,corpusVersion:corpus.corpusVersion});
beforeEach(async()=>{await Promise.all(db.tables.map(t=>t.clear()));});
describe('local team storage',()=>{
  it('persists six members and recovers them after reopening IndexedDB',async()=>{const team=await saveTeam(input());db.close();await db.open();expect(await db.teams.get(team.id)).toEqual(team);});
  it('keeps immutable revisions when a user edits the team',async()=>{const first=await saveTeam(input());const second=await saveTeam({...first,name:'Mi equipo revisado'});expect(second.revision).toBe(2);expect((await db.revisions.get(first.id+':1'))?.name).toBe('Mi equipo');expect((await db.teams.get(first.id))?.name).toBe('Mi equipo revisado');});
  it('rejects an old revision from another tab',async()=>{const first=await saveTeam(input());await saveTeam({...first,name:'Cambio'});await expect(saveTeam({...first,name:'Cambio antiguo'})).rejects.toThrow('otra pestaña');expect((await db.teams.get(first.id))?.name).toBe('Cambio');});
  it('does not save EV conversion without confirmation or malformed teams',async()=>{const team=input();team.members[0].evs={atk:252,spe:252,hp:4};await expect(saveTeam(team)).rejects.toThrow('Confirma');expect(await db.teams.count()).toBe(0);await expect(saveTeam({...input(),members:[]})).rejects.toThrow();});
  it('a malformed library cannot replace the last successful snapshot',async()=>{const snapshot={schemaVersion:1 as const,id:'test',checkedAt:new Date().toISOString(),datasetVersion:'version1',catalogVersion:catalog.datasetVersion,corpusVersion:corpus.corpusVersion,warnings:[],fromCache:false,trainingReady:false as const,tournaments:[]};await cacheLibrary(snapshot);await expect(cacheLibrary({...snapshot,schemaVersion:99} as never)).rejects.toThrow();expect((await loadLibrary())?.datasetVersion).toBe('version1');});
});
