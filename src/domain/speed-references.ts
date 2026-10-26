import {z} from 'zod';
const percentage=z.number().min(0).max(100).nullable();
const sp=z.object({hp:z.number().int().min(0).max(32),atk:z.number().int().min(0).max(32),def:z.number().int().min(0).max(32),spa:z.number().int().min(0).max(32),spd:z.number().int().min(0).max(32),spe:z.number().int().min(0).max(32)}).refine(v=>Object.values(v).reduce((a,b)=>a+b,0)<=66);
export const speedReferencesSchema=z.object({schemaVersion:z.literal(1),species:z.string(),format:z.literal('Doubles'),season:z.string(),sourceDate:z.string().nullable(),checkedAt:z.string().datetime(),stale:z.boolean(),sourceUrl:z.string().url(),attribution:z.string(),jointSet:z.literal(false),natures:z.array(z.object({nature:z.string(),percentage})),spreads:z.array(z.object({sp,percentage})),items:z.array(z.object({item:z.string(),percentage}))});
export type SpeedReferences=z.infer<typeof speedReferencesSchema>;
const memory=new Map<string,SpeedReferences>();
export function cachedSpeedReferences(species:string){
  const existing=memory.get(species);if(existing)return existing;
  try{const raw=localStorage.getItem('champions-speed-refs:'+species);if(raw){const value=speedReferencesSchema.parse(JSON.parse(raw));if(value.species===species){memory.set(species,value);return value;}}}catch{/* Optional cache: calculations never depend on it. */}
  return null;
}
export async function fetchSpeedReferences(species:string,signal:AbortSignal,refresh=false){
  const response=await fetch('/api/speed-reference/'+encodeURIComponent(species),{signal,method:refresh?'POST':'GET'});
  if(!response.ok)throw new Error('Sin referencias disponibles.');
  const value=speedReferencesSchema.parse(await response.json());
  if(value.species!==species)throw new Error('La referencia corresponde a otra forma.');
  memory.set(species,value);try{localStorage.setItem('champions-speed-refs:'+species,JSON.stringify(value));}catch{/* The result is still available in memory. */}return value;
}
