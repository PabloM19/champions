# Taller de equipos y actualización de la biblioteca

La versión local 0.1.0 implementó el primer flujo de gestión de equipos y una biblioteca actualizable desde VGC History. La continuación 0.2.0 añade [práctica de lectura e historial](practica-lectura.md), con análisis mecánico aún pendiente. Es desarrollo solicitado después de la especificación v1.0; el documento original permanece intacto.

## Arranque

Requiere Node 22.12 o posterior. Desde la raíz del proyecto:

```sh
npm ci
npm run dev
```

La dirección es http://127.0.0.1:5173/. El servicio escucha únicamente en loopback. Para comprobar el build local:

```sh
npm run build
npm run preview
```

No ejecutar dev y preview simultáneamente en el mismo puerto. El preview debe arrancarse después de detener dev. No se ha publicado la app.

## Flujo disponible

Mis equipos permite importar seis sets de estilo Showdown, editar especie/forma, objeto, habilidad, naturaleza, cuatro movimientos y SP. La importación informa de campos no reconocidos o incompatibles. El ejemplo incluye un reparto EV de demostración; no se presenta como las estadísticas observadas de un jugador.

La conversión EV → SP debe confirmarse: 252/252/4 produce 32/32/1, 65 SP y un punto libre. La aplicación conserva EV y texto originales. Un SP omitido en una importación explícita de SP permanece desconocido; solo la conversión confirmada de EV introduce los ceros que corresponden a ese reparto. Los IV clásicos se conservan como referencia y no se interpretan como SP. Las estadísticas resultantes aún no se muestran porque falta contrastar su cálculo con referencias del juego.

Los equipos se guardan en IndexedDB mediante Dexie, con versiones anteriores en una tabla independiente. Una edición basada en una versión que otra pestaña ya modificó se rechaza. Se permiten borradores de seis especies con campos desconocidos; las incompatibilidades detectadas bloquean el guardado desde la interfaz. El entrenamiento sigue sin habilitarse.

La exportación JSON conserva datos personales con checksum: equipos y versiones, y desde 0.2 también ejercicios, decisiones, revisiones, borradores y preferencias. La restauración de ese archivo y la política de avisos de respaldo siguen pendientes. Se ofrece también exportación de paste. Oscuro es el tema predeterminado; claro conserva las mismas funciones. Las etiquetas del catálogo y el paste utilizan por ahora nombres canónicos en inglés; la localización completa de movimientos, objetos y habilidades queda pendiente.

## Botón Actualizar biblioteca

La biblioteca consulta únicamente archivos documentados de VGC History. Selecciona los tres eventos más recientes en el orden publicado por la fuente que cumplan: Pokémon Champions, M-C, Masters, resultado final, verificación declarada por el archivo e indicador de fichas disponibles. No promete cubrir todos los torneos ni reglamentos futuros.

El frontend llama a un servicio de descarga local incluido en Vite, también disponible en preview. No envía equipos propios, razonamientos ni archivos personales a VGC History. No hay cuentas, claves ni servidor remoto de usuarios. Una futura distribución estática necesitará un servicio de paquetes de datos o una ingesta externa equivalente; este middleware de desarrollo no se convierte por sí solo en infraestructura de producción.

El servicio:

1. Descarga el índice y los archivos de fichas y clasificación de los eventos seleccionados, con límites de tamaño y tiempo.
2. Extrae declaraciones literales del índice con un parser JavaScript, sin ejecutar su envoltorio remoto.
3. Valida la forma de los datos y une cada ficha únicamente cuando su clave y sus seis especies coinciden con la clasificación.
4. Aparta fichas incompletas o sin unión segura. Una discrepancia de campos competitivos se conserva con sus diagnósticos; no se corrige inventando datos.
5. Normaliza una mega a su forma inicial solo si existe una transición única en el catálogo y coincide la piedra. Conserva el registro original.
6. Mantiene los SP no publicados como desconocidos, valida los campos conocidos con el mismo validador del proyecto y no declara ningún equipo apto para entrenar.
7. Guarda URL, checksums, fecha de consulta, versiones del adaptador y del catálogo, y copias anteriores. Las peticiones condicionales usan ETag o Last-Modified; pulsaciones repetidas en cinco minutos reutilizan caché y las concurrentes comparten una actualización.

Si falla una fuente se conserva el último evento válido cuando existe. Si falla toda la descarga, no se sustituye la biblioteca anterior. El navegador guarda su propia copia en IndexedDB después de validar la respuesta. La caché del servicio y los sets descargados están en .cache/live-library, fuera de Git.

La fecha de consulta no afirma cuándo se jugó un torneo ni cuándo lo actualizó su organizador. Cada ficha conserva además la fecha publicada del evento y su enlace. El índice recibido puede retrasarse respecto a un evento reciente.

El botón actualiza equipos publicados. No sustituye el catálogo o las reglas del motor ni valida automáticamente cambios de mecánicas. Esa separación permite incorporar actualidad sin alterar el significado de los datos anteriores.

## Comprobaciones

```sh
npm test
npm run test:research
npm run build
```

Las pruebas de producto cubren parser, conversión confirmable, ausencia de estadísticas, exportación/reimportación de SP parciales, persistencia y versiones, recuperación del equipo, fallo de actualización y límites del adaptador. Incluyen un flujo de interfaz en DOM de pruebas: importar ejemplo, revisar 65 SP, confirmar, guardar y recuperar el equipo tras volver a montar la app.

El servicio HTTP y la descarga real se han comprobado. El [informe agregado de la actualización](../../research/evidence/vgc-history-live-2026-10-19.json) evita redistribuir nombres de jugadores o sets completos. Las pruebas previas del catálogo y corpus siguen pasando tras compartir el validador con el navegador.

La revisión visual interactiva en escritorio y móvil sigue pendiente porque el navegador local está desactivado en Work. Las pruebas DOM no acreditan contraste visual, ausencia de desbordamientos, navegación táctil ni comportamiento de los selectores nativos. La app dispone de estilos responsive, pero CA-16 y CA-20 aún no se declaran superados.

## Continuación

El flujo de ejercicios, autoevaluación e historial está incorporado en [0.2.0](practica-lectura.md). La siguiente fase es el motor contrastado de aperturas. La evaluación permanece indeterminada para las mecánicas que todavía no tienen cobertura. También quedan pendientes restauración de copias, sugerencias confirmables para completar sets, localización del catálogo y QA visual.
