import {describe,it,expect} from 'vitest';
import {Generations,Pokemon,Field} from '@smogon/calc';
import {getFinalSpeed} from '@smogon/calc/dist/mechanics/util.js';
import {blankSpeed,baseSpeedStat,effectiveSpeed,speedRange,compareSpeeds,minimumSpToBeat,inputFromMember,orderValue,SPEED_FORMS} from '../src/domain/speed';
import {emptyMember} from '../src/domain/team';
const settings=(override={})=>({...blankSpeed(),species:'garchomp',sp:32,nature:'Adamant',...override});
describe('Champions speed arithmetic',()=>{
  it('keeps base, stat and effective speed distinct and rounds natures down',()=>{
    expect(baseSpeedStat(102,0,'Serious')).toBe(122);expect(baseSpeedStat(102,32,'Adamant')).toBe(154);expect(baseSpeedStat(102,32,'Jolly')).toBe(169);expect(baseSpeedStat(102,0,'Brave')).toBe(109);
    expect(speedRange(settings({item:'scarf'}),'none')).toMatchObject({base:102,statMin:154,min:231,max:231,exact:true});
  });
  it('rejects EVs, fractions and invalid stages instead of silently clamping',()=>{for(const sp of [-1,33,252,2.5])expect(()=>baseSpeedStat(102,sp,'Jolly')).toThrow();expect(()=>effectiveSpeed(102,32,'Jolly',settings({stage:7}),'none')).toThrow();});
  it('preserves unknown fields and computes an interval without inventing a build',()=>{const result=speedRange({...blankSpeed(),species:'garchomp'},'none');expect(result).toMatchObject({base:102,min:109,max:169,exact:false});expect(speedRange(settings({nature:'',sp:32}),'none')).toMatchObject({min:138,max:169,exact:false});});
  it('distinguishes a tie, overlapping ranges, a definite advantage and Trick Room',()=>{expect(compareSpeeds(settings(),settings(),'none',false).kind).toBe('tie');expect(compareSpeeds(settings(),settings({sp:null,nature:''}),'none',false).kind).toBe('uncertain');expect(compareSpeeds(settings({item:'scarf'}),settings(),'none',false).kind).toBe('own');expect(compareSpeeds(settings({item:'scarf'}),settings(),'none',true).kind).toBe('opponent');});
  it('uses the exact Trick Room wrap at unusual high-speed boundaries',()=>{expect(orderValue(1808,true)).toBe(0);expect(orderValue(1809,true)).toBe(8191);expect(orderValue(100,true)).toBeGreaterThan(orderValue(200,true));});
  it('computes the minimum legal SP to strictly beat a known target and accounts for boosts',()=>{expect(minimumSpToBeat(settings({sp:null,nature:'Jolly'}),settings(),'none',false)?.sp).toBe(19);expect(minimumSpToBeat(settings(),settings({nature:'Jolly'}),'none',false)?.sp).toBeNull();expect(minimumSpToBeat(settings({nature:''}),settings(),'none',false)).toBeNull();expect(minimumSpToBeat(settings({nature:'Brave'}),settings(),'none',true)?.sp).toBe(0);});
  it('imports only speed-related fields from a team without mutation or implicit EV conversion',()=>{const member={...emptyMember(),species:'Garchomp',item:'Choice Scarf',nature:'Adamant',sp:{spe:32},ability:'Rough Skin'};const original=structuredClone(member);expect(inputFromMember(member)).toMatchObject({species:'garchomp',sp:32,item:'scarf',nature:'Adamant'});expect(member).toEqual(original);expect(inputFromMember({...member,evs:{spe:252},conversionConfirmed:false}).sp).toBeNull();});
  it('keeps base and mega forms separate',()=>{expect(SPEED_FORMS.find(f=>f.id==='garchomp').base).toBe(102);expect(SPEED_FORMS.find(f=>f.id==='garchompmegaz').base).toBe(151);});
  it('matches the pinned calculation library over all supported modifier combinations',()=>{
    const gen=Generations.get(0);let checks=0;
    for(const nature of ['Adamant','Jolly','Brave'])for(const sp of [0,1,19,32])for(const stage of [-6,-2,-1,0,1,2,6])for(const item of ['none','scarf','ironball'])for(const tailwind of [false,true])for(const paralyzed of [false,true])for(const [ability,weather,abilityActive] of [['','none',false],['Chlorophyll','sun',false],['Swift Swim','rain',false],['Sand Rush','sand',false],['Slush Rush','snow',false],['Unburden','none',true],['Unburden','none',false],['Quick Feet','none',false]]){
      const input=settings({sp,nature,stage,item,tailwind,paralyzed,ability,abilityActive});
      const pokemon=new Pokemon(gen,'Garchomp',{nature,evs:{spe:sp},boosts:{spe:stage},item:item==='scarf'?'Choice Scarf':item==='ironball'?'Iron Ball':undefined,status:paralyzed?'par':undefined,ability:ability||undefined,abilityOn:abilityActive});
      const field=new Field({weather:{sun:'Sun',rain:'Rain',sand:'Sand',snow:'Snow'}[weather],attackerSide:{isTailwind:tailwind}});
      const actual=effectiveSpeed(102,sp,nature,input,weather);
      expect(actual.stat).toBe(pokemon.rawStats.spe);
      // Calc 0.12.0 accidentally applies its gen<=2 cap to Champions generation 0.
      // Use modern modifier mechanics with Champions raw stats to check values above 999 too.
      // This matches pinned Showdown; game equivalence remains a candidate.
      expect(actual.effective).toBe(getFinalSpeed(Generations.get(9),pokemon,field,field.attackerSide));checks++;
    }expect(checks).toBe(8064);
  });
});
