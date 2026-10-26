# Velocidades · consulta rápida

Implementado el 23 de octubre de 2026 a petición del usuario. Acceso en el menú lateral y directo en `http://127.0.0.1:5173/#velocidades`. La especificación original se conserva: esta calculadora es una ampliación solicitada después.

## Uso durante una partida

Escribir el nombre y pulsar Enter para elegir el primer resultado, o usar flechas y ratón. La lista incluye las 262 formas del catálogo M-C y 89 formas de combate; las megas se seleccionan explícitamente. Ambos lados son editables. Si hay un equipo abierto o guardado, se puede elegir un integrante propio con naturaleza, SP y objeto sin modificar el equipo.

La velocidad base siempre se muestra separada de la velocidad en ficha y de la efectiva. Sin naturaleza o SP se calcula un intervalo; un campo vacío no equivale a cero. Los accesos 0 SP, 32 SP, máximo neutro y máximo positivo permiten probar escenarios rápidamente. Se conserva la última comparación al cambiar de apartado o recargar. El resultado permanece visible al desplazarse para editar o consultar referencias. Hay intercambio de lados y cálculo del mínimo SP necesario para superar un rival conocido.

La búsqueda, el catálogo y los cálculos funcionan localmente una vez abierta la aplicación. No esperan ninguna petición de Internet. La calculadora de Smogon se usa únicamente en las pruebas y no se añade al paquete del navegador.

## Referencias disponibles

Las fichas compatibles de la biblioteca VGC History ofrecen naturaleza y objeto publicados; los SP ausentes se mantienen desconocidos. Se muestran hasta tres combinaciones, con procedencia y frecuencia dentro de la biblioteca, sin identificarlas como frecuencia global del metajuego.

El servicio local consulta bajo demanda el endpoint público `/api/battle/Doubles/<especie>` de [Pokémon Champions Battle Data](https://championsbattledata.com/api_guide). Solo se solicita la especie rival, sin enviar equipos propios. Se muestran las tres primeras naturalezas, repartos y objetos publicados y la atribución requerida. La fuente publica distribuciones marginales: combinar naturaleza, SP y objeto produce una hipótesis, no un set observado conjuntamente. Nada se aplica sin pulsar su botón.

Caché en memoria y navegador, y caché temporal del servidor de seis horas. El botón Actualizar referencias permite consultar de nuevo, con mínimo de cinco minutos entre peticiones. Peticiones simultáneas de una especie se agrupan; límite de ocho segundos y 2 MB. Si falla la fuente, se conserva la caché anterior y el cálculo local sigue disponible. No se genera un espejo ni un archivo distribuible del proveedor.

## Mecánica y límites

Versión `champions-speed-0.1.0`. Estadística Champions: `floor((base + 20 + SP) × naturaleza)`, SP entero de 0 a 32, naturaleza 0,9 / 1 / 1,1. Se aplican niveles −6 a +6, modificadores de punto fijo con redondeo de mitades hacia abajo, y parálisis. Incluye Pañuelo Elección, Bola Férrea, Viento Afín, Clorofila, Nado Rápido, Ímpetu Arena, Quitanieves, Liviano activado y Pies Rápidos con parálisis. La comparación contempla Espacio Raro y su truncamiento de orden a 13 bits.

Compara velocidad a igual prioridad; no simula el turno completo. Solo aplica condiciones visibles. Rezagado, Inicio Lento, Cola Plúmbea, Incienso Lento y otros efectos no incluidos no se deducen automáticamente. El catálogo y la equivalencia con el juego conservan su carácter candidato.

## Verificación

Pruebas de aritmética, desconocidos, empates, Espacio Raro, mínimo SP, formas y carga del equipo; pruebas de normalización y caché del servidor; flujos DOM con teclado, persistencia, aplicación explícita y petición de referencias pendiente. El contraste diferencial cubre 8 064 combinaciones de naturaleza, SP, nivel, objeto, estado, Viento Afín y habilidad.

Se detectó que `@smogon/calc` 0.12.0 aplica en `getFinalSpeed` el límite de 999 de generaciones antiguas a Champions (generación 0). El contraste usa estadísticas nativas Champions y modificadores modernos de generación 9, también por encima de 999. El código sigue el límite 10 000 y la resolución de orden de `sim/pokemon.ts` de Showdown fijado en `7b02eb39878f4b486f658a752b38c161379bd352`. Esto contrasta implementaciones; no acredita una prueba dentro del videojuego.

Se comprobó en navegador real de escritorio la búsqueda, selección con Enter, máximos 169 frente a 154 para Garchomp, respuesta de la fuente real y conservación de la comparación. El diseño incorpora una columna en pantallas estrechas; la revisión visual móvil queda pendiente.
