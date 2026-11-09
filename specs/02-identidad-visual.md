# SPEC 02 — Identidad visual estilo Age of Empires 1

> **Estado:** Implementado
> **Depende de:** [01 — MVP AoE1](./01-mvp-aoe1.md)
> **Fecha:** 2026-11-08
> **Objetivo:** Que el prototipo se parezca visualmente a AoE1 (terreno verde con variación, unidades con silueta y color de bando, obstáculos con forma de árbol y roca, luz cálida con sombras) sin cambiar la lógica de juego.

## Por qué existe esta spec

El MVP fija la mecánica (cámara, selección, pathfinding, movimiento) con primitivas genéricas: un plano verde, cubos grises y cilindros azules. Funciona, pero no se reconoce como AoE. Esta spec define el lenguaje visual antes de meter assets o mecánicas nuevas, para que las specs siguientes (recursos, edificios) nazcan ya con un estilo coherente.

## Principio rector

**Solo cambia la capa de presentación.** Ningún archivo de lógica (`state.ts`, `pathfinding.ts`, `commands.ts`, la parte de posición de `units.ts`) cambia de comportamiento. Si un cambio visual obliga a tocar lógica, se para y se reconsidera.

## Alcance

**Dentro:**

- Paleta centralizada en un solo módulo (`src/render/palette.ts`).
- Terreno con variación de color por casilla, determinista (misma imagen en cada carga).
- Obstáculos con dos variantes visuales construidas con primitivas: árboles (tronco cilíndrico + copa cónica) y rocas (dodecaedros agrupados). Se asignan por una regla fija sobre las casillas de `OBSTACLES`.
- Unidades con silueta reconocible: cuerpo cónico, cabeza esférica y color de bando.
- Iluminación cálida: luz direccional con sombras proyectadas y luz ambiental de tono frío-neutro.
- Animación leve de las unidades mientras se mueven (balanceo vertical sincronizado con el movimiento).
- Ajustes visuales del anillo de selección y del rectángulo de caja para que combinen con la paleta.
- Color de fondo y niebla de borde que sugieran un horizonte de mapa.

**Fuera de alcance (para specs futuras):**

- Modelos GLTF, sprites, texturas descargadas o cualquier arte externo. Se mantiene la decisión de la spec 01: primitivas y texturas generadas en código.
- Audio y música.
- Edificios, recursos y sus visuales.
- Nuevos tipos de unidad o de terreno (agua, colinas, bosque denso).
- Efectos de partículas (polvo, humo, impactos).
- Menús, HUD o iconografía nueva.
- Zoom de cámara u otros controles.

## Dirección visual

Referencias conceptuales, no copias de assets:

- **Terreno:** verdes ligeramente desaturados con manchas de tonos más claros y más oscuros, con borde suave entre casillas (una separación de 0.02 en la geometría se mantiene como en la spec 01).
- **Obstáculos:** árboles y rocas oscuras, lo bastante altos para que no se confundan con el suelo.
- **Unidades:** color de bando saturado sobre cuerpo claro, con silueta de persona en miniatura (cono + esfera), legible desde la cámara isométrica.
- **Luz:** sol bajo y cálido desde una dirección fija, con sombras. Sombra suave con `PCFShadowMap`.
- **Fondo:** tono de tierra oscura o verde-azulado en el borde del mapa, sin cielo.

## Modelo de datos

Solo se añaden estructuras de presentación. Ningún campo nuevo en `Unit`, `Tile` o `GameState`.

```ts
// src/render/palette.ts
export const PALETTE = {
  grass: [0x4d7a3a, 0x528240, 0x477335, 0x5a8a45], // variantes de suelo
  rock: 0x7a6a55,
  tree: { trunk: 0x5b3d24, crown: 0x2f5e2a },
  rockStone: 0x6e6659,
  player: { body: 0x2f6bff, head: 0xf2d2b0 },   // bando del jugador
  selection: 0xffe14d,
  background: 0x1b1f24,
  sun: 0xffe2b3,
  ambient: 0x8d9aaa,
} as const;

// src/game/map.ts (nuevo export, solo de presentación)
/** Variante visual de cada obstáculo. Regla fija: determinista por (x, y). */
export function obstacleKind(x: number, y: number): 'tree' | 'rock';
```

Convenciones:

- El color de suelo por casilla se calcula con una función hash de `(x, y)`, no con `Math.random`, para que la imagen sea la misma en cada recarga.
- Las geometrías se crean una vez y se reutilizan (`BoxGeometry`, `ConeGeometry`, etc.), igual que en la spec 01.
- Las sombras se activan solo en el sol y solo para terreno, obstáculos y unidades. El anillo de selección no proyecta sombra.
- Mantener el número de draw calls razonable: usar `InstancedMesh` para el terreno y los obstáculos si el número de objetos pasa de unos cientos.

## Plan de implementación

Cada paso deja el proyecto ejecutable y jugable.

1. **Paleta centralizada.** Crear `src/render/palette.ts` y reemplazar los colores literales de `map.ts`, `units.ts` y `scene.ts` por referencias a `PALETTE`. Sin cambios visuales. Prueba: el juego se ve igual que antes.
2. **Terreno variado.** Asignar a cada casilla libre una de las variantes de `PALETTE.grass` con la función hash. Prueba: se ven manchas de verde estables al recargar.
3. **Obstáculos con forma.** Añadir `obstacleKind` y construir árboles (cilindro + cono) o rocas (grupos de dodecaedros) en lugar de cubos. Mantener la huella en la casilla y la altura máxima de 1.5 casillas. Prueba: los 22 obstáculos se ven como árboles o rocas y el pathfinding sigue rodeándolos.
4. **Unidades con silueta.** Sustituir el cilindro por cuerpo cónico y cabeza esférica en `PALETTE.player`. Mantener el proxy de clic de 0.6 de radio. Prueba: las 5 unidades se distinguen y el clic sigue acertando.
5. **Luz y sombras.** Configurar `renderer.shadowMap` con `PCFShadowMap`, sol cálido con `castShadow` y frustum de sombra ajustado al mapa de 40x40. Prueba: los obstáculos y las unidades proyectan sombra hacia el mismo lado.
6. **Movimiento con balanceo.** En `UnitViews.sync`, añadir una oscilación vertical pequeña (amplitud 0.05) solo mientras `path.length > 0`. Prueba: las unidades parecen caminar, y quietas no se mueven.
7. **Selección y caja.** Ajustar el anillo a `PALETTE.selection` y el rectángulo de caja a esa misma familia de color. Prueba: anillo y caja se leen bien sobre verde y sobre obstáculos.
8. **Fondo y horizonte.** Fijar `scene.background` y, si hace falta, una niebla lineal de borde. Prueba: el borde del mapa no se ve como un corte abrupto.
9. **Revisión final.** Revisar el README: actualizar la sección de controles si cambia algo visible y añadir una línea sobre la paleta.

## Criterios de aceptación

- [x] `npm run build` pasa sin errores de tipos.
- [x] La consola del navegador no muestra errores al cargar la página.
- [x] Todos los colores del juego salen de `src/render/palette.ts`; no hay literales de color en `map.ts`, `units.ts` ni `scene.ts`.
- [x] El suelo tiene al menos dos tonos de verde visibles, y la misma distribución de tonos en cada recarga.
- [x] Cada obstáculo se ve como árbol o roca; ninguno se ve como cubo gris.
- [x] Las unidades tienen cabeza y cuerpo diferenciados, y su color es `PALETTE.player.body`.
- [x] Hay sombras visibles de obstáculos y unidades sobre el suelo.
- [x] Las unidades oscilan solo mientras se mueven.
- [x] El anillo de selección y el rectángulo de caja usan `PALETTE.selection` y se leen sobre el terreno.
- [x] Clic izquierdo, caja de selección, clic derecho y cámara funcionan igual que en la spec 01.
- [x] Ninguna unidad entra en una casilla bloqueada; el pathfinding no cambió (verificado por código: `pathfinding.ts` y `commands.ts` sin diff).
- [x] Recargar la página devuelve la misma imagen visual inicial.

## Decisiones

- **Sí:** paleta centralizada en un módulo. Permite cambiar el estilo sin tocar la lógica.
- **No:** texturas descargadas o arte externo. Se mantiene la decisión de la spec 01. Si el estilo pide más, se abre una spec aparte.
- **Sí:** texturas y variaciones generadas en código con una función hash determinista.
- **Sí:** árboles y rocas construidos con primitivas. Dan forma reconocible sin assets.
- **Sí:** sombras con `PCFShadowMap`. Mejora la lectura del 3D y es barato para un mapa de 40x40. Desviación: la spec original pedía `PCFSoftShadowMap`, pero three 0.187 lo retiró (aviso en consola), así que se usa su reemplazo directo.
- **No:** `PCFShadowMap` con resolución muy alta. Cuesta frames en equipos modestos; se empieza con 2048 y se ajusta al probar.
- **Sí:** balanceo de unidades solo mientras caminan. Da vida sin efectos extra.
- **No:** partículas, polvo o humo. Se dejan para una spec de efectos.
- **Sí:** verificación solo manual, igual que la spec 01. Tests automatizados siguen fuera de alcance.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Las sombras reducen los FPS en equipos modestos. | Resolución de sombra configurable en `palette.ts` o en `scene.ts`; empezar en 2048. |
| El terreno con muchas variaciones parece ruido visual. | Limitar a 4 tonos muy cercanos y elegir las variantes con una regla suave, no aleatoria. |
| Árboles y rocas tapan las unidades o el anillo de selección. | Alturas máximas de 1.5 casillas y anillo en `y = 0.02` por encima del suelo; revisar desde la cámara al probar. |
| El cambio de geometría de obstáculos rompe el pathfinding. | La huella sigue siendo una casilla; `isBlocked` y `OBSTACLES` no cambian. |
| El `InstancedMesh` complica la selección por clic en el terreno. | El terreno no es seleccionable; los obstáculos no tienen interacción. Si la hay en el futuro, se revisa en su spec. |

## Lo que **no** está en esta spec

- Arte externo, GLTF y sprites.
- Audio.
- Edificios, recursos e IA.
- Efectos de partículas.
- Menús y HUD nuevos.
- Cambios de lógica de juego.
