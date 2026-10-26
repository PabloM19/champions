# Catálogo candidato de Pokémon Champions M-C

La versión m-c-2026-10-19.1 resuelve las 262 entradas del listado oficial en 231 especies y las conecta con una revisión fija de Pokémon Showdown y con @smogon/calc 0.12.0. El catálogo incorpora también 89 formas de combate candidatas: 82 megas y siete transformaciones por habilidad, con 81 megapiedras.

Las identidades de las entradas oficiales están resueltas. Los datos técnicos siguen siendo candidatos a contraste con el juego, y dos habilidades predeterminadas difieren entre proveedores. El catálogo conserva esas diferencias y mantiene runtimeReady en false.

## Archivos generados

- [Catálogo versionado](../../data/catalog/m-c-2026-10-19.1/catalog.json).
- [Cobertura y conflictos](../../data/catalog/m-c-2026-10-19.1/report.json).
- [Atribución y licencia de los datos técnicos](../../data/catalog/m-c-2026-10-19.1/NOTICE.txt).
- [Fuentes fijadas y alias revisados](../../research/catalog/input-lock.json).

El catálogo distingue los miembros seleccionables del roster, las formas que aparecen durante el combate, las megapiedras y las relaciones de transformación. Los datos de tipos, estadísticas base, habilidades y peso conservan la referencia a la fuente técnica. No se incluyen imágenes, equipos de jugadores ni datos de la API de estadísticas agregadas.

## Cómo se resuelven las identidades

Cada identidad seleccionable recibe un ID propio basado en el identificador oficial, independiente del reglamento y del idioma. La correspondencia exige que coincidan el número de Pokédex, el nombre de especie y el índice de forma.

Se usa formeOrder de la revisión fijada de Showdown, cuyo contrato define el orden de formas en los datos del juego. No se usa la posición en un resultado de búsqueda ni una coincidencia aproximada de nombres. Un índice desconocido, un ID duplicado o una forma exclusiva del combate hacen fallar la generación.

| ID oficial | Nombre oficial visible | Correspondencia técnica |
|---|---|---|
| 0666-018 | Vivillon | Vivillon-Fancy |
| 0670-005 | Floette | Floette-Eternal |
| 0925-001 | Maushold | Maushold-Four |
| 0931-000 | Squawkabilly | Squawkabilly, variante verde |
| 0931-002 | Squawkabilly | Squawkabilly-Yellow |
| 0080-002 | Slowbro, forma de Galar | Slowbro-Galar |
| 0711-003 | Gourgeist, variedad Jumbo | Gourgeist-Super |
| 0681-000 | Aegislash | Aegislash en Showdown; Aegislash-Shield en la calculadora |

Estas diferencias pueden afectar al análisis. Las variantes verde y amarilla de Squawkabilly tienen distinta habilidad oculta en la fuente técnica. Aegislash debe comenzar con las estadísticas de su forma Escudo; confundirlo con su forma Filo alteraría ataque y defensa.

Las variantes cosméticas o predeterminadas no incluidas en el listado se mantienen fuera del roster legal de este snapshot. Que una biblioteca conozca una forma no basta para declararla seleccionable.

## Formas de combate y megapiedras

Las relaciones de megaevolución conectan una forma de origen concreta, su piedra y la forma resultante. Se comprueba que los dos proveedores técnicos coincidan en los tipos y las seis estadísticas base, y que la calculadora asocie la misma piedra con el mismo origen y destino.

Hay 82 formas mega asociadas a 81 piedras porque Meowsticite tiene dos destinos distintos, según el sexo de Meowstic. Las formas regionales no heredan por similitud de nombre la megaevolución de otra forma. Floettite se asocia a la entrada de Floette-Eternal.

Las siete formas por habilidad cubren los tres climas de Castform, Aegislash-Blade, Mimikyu-Busted, Morpeko-Hangry y Palafin-Hero. El catálogo registra la habilidad necesaria y marca la secuencia de activación como pendiente; no simula que la transformación haya ocurrido.

Las seis megas anunciadas en el [reglamento oficial](https://champions-news.pokemon-home.com/en/page/816.html) conservan esa evidencia explícita. El resto y las megapiedras se etiquetan como candidatos de la fuente técnica. La correspondencia entre sus datos no acredita por sí sola su disponibilidad legal en todas las versiones.

El límite oficial de una megaevolución por combate se aplica a las decisiones de cada entrenador. La generación no inventa un límite de una megapiedra en el roster.

## Conflictos de habilidades detectados

| Forma | Showdown fijado | Valor predeterminado de la calculadora |
|---|---|---|
| Mega-Hawlucha | No Guard | Limber |
| Mega-Skarmory | Stalwart | Keen Eye |

Estas filas describen las discrepancias entre implementaciones, sin resolverlas por votación de fuentes. El informe las marca como pendientes y no incluye la habilidad entre los campos coincidentes. El futuro adaptador deberá recibir explícitamente la habilidad de cada set, contrastarla con el juego y comprobar su efecto; no bastará con cambiar el nombre del campo.

Todas las formas exigen habilidad explícita al adaptar un set. Las habilidades alternativas de una especie también se conservan, aunque la calculadora tenga una sola como predeterminada.

Referencias técnicas primarias: [datos de especies de Showdown](https://github.com/smogon/pokemon-showdown/blob/7b02eb39878f4b486f658a752b38c161379bd352/data/pokedex.ts) y [datos de especies de la calculadora publicada](https://unpkg.com/@smogon/calc@0.12.0/dist/data/species.js).

## Reproducción y pruebas

Desde la raíz del repositorio, con Python 3.12 o posterior, curl y Node.js:

```sh
npm ci --prefix research/catalog --ignore-scripts --no-audit --no-fund
python3 research/catalog/fetch-inputs.py
npm run build --prefix research/catalog
npm test --prefix research/catalog
```

La preparación descarga solo los dos insumos fijados si faltan en caché y comprueba sus SHA-256. El código técnico procede de la revisión 7b02eb39878f4b486f658a752b38c161379bd352 de Showdown. La lista oficial conserva el hash de la auditoría inicial. Si esa página cambia, la preparación exige revisar una nueva versión en lugar de aceptar el contenido nuevo automáticamente.

La generación es determinista y comprueba que no se sobrescriba una versión con contenido diferente. El informe incluye el SHA-256 del catálogo.

Han pasado 21 pruebas de cobertura, índices ambiguos, alias, entradas inválidas, integridad, formas de combate, relaciones con piedras, exposición de conflictos y conservación de versiones. Estas pruebas verifican el catálogo y sus contratos; no sustituyen los casos del juego ni validan el futuro entrenador.

## Estado del hito y continuación

- A01: correspondencias de las 262 entradas resueltas, con controles automáticos y procedencia.
- A02: relaciones de formas, piedras y habilidades construidas; quedan dos conflictos y el contraste de disponibilidad y activación en el juego.
- A03: siguiente trabajo, catálogo de movimientos, efectos de habilidades, objetos y learnsets versionados.

La siguiente ingesta de equipos deberá mantener los SP ausentes como desconocidos y validar los campos publicados contra ese corpus antes de habilitar ejercicios.

El [corpus competitivo posterior](corpus-competitivo-m-c.md) ya conecta movimientos, habilidades y objetos y documenta la primera revisión de campos de las 42 listas reales. Conserva las limitaciones y la versión de este catálogo.

