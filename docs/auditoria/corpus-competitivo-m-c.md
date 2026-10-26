# Corpus competitivo y revisión de equipos M-C

La versión m-c-2026-10-19.corpus.1 conecta el catálogo de formas con movimientos, habilidades, objetos, naturalezas y listas de movimientos aprendibles de Champions. Un validador de campos revisa equipos sin completar los datos ausentes. La revisión de las 42 listas del torneo no encuentra incompatibilidades en los campos comprobables; todas siguen incompletas para un análisis de estadísticas y daño.

El corpus es candidato y conserva runtimeReady en false. Sus efectos declarativos y referencias a eventos documentan la fuente técnica; todavía no constituyen un motor de turnos o una evaluación de leads.

## Contenido y trazabilidad

| Contenido | Cantidad |
|---|---:|
| Movimientos candidatos de la fuente | 515 |
| Movimientos presentes en alguna lista aprendible del roster | 510 |
| Habilidades, incluida una con conflicto de disponibilidad | 317 |
| Objetos candidatos | 166 |
| Naturalezas | 25 |
| Listas aprendibles de las formas seleccionables | 262 |
| Relaciones entre una forma y un movimiento | 15 987 |
| Referencias a funciones de eventos de la fuente | 1 228 |

Archivos:

- [Corpus versionado](../../data/corpus/m-c-2026-10-19.corpus.1/corpus.json).
- [Cobertura, parche y diferencias](../../data/corpus/m-c-2026-10-19.corpus.1/report.json).
- [Informe de las listas del torneo](../../research/evidence/candidate-fields-0.1.0/tournament-review.json).
- [Generador y validador de campos](../../research/corpus).

La entrada fija el SHA-256 del catálogo anterior y utiliza la misma revisión de Showdown. El corpus registra su propio checksum y su licencia. Generar contenido diferente requiere una nueva versión; el catálogo de formas anterior permanece intacto.

Las listas aprendibles se obtienen con el método nativo de la revisión fijada de Champions. Conservan la procedencia de cada movimiento, incluidas las herencias entre formas. La pertenencia individual a una lista no acredita todas las restricciones conjuntas de cuatro movimientos.

Los movimientos de una forma de combate se relacionan con el set de su forma de origen. Transformarse no concede un set nuevo. Un movimiento globalmente presente en la fuente tampoco se puede asignar a cualquier especie.

## Comprobaciones del parche oficial

Las seis comprobaciones del [aviso oficial del 9 de septiembre](https://news.pokemon-home.com/en/page/817.html) coinciden con la fuente técnica: tres retiradas de movimientos de listas concretas, disponibilidad de Slash y los PP efectivos de Wish y Strength Sap en 8.

El corpus distingue PP de referencia y PP efectivos de Champions. En Wish, el valor de referencia es 5 y el cálculo específico del simulador produce 8. Ese valor se contrasta con el aviso oficial; copiar directamente los PP de referencia daría una cifra incorrecta. El resto de movimientos conserva como procedencia la regla específica de PP de la implementación fijada.

## Efectos y límites de implementación

Se conservan propiedades como prioridad, objetivo, potencia, precisión, condiciones de campo, alteraciones de estadísticas, estados, efectos secundarios y restricciones. Los efectos que dependen de código de eventos incluyen la ruta del evento y el hash de la función en la fuente fijada. También se mantienen las condiciones anidadas, como las de Protección y redirección.

Esas funciones no se ejecutan en el producto. Todos los registros señalan que la evaluación de turnos está pendiente. El número de referencias no mide la cobertura de un entrenador: antes de usar un efecto en una recomendación habrá que implementarlo y contrastarlo con referencias del juego.

## Diferencias que requieren revisión

El cruce detecta diferencias en datos de 12 movimientos respecto a la calculadora 0.12.0, y un movimiento candidato ausente de ella. Son diferencias entre implementaciones que necesitan interpretación; no todas son errores mecánicos.

Por ejemplo, el objeto de Espacio Raro de la calculadora utiliza prioridad 0, mientras la fuente de Champions usa -7. El futuro evaluador debe obtener prioridades del corpus y resolver el orden de acciones. El cálculo de daño de un movimiento no sustituye esa operación.

Struggle también representa una diferencia de contexto: la calculadora usa un tipo especial para su tratamiento de daño. No se puede corregir una discrepancia de ese tipo copiando un campo sin revisar el comportamiento.

La habilidad Aura Guard está referenciada por Mega-Lucario Z, pero sigue marcada Future en la misma revisión de Showdown. Se conserva con un conflicto explícito, sin descartarla ni declararla disponible por inferencia. Continúan abiertas las discrepancias de habilidades predeterminadas de Mega-Hawlucha y Mega-Skarmory registradas en el catálogo.

Referencias técnicas primarias: [métodos de listas aprendibles](https://github.com/smogon/pokemon-showdown/blob/7b02eb39878f4b486f658a752b38c161379bd352/sim/dex-species.ts), [mecánicas de Champions](https://github.com/smogon/pokemon-showdown/blob/7b02eb39878f4b486f658a752b38c161379bd352/data/mods/champions/scripts.ts) y [habilidades de la revisión fijada](https://github.com/smogon/pokemon-showdown/blob/7b02eb39878f4b486f658a752b38c161379bd352/data/abilities.ts).

## Validador de campos de equipos

La versión candidate-fields-0.1.0 comprueba tamaño del equipo, identidades, pertenencia de habilidades y movimientos, objetos, naturalezas, duplicados y límites de entrada SP. Separa tres resultados:

- candidate_checks_passed: los campos conocidos pasan las comprobaciones candidatas.
- incomplete_candidate: faltan datos o hay ambigüedades que necesitan confirmación.
- published_fields_conflict: algún campo contradice el corpus candidato o el contrato de entrada.

Ninguno de esos estados habilita por sí solo un entrenamiento. La verificación del juego y las restricciones conjuntas permanecen pendientes.

Los repartos SP ausentes quedan en null. Los repartos parciales conservan sus huecos y los EVs clásicos requieren una conversión explícita. No se asignan ceros, repartos habituales ni una habilidad diferente para hacer pasar un set.

Un nombre genérico de proveedor, como Vivillon o Floette, puede necesitar confirmar la forma aunque solo exista una candidata en el reglamento. Una habilidad exclusiva de la mega, junto con su piedra correcta, exige aclarar la fase del set. Si no existe esa relación de transformación, el validador registra la incompatibilidad.

La cláusula de objetos detecta duplicados. Llevar distintas megapiedras no crea por sí solo una infracción de un supuesto límite de una piedra por roster.

## Resultado de la muestra real

La revisión usa la respuesta de [Chaos League Sunday Slam 117](https://play.limitlesstcg.com/api/tournaments/6acfe5ff8a8383117e3ebdde/standings) ya auditada, con hashes de la clasificación y los detalles del evento. No vuelve a descargarla ni publica nombres de jugadores o sets completos.

| Resultado | Cantidad |
|---|---:|
| Listas revisadas de seis Pokémon | 42 |
| Listas clasificadas como candidatas incompletas | 42 |
| Repartos SP ausentes conservados como desconocidos | 252 |
| Campos de forma pendientes de confirmación | 3 |
| Campos de habilidad pendientes de aclarar su fase | 1 |
| Campos heredados de teratipo señalados | 5 |
| Incompatibilidades en los campos comprobables | 0 |

Este resultado describe una muestra y las comprobaciones implementadas. No acredita legalidad completa, frecuencia del metajuego ni repertorios de leads realmente usados. El banco de ejercicios permanece sin habilitar.

## Reproducción y pruebas

Después de preparar las [fuentes del catálogo](catalogo-m-c.md#reproducción-y-pruebas):

```sh
node research/corpus/build.cjs
node --test research/corpus/corpus.test.cjs
node research/corpus/probe-tournament.cjs
```

La revisión del torneo necesita los dos archivos de caché de la auditoría inicial y sus hashes. Si faltan, el [probe original de fuentes](../../research/probe-sources.py) permite recuperarlos; una respuesta distinta requiere nueva evidencia.

Han pasado 24 pruebas nuevas. Cubren compatibilidad de versiones, parche, PP efectivos, listas por forma, procedencia, condiciones anidadas, conflictos, datos ausentes, SP inválidos, movimientos incompatibles, duplicados, ambigüedad de habilidades y ausencia de datos personales en el informe.

## Continuación del trabajo

A03 tiene su primer corpus candidato reproducible y A05 cuenta con una revisión de campos de la muestra real. Siguen abiertos los conflictos señalados y la validación del juego. El siguiente paso funcional es preparar la importación de equipos propios con formato explícito, conversión EV a SP confirmable y diagnósticos que el editor pueda mostrar. El motor de aperturas incorporará después efectos comprobados, con cobertura declarada por regla.

