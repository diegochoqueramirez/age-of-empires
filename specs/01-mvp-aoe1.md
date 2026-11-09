# SPEC 01 — MVP de juego estilo Age of Empires 1

> **Estado:** Aprobado
> **Depende de:** ninguna (primera spec del proyecto)
> **Fecha:** 2026-11-08
> **Objetivo:** Crear un prototipo jugable con three.js donde el jugador selecciona y mueve unidades sobre un mapa isométrico con obstáculos.

## Por qué existe esta spec

El proyecto está vacío. Este MVP fija la base técnica (Vite, TypeScript, three.js) y el bucle mínimo de juego (ver, seleccionar, mover). Las mecánicas más grandes (recursos, edificios, IA) se iteran después sobre esta base.

## Alcance

**Dentro:**

- Proyecto Vite + TypeScript con three.js como dependencia.
- Escena 3D con cámara ortográfica isométrica a 45°.
- Mapa fijo de 40x40 casillas con obstáculos definidos en código.
- Visuales hechos con primitivas de three.js (cubos, cilindros), sin assets externos.
- 5 unidades del mismo tipo al inicio, controladas por el jugador.
- Cámara con teclas W/A/S/D y desplazamiento al acercar el ratón al borde de la pantalla.
- Selección con clic izquierdo y con caja de selección arrastrando.
- Órdenes de movimiento con clic derecho.
- Pathfinding A* en cuadrícula que rodea obstáculos.
- Movimiento animado y continuo entre casillas.
- README con los comandos para instalar, ejecutar y los controles.

**Fuera de alcance (para specs futuras):**

- Recursos, recolección y economía.
- Edificios y construcción.
- Enemigos, IA y cualquier oponente.
- Multijugador y red.
- Guardado o persistencia de partidas (localStorage, archivos, etc.).
- Zoom de cámara con la rueda del ratón.
- Mapas generados de forma procedural o varios mapas.
- Modelos GLTF, sprites o arte externo.
- Menús, pantalla de inicio, audio, HUD más allá de lo listado.
- Tests automatizados (ver decisiones).
- Varios tipos de unidad.

## Modelo de datos

Estructuras propuestas. Las coordenadas de casilla son enteras, con origen en la esquina superior izquierda del mapa (`x` crece a la derecha, `y` crece hacia abajo en el mapa lógico).

```ts
// src/game/map.ts
export const MAP_SIZE = 40;

export interface Tile {
  x: number;
  y: number;
  blocked: boolean;
}

export interface GameMap {
  width: number;   // MAP_SIZE
  height: number;  // MAP_SIZE
  tiles: Tile[][]; // tiles[y][x]
}

// src/game/units.ts
export interface Vec2 {
  x: number; // posición en casillas, puede ser fraccionaria mientras se mueve
  y: number;
}

export interface Unit {
  id: number;
  position: Vec2;       // posición actual, interpolada
  path: Vec2[];         // casillas pendientes, en orden; vacío = quieta
  speed: number;        // casillas por segundo, valor inicial 3
  selected: boolean;
}

// src/game/state.ts
export interface GameState {
  map: GameMap;
  units: Unit[];
  selectedUnitIds: number[];
}
```

Convenciones:

- Mundo three.js: `x` de three = `x` de la casilla; `z` de three = `y` de la casilla; el suelo está en `y = 0`.
- Velocidad en casillas por segundo, medida con el delta de tiempo del bucle (no por frame).
- Los obstáculos son un array constante en `map.ts` con coordenadas explícitas. Mínimo 3 bloques y máximo 40 casillas bloqueadas en total.
- Posiciones iniciales de las 5 unidades: casillas fijas en `units.ts`, todas libres.

No se introduce ninguna estructura de persistencia.

## Plan de implementación

Cada paso deja el proyecto ejecutable.

1. **Scaffold.** Crear el proyecto con Vite + TypeScript, instalar `three` y `@types/three`, y dejar `index.html` con un `<canvas>` a pantalla completa. Prueba: `npm run dev` abre una página sin errores en consola.
2. **Escena y cámara isométrica.** Crear `src/render/scene.ts` con renderer, luz ambiental y direccional, y una `OrthographicCamera` situada a 45° mirando al centro del mapa. Prueba: se ve un plano de color de fondo que llena la ventana.
3. **Mapa visual.** Crear `src/game/map.ts` con la cuadrícula 40x40 y los obstáculos. Renderizar cada casilla como un cubo plano y cada obstáculo como un cubo alto de otro color. Prueba: se ve el mapa completo con los obstáculos.
4. **Control de cámara.** Crear `src/render/camera-controls.ts` con W/A/S/D y desplazamiento por borde de pantalla (margen de 20 px). El centro de la cámara se limita al mapa. Prueba: cada tecla mueve la vista en su dirección y el borde desplaza la vista.
5. **Unidades visuales.** Crear `src/game/units.ts` con 5 cilindros azules en las posiciones iniciales y renderizarlos en el bucle. Prueba: se ven 5 unidades sobre casillas libres.
6. **Selección por clic.** Crear `src/game/selection.ts` con raycast del clic izquierdo sobre las unidades. Seleccionar una unidad la marca con un anillo visible. Clic sobre el vacío limpia la selección. Prueba: se puede seleccionar y deseleccionar una unidad.
7. **Caja de selección.** Dibujar un rectángulo mientras se arrastra con el botón izquierdo sobre el vacío. Al soltar, seleccionar las unidades cuya posición en pantalla cae dentro del rectángulo. Prueba: arrastrar sobre varias unidades las selecciona todas.
8. **Pathfinding A*.** Crear `src/game/pathfinding.ts` con la función pura `findPath(map, start, goal): Vec2[] | null`. Usa 8 direcciones y no corta esquinas de obstáculos. Devuelve `null` si no hay ruta. Prueba: la función devuelve ruta sin pasar por casillas bloqueadas (verificable en consola con un caso fijo).
9. **Órdenes de movimiento.** Crear `src/game/commands.ts` con el clic derecho: calcula la ruta de cada unidad seleccionada al destino. Si el destino está bloqueado, usa la casilla libre más cercana. Si dos unidades caerían en la misma casilla, asigna casillas libres distintas. Prueba: clic derecho mueve las unidades y ninguna acaba en una casilla bloqueada.
10. **Movimiento animado.** En cada frame, avanzar cada unidad a lo largo de su `path` a `speed` casillas por segundo, interpolando la posición. Al llegar a la última casilla, `path` queda vacío. Prueba: el movimiento es continuo y se detiene en el destino.
11. **Documentación de ejecución.** Escribir `README.md` con `npm install`, `npm run dev`, la lista de controles y la estructura de carpetas. Prueba: seguir el README desde cero arranca el juego.

## Criterios de aceptación

- [ ] `npm install` y `npm run dev` arrancan sin errores.
- [ ] La consola del navegador no muestra errores al cargar la página.
- [ ] La cámara es `OrthographicCamera` con una inclinación de 45°.
- [ ] Se ve la cuadrícula completa de 40x40 casillas.
- [ ] Hay al menos 3 casillas bloqueadas visibles como obstáculos.
- [ ] Al empezar hay exactamente 5 unidades, todas sobre casillas libres.
- [ ] W, A, S y D mueven la cámara hacia arriba, izquierda, abajo y derecha.
- [ ] Acercar el ratón al borde de la pantalla desplaza la cámara.
- [ ] El centro de la cámara no puede salir del mapa.
- [ ] Clic izquierdo sobre una unidad la selecciona y muestra un anillo visible.
- [ ] Clic izquierdo sobre el vacío quita la selección.
- [ ] Arrastrar con el botón izquierdo dibuja un rectángulo visible.
- [ ] Al soltar la caja, quedan seleccionadas exactamente las unidades dentro del rectángulo.
- [ ] Clic derecho con unidades seleccionadas las manda a la casilla indicada.
- [ ] Una unidad rodea un obstáculo que está entre ella y el destino, en lugar de atravesarlo.
- [ ] Ninguna unidad entra en una casilla bloqueada durante el movimiento.
- [ ] Si el destino está bloqueado, la unidad se detiene en la casilla libre más cercana.
- [ ] Dos unidades nunca terminan en la misma casilla.
- [ ] Clic derecho sin unidades seleccionadas no mueve nada.
- [ ] El movimiento se ve continuo, sin saltos de casilla en casilla.
- [ ] Recargar la página devuelve el juego a su estado inicial.

## Decisiones

- **Sí:** Vite + TypeScript + three.js. Build rápido y tipos para iterar sin romper el juego.
- **No:** Vite + JavaScript. Menos seguridad al crecer el código.
- **No:** three.js desde CDN en un solo HTML. Se vuelve incómodo al crecer en varios archivos.
- **Sí:** primitivas de three.js para unidades y terreno. No hay arte todavía y evita dependencias de assets.
- **No:** modelos GLTF y sprites. Requieren arte que no existe en esta fase.
- **Sí:** cámara ortográfica isométrica a 45°, como en AoE1. Hace la selección y la lectura del mapa simples.
- **No:** perspectiva libre. Complica la selección y la proyección de la caja.
- **No:** vista cenital 2D. Pierde el aspecto de 3D.
- **Sí:** mapa fijo de 40x40 con obstáculos en código. Predecible para probar pathfinding.
- **No:** mapa procedural. Añade superficie de bugs antes de tener el juego base.
- **Sí:** A* en cuadrícula con 8 direcciones. Rodea obstáculos sin quedarse atascado.
- **No:** movimiento en línea recta. Las unidades se pegan a los obstáculos.
- **No:** flow field. Es más de lo que un mapa de 40x40 y 5 unidades necesita.
- **Sí:** 5 unidades de un solo tipo. Basta para probar selección de grupo y movimiento.
- **Sí:** controles estilo AoE: clic, caja de selección, clic derecho para mover, y desplazamiento de cámara por borde.
- **Sí:** verificación solo manual, según la decisión del usuario. Sin tests automatizados en este MVP. Es una decisión que puede revisarse en una spec posterior si el pathfinding empieza a dar regresiones.
- **No:** persistencia de partida. Decisión cerrada en esta fase.
- **No:** IA y multijugador en esta spec. Cada uno merece su propia spec.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El desplazamiento por borde resulta molesto o se activa sin querer. | Margen de 20 px como constante con nombre en `camera-controls.ts`, fácil de ajustar al probar. |
| El raycast falla sobre primitivas pequeñas o en los bordes de casilla. | Usar un radio de selección mayor que el cilindro visual. |
| Dos unidades se bloquean mutuamente en un pasillo estrecho. | El MVP acepta que se detengan sin resolver el atasco; se trata en una spec de movimiento posterior. |

## Lo que **no** está en esta spec

- Recursos, edificios, enemigos e IA.
- Multijugador.
- Guardado de partida.
- Zoom de cámara.
- Mapas procedurales o varios mapas.
- Tests automatizados.

Cada una de estas, si entra, va en su propia spec.
