import { MAP_SIZE, isBlocked, inBounds } from './map';
import { findPath } from './pathfinding';
import type { GameState } from './state';
import { endTile, type Unit, type Vec2 } from './units';

const key = (x: number, y: number): string => `${x},${y}`;

/**
 * Orden de movimiento con clic derecho para las unidades seleccionadas.
 * - Si el destino está bloqueado o fuera del mapa, usa la casilla libre más cercana alcanzable.
 * - Dos unidades nunca reciben la misma casilla final.
 * - Las unidades que no se mueven ocupan su casilla final y no se les asigna.
 */
export function issueMoveOrder(state: GameState, destination: Vec2): void {
  const { map } = state;
  const selected = state.units.filter((u) => u.selected);
  if (selected.length === 0) return;

  const target = {
    x: Math.min(Math.max(Math.round(destination.x), 0), MAP_SIZE - 1),
    y: Math.min(Math.max(Math.round(destination.y), 0), MAP_SIZE - 1),
  };

  // Casillas que ya tienen un destino fijo: unidades no ordenadas.
  const reserved = new Set<string>();
  for (const unit of state.units) {
    if (!unit.selected) {
      const end = endTile(unit);
      reserved.add(key(end.x, end.y));
    }
  }

  // Candidatos ordenados por distancia al destino (empate: y, luego x, para ser deterministas).
  const candidates: Vec2[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (!isBlocked(map, x, y)) candidates.push({ x, y });
    }
  }
  const distanceToTarget = (c: Vec2): number => (c.x - target.x) ** 2 + (c.y - target.y) ** 2;
  candidates.sort((a, b) => distanceToTarget(a) - distanceToTarget(b) || a.y - b.y || a.x - b.x);

  // Las unidades más cercanas al destino eligen primero.
  const ordered = [...selected].sort((a, b) => {
    const da = (a.position.x - target.x) ** 2 + (a.position.y - target.y) ** 2;
    const db = (b.position.x - target.x) ** 2 + (b.position.y - target.y) ** 2;
    return da - db || a.id - b.id;
  });

  for (const unit of ordered) {
    assignPath(state, unit, candidates, reserved);
  }
}

function assignPath(
  state: GameState,
  unit: Unit,
  candidates: Vec2[],
  reserved: Set<string>,
): void {
  const from = { x: Math.round(unit.position.x), y: Math.round(unit.position.y) };
  for (const candidate of candidates) {
    if (reserved.has(key(candidate.x, candidate.y))) continue;
    if (!inBounds(state.map, candidate.x, candidate.y)) continue;
    const path = findPath(state.map, from, candidate);
    if (path === null) continue;
    unit.path = path;
    reserved.add(key(candidate.x, candidate.y));
    return;
  }
  // Sin ruta a ninguna casilla libre: la unidad se queda donde está.
  unit.path = [];
}
