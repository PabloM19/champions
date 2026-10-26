# Champions Hero

Entrenador personal para elegir y justificar las dos leads en combates dobles de Pokémon Champions. El jugador practica ante un team preview rival, recibe análisis por criterios y revisa sus decisiones con el tiempo.

La [especificación v1.0](docs/especificacion/champions-hero-v1.0.md) fija el alcance: 33 decisiones de producto y 25 criterios de aceptación. Se conserva sin modificaciones respecto al archivo entregado por el usuario.

## Estado actual

La aplicación local 0.2 permite importar, editar y guardar equipos, revisar la conversión EV a SP, actualizar la biblioteca de VGC History y practicar la elección de dos leads con razonamiento, revelación posterior y autoevaluación. Incluye también una calculadora rápida de velocidades con búsqueda local, selección desde tus equipos y referencias opcionales. El catálogo y el validador siguen siendo candidatos; el análisis mecánico y las recomendaciones competitivas permanecen pendientes.

## Abrir la aplicación

Requiere Node.js 22.12 o posterior:

```sh
npm ci
npm run dev
```

Abrir http://127.0.0.1:5173/. En Biblioteca, pulsar Actualizar biblioteca para consultar los tres torneos M-C más recientes con fichas y resultados finales verificados en el registro de VGC History. La primera descarga comprobada reúne 1 561 equipos; aparta una ficha incompleta y mantiene 26 equipos con incompatibilidades explícitas. La fecha de consulta y la fuente permanecen visibles.

Los equipos propios se guardan en el navegador. El servicio local solo descarga datos públicos; no envía equipos personales a terceros. El botón actualiza fichas de torneos, no sustituye las mecánicas ni cambia de reglamento automáticamente. La aplicación no se ha publicado. La calculadora de velocidades se ha revisado en navegador real de escritorio; la revisión móvil y de otros apartados sigue pendiente.

Detalles, límites y siguiente fase en [Taller y actualizaciones](docs/desarrollo/taller-y-actualizaciones.md).

En Entrenar puedes elegir equipo, filtros, perfil y mezcla 70/30; confirmar dos leads y un razonamiento obligatorio; revelar después los sets y guardar una autoevaluación. El historial conserva cada decisión con sus datos y versiones. El modo actual es práctica de lectura: los criterios no respaldados se muestran como indeterminados. Consulta [Práctica de lectura e historial](docs/desarrollo/practica-lectura.md) para conocer la selección y sus límites.

En [Velocidades](http://127.0.0.1:5173/#velocidades) puedes comparar dos Pokémon sin esperar a Internet: naturaleza, SP, objeto, niveles, Viento Afín, parálisis y Espacio Raro. Guarda la última consulta y muestra referencias en segundo plano. Consulta [Velocidades: uso y límites](docs/desarrollo/velocidades.md).

## Datos y auditorías

- [Auditoría de fuentes y mecánicas](docs/auditoria/auditoria-inicial-2026-10-19.md).
- [Catálogo M-C y resultados de sus pruebas](docs/auditoria/catalogo-m-c.md).
- [Snapshot del catálogo](data/catalog/m-c-2026-10-19.1/catalog.json) y [conflictos detectados](data/catalog/m-c-2026-10-19.1/report.json).
- [Corpus competitivo y revisión de equipos](docs/auditoria/corpus-competitivo-m-c.md).
- [Informe de 42 listas reales](research/evidence/candidate-fields-0.1.0/tournament-review.json).
- [VGC History: equipos M-C, enfrentamientos y acceso documentado](docs/auditoria/vgc-history.md).
- [Actualización real: informe agregado de 1 561 equipos](research/evidence/vgc-history-live-2026-10-19.json).
- [Pokéos: base de datos y sugerencias por temporada](docs/auditoria/pokeos.md).
- [Registro de fuentes y condiciones](research/sources.json).
- [Casos de referencia que debe superar el motor](docs/auditoria/casos-de-referencia.md).
- [Pruebas estructurales de fuentes](research/evidence/source-probes-2026-10-19.json).
- [Resultados de compatibilidad con la calculadora](research/evidence/calc-0.12.0.json).

Las herramientas de research conservan su carácter exploratorio. La biblioteca muestra fichas y permite copiarlas al editor. Los casos sin conflictos ni formas sin resolver pueden utilizarse para práctica de lectura, pero no están certificados para análisis competitivo. Los resultados de la calculadora necesitan contraste con referencias del juego.

## Comprobaciones de la aplicación

```sh
npm test
npm run test:research
npm run build
```

Han pasado 63 pruebas de producto y 45 pruebas del catálogo y corpus. El build de producción compila. Los flujos de importación, práctica y velocidades se prueban en DOM de test. La velocidad se contrasta además en 8 064 combinaciones de condiciones. Hay QA visual real de escritorio para Velocidades; móvil sigue pendiente. Para servir el build local, detener dev y usar npm run preview.

## Reproducir la investigación

Requisitos: Node.js con npm, Python 3 y curl con verificación TLS normal.

Desde la raíz del repositorio:

```sh
npm ci --prefix research/calc-compatibility --ignore-scripts --no-audit --no-fund
npm run probe --prefix research/calc-compatibility
python3 research/probe-sources.py
```

El probe de fuentes reutiliza las respuestas locales de .cache/audit. Si faltan, realiza ocho peticiones GET públicas. La opción --refresh vuelve a consultarlas. Puede devolver datos antiguos de caché: cada registro incluye cachedAt, que no equivale a la fecha de actualización de la fuente.

Para guardar nuevos resultados, usar un archivo nuevo y conservar la evidencia de esta auditoría:

```sh
node research/calc-compatibility/probe.cjs /tmp/champions-calc-probe.json
python3 research/probe-sources.py --output /tmp/champions-source-probe.json
```

Las respuestas originales, las listas de jugadores y los paquetes instalados quedan fuera de Git. La caché es material temporal de investigación; no constituye un archivo o espejo de una API.

Para reproducir el catálogo, seguir los comandos de su [documentación](docs/auditoria/catalogo-m-c.md#reproducción-y-pruebas). Incluyen preparación de fuentes fijadas, generación y 21 pruebas. Esa preparación necesita Python 3.12 o posterior. El snapshot conserva tipos, estadísticas base, habilidades, formas de combate y relaciones con megapiedras, con licencia y procedencia.

El [corpus competitivo](docs/auditoria/corpus-competitivo-m-c.md#reproducción-y-pruebas) añade 515 movimientos candidatos, 317 habilidades y 166 objetos, junto con las 262 listas aprendibles por forma y 24 pruebas nuevas del corpus y del validador. Los efectos de eventos se conservan como referencias, pendientes de implementación en el entrenador.

## Próximo hito

Implementar y contrastar las primeras reglas mecánicas de apertura para sustituir abstenciones por conclusiones respaldadas. Ampliar plantillas y calibrar dificultad y muestreo. También siguen pendientes restauración de copias, sugerencias confirmables para completar sets, localización completa del catálogo y QA visual.

VGC History está conectado al actualizador manual de la biblioteca. Pokéos queda registrado como referencia de Champions y posibles sugerencias de SP por temporada; no se ha habilitado su extracción automática.

La arquitectura de producto prevista es React, TypeScript, Vite y persistencia local con IndexedDB. La referencia de diseño acordada es [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). Las decisiones técnicas sujetas a pruebas se registrarán antes de incorporarlas al producto.

