import { type GameMap, inBounds, isBlocked } from './map';
import type { Vec2 } from './units';

const SQRT2 = Math.SQRT2;

// 8 direcciones: [dx, dy, coste]
const DIRECTIONS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
];

/** Heurística octile: exacta para 8 direcciones con coste diagonal √2. */
function octile(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
}

/**
 * A* en cuadrícula de 8 direcciones. No corta esquinas: una diagonal solo
 * se permite si ambas casillas ortogonales vecinas están libres.
 * Devuelve las casillas del camino sin incluir `start`, o `null` si no hay ruta.
 * Si `start` y `goal` coinciden devuelve `[]`.
 */
export function findPath(map: GameMap, start: Vec2, goal: Vec2): Vec2[] | null {
  const sx = Math.round(start.x);
  const sy = Math.round(start.y);
  const gx = Math.round(goal.x);
  const gy = Math.round(goal.y);

  if (!inBounds(map, gx, gy) || isBlocked(map, gx, gy)) return null;
  if (sx === gx && sy === gy) return [];

  const width = map.width;
  const index = (x: number, y: number): number => y * width + x;
  const total = map.width * map.height;
  const gScore = new Float64Array(total).fill(Infinity);
  const parent = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const open: number[] = [];

  const startIndex = index(sx, sy);
  gScore[startIndex] = 0;
  open.push(startIndex);

  while (open.length > 0) {
    // Nodo abierto con menor f = g + h (cuadrícula pequeña, búsqueda lineal basta).
    let bestPos = 0;
    let bestF = Infinity;
    for (let i = 0; i < open.length; i++) {
      const n = open[i];
      const f = gScore[n] + octile(n % width, Math.floor(n / width), gx, gy);
      if (f < bestF) {
        bestF = f;
        bestPos = i;
      }
    }
    const current = open[bestPos];
    open[bestPos] = open[open.length - 1];
    open.pop();

    if (current === index(gx, gy)) {
      return reconstruct(parent, current, startIndex, width);
    }
    closed[current] = 1;

    const cx = current % width;
    const cy = Math.floor(current / width);
    for (const [dx, dy, cost] of DIRECTIONS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (isBlocked(map, nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (isBlocked(map, cx + dx, cy) || isBlocked(map, cx, cy + dy))) {
        continue; // no cortar esquinas de obstáculos
      }
      const n = index(nx, ny);
      if (closed[n]) continue;
      const tentative = gScore[current] + cost;
      if (tentative < gScore[n]) {
        gScore[n] = tentative;
        parent[n] = current;
        if (!open.includes(n)) open.push(n);
      }
    }
  }
  return null;
}

function reconstruct(parent: Int32Array, goalIndex: number, startIndex: number, width: number): Vec2[] {
  const path: Vec2[] = [];
  let node = goalIndex;
  while (node !== startIndex) {
    path.push({ x: node % width, y: Math.floor(node / width) });
    node = parent[node];
  }
  return path.reverse();
}
