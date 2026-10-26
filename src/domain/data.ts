import candidates from '../data/candidates.json';
import {validateTeam} from './validate-team.js';
import {toID} from './ids.js';
import {toValidationMember,type Member} from './team';
export const {catalog,corpus}=candidates;
export function formFor(species:string){return catalog.rosterForms.find(f=>f.showdownId===toID(species));}
export function checkMembers(members:Member[]){return validateTeam(members.map(toValidationMember),catalog,corpus);}
export const ISSUE_TEXT:Record<string,string>={
  team_size_not_six:'El equipo necesita seis integrantes.',species_not_in_official_roster:'La especie o forma no figura en el roster M-C.',
  missing_species:'Falta elegir especie o forma.',missing_ability:'Falta la habilidad.',missing_nature:'Falta la naturaleza.',missing_moves:'Faltan movimientos.',
  missing_sp:'El reparto SP es desconocido.',item_absent_or_unspecified:'El objeto no está especificado.',
  move_slots_not_complete:'Hay huecos de movimientos.',provider_form_requires_confirmation:'Hay que confirmar la forma exacta.',
  battle_form_requires_import_normalization:'La forma de combate requiere revisar su forma inicial.',ability_stage_requires_confirmation:'Hay que aclarar si la habilidad corresponde a la mega.',
  ability_availability_conflict:'La disponibilidad de esta habilidad sigue en revisión.',unknown_or_unavailable_ability:'La habilidad no consta en el corpus candidato.',
  ability_not_on_roster_form:'La habilidad no corresponde a esta forma inicial.',unknown_or_unavailable_item:'El objeto no consta en el corpus candidato.',
  unknown_nature:'Naturaleza no reconocida.',too_many_moves:'Hay más de cuatro movimientos.',duplicate_move:'Hay movimientos duplicados.',
  unknown_or_unavailable_move:'Un movimiento no consta en el corpus candidato.',move_not_in_champions_learnset:'Un movimiento no pertenece a la lista candidata de esta forma.',
  duplicate_species_candidate_rule:'Hay una especie repetida en el equipo.',duplicate_held_item:'Hay un objeto repetido en el equipo.',
  legacy_tera_field_not_enabled:'El teratipo importado se conserva como referencia y no se activa en Champions.',
  sp_out_of_range:'Cada SP debe ser un entero entre 0 y 32.',sp_total_above_66:'El reparto supera los 66 SP.',sp_distribution_incomplete:'El reparto SP tiene valores sin indicar.',
  ev_input_requires_explicit_conversion:'La conversión EV → SP necesita confirmación.',mega_stone_has_no_transformation_for_holder:'La megapiedra no transforma a este portador.',
};
