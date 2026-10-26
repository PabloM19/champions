import {ChevronRight,HelpCircle} from 'lucide-react';
import {formFor,corpus,ISSUE_TEXT,checkMembers} from '../domain/data';
import {STAT_LABELS,STATS,type Member} from '../domain/team';
const natureEs:Record<string,string>={Adamant:'Firme',Modest:'Modesta',Quiet:'Mansa',Timid:'Miedosa',Jolly:'Alegre',Careful:'Cauta',Bold:'Osada',Calm:'Serena',Brave:'Audaz',Relaxed:'Plácida',Sassy:'Grosera',Impish:'Agitada'};
export const typeEs:Record<string,string>={Grass:'Planta',Fire:'Fuego',Water:'Agua',Normal:'Normal',Psychic:'Psíquico',Dark:'Siniestro',Fairy:'Hada',Dragon:'Dragón',Ground:'Tierra',Flying:'Volador',Fighting:'Lucha',Poison:'Veneno',Steel:'Acero',Rock:'Roca',Electric:'Eléctrico',Ghost:'Fantasma',Ice:'Hielo',Bug:'Bicho'};
export function MemberEditor({member,index,members,onChange}:{member:Member;index:number;members:Member[];onChange:(m:Member)=>void}){
  const form=formFor(member.species),issues=checkMembers(members).issues.filter(i=>i.memberIndex===index);
  const learned=corpus.learnsets.find(l=>l.id===form?.id)?.moves??[];
  const availableMoves=corpus.moves.filter(m=>!form||learned.includes(m.id));
  const total=member.sp?Object.values(member.sp).reduce((a,b)=>a+(b??0),0):null;
  const change=(key:keyof Member,value:unknown)=>onChange({...member,[key]:value});
  return <section className="member-editor" aria-label={`Editar integrante ${index+1}`}>
    <div className="row spread"><p className="eyebrow">SET / {String(index+1).padStart(2,'0')}</p><span className="small muted">M-C · Dobles</span></div>
    <div className="form-grid">
      <label className="wide">Especie o forma<input list="species-list" value={member.species} onChange={e=>change('species',e.target.value)} placeholder="Busca un Pokémon…" autoComplete="off"/></label>
      <label>Objeto<input list="items-list" value={member.item} onChange={e=>change('item',e.target.value)} placeholder="Sin especificar"/></label>
      <label>Habilidad<input list={`abilities-${index}`} value={member.ability} onChange={e=>change('ability',e.target.value)} placeholder="Sin especificar"/><datalist id={`abilities-${index}`}>{(form?.mechanics.abilities??corpus.abilities).map(a=><option key={a.id} value={a.name}/>)}</datalist></label>
      <label className="wide">Naturaleza<select value={member.nature} onChange={e=>change('nature',e.target.value)}><option value="">Sin especificar</option>{corpus.natures.map(n=><option key={n.id} value={n.name}>{n.name}{natureEs[n.name]?` · ${natureEs[n.name]}`:''}</option>)}</select></label>
    </div>
    <div className="section-label"><h3>Movimientos</h3><span className="small muted">{member.moves.filter(Boolean).length}/4</span></div>
    <div className="moves-grid">{[0,1,2,3].map(i=><label className="move-input" key={i}><span>{i+1}</span><input aria-label={`Movimiento ${i+1}`} list={`moves-${index}`} placeholder="Sin especificar" value={member.moves[i]??''} onChange={e=>{const next=Array.from({length:4},(_,n)=>member.moves[n]??'');next[i]=e.target.value;change('moves',next);}}/><ChevronRight size={15}/></label>)}</div>
    <datalist id={`moves-${index}`}>{availableMoves.map(m=><option key={m.id} value={m.name}/>)}</datalist>
    <div className="section-label"><h3>Stat Points</h3><span className={total!==null&&total>66?'error-text':'small muted'}>{total===null?'Reparto desconocido':`${total}/66 SP`}</span></div>
    <div className="sp-grid">{STATS.map(stat=><label key={stat}>{STAT_LABELS[stat]}<input type="number" min="0" max="32" step="1" inputMode="numeric" aria-label={`SP ${STAT_LABELS[stat]}`} placeholder="—" value={member.sp?.[stat]??''} onChange={e=>{const next={...member.sp};if(e.target.value==='')delete next[stat];else next[stat]=Number(e.target.value);change('sp',Object.keys(next).length?next:null);}}/></label>)}</div>
    <p className="small muted">0 es un valor conocido. Un campo vacío sigue siendo desconocido.</p>
    {member.evs&&<details className="source-details"><summary>Reparto EV original conservado</summary><p className="small">{Object.entries(member.evs).map(([s,v])=>`${v} ${STAT_LABELS[s as keyof typeof STAT_LABELS]}`).join(' / ')} · Conversión confirmada</p></details>}
    {!!issues.length&&<details className="diagnostics"><summary><HelpCircle size={16}/>{issues.filter(i=>i.kind==='error').length?`${issues.filter(i=>i.kind==='error').length} incompatibilidades`:'Datos por completar'} · Ver revisión</summary><ul>{issues.map((issue,i)=><li key={i} className={issue.kind==='error'?'error-text':''}>{ISSUE_TEXT[issue.code]??issue.code}</li>)}</ul></details>}
  </section>;
}
