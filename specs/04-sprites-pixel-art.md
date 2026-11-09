# SPEC 04 — Sprites pixel-art generados en código

> **Estado:** implementado
> **Depende de:** [02 — Identidad visual](./02-identidad-visual.md), [03 — Cámara isométrica 2:1](./03-camara-isometrica-2a1.md)
> **Fecha:** 2026-11-09
> **Objetivo:** Que unidades y obstáculos se vean como sprites pixel-art de AoE1 (siluetas en 8 direcciones, paleta limitada, sombra ovalada en el suelo), dibujados por código y sin arte externo.

## Por qué existe esta spec

Las specs 01 y 02 representan unidades y obstáculos con primitivas 3D (cono, esfera, dodecaedros) con sombras dinámicas. Con la cámara 2:1 de la spec 03, eso se ve como maqueta 3D y no como el juego original, donde todo son sprites 2D de pocos píxeles que miran en 8 direcciones. Esta spec cambia la representación de objetos a sprites, sin tocar la lógica.

## Principio rector

**Solo cambia cómo se dibujan unidades y obstáculos.** `Unit`, `advanceUnits`, `pathfinding.ts`, `commands.ts` y `OBSTACLES` no cambian de comportamiento. La dirección en la que mira cada unidad es estado de presentación y vive en `UnitViews`, no en `Unit`.

## Alcance

**Dentro:**

- Módulo nuevo `src/render/sprites.ts` que genera las texturas por código, a partir de cuadros de píxeles.
- Unidades como sprites con 8 direcciones, según el movimiento en pantalla.
- Árboles y rocas como sprites, uno por casilla bloqueada.
- Paleta de sprites limitada a 64 colores.
- Sombra ovalada plana bajo cada unidad y cada obstáculo, en lugar de sombras proyectadas.
- Color de bando de las unidades como parámetro de la generación, para poder cambiarlo sin redibujar a mano.
- Filtro de textura `Nearest` para que los píxeles se vean nítidos.
- Retirada de las sombras dinámicas (`shadowMap`) y de `castShadow`/`receiveShadow` en unidades y obstáculos.

**Fuera de alcance (para specs futuras):**

- Terreno: sigue como en la spec 02 (cubos con variación de color). Pasa a la spec 06.
- Animación de caminata por cuadros. Se mantiene el balanceo vertical de la spec 02.
- Animaciones de combate, muerte o trabajo.
- Equipos enemigos y otras civilizaciones (solo se prepara el parámetro de color).
- Efectos de partículas.
- HUD, minimapa e iconos de interfaz (spec 05).

## Dirección visual

Referencias conceptuales, no copias de assets:

- **Unidades:** figuras pequeñas de unos 16 píxeles de ancho, con cuerpo del color del bando, cabeza de tono piel y contorno oscuro de un píxel.
- **Direcciones:** 8 vistas. Las 4 diagonales y las 4 cardinales se leen según la pantalla isométrica, no según el mundo three.js.
- **Árboles:** copa oscura redondeada y tronco corto, con contorno de un píxel.
- **Rocas:** montículo gris-marrón con dos tonos de sombreado.
- **Sombra:** elipse oscura semitransparente pegada al suelo, bajo los pies de cada unidad y en la base de cada obstáculo.
- **Paleta:** un conjunto cerrado de como máximo 64 colores, compartido por todos los sprites.

## Modelo de datos

Ningún campo nuevo en `Unit`, `Tile` ni `GameState`. El estado de presentación (dirección actual de cada unidad) vive en `UnitViews`.

```ts
// src/render/palette.ts (nueva entrada, reemplaza el uso directo de player.body/head en sprites)
export const SPRITE_PALETTE = [/* hasta 64 colores hexadecimales */] as const;
export const SHADOW_OPACITY = 0.35;

// src/render/sprites.ts (nuevo)
export const SPRITE_DIRECTIONS = 8;
/** Lado de cada cuadro de sprite, en píxeles lógicos. */
export const UNIT_SPRITE_PIXELS = 16;
export const TREE_SPRITE_PIXELS = 24;
export const ROCK_SPRITE_PIXELS = 16;

export interface TeamColors { body: number; head: number }

/** Índice 0..7 de la dirección de pantalla de un vector de movimiento en el plano del suelo. */
export function directionIndex(dx: number, dy: number, azimuthRad: number): number;

/** Ocho texturas de unidad, una por dirección, con el color del bando dado. */
export function makeUnitFrames(team: TeamColors): THREE.Texture[];
export function makeTreeTexture(): THREE.Texture;
export function makeRockTexture(): THREE.Texture;
export function makeShadowTexture(): THREE.Texture;

// src/render/units-view.ts o units.ts (UnitViews)
// Campo privado nuevo: facing: Map<number, number>  // dirección 0..7 por unidad, presentación
```

Convenciones:

- Cada cuadro se dibuja en un `<canvas>` 2D a la resolución lógica (16 o 24 píxeles) y luego se convierte en `THREE.CanvasTexture` con `magFilter` y `minFilter` en `NearestFilter`, sin mipmaps.
- Cada sprite es un `THREE.Sprite` con `SpriteMaterial` y `alphaTest` de 0.5. Los sprites no proyectan sombra.
- La dirección se calcula proyectando el vector de movimiento sobre los ejes de cámara (`CAMERA_AZIMUTH` de la spec 03), para que "arriba" en pantalla corresponda siempre a la misma dirección de sprite.
- Mientras la unidad está quieta, se mantiene la última dirección. La dirección inicial es la vista hacia la cámara.
- Las texturas se generan una vez al arrancar y se reutilizan; no se crean por frame.
- El proxy invisible de clic de 0.6 de radio (spec 02) se mantiene sin cambios, aunque la figura visible sea un sprite.
- Las sombras se desactivan globalmente: `renderer.shadowMap.enabled = false`.

## Plan de implementación

Cada paso deja el proyecto ejecutable.

1. **Paleta de sprites.** Añadir `SPRITE_PALETTE` (≤64 colores) y `SHADOW_OPACITY` en `palette.ts`. Prueba: `npm run build` pasa.
2. **Generador de texturas.** Crear `src/render/sprites.ts` con `makeUnitFrames`, `makeTreeTexture`, `makeRockTexture` y `makeShadowTexture`, dibujadas en canvas con filtro `Nearest`. Prueba: en consola, `makeUnitFrames(...)` devuelve 8 texturas no vacías.
3. **Unidades como sprites.** En `UnitViews`, sustituir el cono y la esfera por un `THREE.Sprite` por unidad, más una sombra ovalada plana. Mantener el anillo y el proxy de clic. Prueba: las 5 unidades se ven como figuras pixeladas y el clic sigue acertando.
4. **Dirección de movimiento.** Calcular la dirección en `UnitViews.sync` a partir del último tramo de `path` o de la posición, y cambiar la textura del sprite. Prueba: al caminar hacia la derecha de pantalla, la unidad muestra la dirección correspondiente; al parar, conserva la última.
5. **Obstáculos como sprites.** Sustituir `buildTree` y `buildRock` en `map.ts` por sprites con `makeTreeTexture` y `makeRockTexture`, y añadir la sombra ovalada en la base. Mantener la huella de una casilla y la altura máxima de 1.5 casillas. Prueba: los 22 obstáculos se ven como árboles o rocas pixeladas, y el pathfinding no cambia.
6. **Retirada de sombras.** Desactivar `renderer.shadowMap`, quitar `castShadow` y `receiveShadow` de unidades y obstáculos, y eliminar la luz direccional del sol si ya no tiene efecto visible. Prueba: no quedan sombras proyectadas en la escena.
7. **Balanceo.** Aplicar el balanceo vertical de la spec 02 a la posición del sprite, sin cambios de amplitud. Prueba: las unidades oscilan solo mientras caminan.
8. **Revisión final.** Comprobar en captura que la paleta está limitada y actualizar el README con una línea sobre los sprites y la eliminación de sombras.

## Criterios de aceptación

- [x] `npm run build` pasa sin errores de tipos.
- [x] La consola del navegador no muestra errores al cargar la página.
- [x] Las 5 unidades se ven como sprites pixel-art, no como conos ni esferas.
- [x] Cada unidad muestra una de 8 direcciones, y la dirección cambia con el movimiento en pantalla.
- [x] Cada obstáculo se ve como árbol o roca pixelada; ninguno es una primitiva 3D.
- [x] Todos los sprites usan `NearestFilter`; los píxeles se ven nítidos al acercar la vista.
- [x] Las texturas generadas usan como máximo 64 colores distintos (verificado con un contador en consola sobre los canvas).
- [x] Bajo cada unidad y cada obstáculo hay una sombra ovalada plana.
- [x] No hay sombras proyectadas en la escena (`renderer.shadowMap.enabled` es `false`).
- [x] El clic sobre una unidad la selecciona, y el clic en el vacío limpia la selección.
- [x] `pathfinding.ts`, `commands.ts`, `state.ts` y `OBSTACLES` no tienen cambios (verificado con `git diff`).
- [x] Recargar la página devuelve la misma imagen inicial.

## Decisiones

- **Sí:** sprites en lugar de primitivas 3D para unidades y obstáculos. Es el lenguaje visual del original y encaja con la cámara 2:1.
- **Sí:** texturas generadas por código, como en la spec 02. No se descargan imágenes ni se usan assets externos.
- **Sí:** 8 direcciones de sprite. Es lo que da la lectura de movimiento del original.
- **Sí:** paleta limitada a 64 colores. Refuerza el aspecto de pixel-art y evita degradados.
- **Sí:** sombras ovaladas planas en lugar de sombras proyectadas. Esta decisión sustituye los criterios de sombras de la spec 02.
- **No:** animación de caminata por cuadros. Se deja para una spec de animación; el balanceo de la spec 02 basta por ahora.
- **No:** cambiar el terreno en esta spec. Sigue como en la spec 02 hasta la spec 06.
- **Sí:** verificación manual con capturas, igual que las specs anteriores. Sin tests automatizados.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Los sprites se ordenan mal al solaparse, y una unidad aparece detrás de un árbol que debería tapar. | Usar `alphaTest` con `depthWrite` y revisar el orden en las zonas de muro; si falla, ordenar por posición en `renderOrder`. |
| Los árboles altos tapan unidades y el anillo de selección. | Limitar la altura de los sprites de árbol a 1.6 casillas y revisar desde la cámara al probar. |
| Los sprites pequeños se ven borrosos al escalarlos. | Filtro `Nearest` y tamaño de cuadro fijo; comprobar a dos zooms de la ventana. |
| Quitar sombras hace el mapa plano. | El sombreado del terreno y el contorno de los sprites dan volumen; si no basta, se ajusta en la spec 06. |
| La dirección parpadea cuando la unidad va casi en vertical de pantalla. | Histéresis: cambiar de dirección solo si el ángulo supera el sector en un margen de 5°. |

## Cambio posterior: aldeano desde imagen propia (unidades)

Tras implementar la spec, el usuario pidió usar `referencias/aldeano.png` como sprite de todas las unidades. Cambios respecto a lo anterior en la parte de unidades:

- **Arte:** la imagen (copiada a `src/assets/aldeano.png`) sustituye a los 8 frames generados por código. Se quita el fondo blanco y el marco rosa y se reduce a un píxel por celda de pixel-art. `sprites.ts` expone `loadVillagerTextures()`.
- **Dirección:** una sola vista. Al caminar hacia la derecha de la pantalla se usa una textura espejada (orientación invertida respecto a la imagen original, a petición del usuario); las 8 direcciones se retiran.
- **Movimiento:** tambaleo con saltito. Mientras camina, el sprite se inclina ±10° alternando de lado y da un pequeño salto en cada paso. Quieto, no se inclina ni salta.
- **Sombra, anillo de selección y proxy de clic:** sin cambios.

Los obstáculos (árboles y rocas) y la retirada global de sombras siguen pendientes de esta spec.

### Cursor

El cursor del juego pasa a ser la mano señalando de la hoja `referencias/cursores 2.jpg` (cuarta opción de la fila superior, versión bronce). Se recorta a 26×32 px, con fondo transparente, en `src/assets/cursor-pointer.png`. La punta del dedo (píxel 4, 1) es el punto activo. `src/render/cursor.ts` lo aplica al canvas desde `main.ts`.

## Lo que **no** está en esta spec

- Terreno con transiciones y autotiling (spec 06).
- Niebla de guerra (spec 07).
- HUD, minimapa e iconos (spec 05).
- Animaciones de combate, trabajo o muerte.
- Equipos enemigos.
- Cambios de lógica de juego.
