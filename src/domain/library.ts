import {z} from 'zod';
import {memberSchema} from './team';
const issue=z.object({kind:z.string(),code:z.string(),memberIndex:z.number().nullable(),field:z.string()}).passthrough();
const realTeam=z.object({id:z.string(),order:z.number(),placement:z.array(z.number()).length(2),members:z.array(memberSchema.passthrough()).length(6),kind:z.literal('real'),
  validation:z.object({status:z.string(),trainingReady:z.literal(false),issues:z.array(issue)}).passthrough(),
  provenance:z.object({sourceUrl:z.string().url(),eventName:z.string(),eventDates:z.string(),regulation:z.string(),retrievedAt:z.string()}).passthrough()}).passthrough();
export const librarySchema=z.object({schemaVersion:z.literal(1),id:z.string(),checkedAt:z.string(),datasetVersion:z.string(),catalogVersion:z.string(),corpusVersion:z.string(),
  warnings:z.array(z.string()),fromCache:z.boolean(),trainingReady:z.literal(false),
  tournaments:z.array(z.object({id:z.string(),name:z.string(),dates:z.string(),sourceUrl:z.string().url(),joinedTeams:z.number(),unjoined:z.number(),teams:z.array(realTeam)}).passthrough())}).passthrough();
export type LibrarySnapshot=z.infer<typeof librarySchema>;
export type RealTeam=z.infer<typeof realTeam>;
export async function requestLibrary(refresh=false):Promise<LibrarySnapshot|null>{
  const response=await fetch(refresh?'/api/library/refresh':'/api/library',{method:refresh?'POST':'GET',signal:AbortSignal.timeout(180_000)});
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('La actualización necesita la app local abierta con npm run dev o npm run preview.');
  const value=await response.json();
  if(!response.ok)throw new Error(value.error??'No se ha podido consultar la fuente.');
  return value===null?null:librarySchema.parse(value);
}
