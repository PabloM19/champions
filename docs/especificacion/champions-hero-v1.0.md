# Champions Hero — Especificación funcional y técnica v1.0

**Fecha:** 18 de octubre de 2026  
**Estado:** requisitos funcionales cerrados; referencia para estimación, investigación de datos y desarrollo posterior  
**Producto:** Champions Hero / Lead Trainer  
**Alcance:** Pokémon Champions, combates dobles, práctica de ladder individual  
**Importante:** este documento no implica que se haya implementado código, creado un repositorio ni importado una base de datos.

> **Objetivo:** entrenar al jugador para elegir y justificar una pareja inicial de dos Pokémon frente a un team preview rival de seis, recibiendo una crítica técnica fundada, alternativas y aprendizaje acumulativo. No sustituye al juicio del jugador ni pretende predecir con certeza el equipo y los movimientos del rival.

## 1. Estado de decisiones

Se han cerrado **33 respuestas** en cinco rondas. Las decisiones del MVP están aprobadas como base del proyecto. Los detalles de implementación sujetos a verificación se distinguen de las preferencias ya resueltas. **No se ha iniciado el desarrollo.**

### Primera ronda — 8 decisiones

1. El caso de uso principal es **ladder individual** (dobles), no juego con hojas de equipo abiertas.
2. En el MVP el jugador **solo elige las dos leads**; no tiene que seleccionar las cuatro plazas activas para el combate.
3. Los rivales proceden de **equipos reales** y **equipos generados competitivamente coherentes**.
4. Se equilibra **representatividad del metajuego** y **variedad**.
5. El informe empieza en una **profundidad intermedia**, con opción de ampliarlo.
6. Los sets rivales permanecen **ocultos durante la decisión**, como en ladder.
7. Uso **personal** inicialmente, con posible ampliación futura.
8. Se prioriza el equilibrio entre **rapidez de práctica** y **precisión**.

### Segunda ronda — 8 decisiones

9. Gestión de equipos mediante **editor visual e importación de equipos**.
10. Para sets propios incompletos, **sugerencias competitivas habituales** que el jugador deberá distinguir y confirmar.
11. Los otros cuatro Pokémon del roster solo ofrecen **contexto de posibles apoyos/cambios**, sin seleccionar reservas.
12. La **predicción de leads rivales** es un ejercicio opcional.
13. Evaluación **por criterios**, expresamente **sin nota global**.
14. Tras confirmar, se pueden **revelar sets rivales plausibles** con indicación de su procedencia e incertidumbre.
15. Práctica **aleatoria** y **dirigida** a Pokémon o arquetipos concretos.
16. Almacenamiento **local** al principio; sincronización después.

### Tercera ronda — 7 decisiones

17. Mostrar las **tres alternativas mejor justificadas** a la pareja elegida.
18. Antes de evaluar, escribir un **razonamiento obligatorio**.
19. **Sin pistas** antes de confirmar.
20. La predicción rival se activa **dentro del mismo ejercicio**, no como módulo separado obligatorio.
21. Dificultad **manual**.
22. El MVP incluye **historial, errores recurrentes y evolución**.
23. Motor de **reglas y plantillas propias, sin IA externa obligatoria**. Un eventual chat es optativo y posterior.

### Cuarta ronda — 7 decisiones

24. El razonamiento obligatorio es **texto libre**, como hablar con un entrenador.
25. Como no hay IA que entienda ese texto, la reflexión se corrige mediante **lista de criterios y autoevaluación del jugador**; no se simulará una corrección semántica automática.
26. La dificultad cambia según **claridad/ambigüedad estratégica**, no simplemente por enfrentar equipos débiles o fuertes.
27. La **proporción entre equipos reales y generados** será **ajustable en los filtros**.
28. Habrá **tema oscuro y tema claro**, con **oscuro por defecto**.
29. Copias de seguridad mediante **exportación manual y recordatorios periódicos**.
30. Al importar EVs clásicos, se **convertirán a Stat Points (SP)**; la aplicación mostrará el resultado para que el jugador lo confirme.

### Quinta ronda — 3 decisiones (cierre v1.0)

31. **Móvil y ordenador tienen la misma prioridad funcional y de calidad**: no existirá un modo completo para escritorio y uno recortado para móvil.
32. El entrenador ofrece tres **perfiles seleccionables**: `equilibrado`, `conservador` y `agresivo`. Modifican preferencias estratégicas, no hechos mecánicos, ni fuerzan un dictamen único.
33. Mezcla predeterminada para elegir nuevos casos: **70 % equipos reales y 30 % equipos generados**. El jugador puede ajustar el reparto de 0 a 100 % en los filtros; solo se utiliza material real donde exista evidencia legalmente reutilizable.

**Cierre de requisitos de producto:** 33/33 decisiones contestadas. La validación de fuentes, motor y detalles de UX forma parte del trabajo posterior, no de otra ronda de preguntas obligatoria.

## 2. Alcance funcional

### En MVP

- Catálogo legal de Pokémon Champions versionado por reglamento, con especies, formas, objetos, habilidades, movimientos y mecánicas relevantes.
- Editor visual de equipos personales de seis Pokémon; múltiples equipos y versiones.
- Importador de texto con formato tipo Pokémon Showdown, análisis de validez y conversión EV -> SP confirmada.
- Sugerencias de sets para completar datos, identificadas como sugerencias y nunca confundidas con sets verificados.
- Banco de equipos rivales reales documentados y generados con arquetipos coherentes.
- Filtros por reglamento, Pokémon, arquetipo, origen, dificultad y porcentaje real/generado.
- Ejercicio: seis rivales visibles, elegir dos leads propias, razonamiento libre obligatorio, confirmación sin pistas.
- Predicción de leads rivales opcional dentro del ejercicio.
- Evaluación cualitativa por criterios, evidencias concretas, incertidumbre, desglose opcional y tres alternativas.
- Revelación posterior de posibles sets rivales, sin presentar estimaciones como datos conocidos.
- Autoevaluación del razonamiento mediante checklist posterior.
- Historial de ejercicios, errores recurrentes y evolución por criterios.
- Tema oscuro por defecto, tema claro opcional, persistencia local, exportación/importación de copia de seguridad y avisos de respaldo dentro de la app.
- Perfil de análisis configurable por entrenamiento: equilibrado, conservador o agresivo, sin alterar las mecánicas.
- Experiencia funcional completa y accesible tanto en móvil como en escritorio.

### Fuera del MVP

- Elegir formalmente los cuatro Pokémon de combate y ordenar reservas.
- Simular turnos completos, grabar y analizar automáticamente videos o repeticiones.
- Chat de IA integrado, API keys, pagos, cuentas, login o sincronización multi-dispositivo.
- Seguimiento de resultados reales automáticamente mediante acceso a la cuenta del juego.
- Rellenar huecos en sets rivales inventando datos que se presenten como factuales.

## 3. Experiencia principal

### E-01 — Preparar equipo

1. Crear equipo propio con seis integrantes y un nombre/versión.
2. Editar especie/forma, movimientos, habilidad, objeto, naturaleza y SP.
3. Completar campos vacíos con sugerencias competitivas explicadas y confirmables.
4. Validar legalidad frente al reglamento escogido. Advertir y bloquear la práctica reglamentaria con elementos no legales según el tipo de error.

### E-02 — Configurar entrenamiento

1. Elegir equipo personal y reglamento.
2. Elegir dificultad manual: fácil, media o difícil.
3. Elegir aleatorio o dirigido; en dirigido permitir filtrar por Pokémon y arquetipo.
4. Ajustar la proporción de rivales reales / generados (control de 0 a 100 %, valor inicial 70 % reales / 30 % generados).
5. Elegir perfil de entrenador: equilibrado por defecto, conservador o agresivo.
6. Activar o no 'Predecir la pareja rival'.
7. Generar caso; si el filtro no tiene datos suficientes, informarlo sin sustituir silenciosamente los criterios del jugador.

### E-03 — Resolver ejercicio

1. Ver los **seis Pokémon rivales**, con solo la información propia del team preview del reglamento.
2. Ver el propio roster de seis y sus sets disponibles.
3. Seleccionar **exactamente dos leads** propias.
4. Si esta activada la predicción, indicar la pareja rival esperada.
5. Escribir obligatoriamente un texto libre explicando el plan, amenazas y primera acción prevista; no imponer un mínimo artificial de caracteres, pero rechazar texto vacío.
6. Confirmar: la decisión queda bloqueada para ese intento; se registra el contexto/reglamento/versión del motor.
7. No mostrar pistas, sugerencias, ranking de leads o información de sets enemigos antes de confirmar.

### E-04 — Evaluación y aprendizaje

1. Mostrar resumen de la pareja seleccionada y juicio **por criterios**, sin puntuación global numérica.
2. Explicar de forma intermedia **por que** cada criterio es favorable, situacional, peligroso o incierto.
3. Abrir, bajo demanda, cálculos de velocidades, prioridades, interacciones de habilidades, rangos de daño y escenarios.
4. Destacar riesgos ante aperturas rivales razonables, sin asumir que sabemos que pareja sacará el rival.
5. Ofrecer **tres alternativas** justificadas (las tres mejores opciones comparables entre las 14 restantes, cuando exista evidencia). Si ninguna es claramente mejor, rotularlas como "otras aperturas viables"; reconocer la elección del jugador cuando es defendible.
6. Permitir revelar **posibles** sets rivales, rotulados como 'observado', 'inferido', 'habitual' o 'generado'.
7. Mostrar checklist de autoevaluación de su razonamiento, permitir marcar conceptos previstos/omitidos, y registrar las respuestas sin afirmar que el sistema ha comprendido el texto.
8. Guardar el ejercicio y ofrecer siguiente / repetir.

### E-05 — Revisar progreso

- Historial consultable por fecha, equipo propio, reglamento, rival/arquetipo y dificultad.
- Estadísticas **por criterio** y categorías de error; nunca una nota global encubierta.
- Errores recurrentes identificados a partir de hechos del motor y la autoevaluación del usuario, cada uno con ejemplos enlazados.
- Comparación temporal de progreso sobre conjuntos comparables; evitar atribuir mejora solo a haber entrenado casos más faciles.

## 4. Regla crítica: sin reservas seleccionadas

El usuario **no** elige las otras dos plazas de combate en el MVP. Por tanto:

- El motor puede indicar que un Pokémon del roster sería un apoyo o cambio **posible**.
- No puede afirmar que ese Pokémon estaba disponible en la partida ni sumar su supuesto cambio como una ventaja garantizada.
- La seguridad y eficacia de la pareja inicial se evalúan principalmente según las dos leads escogidas.
- La futura selección de cuatro constituirá una nueva modalidad, no una suposición implícita del MVP.

## 5. Evaluador competitivo

### 5.1 Matriz y escenarios

Con seis Pokémon, hay 15 parejas propias posibles y 15 parejas rivales posibles (225 cruces básicos). El motor no deberá hacer 225 afirmaciones de certeza: deberá generar escenarios con plausibilidad y calidad de evidencia diferenciadas. Cada escenario puede incluir variantes razonables de set oculto.

### 5.2 Criterios independientes

- **Control de velocidad:** velocidades efectivas, Viento Afín, Espacio Raro, cambios, prioridades.
- **Seguridad del primer turno:** Sorpresa, protección, redirección, amenazas de KO, inmunidades y bloqueo de plan.
- **Presión ofensiva:** objetivos amenazados, ventajas/coberturas y capacidad de ejercer daño inmediato.
- **Sinergia:** interacciones de habilidad, clima, campo, soporte y conflicto entre compañeros.
- **Cobertura de aperturas plausibles:** robustez frente a varias parejas rivales, incluida la peor exposición relevante.
- **Flexibilidad:** opciones de plan B desde la pareja elegida; las reservas no elegidas solo se citarán condicionalmente.
- **Incertidumbre:** falta de sets confirmados, datos insuficientes o conclusiones muy sensibles a un objeto/movimiento no visto.

Las etiquetas propuestas son **favorable, aceptable, situacional, arriesgado, indeterminado**. No equivalen a porcentajes de victoria. En caso de falta de pruebas el motor debe mostrar 'no verificable con los datos disponibles' en vez de una precisión falsa.

### 5.3 Evidencia y resultados

Cada conclusión guardará referencias a las reglas y escenarios que la originaron: `rule_id`, `mechanics_version`, `input_set_confidence`, `scenario_id`, `reason_codes`. Los textos explicativos se generarán mediante plantillas y datos calculados; no mediante lenguaje libre fabricado por IA. Las tres alternativas serán comparaciones de las otras parejas del equipo y sus ventajas/inconvenientes.

### 5.4 Dificultad

- **Fácil:** amenaza principal clara, arquetipo reconocible, poca ambigüedad de sets y planes de respuesta evidentes.
- **Media:** varias aperturas probables, roles complementarios y compensaciones reales entre seguridad y presión.
- **Difícil:** equipos flexibles, sets inciertos, orden de operaciones/prioridades complejos y respuestas no dominantes.

La dificultad no clasifica a los rivales por su fuerza bruta ni degrada artificialmente su calidad; describe la **complejidad de la lectura estratégica**.

### 5.5 Perfiles de entrenamiento: la decisión número 32

Los tres perfiles son filtros interpretativos, no tres motores distintos ni sistemas que alteren los cálculos:

| Perfil | Prioridad cualitativa | Riesgo aceptable | Pregunta que responde |
|---|---|---|---|
| **Equilibrado** (por defecto) | Robustez, flexibilidad y presion razonable | Moderado | Cual es un comienzo solido frente a varias aperturas plausibles? |
| **Conservador** | Evitar derrotas tempranas, mantener planes alternativos | Bajo | Como minimizo exposiciones graves del turno 1? |
| **Agresivo** | Iniciativa, presion ofensiva y tempo | Alto, si el plan es defendible | Que pareja ofrece mayor capacidad de tomar la iniciativa? |

El informe mostrara el perfil utilizado y podrá comparar las mismas leads bajo los otros perfiles despues del ejercicio. El perfil **no** elimina riesgos conocidos: si una apertura agresiva pierde frente a una amenaza frecuente, debe indicarlo. No se permitirá fabricar porcentajes de victoria. La clasificación de escenarios inciertos permanece incierta con cualquier perfil.

**Regla de producto:** el perfil cambia el criterio de desempate o la preferencia entre opciones viables; no el catálogo legal, ni los stats, ni el daño, ni las resistencias, ni las conclusiones factuales. Las explicaciones registraran el perfil y la versión de heurísticas.

### 5.6 Proceso de decisión y explicabilidad

1. **Validar entradas**: reglamento, sets propios, rivales, formas, objetos y movimientos; distinguir vacios de datos inferidos.
2. **Generar escenarios** de parejas rivales y, cuando proceda, sets posibles; deduplicar resultados equivalentes.
3. **Evaluar** cada pareja propia con reglas comprobables, prioridades, control de velocidad, amenazas y lineas de apertura aproximadas. No prometer simulación completa de combates.
4. **Registrar evidencia** favorable, desfavorable y desconocida para cada criterio y escenario; separar hechos de inferencias.
5. **Ordenar parcialmente** las opciones por criterios sin fingir una nota global. Aplicar el estilo conservador/equilibrado/agresivo solo al elegir entre alternativas defendibles.
6. **Presentar** la evaluación en dos profundidades: resumen intermedio y detalle expandible.
7. **Permitir autoevaluacion** del razonamiento escrito; el sistema no afirmara haber leido su significado sin IA.

Si los datos disponibles no sostienen un orden claro, el motor puede declarar empate estratégico o resultado indeterminado y proponer alternativas, en vez de inventar un ganador. Las probabilidades relativas solo se mostraran cuando haya un método empirico auditado y una muestra suficiente; nunca a partir de intuiciones disfrazadas de porcentajes.

### 5.7 Objetividad, calibración y pruebas

- Casos de referencia preparados con jugadores competentes: sencillos, ambiguos, con trampa de prioridad, con Speed Control, Sorpresa, clima, terreno, redireccion y megas.
- Pruebas diferenciales de daño y estadísticas frente a ejemplos verificados del juego; bibliotecas externas no se asumen equivalentes.
- Análisis de contradicciones: dos informes del mismo escenario y versión no pueden afirmar hechos mecánicos incompatibles.
- Revisar por separado falsos positivos (lead peligrosa valorada como segura) y falsos negativos (lead defendible descartada).
- Registrar cobertura de reglas y porcentaje de evaluaciones con incertidumbre expresada, sin optimizar artificialmente una supuesta tasa de acierto sin ground truth.

## 6. Importación y conversión EV -> SP

Se admitirá pegar equipos con estructura compatible con Showdown, pero un set compatible con Showdown **no es automáticamente legal en Champions**.

### Regla de conversión propuesta (revisada con Bulbapedia)

Para cada estadística, con EV entero no negativo: `SP = 0` si `EV < 4`; en otro caso `SP = min(32, 1 + floor((EV - 4)/8))`. El presupuesto total es de 66 SP y el límite individual de 32. La interfaz mostrará **EV original, SP convertido, total gastado, puntos libres, estadísticas resultantes y advertencias**. La conversión depende de las reglas de Champions y se incluirá en pruebas de regresión.

Ejemplo: `252 Atk / 252 Spe / 4 HP` produce `32 Atk / 32 Spe / 1 HP` = **65 SP**. La app no inventará el punto restante: lo mostrará como disponible para confirmación/reasignación.

- No modificar silenciosamente un reparto que sobrepase los límites de Champions; solicitar ajustes.
- Guardar el texto y el reparto EV originales como procedencia para futuras revisiones.
- Validar movimientos, habilidades, objetos, formas y restricciones por reglamento.
- Cualquier conversión ha de confirmarse antes de guardar el set definitivo.
- No equiparar automáticamente la importación desde Showdown con el comportamiento de transferencia de HOME; compartir reglas verificadas donde corresponda, sin confundir ambos flujos.

**Fuente mecánica:** https://bulbapedia.bulbagarden.net/wiki/Stat_point

## 7. Fuentes de datos y gobierno

### Jerarquía de evidencia

1. **Reglamento/documentación oficial de Champions:** especie/formas elegibles, límites, novedades y cambios de reglas.
2. **Datos de torneos accesibles legalmente:** jugadores, eventos, listas de equipo que se publiquen, fechas y metadatos.
3. **Datos base generales (PokéAPI y referencias tecnicas):** especies y estadísticas generales, nunca como única fuente de legalidad de Champions.
4. **Estadísticas comunitarias y sets inferidos:** probabilidades o ejemplos, con etiqueta de procedencia.
5. **Equipos generados:** etiquetados como sintéticos y justificados por una plantilla de arquetipo y restricciones competitivas.

### Conectores y límites

- **Limitless:** revisar sus endpoints de torneos y `standings`, donde la lista de equipo puede estar disponible; respetar límite de peticiones y condiciones. https://docs.limitlesstcg.com/developer/tournaments
- **Play! Pokémon / RK9:** utilizar los materiales y listas públicas disponibles; no presuponer que se publican movimientos y Stat Points de todos los participantes.
- **Pokémon Zone:** fuente editorial/de contraste; **no realizar scraping automatizado sin permiso**, de acuerdo con sus términos. https://www.pokemon-zone.com/terms/
- **PokéAPI:** complemento para estadísticas y taxonomía; caché local y respeto de condiciones, licencia y derechos de imagen. https://pokeapi.co/docs/v2

### Procedencia mínima de cada equipo

`source_type`, `source_url`, `event_name`, `event_date`, `regulation_id`, `placing` (si consta), `player_name` (si se publica y puede reutilizarse), `team_members`, `set_visibility`, `last_verified`, `dataset_version`, `license_notes`.

**Nunca deducir leads realmente usadas a partir de una teamlist de seis**; hacen falta combates/replays registrados para afirmarlo.

### Datos del catálogo anterior

El inventario previamente investigado de Pokémon y megaevoluciones es un **punto de partida provisional**, no una fuente automática de verdad. Antes del primer uso competitivo habrá que validarlo contra normativa oficial y registrar su versión. Los cambios de reglamento no deben reescribir los resultados históricos del usuario.

### 7.1 Muestreador 70/30 y equilibrio meta/variedad

- El **70/30** es el objetivo inicial de **ejercicios ofrecidos**, no la distribución de filas que debe tener la base. Se aplica de forma reproducible mediante semilla; en sesiones cortas la proporción exacta puede variar y se registra el reparto real.
- "Real" significa equipo rastreable a un evento y fuente; un equipo similar reconstruido, aún cuando use seis especies reales, sigue siendo **generado** si esa configuración no se ha documentado.
- Mezclar representatividad y variedad mediante selección estratificada por arquetipos y popularidad, con penalizacion de repeticiones recientes. No usar frecuencia de una muestra pequena como si fuera la frecuencia mundial del meta.
- Nunca reemplazar silenciosamente el origen solicitado. Si filtros especificos agotan los equipos reales, ofrecer: cambiar filtro, aceptar una proporción efectiva distinta con consentimiento o detener la selección.
- Preservar snapshots originales de casos que se hayan jugado para que una actualización del conjunto de datos no reescriba las evaluaciones pasadas.
- Al cambiar reglamento, no adaptar sin validación una lista antigua mediante eliminacion arbitraria de especies. Conservar su procedencia original y, si se propone una variante legal, rotularla como generada.

## 8. Modelo de datos propuesto

| Entidad | Campos esenciales |
|---|---|
| `Regulation` | id, fechas, especies/formas/items/moves permitidos, `mechanicsVersion` |
| `PokemonForm` | especie, forma, tipos, stats base, habilidades, sprites permitidos |
| `Move` / `Ability` / `Item` | id, efectos e interacciones relevantes, legalidad por versión |
| `CompetitiveSet` | forma, naturaleza, habilidad, objeto, movimientos, SP, rol, origen, confianza |
| `TeamTemplate` | seis integrantes, arquetipo, real/generado, fuente, versión de datos |
| `UserTeam` | id local, nombre, seis sets, versiones, fecha de modificacion |
| `TrainingConfig` | reglamento, dificultad, filtros, proporciones (70/30 por defecto), predicción opcional, perfil del entrenador |
| `Exercise` | caso inmutable, origen rival, seis visibles, versiones y semilla aleatoria |
| `Attempt` | dos leads, predicción opcional, razonamiento libre, fecha, decisiones |
| `Assessment` | criterios, escenarios, justificaciones, tres alternativas, incertidumbre, perfil y versión del evaluador |
| `SelfReview` | checklist declarado por usuario, puntos de aprendizaje, etiquetas |
| `BackupMetadata` | fecha de exportación verificada, versión de esquema, recordatorio |

Los ids de entidades serán estables. El intento siempre conservara el reglamento y los datos con los que se evaluó para que un cambio futuro no altere silenciosamente su resultado.

### 8.1 Contratos de información y proveniencia

Cada campo relevante se acompana, cuando corresponda, de `origin` (`official`, `tournament`, `community`, `inferred`, `synthetic`, `user`), `sourceUrl`, `retrievedAt`, `rulesetVersion`, `confidenceLevel`, `verifiedAt` y `licenseNote`. Nunca elevar un valor inferido a hecho confirmado por el mero paso del tiempo.

- **TeamTemplate**: `kind=real` solo con referencia verificable; los generados usan `kind=synthetic`, `generationPolicyVersion` y semilla.
- **CompetitiveSet**: `observed` si se conoce exactamente; `estimated` si se aproxima; `suggested` si es recomendacion para rellenar huecos. Un set observado en OTS no implica ser el set elegido en cada partida.
- **Exercise**: instantanea inmutable de rival, dataset, reglamento, perfil, filtros, dificultad y semilla, sin filtrar sets ocultos al cliente antes del envio de la respuesta (el cliente tiene almacenamiento local: esta es una protección de UX, no un sistema antifraude).
- **Attempt**: pareja propia, texto libre original, pareja rival predicha si se habilito, sello temporal.
- **Assessment**: motivos enumerables por criterio y contraescenario; comparación explicable de hasta tres opciones.
- **SelfReview**: respuestas del propio usuario, no etiquetado semantico automático.

### 8.2 Persistencia y versiones

Las entidades locales usaran IDs estables; el respaldo tendrá `schemaVersion`, `exportedAt`, integridad/checksum y manifiesto de contenidos. La restauración ofrecera previsualización, modo combinar o reemplazar con confirmacion, y manejo de conflictos por ID. Las migraciones de IndexedDB se probaran con datos de versiones antiguas.

Se diferenciaran tres versiones: `appVersion` (UI), `datasetVersion` (datos) y `engineVersion` (mecánicas/heurísticas). Los intentos persistidos mantendran las tres para reproducibilidad; si se reevalua un ejercicio se registrara como una nueva evaluación, nunca como modificacion silenciosa.

## 9. Arquitectura técnica elegida para planificar (sujeta a prueba de librerías)

- **Frontend:** React + TypeScript + Vite.
- **UI:** Tailwind CSS + biblioteca de componentes accesibles; guía de diseño UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **Datos del usuario:** IndexedDB (Dexie), sin servidor y sin login en el MVP.
- **Motor:** módulo TypeScript testeable, separado de interfaz y de plantillas de explicación.
- **Trabajo intensivo:** Web Worker y caché de escenarios cuando sean necesarios.
- **Fuentes competitivas:** proceso de ingesta validado y versiones de datos distribuidas; **no** extraer en tiempo real desde el navegador en cada ejercicio.
- **Cálculo de daño:** evaluar la reutilización/adaptación de bibliotecas existentes; comprobar mecánicas de Champions y diferencias frente a otros juegos antes de aceptarlo como correcto.
- **Validación:** Zod/JSON Schema; pruebas unitarias, integración y e2e.
- **Offline/PWA:** posible tras precargar catálogo y casos; actualizaciones con conectividad y manejo transparente de versiones.
- **IA:** no requerida; sin API key en cliente, sin costes de tokens como requisito del producto.

### Seguridad y persistencia

- IndexedDB puede borrarse por acción del usuario o mecanismos del navegador. Nunca presentar almacenamiento local como copia segura permanente.
- Exportar JSON versionado con equipos, configuración, intentos y autoevaluaciones; permitir validar e importar sin sobrescribir de manera destructiva.
- Recordatorios **dentro de la aplicación cuando se abre** o tras varias sesiones, no promesas de notificaciones en segundo plano sin infraestructura o permisos.
- No subir razonamientos personales ni equipos a un servicio externo en el MVP.
- No almacenar secretos o API keys en el frontend.
- Revisar los derechos de uso de imágenes y marcas de Pokémon antes de publicar la app.

**Fuente sobre riesgos de almacenamiento:** https://webkit.org/blog/14403/updates-to-storage-policy/

### 9.1 Decisiones de arquitectura

- **ADR-01, local-first**: no login ni servidor de usuarios en MVP. Riesgo aceptado: almacén local no equivale a copia segura, mitigado por backups.
- **ADR-02, motor interpretable**: reglas y cálculos deterministas, no una IA que opina sin trazabilidad. Riesgo: cobertura inicial limitada; mitigado por `indeterminado` y ampliacion de reglas.
- **ADR-03, paquetes de datos versionados**: ingesta y verificación separadas del navegador; el frontend no debe llamar a docenas de fuentes externas al abrir un ejercicio.
- **ADR-04, experiencia dual**: mismas operaciones disponibles con teclado/raton y con tactil, sin esconder funciones esenciales por tamaño de pantalla.
- **ADR-05, fuente transparente**: real/generado son categorías mutuamente excluyentes; set observado/estimado son estados distintos.

Antes de elegir definitivamente una biblioteca de cálculo, hacer un **spike de compatibilidad** con Champions M-C (Stat Points, megaevolucion, habilidades y objetos propios, lista de movimientos, prioridades). La conclusion del spike puede cambiar la biblioteca, pero no el contrato del motor ni los requisitos aprobados.

### 9.2 Sincronizacion y modo chat (posteriores)

Al principio nada sale del dispositivo salvo las descargas de datos generales o acciones explicitas del usuario. Si algun día se anade sincronizacion, el adaptador de repositorio local permitira una capa remota sin cambiar el modelo de ejercicios. No almacenar claves privadas de APIs de IA en el frontend. Un chat externo opcional no forma parte de la evaluación del MVP y no puede alterar hechos calculados ni notas historicas sin autorizacion.

## 10. Diseño UX

- Tema **oscuro por defecto**, claro activable; recordar preferencia.
- **Móvil y ordenador con igual prioridad:** paridad funcional y de accesibilidad. No existen pantallas completas exclusivas de escritorio.
- Pantallas MVP: `Inicio/Entrenar`, `Mis equipos`, `Nuevo ejercicio`, `Evaluación`, `Mi progreso`, `Biblioteca/Fuentes`, `Ajustes/Copia de seguridad`.
- Un ejercicio se resuelve en una sola vista enfocada en el team preview; información secundaria oculta hasta evaluar.
- Las explicaciones extensas se expanden por criterio sin perder la comparación con las tres alternativas.
- Etiquetas claras: `dato verificado`, `set probable`, `equipo generado`, `incertidumbre alta`.
- Accesibilidad objetivo WCAG 2.2 AA: contraste, teclado, estados focus, lectores de pantalla, no depender solo del color.
- Debe respetar idioma español inicialmente; códigos de especies/formas independientes del idioma.

### 10.1 Mapa de pantallas y estados

1. **Inicio**: equipo activo, boton empezar, acceso rapido a ejercicio dirigido, último progreso, estado de respaldo.
2. **Mis equipos**: lista, duplicar/versionar, editor de seis, importación, sugerencias pendientes y diagnostico de legalidad.
3. **Configurar práctica**: elegir equipo, reglamento, dificultad, origen 70/30 ajustable, estilo de entrenador y filtros; prediccion rival opcional.
4. **Ejercicio**: seis iconos rivales; seis propios; dos leads propias activas; campo de razonamiento libre obligatorio; prediccion opcional en misma vista; boton Confirmar. Prohibidas pistas previas.
5. **Resultado**: juicio por criterios, riesgos concretos, resumen, tres alternativas, detalle técnico desplegable, revelacion de posibles sets y checklist de autoevaluacion.
6. **Mi progreso**: historial, filtros, errores recurrentes fundamentados, evolución de criterios y enlace a ejercicios originales.
7. **Biblioteca**: catálogo legal, arquetipos, sets según fuente, referencias y última actualización.
8. **Ajustes**: tema, exportar/importar respaldo, última copia, accesibilidad y preferencias.

Estados obligatorios de UI: `loading`, `empty`, `partial-data`, `stale-dataset`, `invalid-team`, `insufficient-real-cases`, `no-rule-coverage`, `backup-import-error` y `offline`. Siempre accion recuperable y mensaje claro.

### 10.2 Paridad móvil/escritorio

- **Móvil (aprox. 360-430 px)**: navegacion inferior o menu visible, equipos en rejilla legible, botones tactiles grandes; paneles de análisis mediante acordeones.
- **Escritorio (desde aprox. 1024 px)**: se permiten columnas paralelas para roster rival/propio e informe lateral, con navegacion lateral.
- **Entre ambos**: layout fluido sin separar productos; tocar o clicar un Pokemon realiza la misma accion, con estados accesibles. No depender del hover.
- Navegacion con teclado, foco visible, labels para lectores de pantalla, mensajes sin depender solo del color, contraste objetivo WCAG 2.2 AA.
- Mantener el punto de lectura al desplegar explicaciones; no introducir animaciones obligatorias.
- Preferencia de tema guardada, **oscuro predeterminado**.

### 10.3 Reglas visuales para resultados

`Favorable`, `Aceptable`, `Situacional`, `Arriesgado`, `Indeterminado` son etiquetas por criterio, nunca porcentajes en barras que sugieran probabilidades. El informe inicial prioriza una descripcion en lenguaje sencillo; la vista avanzada puede listar valores de velocidad y cálculos cuando existan. La calidad de evidencia debe verse junto a las afirmaciones importantes.

## 11. Criterios de aceptación del MVP

- **CA-01** Se guardan y recuperan varios equipos personales de seis sin conexión.
- **CA-02** La importación de ejemplo `252/252/4` muestra conversión `32/32/1` y un SP libre; no guarda sin confirmación.
- **CA-03** No permite ejercicios con un set marcado como ilegal para el reglamento seleccionado sin explicar el motivo.
- **CA-04** Los equipos reales muestran torneo/fecha/fuente; los generados se distinguen claramente.
- **CA-05** El slider de proporción real/generado afecta a la selección; si no hay casos elegibles lo indica.
- **CA-06** La vista previa no filtra movimientos/objetos rivales antes de confirmar.
- **CA-07** Exige dos leads exactas y razonamiento no vacío; las pistas permanecen ocultas.
- **CA-08** Con predicción opcional desactivada no obliga a predecir la lead rival.
- **CA-09** El informe entrega juicios independientes y ninguna nota global o porcentaje de victoria inventado.
- **CA-10** Las tres alternativas incorporan motivos específicos. Si no hay evidencias suficientes, el informe expresa incertidumbre.
- **CA-11** El texto libre no se presenta como semanticamente corregido; la checklist la completa el usuario.
- **CA-12** No se asume disponible en el combate una reserva no seleccionada.
- **CA-13** Cada intento queda ligado a una versión del reglamento y del motor.
- **CA-14** El historial permite detectar y consultar errores recurrentes por criterio, sin atribuir al usuario errores no demostrados.
- **CA-15** Exportación e importación de respaldo restauran equipos, historial y preferencias; aviso de respaldo aparece en la app según política definida.
- **CA-16** Se puede alternar tema oscuro/claro; usabilidad básica comprobada en móvil y escritorio.
- **CA-17** El motor supera pruebas con casos de referencia revisados manualmente; no se considera 'bueno' solo porque genere explicaciones convincentes.

- **CA-18** La configuración inicial selecciona **70 % equipos reales / 30 % generados**; se puede ajustar a cualquier reparto permitido y el origen efectivo se registra.
- **CA-19** Conservador, equilibrado y agresivo muestran criterios y alternativas consecuentes con sus preferencias, manteniendo idénticos hechos mecánicos para entradas identicas.
- **CA-20** En un dispositivo móvil y en escritorio se puede completar el flujo completo sin funciones ocultas, incluyendo importación, evaluación, checklist y restauración.
- **CA-21** Si no hay tres alternativas respaldadas, el resultado aclara la falta de evidencia y no inventa recomendaciones.
- **CA-22** El usuario puede revisar y confirmar sugerencias de sets incompletos; los campos inferidos se distinguen de los introducidos.
- **CA-23** Restaurar una copia no destruye datos actuales sin confirmacion y las migraciones conservan razonamientos y versiones de ejercicios.
- **CA-24** Cambios de versión de reglas/dataset preservan el snapshot del ejercicio y ofrecen reevaluacion explicita.
- **CA-25** Si un escenario no esta soportado por la mecánica implementada, se muestra indeterminación y la limitacion, no un dictamen inventado.

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Reglas de Champions mal modeladas | Versionado, fuentes oficiales, banco de pruebas de mecánicas |
| Datos externos incompletos/desactualizados | Origen y fecha por equipo/set; actualizaciones auditables |
| Equipos sintéticos absurdos | Generador con restricciones de roles, sinergias, legalidad y controles de calidad |
| Falsa precisión frente a sets ocultos | Escenarios alternativos, grado de confianza y abstención |
| Evaluar texto libre sin IA | Autoevaluación explícita, sin fingir comprensión del texto |
| Asumir reservas inexistentes | Menciones condicionales; no otorgarles ventaja determinista |
| Perder datos locales | Exportación verificable, recordatorio in-app, posterior sincronización |
| Derechos o términos de terceros | APIs autorizadas, atribución, evitar scraping prohibido y revisar sprites |
| Regla nueva o parche cambia el meta | Conservar snapshots por reglamento y versionar datos |

## 13. Historias de usuario y prioridades de entrega

**P0 = imprescindible para MVP usable**. **P1 = imprescindible para aceptar el MVP completo acordado**, tras validar el motor. **P2 = futuro expresamente fuera de alcance**. Las fases indican orden de trabajo, no un calendario prometido.

| ID | Prioridad | Historia de usuario / capacidad | Dependencias |
|---|---|---|---|
| US-01 | P0 | Elegir y guardar mi equipo de seis, con sets y versiones | Catálogo, validador, persistencia |
| US-02 | P0 | Importar un paste Showdown y confirmar conversion EV->SP | Parser, reglas de SP |
| US-03 | P0 | Obtener rivales legales reales o sintéticos, con fuente o etiqueta | Banco de casos validado |
| US-04 | P0 | Seleccionar dos leads y escribir mi razonamiento sin pistas | UI responsive, estado de ejercicio |
| US-05 | P0 | Conocer riesgos, fortalezas y limitaciones de mi lead por criterio | Motor de reglas, escenarios |
| US-06 | P0 | Ver tres alternativas defendibles con motivos concretos | Comparador y análisis de parejas |
| US-07 | P0 | Usar la misma experiencia en móvil y escritorio | Diseño y QA responsive |
| US-08 | P1 | Cambiar perfil del entrenador sin cambiar hechos mecánicos | Heurísticas interpretables |
| US-09 | P1 | Ajustar 70/30 y filtros dirigidos, ver excepciones si faltan casos | Muestreador y dataset |
| US-10 | P1 | Practicar prediccion rival en el mismo ejercicio, opcionalmente | Selección de pareja rival |
| US-11 | P1 | Revelar sets posibles tras responder, con etiqueta de evidencia | CompetitiveSet y procedencia |
| US-12 | P1 | Autoevaluar mi razonamiento con checklist sin falsa correccion automática | Motor de explicaciones |
| US-13 | P1 | Ver errores recurrentes y evolución sin una nota global | Histórico, SelfReview |
| US-14 | P1 | Hacer copias JSON completas y recibir avisos discretos | IndexedDB, export/import |
| US-15 | P1 | Cambiar oscuro/claro, practicar offline con paquetes instalados | Preferencias, PWA |
| US-16 | P2 | Elegir cuatro para el combate; simulación por turnos, replays | Futura ampliacion |
| US-17 | P2 | Sincronizacion, usuarios públicos o chat IA | Backend/opciones futuras |

### 13.1 Dependencias que no se pueden saltar

La UI de evaluación puede prototiparse con datos ficticios, pero **no** se marca US-05/06 como terminada hasta contar con reglas y casos verificados. La biblioteca competitiva necesita controlar legalidad y procedencia antes de habilitar generación de casos. Un generador visual no equivale a un entrenador confiable.

### 13.2 Calidad de datos requerida antes de beta personal

- Conjunto de equipos reales con evento, fecha y URL verificables; si una fuente no proporciona sets, guardarlos como desconocidos.
- Validación de legalidad para especies, formas, objetos, movimientos y limite de megaevolucion en la normativa seleccionada.
- Mapa de movimientos/efectos realmente implementados y sus limitaciones; no ocultar omisiones de cálculo.
- Conjunto de pruebas de referencia del juego para conversion SP, velocidades, prioridades, amenazas y escenarios de doble.
- Registro de permisos, atribuciones y origen de cada tipo de datos e imagen reutilizada.

## 14. Plan por fases (sin comenzar desarrollo)

0. **Especificación v1.0 cerrada; comprobar datasets y ejecutar pruebas exploratorias sin implementación de producto**.
1. Datos de Champions, legalidad, fuentes y corpus de equipos; QA de integridad.
2. Gestión de equipos propios, importación y conversión SP; QA funcional.
3. Generador de casos, filtros, dificultad y vista de selección de leads.
4. Motor verificable de escenarios y criterios; casos de prueba competitiva revisados.
5. Explicaciones, alternativas, autoevaluación e historial; QA UX.
6. Exportaciones, tema, accesibilidad, estabilidad offline y lanzamiento personal.
7. Opcionales posteriores: selección de cuatro, turnos, comparación con replays, sincronización, chat externo.

## 15. Política de decisiones cerradas y supuestos operativos

**No quedan preguntas de producto bloqueantes**: el usuario ha decidido los 33 puntos solicitados. Esta especificación constituye la línea base funcional **v1.0**. Cambios posteriores se registraran mediante decisión nueva, justificación, impacto y versión de documento.

Puntos que requieren **verificación técnica** antes de codificar o poblar la base, sin reabrir el producto:

1. **Corpus M-C**: contrastar especies, formas, movimientos, items y habilidades elegibles con el listado oficial y la versión del juego. El CSV anterior de 231 especies es un insumo de investigación, no una garantia de legalidad para toda partida.
2. **Motor de daño**: verificar compatibilidad con Stat Points y excepciones de Champions; librerías VGC generales son candidatas, no fuentes finales de verdad.
3. **Calidad y licencia de datasets**: documentar el permiso o condiciones de cada fuente, su cobertura y la fecha de última actualización. Un sitio sin API o con scraping prohibido no pasa automaticamente a ingesta.
4. **Recordatorio de copia**: valor de diseño inicial propuesto: aviso no intrusivo si hay cambios y han pasado 7 días desde el último respaldo, o tras 10 ejercicios sin copia; debe poder posponerse/desactivarse. Es un default implementable, no una nueva preferencia votada.
5. **Idioma**: español en MVP, IDs y esquemas independientes de las traducciones, listo para ampliar en fase futura.
6. **Requisitos de uso de marcas e imágenes**: evaluar activos antes de una eventual apertura a otros usuarios.

### 15.1 Condiciones objetivas para declarar MVP terminado

- Historias US-01 a US-15 comprobadas conforme a sus criterios, y CA-01 a CA-25 superados.
- Referencias revisadas y cobertura documentada, incluidos los casos en los que el motor se abstiene.
- Un usuario puede guardar/importar equipo, resolver un caso completo, recibir feedback, autoevaluarse y volver a revisar el historial tanto en móvil como en ordenador.
- Un ejercicio guardado mantiene su regla, perfil, datos rivales y explicación al actualizar la base.
- Puede restaurarse una copia de forma comprobable y sin pérdida no consentida.
- Ninguna fuente externa utilizada incumple de forma conocida sus terminos; no se exponen claves privadas.

### 15.2 Alcance explicito de la aprobación

La aprobación de v1.0 **no** autoriza iniciar código, crear repo, desplegar, contratar servicios ni consumir APIs de pago. Solo fija requisitos y criterios para planificar trabajo futuro cuando el usuario lo pida.

## 16. Referencias de verificación

- Pokémon Champions, juego y modalidades: https://champions.pokemon.com/es-es/gameplay/
- Reglamento M-C oficial y fechas: https://champions-news.pokemon-home.com/en/page/816.html
- Stat Points y conversión desde EV: https://bulbapedia.bulbagarden.net/wiki/Stat_point
- Documentación Limitless: https://docs.limitlesstcg.com/developer/tournaments
- Límites y claves Limitless: https://docs.limitlesstcg.com/developer
- Términos de Pokémon Zone: https://www.pokemon-zone.com/terms/
- Documentación PokeAPI: https://pokeapi.co/docs/v2
- Almacenamiento WebKit: https://webkit.org/blog/14403/updates-to-storage-policy/
- Guía UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Política de uso PokéAPI: https://pokeapi.co/docs/v2

---

**Estado al cerrar este documento:** 33 decisiones de producto confirmadas; especificación v1.0 funcionalmente cerrada, con comprobaciones técnicas previas a la ejecución. **No se ha iniciado desarrollo.**
