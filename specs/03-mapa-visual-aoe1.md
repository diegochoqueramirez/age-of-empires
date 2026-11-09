# SPEC 03 — Mapa visual estilo AoE1

> **Estado:** Implementado (verificación manual de interacción pendiente)
> **Depende de:** [01 — MVP AoE1](./01-mvp-aoe1.md), [02 — Identidad visual](./02-identidad-visual.md)
> **Fecha:** 2026-11-09
> **Objetivo:** Que el mapa se vea y se lea como el mapa de AoE1: rombos de proporción 2:1, terrenos variados con bordes de transición, bosques en grupo, agua, y un borde de mapa sin cortes. Solo cambia la capa visual; la lógica de juego no cambia.

## Por qué existe esta spec

La spec 02 llevó el prototipo hacia el look de AoE1 con primitivas, pero el mapa todavía no se parece al original en tres puntos concretos:

1. **Proporción de las casillas.** Con la cámara a 45° de inclinación, cada casilla se ve como un rombo de proporción cercana a 1.4:1. AoE1 usa rombos más aplastados, de 2:1. Esto cambia la lectura de todo el mapa.
2. **Variedad de terreno.** Solo hay cuatro tonos de pasto. El original se lee por tipos de terreno (pasto, tierra, arena, agua) con bordes entre ellos.
3. **Bosques y bordes.** Los árboles son individuales y se leen como un muro. El original usa bosques en grupo y un borde de mapa que no termina en un corte abrupto.

## Principio rector

**Solo cambia la capa de presentación.** `state.ts`, `pathfinding.ts`, `commands.ts`, `selection.ts` y la parte de posición de `units.ts` no cambian de comportamiento. Si un cambio visual necesita tocar la lógica, se para y se revisa.

La textura del suelo se genera en código, igual que en la spec 02: nada de imágenes ni assets externos. El estilo se consigue con texturas de píxel dibujadas por código, no con copias de arte existente.

## Alcance

**Dentro:**

- Cámara con inclinación de 30° y yaw de 45°, para que cada casilla sea un rombo de 2:1.
- Tres tipos de terreno: pasto (ya existe), tierra y agua. La arena queda para una spec posterior.
- Texturas de suelo generadas en un `CanvasTexture` con filtro nearest, para que se vean como píxel.
- Bordes de transición entre tipos de terreno, resueltos con una tabla de vecinos de 4 bits.
- Bosques en grupo: los obstáculos `tree` se agrupan en parches de 2 a 4 casillas, en lugar de un muro lineal.
- Agua como casilla bloqueada, sin lógica nueva: entra en `OBSTACLES` con `kind: 'water'`.
- Borde del mapa: una franja oscura de 2 casillas alrededor del mapa, y el fondo en negro.
- Sombras de contacto simples (manchas bajo árboles y unidades) en lugar de sombras direccionales.

**Fuera de alcance (para specs futuras):**

- Arena, colinas, acantilados y otros terrenos.
- Rediseño de las unidades y los edificios. Siguen con primitivas.
- Niebla de guerra y zonas sin explorar (spec 06).
- Recursos, edificios, combate e IA (specs 04 y siguientes).
- Mapas múltiples o generados de forma procedural.
- Audio, animaciones de terreno, agua animada.
- Arte externo, sprites o texturas descargadas.

## Dirección visual

Referencias de estilo, sin copiar assets del juego:

- **Proporción:** rombos de 2:1. Es la vista isométrica clásica de AoE1.
- **Pasto:** verdes saturados y cálidos, con manchas claras y oscuras pequeñas. Debe leerse como textura de píxel, no como ruido.
- **Tierra:** marrón claro, con puntos más oscuros. Va en caminos y claros.
- **Agua:** azul verdoso oscuro, con dos tonos y un brillo fino.
- **Bordes:** las transiciones entre tipos de terreno son irregulares, con un borde de un píxel más oscuro.
- **Bosques:** parches de copas redondeadas agrupadas, con tronco visible en la base. Deben tapar menos la vista que un muro.
- **Borde del mapa:** franja oscura y sin cortes; el fondo es negro.

## Modelo de datos

Cambios de presentación y un tipo de obstáculo nuevo. Ningún campo nuevo en `Unit`, `Tile` o `GameState`.

```ts
// src/game/map.ts
export type TerrainKind = 'grass' | 'dirt' | 'water';

/** Terreno de cada casilla. Regla fija: el mapa se define en código, igual que OBSTACLES. */
export const TERRAIN: ReadonlyArray<{ x: number; y: number; kind: TerrainKind }>;

/** Tipo visual de un obstáculo. `water` es bloqueado; `tree` y `rock` también. */
export function obstacleKind(x: number, y: number): 'tree' | 'rock' | 'water';

// src/render/palette.ts (campos nuevos)
export const PALETTE = {
  // ...campos existentes...
  dirt: [0x8a6a44, 0x7d5f3c, 0x9a7a50],
  water: [0x2c5a6e, 0x335f73],
  waterHighlight: 0x6a9bb0,
  edge: 0x12140f,        // franja del borde del mapa
  background: 0x000000,  // fondo negro, como en el mapa original
  shadowBlob: 0x000000,
} as const;

// src/render/terrain-texture.ts (nuevo)
/** Crea un CanvasTexture con pasto, tierra y agua en píxel, con bordes de transición. */
export function createTerrainTexture(): THREE.CanvasTexture;
```

Convenciones:

- Las texturas se generan con una función hash de `(x, y)`, sin `Math.random`, para que la imagen sea la misma en cada recarga.
- El `CanvasTexture` tiene un tamaño fijo de píxel por casilla (por ejemplo, 16 px por casilla), con `magFilter` y `minFilter` en `NearestFilter`.
- Las transiciones se eligen con una tabla de 16 entradas según los vecinos (norte, este, sur, oeste) del mismo tipo de terreno.
- `OBSTACLES` se conserva como lista de bloqueos. El agua y los bosques entran ahí; la lógica de `isBlocked` no cambia.
- Los bosques se generan como parches fijos en la tabla de `OBSTACLES`, no al azar.

## Plan de implementación

Cada paso deja el proyecto ejecutable.

1. **Cámara 2:1.** Cambiar `CAMERA_PITCH` a 30° en `scene.ts`, mantener el yaw de 45°, y ajustar `VIEW_HEIGHT` si el mapa queda demasiado chico. Prueba: cada casilla se ve como rombo de 2:1 y el mapa sigue completo en pantalla.
2. **Borde y fondo negro.** Cambiar `background` a negro y añadir la franja oscura de 2 casillas alrededor del mapa. Prueba: el borde no se corta de forma abrupta y el mapa se lee como un parche sobre negro.
3. **Textura de suelo.** Crear `terrain-texture.ts` con pasto procedural en píxel y reemplazar la variación actual por casillas de color plano. Prueba: el pasto tiene textura de píxel y es igual en cada recarga.
4. **Tierra y agua.** Añadir `TERRAIN` con algunas zonas de tierra (un camino y un claro) y un lago. El lago se añade a `OBSTACLES` como `water`. Prueba: se ven los tres tipos de terreno y el pathfinding rodea el agua.
5. **Transiciones.** Implementar la tabla de 16 entradas para bordes pasto-tierra y pasto-agua. Prueba: los bordes entre tipos se ven continuos, sin huecos.
6. **Bosques en grupo.** Reemplazar los árboles en muro por parches de 2 a 4 casillas. Mantener la huella de una casilla por árbol y la altura máxima de 1.5 casillas. Prueba: los bosques se leen como grupos y el pathfinding los rodea.
7. **Sombras de contacto.** Quitar las sombras direccionales de los árboles y las unidades, y sustituirlas por manchas oscuras translúcidas bajo cada uno. Prueba: cada objeto tiene un punto de apoyo visible y no hay sombras largas.
8. **Revisión final.** Actualizar el README con la nueva proporción de cámara y los tipos de terreno.

## Criterios de aceptación

- [x] `npm run build` pasa sin errores de tipos.
- [x] La consola del navegador no muestra errores al cargar la página.
- [x] Cada casilla se ve como rombo de proporción 2:1 (verificado en captura).
- [x] El fondo es negro y el mapa tiene una franja oscura sin cortes abruptos.
- [x] El pasto tiene textura de píxel (verificado en captura).
- [x] Hay pasto, tierra y agua visibles, y los bordes entre ellos son continuos (verificado en captura).
- [ ] El agua bloquea el paso y el pathfinding de la spec 01 la rodea. (Pendiente de probar con clic derecho.)
- [x] Los bosques se ven como parches de 2 a 4 casillas; ninguno se ve como muro lineal.
- [x] Árboles y unidades tienen manchas de contacto y no proyectan sombras direccionales.
- [ ] Clic izquierdo, caja de selección, clic derecho y cámara funcionan igual que en la spec 01. (Pendiente de prueba manual.)
- [x] Ninguna unidad entra en una casilla bloqueada; `pathfinding.ts` y `commands.ts` no cambian (verificable por diff).
- [ ] Recargar la página devuelve la misma imagen del mapa. (Pendiente de comprobar en dos recargas.)

## Decisiones

- **Sí:** cámara a 30° con rombos de 2:1. Cambio deliberado respecto a la spec 01, que fijó 45°. El rombo de 2:1 es la proporción clásica del mapa de AoE1.
- **Sí:** texturas de píxel generadas en código con una función hash. Mantiene la decisión de no usar arte externo.
- **Sí:** agua como casilla bloqueada. Es el comportamiento del mapa original y no requiere lógica nueva.
- **Sí:** bosques en grupo, pero con la misma huella de una casilla por árbol. El pathfinding no cambia.
- **Sí:** sombras de contacto en lugar de sombras direccionales. Se parece más a la lectura plana del original.
- **No:** arena, colinas y acantilados. Quedan para una spec posterior de terrenos.
- **No:** rediseño de unidades y edificios. Esa parte va en una spec propia de identidad de unidades.
- **No:** tests automatizados. Se mantiene la decisión de las specs anteriores; el criterio visual se verifica a mano.
- **Pendiente de confirmar:** el tamaño de la textura (16 px por casilla) y la altura de los bosques son propuestas iniciales. Se ajustan al probar.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Con la cámara a 30° el mapa ocupa menos alto y se ve pequeño. | Ajustar `VIEW_HEIGHT` en el paso 1 y revisar desde la vista inicial. |
| Las texturas de píxel se ven borrosas en pantallas de alta densidad. | Usar `NearestFilter` y un tamaño fijo de textura; revisar con `devicePixelRatio` de 2. |
| El agua y los bosques bloquean pasillos y dejan zonas inaccesibles. | Validar en el paso 4 que cada zona libre sigue conectada, con una comprobación de alcance desde la posición inicial. |
| Las transiciones con tabla de 16 entradas dan bordes incorrectos en esquinas. | Probar cada una de las 16 combinaciones en una cuadrícula de prueba antes de integrarlas. |
| Cambiar la cámara obliga a recalibrar la selección por caja. | La caja usa proyección de pantalla; verificar al cambiar el pitch en el paso 1. |

## Lo que **no** está en esta spec

- Arena, colinas y acantilados.
- Rediseño de unidades y edificios.
- Niebla de guerra.
- Recursos, edificios, combate e IA.
- Mapas múltiples o procedurales.
- Audio y agua animada.
