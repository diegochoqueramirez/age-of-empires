import { PALETTE, cssColor } from '../render/palette';
import { grassVariant, hash2 } from '../render/terrain-texture';
import { MAP_SIZE, obstacleKind, terrainAt, type GameMap } from '../game/map';
import type { Unit } from '../game/units';

/** Píxeles del lienzo por unidad de (x - y) y de (x + y). Dan una proporción de rombo 2:1. */
const SCALE_X = 5;
const SCALE_Y = 2.5;
const WIDTH = 2 * MAP_SIZE * SCALE_X; // 400
const HEIGHT = 2 * MAP_SIZE * SCALE_Y; // 200

const UNIT_RADIUS = 5;

export interface Minimap {
  /** Redibuja solo la capa de unidades. El terreno se dibuja una vez al crear el minimapa. */
  update(units: ReadonlyArray<Unit>): void;
}

/** Proyecta una coordenada de casilla (puede ser fraccionaria) al lienzo del minimapa. */
function project(gx: number, gy: number): { x: number; y: number } {
  return { x: (gx - gy + MAP_SIZE) * SCALE_X, y: (gx + gy + 1) * SCALE_Y };
}

/**
 * Crea el minimapa en forma de rombo dentro de `root`, en la esquina inferior derecha (ver hud.css).
 * El terreno se pinta una vez en un lienzo auxiliar; `update` solo copia el terreno y dibuja las unidades.
 * El minimapa no da órdenes: sus eventos de ratón no llegan al juego.
 */
export function createMinimap(root: HTMLElement, map: GameMap): Minimap {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el contexto 2D del minimapa');

  const base = document.createElement('canvas');
  base.width = WIDTH;
  base.height = HEIGHT;
  const baseCtx = base.getContext('2d');
  if (!baseCtx) throw new Error('No se pudo crear el contexto 2D del terreno del minimapa');
  drawTerrain(baseCtx, map);

  root.replaceChildren(canvas);
  root.addEventListener('pointerdown', (event) => event.stopPropagation());
  root.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  return {
    update(units: ReadonlyArray<Unit>): void {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.drawImage(base, 0, 0);
      for (const unit of units) {
        const point = project(unit.position.x, unit.position.y);
        ctx.beginPath();
        ctx.arc(point.x, point.y, UNIT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = cssColor(PALETTE.unitMarker);
        ctx.fill();
        if (unit.selected) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = cssColor(PALETTE.selection);
          ctx.stroke();
        }
      }
    },
  };
}

/** Pinta cada casilla como un rombo con el mismo color que el suelo, y marca árboles y rocas. */
function drawTerrain(ctx: CanvasRenderingContext2D, map: GameMap): void {
  ctx.fillStyle = cssColor(PALETTE.background);
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const color = cssColor(tileColor(x, y, terrainAt(x, y)));
      drawTileDiamond(ctx, x, y, color);

      const tile = map.tiles[y][x];
      if (!tile.blocked) continue;
      const kind = obstacleKind(x, y);
      if (kind === 'water') continue; // el agua ya está en el color del terreno
      if (kind === 'building') {
        drawTileDiamond(ctx, x, y, cssColor(PALETTE.building.trim));
        continue;
      }
      const center = project(x, y);
      ctx.beginPath();
      ctx.arc(center.x, center.y, kind === 'tree' ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = cssColor(kind === 'tree' ? PALETTE.tree.crown : PALETTE.rock);
      ctx.fill();
    }
  }
}

/** Color de una casilla, con la misma regla de variantes que la textura del suelo. */
function tileColor(x: number, y: number, kind: ReturnType<typeof terrainAt>): number {
  if (kind === 'grass') return PALETTE.grass[grassVariant(x, y)];
  if (kind === 'dirt') {
    const index = Math.min(PALETTE.dirt.length - 1, Math.floor(hash2(x, y) * PALETTE.dirt.length));
    return PALETTE.dirt[index];
  }
  return PALETTE.water[(y >> 2) % 2];
}

function drawTileDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  const corners = [
    project(x - 0.5, y - 0.5),
    project(x + 0.5, y - 0.5),
    project(x + 0.5, y + 0.5),
    project(x - 0.5, y + 0.5),
  ];
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (const corner of corners.slice(1)) ctx.lineTo(corner.x, corner.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Un trazo fino del mismo color tapa las costuras entre rombos vecinos.
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = color;
  ctx.stroke();
}
