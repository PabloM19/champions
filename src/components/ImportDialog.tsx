import {useEffect,useRef,useState} from 'react';
import {ClipboardPaste,ArrowRight,X,Check,TriangleAlert} from 'lucide-react';
import {parsePaste} from '../domain/import-paste';
import {convertEvs,STAT_LABELS,type Member} from '../domain/team';
import {catalog,checkMembers,ISSUE_TEXT} from '../domain/data';
const EXAMPLE=`Garchomp @ Choice Scarf
Ability: Rough Skin
EVs: 4 HP / 252 Atk / 252 Spe
Adamant Nature
- Rock Slide
- Stomping Tantrum
- Dragon Claw
- Earthquake

Farigiraf @ Sitrus Berry
Ability: Armor Tail
Quiet Nature
- Psychic
- Thunderbolt
- Helping Hand
- Trick Room

Incineroar @ Chople Berry
Ability: Intimidate
Adamant Nature
- Flare Blitz
- Darkest Lariat
- Parting Shot
- Fake Out

Charizard @ Charizardite Y
Ability: Blaze
Modest Nature
- Heat Wave
- Weather Ball
- Ancient Power
- Protect

Sylveon @ Fairy Feather
Ability: Pixilate
Modest Nature
- Hyper Voice
- Moonblast
- Yawn
- Protect

Venusaur @ Focus Sash
Ability: Chlorophyll
Modest Nature
- Leaf Storm
- Sludge Bomb
- Sleep Powder
- Protect`;
export function ImportDialog({onClose,onImport}:{onClose:()=>void;onImport:(members:Member[],raw:string)=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  const [text,setText]=useState(''),[preview,setPreview]=useState<ReturnType<typeof parsePaste>|null>(null),[confirmed,setConfirmed]=useState(false);
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  const conversion=preview?.members.filter(m=>m.evs);
  const validation=preview?.members.length===6?checkMembers(preview.members):null;
  const errors=validation?.issues.filter(i=>i.kind==='error')??[];
  return <dialog ref={ref} className="import-dialog" aria-labelledby="import-title" onCancel={e=>{e.preventDefault();onClose();}}>
    <header className="dialog-header"><div><p className="eyebrow">DE PASTE A EQUIPO</p><h2 id="import-title">Trae a tus seis.</h2></div><button className="icon-button" aria-label="Cerrar importación" onClick={onClose}><X size={22}/></button></header>
    <p className="muted">Pega un equipo en formato Showdown. Revisaremos los campos antes de llevarlo al editor.</p>
    <label className="field-label" htmlFor="paste">Texto del equipo</label>
    <textarea id="paste" className="paste-input" placeholder={'Garchomp @ Choice Scarf\nAbility: Rough Skin\nEVs: 4 HP / 252 Atk / 252 Spe\nAdamant Nature\n- Earthquake'} value={text} onChange={e=>{setText(e.target.value);setPreview(null);setConfirmed(false);}} spellCheck={false}/>
    <div className="row spread"><button className="text-button" onClick={()=>{setText(EXAMPLE);setPreview(null);setConfirmed(false);}}>Cargar ejemplo con EV</button><span className="small muted">El ejemplo incluye un reparto de demostración.</span></div>
    {preview&&<section className="import-results" aria-live="polite">
      <h3>{preview.members.length} integrantes detectados</h3>
      {preview.issues.map((issue,i)=><p className="message error" key={i}>Línea {issue.line}: {issue.message}</p>)}
      {errors.map((issue,i)=><p className="message error" key={i}>{issue.memberIndex===null?'Equipo':preview.members[issue.memberIndex]?.species}: {ISSUE_TEXT[issue.code]??issue.code}</p>)}
      {!!conversion?.length&&<div className="conversion-panel"><div className="row"><TriangleAlert size={19}/><h3>Revisa la conversión EV → SP</h3></div>
        {conversion.map((m,i)=>{let result;try{result=convertEvs(m.evs!);}catch{return null;}return <div key={i}><strong>{m.species}</strong><p className="small">EV originales: {Object.entries(m.evs!).map(([s,v])=>`${v} ${STAT_LABELS[s as keyof typeof STAT_LABELS]}`).join(' / ')}</p><p>SP propuestos: {Object.entries(result.sp).filter(([,v])=>v).map(([s,v])=>`${v} ${STAT_LABELS[s as keyof typeof STAT_LABELS]}`).join(' / ')}</p><p className="accent">{result.total}/66 SP · {result.remaining} {result.remaining===1?'punto libre':'puntos libres'}</p></div>;})}
        <p className="small">Los puntos libres quedan sin asignar. El reparto original se conserva. Las estadísticas resultantes se añadirán cuando esté validado su cálculo.</p>
        <label className="check-label"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>He revisado y confirmo estas conversiones.</label>
      </div>}
      {!preview.issues.length&&!errors.length&&<p className="message"><Check size={17}/>Puedes llevar el equipo al editor. Los datos ausentes seguirán pendientes.</p>}
    </section>}
    <footer className="dialog-footer"><span className="small muted">Catálogo candidato {catalog.regulation.id.replace('champions-','').toUpperCase()}</span>
      {!preview?<button className="primary" disabled={!text.trim()} onClick={()=>setPreview(parsePaste(text))}><ClipboardPaste size={18}/>Revisar importación</button>:
      <button className="primary" disabled={!!preview.issues.length||!!errors.length||!!conversion?.length&&!confirmed} onClick={()=>onImport(preview.members.map(m=>m.evs?{...m,sp:convertEvs(m.evs).sp,conversionConfirmed:true}:m),text)}>Llevar al editor<ArrowRight size={18}/></button>}
    </footer>
  </dialog>;
}
