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
    scene.ts                Renderer con mapa de sombras, y cámara ortográfica con proyección isométrica 2:1 (elevación 30°, giro 45°)
    lighting.ts             Luz ambiente y sol direccional con sombras proyectadas (noroeste a sureste, elevación 30°)
    building.ts             Siete edificaciones de la referencia (3×3 casillas cada una), con primitivas
    camera-controls.ts      Desplazamiento de cámara con teclas y bordes de pantalla
    terrain-texture.ts      Textura del suelo en píxel: pasto, tierra, agua y transiciones
    shadows.ts              Manchas de contacto y helpers para marcar mallas que proyectan o reciben sombra
  ui/
    hud.css                 Marcos del HUD: barra de recursos y minimapa en rombo
    hud-theme.ts            Publica los colores de los marcos como variables CSS desde la paleta
    resource-bar.ts         Barra superior con madera, comida, oro, piedra y población (valores fijos)
    minimap.ts              Minimapa en rombo 2:1 abajo a la derecha; solo muestra, no da órdenes
  game/
    map.ts                  Cuadrícula 40x40, terreno, obstáculos (bosques, rocas, agua) y malla del mapa
    units.ts                Unidades, posiciones iniciales, movimiento y vista (sprite del aldeano con tambaleo)
    sprites.ts              Carga de `src/assets/aldeano.png` (quita el fondo y reduce a píxeles)
    cursor.ts               Cursor de mano señalando (`src/assets/cursor-pointer.png`) sobre el canvas
    state.ts                Estado de partida y selección
    selection.ts            Raycast de clic, selección por caja y punto del suelo
    commands.ts             Órdenes de movimiento con clic derecho
    pathfinding.ts          A* de 8 direcciones sin cortar esquinas
```

## Convenciones

- La casilla `(x, y)` está centrada en el punto `(x, 0, y)` del mundo three.js.
- Las unidades se mueven a `speed` casillas por segundo, medidas con el delta de tiempo.
- El sol proyecta sombras de árboles, rocas, unidades y la edificación sobre el terreno. Las manchas de contacto se mantienen bajo cada objeto como punto de apoyo. La textura del suelo se genera en código, sin assets externos.
- Los colores del mapa salen de la referencia `referencias/mapa.webp`, medidos con muestreo de píxeles.
- La barra de recursos y el minimapa muestran datos fijos y no reciben clics de juego.
