// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,waitFor,cleanup,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App} from '../src/App';
import {db} from '../src/domain/storage';
beforeEach(async()=>{
  await Promise.all(db.tables.map(t=>t.clear()));localStorage.clear();
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('requires EV confirmation, edits a team, saves it and recovers it on remount',async()=>{
  const user=userEvent.setup();const view=render(<App/>);
  await waitFor(()=>expect(screen.getByLabelText('Abrir equipo guardado').textContent).not.toContain('Cargando'));
  await user.click(screen.getByRole('button',{name:'Importar equipo'}));
  await user.click(screen.getByRole('button',{name:'Cargar ejemplo con EV'}));
  await user.click(screen.getByRole('button',{name:'Revisar importación'}));
  const dialog=screen.getByRole('dialog');
  expect(within(dialog).getByText('65/66 SP · 1 punto libre')).toBeTruthy();
  const proceed=within(dialog).getByRole('button',{name:'Llevar al editor'});
  expect((proceed as HTMLButtonElement).disabled).toBe(true);
  await user.click(within(dialog).getByRole('checkbox',{name:'He revisado y confirmo estas conversiones.'}));
  expect((proceed as HTMLButtonElement).disabled).toBe(false);
  await user.click(proceed);
  const name=screen.getByLabelText('Nombre del equipo');await user.clear(name);await user.type(name,'Mi equipo de práctica');
  expect((screen.getByLabelText('SP Ataque') as HTMLInputElement).value).toBe('32');
  expect((screen.getByLabelText('SP Defensa') as HTMLInputElement).value).toBe('0');
  await user.click(screen.getByRole('button',{name:'Guardar equipo'}));
  await screen.findByText('Equipo guardado · versión 1.');
  const saved=(await db.teams.toArray())[0];expect(saved.members[0].evs).toEqual({hp:4,atk:252,spe:252});expect(saved.members[0].sp?.atk).toBe(32);expect(saved.members[1].sp).toBeNull();
  view.unmount();render(<App/>);
  await waitFor(()=>expect((screen.getByLabelText('Nombre del equipo') as HTMLInputElement).value).toBe('Mi equipo de práctica'));
});
it('keeps the last downloaded library when refresh fails',async()=>{
  await db.libraries.put({schemaVersion:1,id:'previous',checkedAt:'2026-10-19T00:00:00Z',datasetVersion:'previous',catalogVersion:'catalog',corpusVersion:'corpus',warnings:[],fromCache:false,trainingReady:false,tournaments:[]});
  await db.settings.put({key:'activeLibrary',value:'previous'});
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Sin conexión. Se conserva la biblioteca anterior.'}),{status:502,headers:{'content-type':'application/json'}})));
  const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Biblioteca'}));
  await screen.findByText(/Última consulta:/);await user.click(screen.getByRole('button',{name:'Actualizar biblioteca'}));
  await screen.findByRole('alert');expect(screen.getByText(/Última consulta:/)).toBeTruthy();expect(await db.libraries.get('previous')).toBeTruthy();
  vi.unstubAllGlobals();
});
