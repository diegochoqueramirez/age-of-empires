import * as THREE from 'three';

export const MAP_SIZE = 40;

export interface Tile {
  x: number;
  y: number;
  blocked: boolean;
}

export interface GameMap {
  width: number; // MAP_SIZE
  height: number; // MAP_SIZE
  tiles: Tile[][]; // tiles[y][x]
}

/**
 * Casillas bloqueadas. Coordenadas de casilla, origen arriba a la izquierda.
 * Un muro vertical en x = 20 desde el borde superior hasta y = 12 obliga a
 * las unidades a rodearlo por abajo, y un bloque de 3x3 añade un segundo obstáculo.
 */
export const OBSTACLES: ReadonlyArray<{ x: number; y: number }> = [
  { x: 20, y: 0 },
  { x: 20, y: 1 },
  { x: 20, y: 2 },
  { x: 20, y: 3 },
  { x: 20, y: 4 },
  { x: 20, y: 5 },
  { x: 20, y: 6 },
  { x: 20, y: 7 },
  { x: 20, y: 8 },
  { x: 20, y: 9 },
  { x: 20, y: 10 },
  { x: 20, y: 11 },
  { x: 20, y: 12 },
  { x: 28, y: 6 },
  { x: 29, y: 6 },
  { x: 30, y: 6 },
  { x: 28, y: 7 },
  { x: 29, y: 7 },
  { x: 30, y: 7 },
  { x: 28, y: 8 },
  { x: 29, y: 8 },
  { x: 30, y: 8 },
];

export function createMap(): GameMap {
  const tiles: Tile[][] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      row.push({ x, y, blocked: false });
    }
    tiles.push(row);
  }
  for (const { x, y } of OBSTACLES) {
    tiles[y][x].blocked = true;
  }
  return { width: MAP_SIZE, height: MAP_SIZE, tiles };
}

export function inBounds(map: GameMap, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

/** Fuera del mapa cuenta como bloqueado. */
export function isBlocked(map: GameMap, x: number, y: number): boolean {
  return !inBounds(map, x, y) || map.tiles[y][x].blocked;
}

/**
 * Crea la malla visual: un cubo plano por casilla libre y un cubo alto por obstáculo.
 * La casilla (x, y) queda centrada en el punto (x, 0, y) del mundo three.js.
 */
export function buildMapMesh(map: GameMap): THREE.Group {
  const group = new THREE.Group();
  const floorGeometry = new THREE.BoxGeometry(0.98, 0.1, 0.98);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x4d7a3a });
  const obstacleGeometry = new THREE.BoxGeometry(0.98, 1.2, 0.98);
  const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x7a6a55 });

  for (const row of map.tiles) {
    for (const tile of row) {
      if (tile.blocked) {
        const block = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        block.position.set(tile.x, 0.6, tile.y);
        group.add(block);
      } else {
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.set(tile.x, -0.05, tile.y);
        group.add(floor);
      }
    }
  }
  return group;
}
