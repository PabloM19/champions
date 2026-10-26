import {z} from 'zod';
export const STATS = ['hp','atk','def','spa','spd','spe'] as const;
export type Stat = typeof STATS[number];
export type Distribution = Partial<Record<Stat, number>>;
export const STAT_LABELS: Record<Stat,string> = {hp:'PS',atk:'Ataque',def:'Defensa',spa:'At. Esp.',spd:'Def. Esp.',spe:'Velocidad'};
const distribution = z.object({hp:z.number().int().optional(),atk:z.number().int().optional(),def:z.number().int().optional(),spa:z.number().int().optional(),spd:z.number().int().optional(),spe:z.number().int().optional()}).strict();
export const memberSchema = z.object({
  species:z.string(), nickname:z.string().optional(), item:z.string(), ability:z.string(), nature:z.string(), moves:z.array(z.string()).max(4),
  sp:distribution.nullable(), evs:distribution.optional(), ivs:distribution.optional(),
  conversionConfirmed:z.boolean(), level:z.number().int().optional(), tera:z.string().optional(),
  notes:z.array(z.string()), rawBlock:z.string().optional(),
});
export type Member = z.infer<typeof memberSchema>;
export const teamSchema = z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(100),members:z.array(memberSchema).length(6),
  revision:z.number().int().min(1), createdAt:z.string().datetime(), updatedAt:z.string().datetime(),
  rawImport:z.string().optional(), catalogVersion:z.string(),corpusVersion:z.string(),sourceUrl:z.string().url().optional()});
export type UserTeam = z.infer<typeof teamSchema>;
export const emptyMember = ():Member => ({species:'',item:'',ability:'',nature:'',moves:[],sp:null,conversionConfirmed:false,notes:[]});
export function convertEvs(evs:Distribution) {
  const values = Object.values(evs);
  if (values.some(v => !Number.isInteger(v) || v < 0 || v > 252) || values.reduce((a,b) => a+b,0)>510) throw new Error('EV no válidos: máximo 252 por estadística y 510 en total.');
  const sp = Object.fromEntries(STATS.map(stat => {const ev=evs[stat] ?? 0; return [stat,ev<4?0:Math.min(32,1+Math.floor((ev-4)/8))];})) as Record<Stat,number>;
  const total=Object.values(sp).reduce((a,b)=>a+b,0);
  if (total>66) throw new Error('La conversión supera los 66 SP. Ajusta el reparto.');
  return {sp,total,remaining:66-total};
}
export function pendingConversion(m:Member) {return m.evs !== undefined && !m.conversionConfirmed;}
export function toValidationMember(m:Member) {
  const {evs, ...value} = m;
  return pendingConversion(m) ? {...value,evs,sp:null} : value;
}
export function confirmConversion(m:Member):Member {
  if (!m.evs) return m;
  return {...m,sp:convertEvs(m.evs).sp,conversionConfirmed:true};
}
export function exportPaste(members:Member[]) {
  return members.map(m => [
    `${m.nickname ? `${m.nickname} (${m.species})` : m.species}${m.item ? ` @ ${m.item}` : ''}`,
    m.ability && `Ability: ${m.ability}`, m.nature && `${m.nature} Nature`,
    m.sp && `SP: ${STATS.filter(s=>m.sp?.[s]!==undefined).map(s=>`${m.sp![s]} ${{hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe'}[s]}`).join(' / ')}`,
    ...m.moves.filter(Boolean).map(move=>`- ${move}`),
  ].filter(Boolean).join('\n')).join('\n\n');
}
