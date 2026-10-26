# Casos de referencia del evaluador de Champions Hero

Estos casos definen qué debe verificarse antes de aceptar recomendaciones competitivas. Las comprobaciones exploratorias de una biblioteca y las referencias del juego son niveles distintos de evidencia.

Cada caso mecánico necesitará reglamento, versión del juego o fecha verificable, sets completos, estado del campo, acciones y resultado esperado revisado. Para daño se necesitan referencias que cubran el rango o los redondeos pertinentes: una sola tirada observada no demuestra un rango completo. Los casos estratégicos deberán tener revisión competitiva y reconocer varias decisiones defendibles.

## Matriz inicial

| ID | Situación que debe cubrirse | Error que debe detectar | Evidencia actual |
|---|---|---|---|
| R01 | Elegibilidad de especie y forma en M-C | Confundir el número de Pokédex con una forma permitida | Listado oficial; correspondencias pendientes |
| R02 | Dos objetos iguales y varias megapiedras distintas | Mezclar cláusula de objetos con límite de una megaevolución por combate | Restricciones oficiales; validador pendiente |
| R03 | Importación EV 252/252/4 | Perder el SP libre o guardar la conversión sin confirmación | Requisito CA-02; contraste del juego pendiente |
| R04 | SP 0, 1 y 32, naturaleza favorable y desfavorable | Redondear mal o interpretar SP como EV | Aritmética de biblioteca comprobada; referencia del juego pendiente |
| R05 | Repartos inválidos, incompletos e IVs clásicos de velocidad cero | Aceptar más de 32/66 SP o conservar una velocidad de otro sistema | La biblioteca acepta entradas inválidas; validación propia pendiente |
| R06 | Velocidad, Viento Afín, Espacio Raro y empate de velocidad | Reducir todas las decisiones a una comparación de velocidades sin prioridades | Secuencia del juego pendiente |
| R07 | Sorpresa ante protección, inmunidades y objetivos con recursos distintos | Confundir daño calculado con interrupción garantizada o disponibilidad del movimiento | Comprobaciones parciales de biblioteca |
| R08 | Armor Tail propio y del aliado; Campo Psíquico con objetivo en tierra y fuera de tierra | Aplicar una protección al objetivo o al lado incorrectos | Comprobado solo el caso del propio Farigiraf y el objetivo en tierra en la biblioteca |
| R09 | Redirección de Follow Me y Rage Powder, movimientos de área y excepciones | Tratar toda redirección como equivalente o garantizar la protección | Referencias del juego pendientes |
| R10 | Dos climas o terrenos al entrar | Aplicar habilidades en un orden incorrecto y recomendar desde un campo equivocado | Referencias del juego pendientes |
| R11 | Mega con cambio de habilidad, tipo o velocidad en la apertura | Evaluar toda la apertura con la forma inicial o asumir la transformación rival | Formas nuevas presentes en biblioteca; secuencia pendiente |
| R12 | Ataques de área que pueden afectar al aliado | Valorar únicamente el daño al rival | Diferencia singles/doubles comprobada; interacción de pareja pendiente |
| R13 | Dos repartos o movimientos rivales plausibles producen conclusiones distintas | Presentar una amenaza de KO o un plan como garantizados con sets ocultos | Contrato de incertidumbre de v1.0; escenarios pendientes |
| R14 | Una lead defendible con varios planes alternativos | Descartarla por no coincidir con una única pareja preferida | Revisión competitiva pendiente |
| R15 | Roster de seis con solo dos leads seleccionadas | Contar un cambio a una reserva no elegida como ventaja segura | Requisito CA-12; caso de producto pendiente |
| R16 | Mismo caso con los tres perfiles y tras una actualización de datos | Alterar hechos mecánicos o reescribir una evaluación histórica | Requisitos CA-19 y CA-24; caso de producto pendiente |

## Registro de evidencia de cada caso

- Identificador, fecha y enlace o archivo de evidencia reutilizable.
- Versiones de reglamento, mecánicas, datos y biblioteca.
- Datos completos conocidos; suposiciones e información oculta por separado.
- Resultado esperado, justificación y revisión.
- Resultado observado, diferencias, límites de cobertura y estado de aceptación.

Los casos con evidencia pendiente no se convertirán en resultados de referencia inventados. Podrán usarse como pruebas exploratorias claramente identificadas hasta completar su contraste.

