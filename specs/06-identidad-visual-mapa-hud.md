# SPEC 06 — Identidad visual del mapa y HUD estilo AoE1

> **Estado:** Aprobado
> **Depende de:** [01 — MVP AoE1](./01-mvp-aoe1.md), [02 — Identidad visual](./02-identidad-visual.md), [04 — Mapa visual AoE1](./04-mapa-visual-aoe1.md)
> **Relacionada (no depende):** [05 — Recursos y recolección](./05-recursos-recoleccion.md)
> **Fecha:** 2026-11-09
> **Objetivo:** Dar al mapa los tonos y la luz de la referencia `mapa.webp`, con sombras visibles y siete edificaciones con sprites propios en las posiciones de `referencias/edificios.jpg`, y añadir una barra de recursos superior con marcos ornamentados y un minimapa en rombo abajo a la derecha, todo con datos fijos.

## Por qué existe esta spec

La spec 04 dejó el mapa con proporción 2:1, texturas de píxel y manchas de contacto, pero sin luz. Sin sombras proyectadas, el mapa se lee plano y no se parece a la referencia de AoE1 (`referencias/mapa.webp` y `referencias/mapa1.jpg`). La referencia también tiene una interfaz con marcos ornamentados, una barra de recursos arriba y un minimapa en rombo abajo a la derecha. Hoy el juego no tiene nada de eso.

Esta spec reabre una decisión de la spec 04 (ver la sección de decisiones) y se limita a lo visual. No cambia reglas de juego.

## Principio rector

**Solo cambia la capa de presentación.** `state.ts`, `pathfinding.ts`, `commands.ts` y `selection.ts` no cambian de comportamiento. El minimapa y la barra leen el estado; no escriben en él.

Los únicos assets binarios nuevos son los dos sprites propios de edificaciones, en `public/assets/buildings/`; el dueño del proyecto confirmó que son suyos. No se añaden fuentes ni otras imágenes. Los marcos se dibujan con CSS e SVG inline, los iconos con SVG inline y el minimapa con canvas 2D. La referencia es una captura de un juego comercial: se usa solo para guiar el estilo, no se copia en el repositorio.

## Alcance

**Dentro:**

- Luz direccional con sombras proyectadas. Árboles, rocas y unidades proyectan sombra sobre el terreno. Se mantienen las manchas de contacto de la spec 04 como apoyo.
- Ajuste de iluminación ambiente para que pasto y tierra tengan contraste similar al de la referencia.
- Ampliación tras revisión con Playwright: acercar el color y la luz del mapa a la referencia (pasto más claro y saturado, tierra más visible, luz cálida y sombras más marcadas). Todo procedural y dentro de `palette.ts`, `lighting.ts` y `terrain-texture.ts`.
- Colores del mapa tomados de `referencias/mapa.webp` con muestreo de píxeles, no a ojo: pasto `#7e8338` y variantes, tierra `#958a47`, agua `#567687` con espuma `#7da09a`. El borde del mapa sigue oscuro, como fija la spec 04.
- Sol con elevación de 30° (antes 45°). A 45° las sombras eran tan cortas que quedaban tapadas por la base de cada objeto; la investigación lo confirmó (ver decisiones).
- Siete edificaciones en dos filas en el sureste, en las mismas posiciones que `referencias/edificios.jpg`. Cada una ocupa 3×3 casillas bloqueadas y se dibuja con un sprite propio: `church` (`asset1.png`, iglesia de ladrillo con cúpula) o `apartments` (`asset2.png`, complejo de apartamentos en terrazas). Reemplazan a los modelos de primitivas, que se eliminan. Asignación inicial, alternada: arriba (24,23) church, (28,23) apartments, (31,23) church; abajo (22,28) apartments, (26,28) church, (30,28) apartments, (34,28) church.
- Los sprites se escalan al footprint, anclados en la base del centro de cada footprint, y bloquean el paso como antes. No proyectan sombra propia: la sombra visible es la mancha de contacto.
- Barra de recursos superior con cinco valores fijos: madera, comida, oro, piedra y población.
- Marcos ornamentados (azul acero con filete dorado) alrededor de la barra de recursos y del minimapa.
- Minimapa en la esquina inferior derecha, con forma de rombo 2:1 que replica la proyección del mapa.
- El minimapa dibuja el terreno una vez y actualiza los puntos de las unidades en cada frame.
- El minimapa no reacciona a clics: no mueve la cámara ni da órdenes.

**Fuera de alcance (para specs futuras):**

- Construcción, producción, vida y lógica de los edificios: solo se dibujan.
- Fidelidad píxel a píxel con `referencias/edificios.jpg`. Los sprites propios sustituyen a esas siete edificaciones, así que la referencia solo guía posición y orden.
- Rediseño de unidades.
- Minimapa interactivo (clic para mover la cámara).
- Indicador del rectángulo de cámara dentro del minimapa.
- Borde de costa con arena o espuma entre tierra y agua.
- Arena, colinas, acantilados y otros terrenos.
- Render realista con normal maps, relieve o texturas descargadas. El acercamiento a la referencia se limita a color, luz y sombra procedurales.
- Uso de la captura de referencia como textura o asset.
- Fuentes web externas (Google Fonts u otras).
- Barra de recursos conectada al `stockpile` real. Llega con la implementación de la spec 05.
- Audio, animaciones de HUD y efectos de agua.

## Dirección visual

Referencias de estilo, sin copiar assets del juego:

- **Luz:** una luz direccional constante, de noroeste a sureste, con elevación de 30°. Las sombras son alargadas y visibles, pero sin oscurecer demasiado.
- **Tonos del mapa:** pasto `#7e8338` con variantes más claras y oscuras, tierra `#958a47`, agua `#567687` con espuma `#7da09a`. Medidos en la referencia.
- **Edificaciones:** se ven con los sprites propios (`asset1.png` y `asset2.png`), con su propia paleta. La paleta de primitivas de `edificios.jpg` queda sin uso.
- **Sombras:** árboles, rocas y unidades proyectan sombra. El terreno recibe sombra. Las manchas de contacto siguen bajo cada objeto con menos opacidad.
- **Marcos:** azul acero oscuro con filete dorado de 1 px y esquinas marcadas. Fondo casi negro semitransparente dentro del marco.
- **Iconos:** madera (tronco), comida (carne), oro (lingote), piedra (roca) y población (persona). Dibujados en SVG simple con colores de la paleta.
- **Textos:** números en blanco con sombra oscura de 1 px. Tipografía del sistema, sin fuentes externas.
- **Minimapa:** rombo de 2:1 con el mismo terreno que el mapa, bordes de marco y puntos de unidades azules. Fondo negro fuera del rombo.

## Modelo de datos

Ningún campo nuevo en `Unit`, `Tile` ni `GameState`. Los datos de la barra son fijos.

```ts
// src/render/lighting.ts (nuevo)
/** Dirección de la luz: de noroeste a sureste, elevación de 30 grados. */
export const SUN_DIRECTION: THREE.Vector3;
/** Crea la luz direccional con sombras y la luz ambiente. */
export function createLighting(scene: THREE.Scene): { sun: THREE.DirectionalLight; ambient: THREE.AmbientLight };

// src/ui/resource-bar.ts (nuevo)
export interface ResourceBarValues {
  wood: number;
  food: number;
  gold: number;
  stone: number;
  population: number;
  populationCap: number;
}
/** Valores de muestra tomados de la referencia. Se sustituyen por el stockpile en la spec 05. */
export const SAMPLE_RESOURCE_BAR: ResourceBarValues;
/** Pinta la barra superior dentro de `root`. No cambia de valores durante la partida. */
export function renderResourceBar(root: HTMLElement, values: ResourceBarValues): void;

// src/ui/minimap.ts (nuevo)
export interface Minimap {
  /** Redibuja solo la capa de unidades. El terreno se dibuja una vez al crear el minimapa. */
  update(units: ReadonlyArray<Unit>): void;
}
/** Crea el canvas en forma de rombo dentro de `root` y dibuja el terreno del mapa. */
export function createMinimap(root: HTMLElement, map: GameMap): Minimap;

// src/ui/hud.css (nuevo)
// Clases: .hud-bar, .hud-frame, .hud-item, .minimap-frame. Solo colores de palette.ts.

// src/render/building.ts (reemplaza los modelos de primitivas)
/** Sprites propios de edificaciones, cargados desde `public/assets/buildings/`. */
export type BuildingKind = 'church' | 'apartments';
/** Sprite de una edificación, anclado en la base del centro de su footprint de 3×3 casillas. */
export function buildBuilding(kind: BuildingKind): THREE.Sprite;

// src/game/map.ts (cambios)
/** Tipo de casilla bloqueada. `building` se añade a la tabla OBSTACLES, así que pathfinding la rodea sin cambios. */
export type ObstacleKind = 'tree' | 'rock' | 'water' | 'building';
/** Las siete edificaciones: esquina superior izquierda de cada una. Footprint de 3×3 casillas. */
export const BUILDINGS: ReadonlyArray<{ kind: BuildingKind; x: number; y: number }>;

// src/render/palette.ts (campos nuevos)
export const PALETTE = {
  // ...campos existentes...
  frameBlue: 0x1f2f45,
  frameGold: 0xc9a54a,
  hudText: 0xffffff,
  unitMarker: 0x4a7bd6,
  building: { wall: 0x5a6f8f, roof: 0x3c4d6b, trim: 0xc9a54a },
} as const;
```

Convenciones:

- Los valores de la barra son constantes en `resource-bar.ts`, tomadas de la referencia: madera 2715, comida 2198, oro 2210, piedra 3303, población 46/76.
- El minimapa usa el mismo criterio de color que el terreno de la spec 04. No hay un segundo mapa de colores.
- El canvas del minimapa tiene resolución interna fija y se escala en CSS a 200 px de ancho. La proporción del rombo es 2:1.
- La luz no usa `Math.random`. La dirección es constante.
- Las siete edificaciones ocupan 3×3 casillas cada una, en dos filas en el sureste, como en la imagen: arriba (24,23), (28,23), (31,23), siguiendo el orden horizontal de la imagen; abajo (22,28), (26,28), (30,28), (34,28). No tocan árboles, rocas, agua ni la posición inicial de las unidades.

## Plan de implementación

Cada paso deja el proyecto ejecutable.

1. **Luz direccional sin sombras.** Crear `lighting.ts` con `SUN_DIRECTION` y la luz ambiente. Sustituir la iluminación actual de `scene.ts` por la nueva, sin sombras todavía. Prueba: `npm run build` pasa y el mapa se ve igual de claro que antes, con la luz activa.
2. **Sombras proyectadas.** Activar `castShadow` en árboles, rocas y unidades, y `receiveShadow` en el terreno. Ajustar el `shadow.camera` para cubrir el mapa 40×40 y el `bias` para evitar artefactos de acné. Prueba: los árboles y las unidades proyectan sombra visible sobre el pasto.
3. **Ajuste de manchas de contacto.** Bajar la opacidad de las manchas de `shadows.ts` para que no dupliquen la sombra proyectada. Prueba: el objeto tiene punto de apoyo y no se ve doble sombra.
4. **Marcos y barra superior.** Crear `hud.css` y `resource-bar.ts` con los cinco valores fijos, los iconos SVG y los marcos. Montarla en `index.html` como franja superior fija de 40 px. Prueba: se ven los cinco valores con los números de la referencia.
5. **Minimapa en rombo.** Crear `minimap.ts` con el canvas en forma de rombo en la esquina inferior derecha de 200 px de ancho, y dibujar el terreno una vez. Prueba: se ve el terreno del mapa en rombo sobre el marco.
6. **Puntos de unidades.** Llamar a `minimap.update(units)` en el bucle de `main.ts` y dibujar un punto por unidad. Prueba: al mover una unidad, su punto se mueve en el minimapa.
7. **Bloqueo de eventos del minimapa.** Hacer que los eventos de ratón sobre el minimapa no lleguen al canvas del juego. Prueba: clic derecho sobre el minimapa no mueve las unidades seleccionadas.
8. **Color y luz hacia la referencia.** Poner en `palette.ts` los tonos medidos de la referencia (pasto, tierra y agua) y dar luz cálida al sol y ambiente más alto en `lighting.ts`. Prueba: el color medio del pasto en la zona central de 1280×720 queda a menos de 25 unidades por canal de `#7e8338`, y la luminancia entre 90 y 150, medido con Playwright sobre el canvas.
9. **Sombras visibles.** Confirmar que el suelo recibe sombra y pasar la elevación del sol de 45° a 30° en `lighting.ts`. Prueba: con la luz ambiental apagada y un sol de prueba, las sombras de árboles y unidades se ven sobre el pasto.
10. **Sprites de edificaciones.** Copiar `referencias/asset1.png` y `referencias/asset2.png` a `public/assets/buildings/` como `church.png` y `apartments.png`. Reescribir `src/render/building.ts` para cargar esos dos sprites y devolver un `THREE.Sprite` escalado al footprint. Quitar los modelos de primitivas de ese archivo. En `map.ts`, usar los nuevos tipos de `BUILDINGS` con las posiciones de la lista. Prueba: las siete aparecen en las posiciones de la lista, con su sprite y su mancha de contacto, y una unidad que pide ir detrás de una de ellas la rodea.
11. **Edificación en el minimapa.** Dibujar las casillas `building` con el color de filete dorado. Prueba: aparece como bloque dorado en el rombo.
12. **Revisión final.** Actualizar el README: controles, sección de HUD, edificación y la convención "el mapa no usa sombras direccionales", que ahora es falsa. Prueba: el README describe lo que hace el juego.

## Criterios de aceptación

- [ ] `npm run build` pasa sin errores de tipos.
- [ ] La consola del navegador no muestra errores al cargar la página.
- [ ] Árboles, rocas y unidades proyectan sombra visible sobre el terreno (verificado en captura).
- [ ] Las manchas de contacto siguen presentes bajo árboles, rocas y unidades.
- [ ] La barra superior muestra madera 2715, comida 2198, oro 2210, piedra 3303 y población 46/76.
- [ ] La barra superior y el minimapa tienen marco de filete dorado (verificado en captura).
- [ ] El minimapa está en la esquina inferior derecha y tiene forma de rombo 2:1.
- [ ] El minimapa muestra el terreno del mapa con los mismos colores que el mapa.
- [ ] Un punto por unidad aparece en el minimapa y se mueve al mover la unidad.
- [ ] Clic derecho sobre el minimapa no mueve las unidades seleccionadas.
- [ ] Clic izquierdo, caja de selección, clic derecho y cámara del mapa funcionan igual que en la spec 01.
- [ ] `pathfinding.ts`, `commands.ts` y `selection.ts` no cambian (verificable por diff).
- [ ] Los únicos assets binarios añadidos son `public/assets/buildings/church.png` y `apartments.png`. No hay fuentes ni otras imágenes.
- [ ] La barra superior y el minimapa no tapan las unidades iniciales en 1280×720 ni en 1920×1080.
- [ ] Recargar la página muestra la misma imagen y los mismos valores de la barra.
- [x] El color medio del pasto en la zona central de 1280×720 está a menos de 25 unidades por canal de `#7e8338` (medido: 121, 124, 51 frente a 126, 131, 56), medido con Playwright.
- [x] La luminancia media del pasto en la zona central de 1280×720 está entre 90 y 150 (línea base previa: 41; medida final: 90.9), medida con Playwright.
- [ ] Con la luz ambiental apagada y un sol de prueba, las sombras de árboles y unidades se ven sobre el pasto (verificado en captura).
- [ ] Las siete edificaciones aparecen en el mapa en dos filas, como en `referencias/edificios.jpg`, cada una con una silueta reconocible (verificado en captura y comparación visual).
- [x] Cada edificación proyecta sombra sobre el pasto (verificado en captura).
- [ ] Una unidad que pide ir detrás de una edificación la rodea, y ninguna unidad la atraviesa (verificado con Playwright).
- [x] La edificación aparece en el minimapa como bloque dorado (el píxel medido es `#c9a54a`, igual que el filete).
- [x] La edificación no se coloca sobre árboles, rocas, agua ni la posición inicial de las unidades (verificado en las constantes de `map.ts`).
- [x] Clic izquierdo sobre una unidad la selecciona, y clic derecho sobre el mapa la mueve (verificado con Playwright).

## Decisiones

- **Sí:** reabrir las sombras direccionales, decisión revertida respecto a la spec 04. La referencia tiene sombras proyectadas y el mapa se lee plano sin ellas. Las manchas de contacto se mantienen como apoyo.
- **Sí:** luz direccional de noroeste a sureste con elevación de 30°. Es una dirección fija y predecible. Investigación: el suelo sí recibía sombra desde el inicio (recibe sombra y el mapa de sombras se genera). A 45° las sombras eran tan cortas que quedaban tapadas por la base de cada objeto. A 30° se ven.
- **Sí:** marcos y barra con CSS y SVG inline. Cumple la regla de no usar assets externos.
- **Sí:** minimapa en rombo 2:1 con canvas 2D. Replica la proyección del mapa.
- **Sí:** minimapa con puntos de unidades, no interactivo. El clic sobre el minimapa no da órdenes.
- **Sí:** valores fijos de muestra en la barra. La spec 05 no está implementada en el código, así que esta spec no depende de ella.
- **Sí (ampliado tras revisión con Playwright):** acercar color y luz del mapa a la referencia con valores procedurales. La línea base de pasto tenía luminancia 41 frente a un pasto claro en la referencia.
- **No:** render realista con normal maps, relieve o texturas descargadas. Requiere assets externos, que la spec 04 descartó.
- **No:** usar la captura de la referencia como textura o asset. Es una captura de un juego comercial.
- **Sí:** siete edificaciones en `OBSTACLES`. Bloquean el paso con el mecanismo existente, así que `pathfinding.ts` no cambia. No tienen lógica de producción ni de construcción.
- **Sí:** footprint de 3×3 para las siete. Permite que la silueta de cada una se parezca a la imagen.
- **No:** fidelidad píxel a píxel con la imagen. Con primitivas y sin assets externos se llega a la silueta y a la paleta, no al detalle.
- **Sí:** colores tomados de la referencia con muestreo de píxeles, no a ojo.
- **No:** construcción, producción y rediseño de unidades. La spec 04 dejó las unidades fuera.
- **No:** cambiar el borde oscuro del mapa por agua o costa. La referencia lo tiene, pero la spec 04 fijó una franja oscura. Queda como pendiente de decisión.
- **No:** borde de costa con arena. No estaba elegido en esta spec.
- **No:** minimapa interactivo y rectángulo de cámara. Quedan para una spec de interacción.
- **No:** fuentes web externas. Usar la tipografía del sistema.
- **Pendiente de confirmar:** tamaño del mapa de sombras (2048 px), altura de la barra (40 px), ancho del minimapa (200 px), posiciones exactas de las siete edificaciones (lista en Convenciones) y si el borde del mapa se cambia a costa en otra spec. Son propuestas iniciales y se ajustan al probar.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Las sombras de árboles y unidades generan acné o se despegan del suelo. | Ajustar `bias` y `normalBias` en el paso 2, y revisar con captura. |
| El `shadow.camera` no cubre el mapa completo y las sombras se cortan en el borde. | Calcular los límites desde el tamaño del mapa en `lighting.ts` y verificar en las esquinas. |
| La barra superior tapa unidades en pantallas pequeñas. | Altura fija de 40 px y comprobación en 1280×720. |
| El minimapa tapa zona de juego en la esquina. | Tamaño fijo de 200 px y comprobación de posición en 1280×720. |
| Los eventos del minimapa llegan al canvas del juego y dan órdenes por error. | Bloquear los eventos en el contenedor del minimapa (paso 7). |
| La spec 05 aparece como "Implementado", pero no hay `resources.ts` ni HUD en `src/`. | Esta spec usa valores fijos y no depende de ella. La inconsistencia se resuelve aparte. |
| La edificación bloquea un pasillo cerca de las unidades y deja zonas inaccesibles. | Colocarla lejos de la posición inicial y comprobar con una ruta de prueba desde las unidades. |
| El sol a 30° alarga tanto las sombras que se cortan en el borde del `shadow.camera`. | Revisar las esquinas del mapa en la captura del paso 9 y ajustar `SHADOW_HALF_EXTENT` si hace falta. |

## Lo que **no** está en esta spec

- Más edificios, construcción y rediseño de unidades.
- Minimapa interactivo y rectángulo de cámara.
- Borde de costa con arena o espuma.
- Arena, colinas y acantilados.
- Render realista con relieve o texturas externas.
- Barra de recursos conectada al stockpile real.
- Fuentes web externas, audio y animaciones de HUD.
