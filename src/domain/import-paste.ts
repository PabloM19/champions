import {convertEvs,emptyMember,type Distribution,type Member,type Stat} from './team';
const aliases:Record<string,Stat>={hp:'hp',ps:'hp',atk:'atk',at:'atk',def:'def',spa:'spa',spatk:'spa',spd:'spd',spdef:'spd',spe:'spe',speed:'spe'};
type ParseIssue = {line:number;message:string};
export function parsePaste(text:string):{members:Member[];issues:ParseIssue[]} {
  const issues:ParseIssue[]=[], members:Member[]=[];
  if(text.length>100_000) return {members,issues:[{line:1,message:'El texto supera el tamaño máximo de 100 KB.'}]};
  let current:Member|null=null;
  const blocks:string[][]=[];
  function stats(value:string,line:number,kind:'evs'|'sp'|'ivs'):Distribution {
    const out:Distribution={};
    for(const part of value.split('/')) {
      const match=part.trim().match(/^(\d+)\s+([A-Za-z.]+)$/);
      const stat=match && aliases[match[2].replaceAll('.','').toLowerCase()];
      if(!match||!stat||out[stat]!==undefined) {issues.push({line,message:`Reparto ${kind.toUpperCase()} no reconocido o duplicado: ${part.trim()}`});continue;}
      out[stat]=Number(match[1]);
    }
    if(kind==='evs') {try{convertEvs(out);}catch(e){issues.push({line,message:(e as Error).message});}}
    if(kind==='ivs' && Object.values(out).some(v=>v>31)) issues.push({line,message:'Los IV clásicos deben estar entre 0 y 31.'});
    // Only EV conversion supplies deliberate zeros. Missing imported SP stay unknown.
    return out;
  }
  let needHeader=true;
  text.replace(/\r\n?/g,'\n').split('\n').forEach((raw,i)=>{
    const line=raw.trim();
    if(!line){needHeader=true;return;}
    if(/^===.*===$/.test(line))return;
    if(needHeader) {
      const match=line.match(/^(.+?)(?:\s+@\s+(.+))?$/)!;
      let species=match[1].replace(/\s+\([MF]\)$/,'');
      const nickname=species.match(/^(.+)\s+\(([^()]+)\)$/);
      current={...emptyMember(),species:nickname?.[2]??species,nickname:nickname?.[1],item:match[2]??''};
      members.push(current);blocks.push([raw]);needHeader=false;return;
    }
    if(!current)return;
    blocks[blocks.length-1].push(raw);
    if(line.startsWith('- ')) {current.moves.push(line.slice(2).trim());if(current.moves.length>4)issues.push({line:i+1,message:'Un Pokémon no puede tener más de cuatro movimientos.'});return;}
    const nature=line.match(/^(.+) Nature$/i);
    if(nature){if(current.nature)issues.push({line:i+1,message:'Naturaleza duplicada.'});current.nature=nature[1];return;}
    const field=line.match(/^([^:]+):\s*(.*)$/);
    if(!field){issues.push({line:i+1,message:`Línea no reconocida: ${line}`});return;}
    const [,key,value]=field;
    if(key==='Ability'){if(current.ability)issues.push({line:i+1,message:'Habilidad duplicada.'});current.ability=value;}
    else if(key==='EVs'||key==='SP'||key==='IVs') {
      const name=key==='EVs'?'evs':key==='SP'?'sp':'ivs';
      if(current[name]!==undefined&&current[name]!==null)issues.push({line:i+1,message:`Campo ${key} duplicado.`});
      current[name]=stats(value,i+1,name);
    } else if(key==='Level') {current.level=Number(value);if(!Number.isInteger(current.level)||current.level<1||current.level>100)issues.push({line:i+1,message:'Nivel no válido.'});}
    else if(key==='Tera Type')current.tera=value;
    else if(['Shiny','Happiness','Gigantamax','Dynamax Level'].includes(key))current.notes.push(`${key}: ${value}`);
    else issues.push({line:i+1,message:`Campo no admitido: ${key}`});
  });
  members.forEach((member,i)=>{
    member.rawBlock=blocks[i].join('\n');
    if(member.sp&&member.evs)issues.push({line:1,message:`${member.species}: usa SP o EVs, no ambos a la vez.`});
    if(member.ivs)member.notes.push('IV originales conservados como referencia; no se aplican como SP.');
  });
  if(members.length!==6)issues.push({line:1,message:`Se necesitan seis Pokémon. Se han leído ${members.length}.`});
  return {members,issues};
}
