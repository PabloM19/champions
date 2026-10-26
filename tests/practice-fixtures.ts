import {SYNTHETIC_TEAMS} from '../src/domain/practice';
import {catalog,corpus,checkMembers} from '../src/domain/data';
import {librarySchema,type LibrarySnapshot} from '../src/domain/library';
import type {UserTeam} from '../src/domain/team';
export const ownFixture=():UserTeam=>({id:crypto.randomUUID(),name:'Equipo de pruebas',members:structuredClone(SYNTHETIC_TEAMS[0].members),revision:1,createdAt:'2026-10-19T00:00:00Z',updatedAt:'2026-10-19T00:00:00Z',catalogVersion:catalog.datasetVersion,corpusVersion:corpus.corpusVersion});
// Fictional test event; not a source of real training teams.
export const libraryFixture=():LibrarySnapshot=>librarySchema.parse({schemaVersion:1,id:'test-library',checkedAt:'2026-10-19T00:00:00Z',datasetVersion:'test-version-1',catalogVersion:catalog.datasetVersion,corpusVersion:corpus.corpusVersion,warnings:[],fromCache:false,trainingReady:false,tournaments:[{id:'test-event',name:'Fixture event',dates:'2026-10-19',sourceUrl:'https://example.com/event',joinedTeams:2,unjoined:0,teams:[1,2].map(n=>({id:'test-real:'+n,order:n,placement:[n,n],members:structuredClone(SYNTHETIC_TEAMS[0].members),kind:'real',validation:checkMembers(SYNTHETIC_TEAMS[0].members),provenance:{sourceUrl:'https://example.com/event#'+n,eventName:'Fixture event',eventDates:'2026-10-19',regulation:'M-C',retrievedAt:'2026-10-19T00:00:00Z'}}))}]});
