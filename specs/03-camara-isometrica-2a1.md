# SPEC 03 — Cámara y proyección isométrica 2:1 estilo AoE1

> **Estado:** implementado
> **Depende de:** [01 — MVP AoE1](./01-mvp-aoe1.md), [02 — Identidad visual](./02-identidad-visual.md)
> **Fecha:** 2026-11-09
> **Objetivo:** Que el mapa se vea como en AoE1: rombos de proporción 2:1, ángulo de cámara fijo de 30° de elevación y 45° de giro, sin cambiar la lógica de juego.

## Por qué existe esta spec

La spec 01 usa una cámara ortográfica a 45° de inclinación. Eso da rombos de proporción cercana a 1:1 y no reproduce la lectura del terreno de AoE1, cuyas casillas son rombos 2:1 vistos desde un ángulo de elevación de 30°. Antes de rediseñar sprites, HUD o terreno hay que fijar la proyección, porque todo lo demás se apoya en ella.

## Principio rector

**Solo cambia la cámara y la forma de proyectar el mundo en pantalla.** Ningún archivo de lógica (`state.ts`, `pathfinding.ts`, `commands.ts`, `units.ts` en la parte de posición) cambia de comportamiento. Las coordenadas de casilla siguen siendo las mismas: `x` de three = `x` de la casilla, `z` de three = `y` de la casilla.

## Alcance

**Dentro:**

- Cámara ortográfica con elevación fija de 30° y giro fijo de 45° respecto al eje Y.
- Proyección tal que una casilla cuadrada del mundo se ve como rombo de proporción 2:1 en pantalla.
- Encuadre del mapa de 40x40 que lo muestre completo al abrir la página.
- Ajuste de `camera-controls.ts` para que W/A/S/D y el desplazamiento por borde sigan funcionando en el nuevo plano de movimiento.
- Área fuera del mapa en negro casi puro, para que el mapa se lea como rombo sobre fondo oscuro.
- Constantes con nombre para ángulo, giro y tamaño del encuadre, en `scene.ts`.

**Fuera de alcance (para specs futuras):**

- Sprites, billboards y cambios de arte de unidades u obstáculos (spec 04).
- HUD, paneles y minimapa (spec 05).
- Cambios en el terreno: tipos, transiciones o autotiling (spec 06).
- Niebla de guerra (spec 07).
- Zoom con la rueda del ratón (sigue fuera, como en la spec 01).
- Rotación de cámara por el jugador. El ángulo es fijo, como en AoE1.

## Modelo de datos

No se añaden campos a `Unit`, `Tile` ni `GameState`. Solo constantes de presentación.

```ts
// src/render/scene.ts
export const CAMERA = {
  elevationDeg: 30,   // ángulo sobre el plano del suelo; sin(30°) = 0.5 da la proporción 2:1
  azimuthDeg: 45,     // giro alrededor del eje Y; alinea los ejes del mapa con las diagonales de pantalla
  viewSize: 30,       // altura visible en unidades del mundo, ajustada para ver el mapa completo
} as const;

// src/render/palette.ts (cambio de valor, no de estructura)
// background pasa a un tono casi negro para el área fuera del mapa.
```

Convenciones:

- La cámara sigue siendo `OrthographicCamera`. No se usa perspectiva.
- Un cuadrado de lado 1 en el suelo, con giro de 45° y elevación de 30°, se proyecta en pantalla como rombo con ancho = 2 × alto. Esa es la razón de la elección de 30°.
- El encuadre se recalcula al cambiar el tamaño de ventana, manteniendo la proporción del mapa visible.
- La posición de la cámara sigue limitada para que su centro no salga del mapa (criterio ya definido en la spec 01).
- Los controles de cámara trabajan en el plano del suelo, rotados 45° respecto a la pantalla, para que W, A, S y D muevan la vista en la dirección que el jugador ve en pantalla.

## Plan de implementación

Cada paso deja el proyecto ejecutable.

1. **Constantes de cámara.** Crear el objeto `CAMERA` en `src/render/scene.ts` y sustituir los valores de 45° que hoy estén en la cámara. Prueba: el juego arranca sin errores de consola.
2. **Proyección 2:1.** Colocar la cámara con elevación de 30° y giro de 45° mirando al centro del mapa. Prueba: una casilla libre se ve como rombo, y su ancho en píxeles es el doble de su alto (±2 px).
3. **Encuadre del mapa.** Ajustar `viewSize` para que el rombo de 40x40 quede completo con margen. Recalcular el frustum en el evento de cambio de tamaño de ventana. Prueba: el mapa completo se ve al abrir y al redimensionar la ventana, sin deformación.
4. **Controles de cámara.** Adaptar `camera-controls.ts` para que el desplazamiento se haga en el plano del suelo rotado 45°. Mantener el margen de 20 px del borde y la limitación del centro al mapa. Prueba: W, A, S y D mueven la vista hacia arriba, izquierda, abajo y derecha en pantalla.
5. **Fondo fuera del mapa.** Cambiar `PALETTE.background` a un tono casi negro. Mantener la niebla de borde de la spec 02 si sigue ayudando. Prueba: las esquinas del rombo se ven negras y el borde no se corta de golpe.
6. **Verificación de selección y movimiento.** Comprobar que el clic izquierdo, la caja de selección y el clic derecho siguen acertando con la nueva proyección. Prueba: seleccionar una unidad, arrastrar una caja y dar una orden de movimiento funcionan como antes.
7. **Documentación.** Actualizar la sección de controles del README si las teclas cambian de dirección visual, y añadir una línea sobre la proyección 2:1.

## Criterios de aceptación

- [x] `npm run build` pasa sin errores de tipos.
- [x] La consola del navegador no muestra errores al cargar la página.
- [x] La cámara sigue siendo `OrthographicCamera`, con elevación de 30° y giro de 45°.
- [x] Una casilla libre se ve como rombo con proporción 2:1 (±2 px en una captura de 1280x720).
- [x] El mapa de 40x40 se ve completo al abrir la página, con margen visible alrededor.
- [x] El mapa se mantiene completo y sin deformación al redimensionar la ventana.
- [x] W, A, S y D mueven la vista hacia arriba, izquierda, abajo y derecha en pantalla.
- [x] Acercar el ratón al borde de la pantalla desplaza la cámara.
- [x] El centro de la cámara no puede salir del mapa.
- [x] El área fuera del rombo se ve en negro casi puro.
- [x] Clic izquierdo, caja de selección y clic derecho funcionan igual que en la spec 01.
- [x] `pathfinding.ts` y `commands.ts` no tienen cambios (verificado con `git diff`).
- [x] Recargar la página devuelve la misma vista inicial.

## Decisiones

- **Sí:** elevación de 30° y giro de 45°. Es la combinación que produce rombos 2:1 con una cámara ortográfica. Reemplaza el criterio de "inclinación de 45°" de la spec 01, que queda superada en este punto.
- **No:** perspectiva. La selección y la proyección de la caja se complican, como ya se dijo en la spec 01.
- **No:** rotación libre de la cámara por el jugador. AoE1 usa un ángulo fijo, y la rotación añadiría estados de control sin aportar a la estética.
- **Sí:** fondo casi negro fuera del mapa. Es el aspecto de AoE1 con el borde del mapa, y sustituye el tono de tierra de la spec 02 solo en ese punto.
- **Sí:** verificación manual con capturas, igual que las specs 01 y 02. Sin tests automatizados en esta spec.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Con elevación de 30° los obstáculos altos tapan más casillas detrás de ellos. | Mantener la altura máxima de 1.5 casillas de la spec 02 y revisar la lectura desde la cámara al probar. |
| El control de WASD en el plano rotado confunde al jugador. | Probar los cuatro sentidos y ajustar el mapeo en `camera-controls.ts` antes de dar la spec por cerrada. |
| El encuadre cambia con el tamaño de ventana y el mapa se corta. | Recalcular el frustum en el evento de redimensionado y fijar un margen mínimo. |
| El cambio de ángulo rompe la selección por raycast. | La selección usa el mismo frustum y la misma cámara; comprobar clic sobre unidades y obstáculos tras el cambio. |

## Lo que **no** está en esta spec

- Sprites, billboards y arte de unidades u obstáculos.
- HUD, minimapa y paneles.
- Terreno con transiciones o autotiling.
- Niebla de guerra.
- Zoom y rotación de cámara.
- Cambios de lógica de juego.
