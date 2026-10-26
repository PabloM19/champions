import {describe,it,expect} from 'vitest';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parseEvents,selectLatestEvents,normalizeTournament,createUpdater} from '../server/vgc-history.mjs';
const {catalog,corpus}=JSON.parse(await readFile(new URL('../src/data/candidates.json',import.meta.url),'utf8'));
const members=[
  {s:'farigiraf',item:'Sitrus Berry',ab:'Armor Tail',nature:'Quiet',moves:['Psychic','Thunderbolt','Helping Hand','Trick Room']},
  {s:'incineroar',item:'Chople Berry',ab:'Intimidate',nature:'Adamant',moves:['Flare Blitz','Darkest Lariat','Parting Shot','Fake Out']},
  {s:'charizard-mega-y',item:'Charizardite Y',ab:'Blaze',nature:'Modest',moves:['Heat Wave','Weather Ball','Ancient Power','Protect']},
  {s:'sylveon',item:'Fairy Feather',ab:'Pixilate',nature:'Modest',moves:['Hyper Voice','Moonblast','Yawn','Protect']},
  {s:'venusaur',item:'Focus Sash',ab:'Chlorophyll',nature:'Modest',moves:['Leaf Storm','Sludge Bomb','Sleep Powder','Protect']},
  {s:'garchomp',item:'Choice Scarf',ab:'Rough Skin',nature:'Adamant',moves:['Rock Slide','Stomping Tantrum','Dragon Claw','Earthquake']},
];
const event={id:'sample-event',name:'Sample',dates:'October 2026',year:2026,season:2027,reg:'M-C',game:'Pokémon Champions',division:'Masters',sheets:1,verified:true,stKind:'final'};
const rows=[[1,'public-id','Public name','US','15-2',members.map(m=>m.s),1,0,{}]];
const index=(events=[event])=>'window.VH = function(){ const T = '+JSON.stringify(events)+'; return {T}; }();';
describe('VGC History import boundary',()=>{
  it('extracts a literal tournament register without executing its wrapper',()=>{expect(parseEvents(index())[0].id).toBe(event.id);expect(()=>parseEvents('window.VH=function(){const T = dangerous(); return {T};}();')).toThrow('no se ejecutará');expect(()=>parseEvents('const T=[...remote];')).toThrow();});
  it('filters other games, rules, divisions and provisional events',()=>{const variants=[{...event,id:'old',reg:'M-B'},{...event,id:'other',game:'Scarlet & Violet'},{...event,id:'future',verified:false},{...event,id:'junior',division:'Juniors'},event];expect(selectLatestEvents(variants).map(e=>e.id)).toEqual([event.id]);});
  it('normalizes a mega only with a unique transition and matching stone, preserving original records',()=>{const result=normalizeTournament(event,{'1':members},rows,catalog,corpus,'2026-10-19T00:00:00Z');const m=result.teams[0].members[2];expect(m.species).toBe('Charizard');expect(m.ability).toBe('Blaze');expect(m.sourceRecord.s).toBe('charizard-mega-y');expect(m.normalization.method).toBe('unique_mega_transition_and_matching_stone');expect(result.teams[0].validation.status).toBe('incomplete_candidate');expect(result.teams[0].actualLeads).toBeNull();expect(result.teams[0].members.every(m=>m.sp===null)).toBe(true);expect(JSON.stringify(result)).not.toContain('Public name');});
  it('does not attach a sheet to a different roster or duplicate order',()=>{expect(()=>normalizeTournament(event,{'1':members},[[...rows[0].slice(0,5),['wrong'],1]],catalog,corpus,'date')).toThrow('relacionar');expect(()=>normalizeTournament(event,{'1':members},[rows[0],rows[0]],catalog,corpus,'date')).toThrow('duplicadas');});
  it('accepts rows/dropped wrappers without giving dropped players a finish',()=>{const result=normalizeTournament(event,{'1':members},{rows,dropped:[['Someone','US','0-1']]},catalog,corpus,'date');expect(result.teams).toHaveLength(1);expect(result.teams[0].placement).toEqual([1,1]);});
  it('preserves a published placement range',()=>{const ranged=[...rows[0],[3,4]];expect(normalizeTournament(event,{'1':members},[ranged],catalog,corpus,'date').teams[0].placement).toEqual([3,4]);});
  it('quarantines an incomplete sheet without throwing away other complete teams',()=>{const result=normalizeTournament(event,{'1':members,'2':members.slice(0,5)},rows,catalog,corpus,'date');expect(result.joinedTeams).toBe(1);expect(result.sheetCount).toBe(2);expect(result.excludedSheets).toBe(1);expect(result.unjoined).toBe(0);});
  it('keeps previous data on failure, deduplicates concurrent updates and enforces cache interval',async()=>{
    const root=await mkdtemp(path.join(tmpdir(),'champions-update-'));let clock=new Date('2026-10-19T00:00:00Z'),calls=0,fail=false;
    await mkdir(path.join(root,'src/data'),{recursive:true});await writeFile(path.join(root,'src/data/candidates.json'),JSON.stringify({catalog,corpus}));
    const fetcher=async url=>{calls++;if(fail)throw new Error('Offline');return new Response(url.endsWith('data.js')?index():JSON.stringify(url.includes('/sheets/')?{'1':members}:rows),{headers:{'content-type':'application/json','etag':'test-etag'}});};
    const updater=createUpdater({root,fetcher,now:()=>clock});
    try{const [first,duplicate]=await Promise.all([updater.refresh(),updater.refresh()]);expect(calls).toBe(3);expect(first.id).toBe(duplicate.id);expect((await updater.refresh()).fromCache).toBe(true);expect(calls).toBe(3);clock=new Date('2026-10-19T00:06:00Z');fail=true;await expect(updater.refresh()).rejects.toThrow('Offline');expect((await updater.readLatest()).id).toBe(first.id);}finally{await rm(root,{recursive:true,force:true});}
  });
});
