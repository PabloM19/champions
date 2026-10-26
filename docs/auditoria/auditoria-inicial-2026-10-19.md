# Auditoría de fuentes y mecánicas de Champions Hero

Revisión del 19 de octubre de 2026. La base para iniciar el catálogo es viable: existe un listado oficial de elegibilidad, hay listas reales de M-C accesibles por API y la versión publicada de la calculadora candidata incluye Champions. El catálogo completo y la corrección competitiva del motor todavía requieren validación.

El alcance de esta entrega es la investigación previa al producto. La especificación v1.0 se conserva como referencia funcional; los hallazgos técnicos siguientes no reabren las decisiones de producto.

## Reglamento y catálogo oficial

El [reglamento M-C](https://champions-news.pokemon-home.com/en/page/816.html) fija su periodo entre el 9 de septiembre de 2026 a las 02:00 UTC y el 2 de diciembre de 2026 a las 01:59 UTC. Por fechas incluye esta revisión. Establece una megaevolución por combate y prohíbe objetos equipados duplicados.

Su [lista oficial de elegibles](https://web-view.app.pokemonchampions.jp/battle/pages/events/rs178713870219xeaaio/en/pokemon.html) contiene 262 identificadores distintos, correspondientes a 231 números de Pokédex. El recuento procede del array JSON incluido en la página, sin ejecutar código de esa página. La página se comprobó también visualmente.

Esos dos recuentos tienen alcances diferentes: 231 especies no equivalen a 231 formas. La lista tampoco representa por sí sola todas las transformaciones de combate. La correspondencia entre sus identificadores y los de otros proveedores debe conservarse, especialmente donde una misma etiqueta visible cubre formas distintas. Por ejemplo, Squawkabilly aparece con dos identificadores y el nombre Floette está asociado a 0670-005.

La regla de una megaevolución por combate no permite deducir una prohibición de llevar varias megapiedras diferentes en el roster. Las restricciones de selección y de activación se modelarán por separado.

### Cambios de mecánicas publicados

El [aviso oficial del 9 de septiembre](https://news.pokemon-home.com/en/page/817.html) retira Pound de Politoed y Mirror Coat y Metal Burst de Archaludon, incorpora Slash y cambia los PP de Wish y Strength Sap de 12 a 8. Estos cambios deben formar parte de la versión de mecánicas y de los learnsets.

El [aviso del 7 de octubre](https://champions-news.pokemon-home.com/en/page/844.html) comunica correcciones sin enumerar sus detalles. Esa nota no permite inferir qué interacciones concretas cambiaron. El corpus de mecánicas deberá contrastarse con el juego; estos avisos no constituyen un historial exhaustivo de todos los parches.

## Equipos reales de Limitless

La [documentación de acceso](https://docs.limitlesstcg.com/developer) permite consultar los endpoints ordinarios sin clave; la excepción indicada es la categorización de decks. Los límites se exponen en cabeceras. En la respuesta observada de /games figuraba una política de 50 consultas por 300 segundos; es una observación del servicio y no una constante del proyecto.

El catálogo /games identifica VGC y el formato M-C. Una consulta limitada a tres eventos devolvió candidatos fechados el 18 y el 19 de octubre. Se inspeccionó un evento para comprobar el contenido real de las respuestas.

| Campo | Resultado de la muestra |
|---|---|
| Evento | Chaos League Sunday Slam #117 |
| ID | 6acfe5ff8a8383117e3ebdde |
| Inicio anunciado | 18 de octubre de 2026, 21:00 UTC |
| Formato y plataforma | M-C, SWITCH |
| Participantes y listas | 42 filas; 42 listas de seis |
| Campos observados por integrante | id, name, item, ability, attacks, nature, tera |
| Campos SP o EV observados | Ninguno |

Referencias directas: [detalles](https://play.limitlesstcg.com/api/tournaments/6acfe5ff8a8383117e3ebdde/details) y [clasificación con listas](https://play.limitlesstcg.com/api/tournaments/6acfe5ff8a8383117e3ebdde/standings). El resumen estructural se conserva en research/evidence/source-probes-2026-10-19.json; las respuestas originales están en caché local excluida de Git.

La presencia de una lista permite documentar ese roster y sus campos publicados. No acredita los repartos SP, la lead utilizada en cada partida, ni que todos sus campos superen nuestra futura validación de legalidad. El campo heredado tera no demuestra que se permita esa mecánica.

La API es candidata para la ingesta controlada. Su documentación contempla aplicaciones que agregan resultados, pero no se ha acreditado una licencia general de redistribución de todos los datos de jugadores y activos. Esa cuestión queda separada del acceso técnico. La muestra tampoco mide la frecuencia mundial de arquetipos ni demuestra cobertura suficiente para todos los filtros.

## Datos generales y estadísticas competitivas

### PokéAPI

La [documentación](https://pokeapi.co/docs/v2) permite GET sin autenticación y exige caché local. La respuesta actual de version-group incluye champions y el ejemplo de Garchomp ofrece 58 movimientos vinculados a ese grupo. Hay cobertura específica aprovechable, aunque sigue siendo información comunitaria que debe contrastarse con M-C y sus parches.

En el ejemplo, las estadísticas base son 108/130/95/80/85/102. Son una referencia de contraste para detectar errores de interpretación entre proveedores. El acceso a la API no concede por sí mismo derechos sobre sprites y marcas.

### Pokémon Champions Battle Data

La [guía de la API](https://championsbattledata.com/api_guide) describe datos agregados de movimientos, objetos, habilidades, naturalezas, compañeros y repartos SP por modalidad. La muestra de Garchomp confirma esas categorías. Son distribuciones marginales: combinar el movimiento, objeto y reparto más frecuentes no produce automáticamente un set observado conjuntamente ni un equipo real.

Las [reglas de uso](https://championsbattledata.com/api-rules/) permiten proyectos personales y comerciales, exigen atribución en proyectos públicos y permiten caché razonable. Prohíben la redistribución como servicio de datos, los volcados y los espejos que sustituyan a la API. No transfieren derechos sobre imágenes. Cualquier paquete distribuido tendrá que respetar ese alcance.

El endpoint individual consultado devuelve aproximadamente 1,18 MB e incluye referencias a muchos días. Conviene preferir consultas acotadas. Current es una selección mutable; los futuros ejercicios necesitarán fecha, temporada y correspondencia comprobada con el reglamento.

**Riesgo detectado:** summary.baseStats.hp contiene 183 y base_stat_total contiene 775 para Garchomp. Al compararlo con sus PS base 108 y con el cálculo neutral de la biblioteca, esos valores parecen estadísticas calculadas, no estadísticas base de especie. Esa interpretación es una inferencia del contraste, pendiente de fijar con el contrato del proveedor. No se copiará ese objeto a PokemonForm.baseStats.

## Compatibilidad de la calculadora

La versión publicada [@smogon/calc 0.12.0](https://registry.npmjs.org/@smogon/calc/0.12.0) incluye un modo Champions mediante Generations.get(0). Se comprobó el paquete instalado con scripts de instalación desactivados y versión bloqueada. El repositorio declara [licencia MIT](https://github.com/smogon/damage-calc/blob/c1eb09be483f0bbf65132bf3703ee677195132f3/LICENSE).

El [cálculo de estadísticas](https://github.com/smogon/damage-calc/blob/c1eb09be483f0bbf65132bf3703ee677195132f3/calc/src/stats.ts) tiene una ruta específica para Champions. El parámetro llamado evs representa SP en ese modo. Pasar EVs tradicionales sin conversión provoca resultados incorrectos.

La prueba exploratoria pasó 14 comprobaciones de API, aritmética candidata, presencia de seis megas y comportamiento de daño bajo condiciones proporcionadas. Detectó también que la biblioteca acepta 33 SP en una estadística y repartos superiores a 66: la legalidad requiere nuestro propio validador.

El resultado está en research/evidence/calc-0.12.0.json. Estas comprobaciones describen el paquete, no certifican su equivalencia con el juego. Tampoco demuestran que se resuelva una apertura completa: obtener daño cero para Espacio Raro no determina si llega a activarse, y calcular Sorpresa no resuelve toda la secuencia de acciones.

Decisión técnica provisional: mantener esta versión como candidata para el adaptador de daño y estadísticas, y validar las interacciones antes de usar sus resultados en recomendaciones.

## Fuentes complementarias

El código de [Pokémon Showdown para Champions](https://github.com/smogon/pokemon-showdown/tree/master/data/mods/champions) ofrece módulos de movimientos, habilidades, objetos, learnsets y reglas. Su [implementación de estadísticas](https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/scripts.ts) usa SP y contempla diferencias específicas de Champions. Es una referencia técnica primaria de ese simulador, con [licencia MIT](https://raw.githubusercontent.com/smogon/pokemon-showdown/master/LICENSE), que debe fijarse a una revisión antes de incorporarse. No sustituye al reglamento ni a una referencia del juego.

Los [términos de Pokémon Zone](https://www.pokemon-zone.com/terms/), apartado 11, prohíben el acceso mediante scrapers y otros medios automatizados. Queda excluido de la ingesta automatizada.

Play! Pokémon y RK9 quedan como candidatos de investigación posterior; esta entrega no verifica sus condiciones ni un corpus reutilizable. La referencia comunitaria de Stat Points de la especificación conserva su condición secundaria. Falta contrastar en el juego la conversión, los límites y los resultados de estadísticas.

## Trabajo restante y orden de ejecución

| ID | Trabajo | Condición de cierre |
|---|---|---|
| A01 | Correspondencia de especies y formas de M-C | Las 262 entradas tienen ID estable, origen y resolución explícita de ambigüedades |
| A02 | Formas de combate y megapiedras | Relaciones especie, objeto, forma y habilidad verificadas; selección separada de transformación |
| A03 | Movimientos, habilidades y objetos | Corpus versionado, diferencias de parches y fuente por dato; omisiones explícitas |
| A04 | Contrato de fuentes y uso permitido | Separar campos base/calculados, temporadas, datos agregados, caché, atribución y distribución |
| A05 | Primer lote de equipos candidatos | Evento y fecha verificables; deduplicación, legalidad y campos desconocidos conservados |
| A06 | Referencias del juego | Completar los casos definidos en casos-de-referencia.md con evidencia independiente |
| A07 | Adaptador competitivo | Límites SP, conversión confirmable, cálculos y abstención comprobados antes de conectar la UI |

La auditoría inicial está terminada como inventario y prueba de viabilidad. La fase de validación previa al motor permanece abierta hasta resolver A01–A07. Ninguna historia de evaluación competitiva se considera terminada por estas pruebas exploratorias.

## Avance posterior del catálogo

El [catálogo candidato M-C](catalogo-m-c.md) resuelve A01 con 262 correspondencias y prepara A02 con formas de combate y piedras. Su informe conserva dos conflictos entre habilidades predeterminadas de proveedores técnicos. La tabla anterior describe el plan original; el estado actualizado y las condiciones aún abiertas se detallan en ese hito.

