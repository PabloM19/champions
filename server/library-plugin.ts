import type {Plugin,Connect} from 'vite';
import {createUpdater} from './vgc-history.mjs';
import {createSpeedReferences} from './speed-reference.mjs';
export function libraryPlugin():Plugin {
  const updater=createUpdater();
  const references=createSpeedReferences();
  const middleware:Connect.NextHandleFunction=async(req,res,next)=>{
    const pathname=req.url?.split('?')[0];
    if(pathname?.startsWith('/api/speed-reference/')){
      res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
      const species=pathname.slice('/api/speed-reference/'.length);
      if(!/^[a-z0-9]{1,60}$/.test(species)){res.statusCode=400;res.end(JSON.stringify({error:'Identificador no válido.'}));return;}
      if(req.method!=='GET'&&req.method!=='POST'){res.statusCode=405;res.end(JSON.stringify({error:'Método no admitido.'}));return;}
      const origin=req.headers.origin;
      if((origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)||req.headers['sec-fetch-site']==='cross-site'){res.statusCode=403;res.end(JSON.stringify({error:'Origen no permitido.'}));return;}
      try{res.end(JSON.stringify(await references.get(species,req.method==='POST')));}catch{res.statusCode=502;res.end(JSON.stringify({error:'Sin referencias disponibles. Puedes seguir calculando con la base o editar el reparto.'}));}return;
    }
    if(pathname!=='/api/library'&&pathname!=='/api/library/refresh')return next();
    res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
    if((pathname==='/api/library'&&req.method!=='GET')||(pathname==='/api/library/refresh'&&req.method!=='POST')){res.statusCode=405;res.end(JSON.stringify({error:'Método no admitido.'}));return;}
    // No arbitrary target URL and no user content is forwarded to a source.
    const origin=req.headers.origin;
    if((origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)||req.headers['sec-fetch-site']==='cross-site'){
      res.statusCode=403;res.end(JSON.stringify({error:'Origen no permitido.'}));return;
    }
    try{res.end(JSON.stringify(pathname.endsWith('/refresh')?await updater.refresh():await updater.readLatest()));}
    catch(error){res.statusCode=502;res.end(JSON.stringify({error:error instanceof Error?error.message:'No se ha podido actualizar.'}));}
  };
  return {name:'champions-local-library',configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);}};
}
