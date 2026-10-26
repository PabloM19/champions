# Práctica de lectura, decisiones e historial · 0.2.0

Esta entrega conecta el taller con el flujo de decisión: configurar una práctica, ver seis rivales sin sus sets, elegir dos leads propias, escribir un razonamiento, confirmar y revisarlo. Es una práctica de lectura con autoevaluación, no una evaluación competitiva validada. La interfaz mantiene esa distinción durante todo el flujo.

## Configuración y selección

Se utiliza una versión guardada de un equipo propio de seis. El sistema bloquea incompatibilidades de los campos comprobables, formas sin resolver y conversiones EV pendientes. Los SP desconocidos se permiten en este modo de lectura y se conservan como desconocidos; no habilitan cálculos de daño o velocidad.

La mezcla predeterminada es 70 % de equipos reales y 30 % sintéticos, ajustable entre 0 y 100. Un sorteo determinista decide primero el origen y después el caso. Los extremos usan exclusivamente el grupo solicitado. Cuando una mezcla solicita ambos grupos, ambos deben disponer de casos para los filtros: no se sustituye un origen vacío por otro. Se muestra un error recuperable para cambiar filtros, actualizar la biblioteca o elegir explícitamente otra proporción.

La semilla y el origen efectivo se guardan por ejercicio. La proporción es un objetivo entre ejercicios, no una cuota exacta dentro de una sesión corta. La selección evita las ocho identidades de casos recientes cuando quedan alternativas del mismo origen. Todavía no hay ponderación por popularidad ni estratificación completa del metajuego: la selección dentro de cada grupo es uniforme sobre los casos disponibles. Dos fichas distintas con composiciones equivalentes aún pueden aparecer por separado.

Los filtros incluyen Pokémon exacto, arquetipo y dificultad. Esta primera clasificación utiliza señales del equipo completo: sequía/Charizardite Y para sol, Drizzle para lluvia y Trick Room para Espacio Raro. Un plan da lectura fácil; dos, media; ninguno o tres, difícil. Es una heurística provisional de planes, explícitamente pendiente de calibración: no equivale a fuerza de un equipo ni demuestra que el rival vaya a ejecutar ese plan. La dificultad no constituye una historia de usuario completamente validada todavía.

La primera colección sintética contiene dos plantillas escritas: sol con Espacio Raro y lluvia con presión física. Sus campos conocidos pasan las comprobaciones del corpus candidato, pero no se declaran legales de forma exhaustiva ni competitivamente calibrados. Se identifican como generadas y conservan versión de política. No se atribuyen a un torneo, jugador o reparto observado. No hay plantilla difícil por ahora; una mezcla que la exija informa de la ausencia en lugar de relajar el filtro.

El [probe sobre la biblioteca real](../../research/evidence/reading-practice-2026-10-19.json) registra 1 501 casos elegibles para lectura entre los 1 561 descargados: 456 fáciles, 302 medios y 743 difíciles según esa heurística. La diferencia incluye conflictos y formas sin resolver, no una clasificación deportiva de equipos malos. Con los filtros predeterminados quedan 302 reales y una plantilla sintética.

## Decidir sin pistas

El preview rival proyecta únicamente posición y especie inicial normalizada. No entrega al componente de selección movimientos, habilidad, objeto, SP, evento, procedencia ni análisis. Las seis especies se guardan con sus etiquetas en la instantánea para no depender del catálogo futuro al mostrar un intento histórico.

El jugador puede consultar sus propios sets y elige exactamente dos índices distintos. Al llegar a dos se bloquean otras plazas hasta deseleccionar una. La predicción rival solo exige otra pareja cuando se activa en la configuración. El razonamiento rechaza texto vacío o espacios, sin mínimo artificial de caracteres.

El borrador se conserva en IndexedDB. Si se sale de la pantalla o se recarga antes de confirmar, se recuperan pareja, predicción y texto. Confirmar valida de nuevo desde el ejercicio guardado y registra el intento dentro de una transacción. Un índice único por ejercicio impide una segunda decisión que sobrescriba la primera, incluso desde otra pestaña.

No se eligen reservas: los otros cuatro integrantes del roster no se convierten en cambios garantizados.

## Revisión y honestidad del resultado

El resultado muestra el razonamiento original y hechos limitados a los movimientos que constan en los sets de las dos leads propias. Citar que un set contiene Protect o Tailwind no acredita que esa acción se ejecute con éxito ni implica recomendarla.

Los siete criterios se muestran como indeterminados, cada uno con su limitación de cobertura y ruleId. No se calculan notas, porcentajes de victoria, rangos de daño, velocidades, rankings ni tres alternativas sin evidencia. El perfil elegido organiza la prioridad de lectura del informe; no altera hechos y todavía no implementa preferencias estratégicas sobre opciones comprobadas.

La ficha rival se puede revelar solo después de confirmar, por acción explícita. Se distingue entre campos publicados en un torneo y plantilla sintética. Los SP desconocidos permanecen así. La predicción no recibe un acierto o fallo inventado: una ficha de seis no aporta las leads históricas.

La autoevaluación contiene cinco preguntas sobre velocidad, seguridad, primera acción/alternativa, incertidumbre y reservas. El jugador marca «Lo contemplé» o «Lo omití». La app no interpreta semánticamente su texto. La autoevaluación se guarda por separado sin modificar la decisión ni su resultado.

## Historial, persistencia y exportación

Cada ejercicio conserva equipo propio y revisión, rival completo, configuración, fuente, semilla y versiones de app, práctica, motor, catálogo, corpus y biblioteca. Los intentos son inmutables. Actualizar la biblioteca o editar un equipo no reevalúa ni modifica un intento anterior.

El historial permite abrir decisiones y autoevaluaciones. Su resumen cuenta omisiones declaradas por criterio; no las presenta como errores mecánicos demostrados, nota global o prueba de mejoría. Filtros avanzados del historial y comparaciones temporales sobre casos comparables siguen pendientes.

IndexedDB migra del esquema 1 al 2 añadiendo ejercicios, borradores, intentos y autoevaluaciones. Las tablas anteriores y sus datos se conservan. La migración se prueba con una base versión 1 que contiene equipos y ajustes.

La exportación local ahora incluye equipos, revisiones, ejercicios, intentos, autoevaluaciones, borradores, ajustes aplicables y tema. Su esquema es 2 e incluye checksum. No exporta las bibliotecas públicas completas: cada ejercicio ya conserva el rival necesario para su historia. La restauración de copias sigue pendiente y la interfaz lo indica.

## Verificación y límites

Las pruebas cubren muestreo reproducible, mezcla, agotamiento de grupos, filtros, plantillas, proyección del preview, validación de parejas, predicción opcional, conservación de texto, abstención del motor, perfiles con hechos idénticos, migración, bloqueo de sobrescritura, cambios de equipos/fuentes, checksum y flujo de interfaz con recuperación de borradores y resultados.

Comandos:

```sh
npm test
npm run test:research
npm run build
```

El flujo de interfaz se verifica en DOM de pruebas. La revisión visual real de escritorio y móvil sigue pendiente porque el navegador local está desactivado. Esta entrega no declara completo el MVP ni el motor competitivo. La siguiente etapa es incorporar reglas de apertura con evidencia verificable y ampliar el corpus sintético, manteniendo la abstención para lo que no esté cubierto.
