import * as THREE from 'three';
import { PALETTE } from '../render/palette';
import { contactShadow } from '../render/shadows';
import { createTerrainTexture, type TerrainKind } from '../render/terrain-texture';

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

/** Tipo de casilla bloqueada. El agua no tiene malla propia: la pinta la textura del suelo. */
export type ObstacleKind = 'tree' | 'rock' | 'water';

interface Area<K> {
  x: number;
  y: number;
  kind: K;
}

/** Rectángulo de casillas del mismo tipo, con origen arriba a la izquierda. */
function area<K>(x: number, y: number, w: number, h: number, kind: K): Array<Area<K>> {
  const result: Array<Area<K>> = [];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      result.push({ x: x + dx, y: y + dy, kind });
    }
  }
  return result;
}

/** Lago en el noroeste: bloquea el paso y se pinta como agua. */
const LAKE = area(9, 12, 3, 2, 'water' as const);

/** Parches de bosque: grupos de 2 a 4 casillas, en lugar de un muro lineal. */
const FOREST = [
  ...area(19, 2, 2, 2, 'tree' as const),
  ...area(20, 7, 2, 2, 'tree' as const),
  ...area(13, 10, 2, 1, 'tree' as const),
  ...area(33, 22, 2, 1, 'tree' as const),
];

/** Bloque de roca en el este, como en la spec 01. */
const ROCKS = area(28, 6, 3, 3, 'rock' as const);

/**
 * Casillas bloqueadas (bosques, rocas y agua). Coordenadas de casilla, origen arriba a la izquierda.
 * Total: 27 casillas, dentro del rango de la spec 01 (3 a 40).
 */
export const OBSTACLES: ReadonlyArray<Area<ObstacleKind>> = [...FOREST, ...ROCKS, ...LAKE];

/**
 * Terreno transitable que no bloquea: caminos y claros de tierra.
 * El agua también aparece aquí para que la textura del suelo la pinte.
 */
export const TERRAIN: ReadonlyArray<Area<TerrainKind>> = [
  ...area(14, 20, 4, 4, 'dirt' as const),
  ...area(18, 23, 8, 2, 'dirt' as const),
  ...LAKE,
];

const obstacleKinds = new Map<string, ObstacleKind>(OBSTACLES.map((o) => [`${o.x},${o.y}`, o.kind]));
const terrainKinds = new Map<string, TerrainKind>(TERRAIN.map((t) => [`${t.x},${t.y}`, t.kind]));

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

/** Tipo visual de una casilla bloqueada. Regla fija por la tabla OBSTACLES; por defecto, roca. */
export function obstacleKind(x: number, y: number): ObstacleKind {
  return obstacleKinds.get(`${x},${y}`) ?? 'rock';
}

/** Tipo de terreno de una casilla. Por defecto, pasto. */
export function terrainAt(x: number, y: number): TerrainKind {
  return terrainKinds.get(`${x},${y}`) ?? 'grass';
}

/**
 * Crea la malla visual del mapa.
 * - Marco oscuro de dos casillas alrededor del mapa.
 * - Suelo: un plano con una textura de píxel que pinta pasto, tierra, agua y transiciones.
 * - Árboles y rocas: una malla por casilla bloqueada, con mancha de contacto debajo.
 * La casilla (x, y) queda centrada en el punto (x, 0, y) del mundo three.js.
 */
export function buildMapMesh(map: GameMap): THREE.Group {
  const group = new THREE.Group();
  const center = (MAP_SIZE - 1) / 2;

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_SIZE + 4, MAP_SIZE + 4),
    new THREE.MeshLambertMaterial({ color: PALETTE.edge }),
  );
  frame.rotation.x = -Math.PI / 2;
  frame.position.set(center, -0.02, center);
  group.add(frame);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE),
    new THREE.MeshLambertMaterial({ map: createTerrainTexture(MAP_SIZE, terrainAt) }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(center, 0, center);
  group.add(ground);

  // Materiales compartidos, geometrías de árbol y roca creadas una sola vez por tipo.
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
      const kind = obstacleKind(tile.x, tile.y);
      if (kind === 'water') continue; // el agua ya está pintada en la textura del suelo
      const mesh =
        kind === 'tree'
          ? buildTree(treeMaterials)
          : buildRock((tile.x * 0.7 + tile.y * 1.3) % (Math.PI * 2), rockMaterials);
      mesh.position.set(tile.x, 0, tile.y);
      group.add(mesh);
      const shadow = contactShadow(kind === 'tree' ? 0.45 : 0.4);
      shadow.position.x = tile.x;
      shadow.position.z = tile.y;
      group.add(shadow);
    }
  }
  return group;
}

/** Malla de un árbol: tronco cilíndrico y copa cónica. Altura total 1.4 casillas. */
function buildTree(materials: { trunk: THREE.Material; crown: THREE.Material }): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 8), materials.trunk);
  trunk.position.y = 0.25;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 8), materials.crown);
  crown.position.y = 0.95;
  group.add(trunk, crown);
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
    group.add(mesh);
  }
  return group;
}
