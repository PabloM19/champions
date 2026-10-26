# VGC History como fuente de equipos y enfrentamientos

Primera revisión mediante navegación del sitio el 19 de octubre de 2026. VGC History reúne torneos de Champions, fichas abiertas, búsquedas de combinaciones y resultados por ronda. La revisión inicial descrita debajo comprobó la interfaz y su documentación. Tras la petición posterior del usuario se ha implementado la descarga y actualización local, detallada en [Taller y actualizaciones](../desarrollo/taller-y-actualizaciones.md) y en el [informe agregado de datos reales](../../research/evidence/vgc-history-live-2026-10-19.json).

## Lo comprobado en el navegador

En [Louisville Regionals 2027](https://vgchistory.com/tournaments/regional-louisville-2027), el sitio identifica Pokémon Champions, regulación M-C, división Masters, 1 013 participantes y fechas del 10 y 11 de octubre de 2026. La temporada del nombre no coincide con el año natural: el importador deberá guardar ambos campos por separado.

La ficha del campeón muestra seis Pokémon, movimientos, objetos, habilidades y naturalezas. Su vista Paste ofrece texto de estilo Showdown. No aparecen repartos SP, EV ni IV en esa ficha; no deben deducirse del puesto o de la naturaleza.

Hay una distinción útil entre presentación y set inicial: la ficha visual muestra Mega Charizard Y con Blaze y Drought, mientras el Paste representa Charizard con Charizardite Y y Blaze. El adaptador deberá conservar la forma de origen y la transformación posible, sin importar una mega como especie inicial ni combinar dos habilidades en una sola.

La [búsqueda comprobada](https://vgchistory.com/ask?era=r-m-c#q=(incineroar,careful),(gengar-mega)&view=stats) encuentra 23 equipos con Incineroar de naturaleza Careful y Mega Gengar, distribuidos en cinco torneos M-C. Permite filtrar por reglamento, división, fase y categoría de torneo, y consultar fichas concretas además de agregados. Estas cifras describen la consulta y la fecha de revisión, no una frecuencia universal del metajuego.

El [recorrido de Joseph Ugarte en Louisville](https://vgchistory.com/runs/regional-louisville-2027/joseph-ugarte) muestra rivales por ronda y acceso a las fichas de ambos equipos. Permite construir un ejercicio basado en un enfrentamiento real. No publica en esa vista qué dos Pokémon abrieron cada partida ni sus acciones del primer turno.

## Acceso documentado

La [página Data](https://vgchistory.com/data) ofrece archivos estáticos para construir proyectos, solicita caché y propone acreditar con un enlace. El [About](https://vgchistory.com/about) atribuye los datos de torneos a organizadores y jugadores y los sprites a los juegos. La autorización de uso de los datos que describe el sitio no se registra como una licencia general de sus imágenes.

| Ruta documentada | Contenido descrito | Uso previsto |
|---|---|---|
| /sheets/<tournament-id>.json | Fichas abiertas, con los campos efectivamente publicados | Sets reales con ausencias explícitas |
| /standings/<tournament-id>.json | Clasificación y presencia de ficha | Procedencia y contexto del equipo |
| /matches/<tournament-id>.json | Rivales y ganador por ronda | Emparejar dos equipos que se enfrentaron |
| /stats/pokemon/<slug>.json | Apariciones, uso y jugadores del registro | Descubrimiento y contexto de una especie |
| /stats/items/<slug>.json y /stats/moves/<slug>.json | Agregados de objetos y movimientos | Contexto de variantes |
| /stats/players/<slug>.json | Resultados y equipos por jugador | Trazabilidad, cuando sea necesaria |
| /data.js | Registro general de torneos y entidades | Identificar juego, reglamento y cobertura |
| /sitemap.xml | Páginas e identificadores válidos | Descubrimiento controlado |

No se han solicitado estos archivos en esta revisión. El primer probe deberá comprobar su esquema y conservar URL, fecha de descarga y checksum. Si se necesita /data.js, se extraerán sus datos sin ejecutar JavaScript remoto.

La documentación introduce varios detalles que el adaptador deberá respetar:

- Las posiciones de los archivos de jugador usan schema 2 y pueden ser intervalos. Un intervalo como [3,4] no acredita un tercer puesto exacto. La columna order es una clave de unión y no un resultado deportivo.
- Las fichas se documentan como indexadas por posición; hay que comprobar su relación efectiva con standings y order antes de unir registros.
- Los slugs pueden indicar movedTo o retired. Debe conservarse la identidad original de la captura y resolver las redirecciones de forma controlada.
- Una clasificación puede ser un array o un objeto con rows y dropped. Los retirados no deben recibir un puesto inventado.
- Los archivos de matches describen resultados de encuentros, sin marcadores de cada partida de un Bo3. Incluyen distinciones para byes y jugadores retirados.
- La cobertura puede corresponder a clasificación final, corte reconciliado o una captura parcial de Swiss. Hay que conservar ese alcance.

La [página Coverage](https://vgchistory.com/coverage) permite revisar los huecos por evento. Durante la visita indica 143 equipos registrados en el resumen de Louisville, mientras la página del evento anuncia 1 013 fichas para Day 1 y 143 para Day 2. Antes de importar hay que contrastar qué mide cada contador; no se usará un resumen como prueba de que existen 1 013 sets completos.

## Aplicación a Champions Hero

La fuente encaja en tres usos del alcance acordado:

1. **Banco de equipos reales:** importar fichas M-C con torneo, fecha y enlace; mantener el set completo publicado en vez de construirlo combinando porcentajes marginales.
2. **Ejercicios de enfrentamientos reales:** mostrar los seis rivales de un emparejamiento registrado y ocultar sus sets hasta el momento previsto por la especificación. El resultado histórico es contexto posterior; no demuestra que una lead concreta sea correcta.
3. **Variedad de práctica:** descubrir composiciones y variantes por filtros, manteniendo procedencia y criterios de selección. Muestrear solo campeones o top cut introduciría un sesgo que deberá declararse.

La coaparición de dos Pokémon en un roster no es una frecuencia de leads. Los porcentajes de victorias mostrados por el sitio tampoco se convertirán en probabilidades de ganar de nuestra recomendación: no están condicionados a la apertura, al rival y a las decisiones del usuario. La vista Stats usa la palabra games, pero la documentación de matches describe encuentros; la unidad deberá verificarse antes de reutilizar ese agregado.

Los repartos SP ausentes seguirán siendo desconocidos. Una hipótesis de estadísticas podrá formar parte de un escenario sintético identificado como tal, pero nunca se presentará como el reparto que usó un jugador. Las fichas importadas pasarán por el validador candidato existente y no quedarán habilitadas automáticamente para análisis de daño.

## Siguiente paso concreto

El probe propuesto inicialmente se ha ampliado al actualizador manual solicitado por el usuario: el índice y las fichas/clasificaciones de los tres eventos M-C más recientes que cumplan los filtros de disponibilidad, verificación, división y resultado final. La primera consulta incorpora 1 561 equipos, aparta una ficha incompleta y conserva 26 conflictos de campos explícitos. Los archivos confirman que Louisville tiene 1 013 fichas; el contador de 143 de la vista resumida no representa todo ese archivo. Los archivos de emparejamientos todavía no se ingieren. El catálogo y el corpus versionados permanecen intactos y el entrenamiento sigue sin habilitarse.

La [evidencia de observaciones](../../research/evidence/vgc-history-2026-10-19.json) diferencia lo visto en la interfaz de lo documentado y de lo pendiente de comprobar.
