import * as THREE from 'three';
import { PALETTE } from '../render/palette';

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

/** Columna del muro que se dibuja como bosque; el resto de obstáculos son rocas. */
const TREE_WALL_COLUMN = 20;

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

/** Tipo visual de un obstáculo. Regla fija por coordenadas: el muro es bosque, el bloque es roca. */
export function obstacleKind(x: number): 'tree' | 'rock' {
  return x === TREE_WALL_COLUMN ? 'tree' : 'rock';
}

/**
 * Índice de variante de suelo para la casilla (x, y). Función suave y determinista:
 * forma manchas de tonos parecidos en lugar de ruido casilla a casilla.
 */
export function grassVariant(x: number, y: number): number {
  const noise = Math.sin(x * 0.45) + Math.cos(y * 0.37) + Math.sin((x + y) * 0.21); // en [-3, 3]
  const t = (noise + 3) / 6; // en [0, 1]
  return Math.min(PALETTE.grass.length - 1, Math.floor(t * PALETTE.grass.length));
}

/** Malla de un árbol: tronco cilíndrico y copa cónica. Altura total 1.4 casillas. */
function buildTree(materials: { trunk: THREE.Material; crown: THREE.Material }): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 8), materials.trunk);
  trunk.position.y = 0.25;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 8), materials.crown);
  crown.position.y = 0.95;
  for (const mesh of [trunk, crown]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

/** Malla de una roca: tres dodecaedros agrupados. Altura máxima cerca de 0.6 casillas. */
function buildRock(
  rotation: number,
  materials: { rock: THREE.Material; stone: THREE.Material },
): THREE.Group {
  const group = new THREE.Group();
  const parts: Array<{ radius: number; x: number; y: number; z: number; material: THREE.Material }> = [
    { radius: 0.32, x: 0, y: 0.28, z: 0, material: materials.rock },
    { radius: 0.18, x: 0.2, y: 0.12, z: -0.14, material: materials.stone },
    { radius: 0.14, x: -0.22, y: 0.1, z: 0.12, material: materials.stone },
  ];
  for (const part of parts) {
    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(part.radius, 0), part.material);
    mesh.position.set(part.x, part.y, part.z);
    mesh.rotation.y = rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

/**
 * Crea la malla visual del mapa.
 * - Suelo: un InstancedMesh con una instancia por casilla libre, coloreada por variante.
 * - Obstáculos: un árbol o una roca por casilla bloqueada.
 * La casilla (x, y) queda centrada en el punto (x, 0, y) del mundo three.js.
 */
export function buildMapMesh(map: GameMap): THREE.Group {
  const group = new THREE.Group();

  // Suelo: cuenta primero las casillas libres para dimensionar el InstancedMesh.
  const freeTiles = map.tiles.flat().filter((tile) => !tile.blocked);
  const floorGeometry = new THREE.BoxGeometry(0.98, 0.1, 0.98);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const floors = new THREE.InstancedMesh(floorGeometry, floorMaterial, freeTiles.length);
  floors.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  freeTiles.forEach((tile, index) => {
    matrix.makeTranslation(tile.x, -0.05, tile.y);
    floors.setMatrixAt(index, matrix);
    floors.setColorAt(index, new THREE.Color(PALETTE.grass[grassVariant(tile.x, tile.y)]));
  });
  floors.instanceMatrix.needsUpdate = true;
  if (floors.instanceColor) floors.instanceColor.needsUpdate = true;
  group.add(floors);

  // Obstáculos: materiales compartidos, geometrías de árbol y roca creadas una sola vez por tipo.
  const treeMaterials = {
    trunk: new THREE.MeshLambertMaterial({ color: PALETTE.tree.trunk }),
    crown: new THREE.MeshLambertMaterial({ color: PALETTE.tree.crown }),
  };
  const rockMaterials = {
    rock: new THREE.MeshLambertMaterial({ color: PALETTE.rock }),
    stone: new THREE.MeshLambertMaterial({ color: PALETTE.rockStone }),
  };

  for (const row of map.tiles) {
    for (const tile of row) {
      if (!tile.blocked) continue;
      const kind = obstacleKind(tile.x);
      const mesh =
        kind === 'tree'
          ? buildTree(treeMaterials)
          : buildRock((tile.x * 0.7 + tile.y * 1.3) % (Math.PI * 2), rockMaterials);
      mesh.position.set(tile.x, 0, tile.y);
      group.add(mesh);
    }
  }
  return group;
}
