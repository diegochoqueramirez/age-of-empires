# Age of Empires — MVP

Prototipo jugable con three.js: un mapa isométrico de 40x40 casillas con obstáculos, 5 unidades y órdenes de movimiento con pathfinding A*.

## Requisitos

- Node.js 20 o superior y npm.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Después abre la URL que muestra Vite (por defecto `http://localhost:5173`).

Otros comandos:

- `npm run build`: comprueba los tipos con `tsc` y genera la versión de producción en `dist/`.
- `npm run preview`: sirve la versión de producción generada.

## Controles

| Acción | Control |
| --- | --- |
| Mover la cámara | `W` arriba, `A` izquierda, `S` abajo, `D` derecha |
| Mover la cámara | Acercar el ratón al borde de la ventana (margen de 20 px) |
| Seleccionar una unidad | Clic izquierdo sobre la unidad (aparece un anillo amarillo) |
| Deseleccionar | Clic izquierdo sobre el vacío |
| Seleccionar varias | Arrastrar con el botón izquierdo sobre el vacío y soltar |
| Mover las unidades seleccionadas | Clic derecho sobre la casilla de destino |

Recargar la página devuelve el juego a su estado inicial; no hay guardado.

## Estructura de carpetas

```
index.html                  Página con el <canvas> a pantalla completa
src/
  main.ts                   Punto de entrada: wiring de entrada y bucle de render
  render/
    palette.ts              Paleta única de colores; todo color visual sale de aquí
    scene.ts                Renderer, luces con sombras y cámara ortográfica con proyección isométrica 2:1 (elevación 30°, giro 45°)
    camera-controls.ts      Desplazamiento de cámara con teclas y bordes de pantalla
  game/
    map.ts                  Cuadrícula 40x40, obstáculos y malla visual del mapa
    units.ts                Unidades, posiciones iniciales, movimiento y vista
    state.ts                Estado de partida y selección
    selection.ts            Raycast de clic, selección por caja y punto del suelo
    commands.ts             Órdenes de movimiento con clic derecho
    pathfinding.ts          A* de 8 direcciones sin cortar esquinas
```

## Convenciones

- La casilla `(x, y)` está centrada en el punto `(x, 0, y)` del mundo three.js.
- Las unidades se mueven a `speed` casillas por segundo, medidas con el delta de tiempo.
