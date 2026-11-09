import * as THREE from 'three';
import { PALETTE } from '../render/palette';
import { CAMERA_AZIMUTH } from '../render/scene';
import { loadVillagerTextures, makeShadowTexture, type VillagerTextures } from '../render/sprites';

export interface Vec2 {
  x: number; // posición en casillas, puede ser fraccionaria mientras se mueve
  y: number;
}

export interface Unit {
  id: number;
  position: Vec2; // posición actual, interpolada
  path: Vec2[]; // casillas pendientes, en orden; vacío = quieta
  speed: number; // casillas por segundo
  selected: boolean;
}

/** Velocidad inicial de todas las unidades, en casillas por segundo. */
export const UNIT_SPEED = 3;

/** Posiciones iniciales fijas. Todas son casillas libres y están cerca de la esquina inferior izquierda. */
export const UNIT_START_TILES: ReadonlyArray<Vec2> = [
  { x: 6, y: 30 },
  { x: 7, y: 30 },
  { x: 8, y: 30 },
  { x: 6, y: 31 },
  { x: 7, y: 31 },
];

export function createUnits(): Unit[] {
  return UNIT_START_TILES.map((tile, id) => ({
    id,
    position: { x: tile.x, y: tile.y },
    path: [],
    speed: UNIT_SPEED,
    selected: false,
  }));
}

/** Avanza cada unidad por su camino según el delta de tiempo (en segundos). */
export function advanceUnits(units: Unit[], deltaSeconds: number): void {
  for (const unit of units) {
    let remaining = unit.speed * deltaSeconds; // distancia disponible este frame
    while (remaining > 0 && unit.path.length > 0) {
      const target = unit.path[0];
      const dx = target.x - unit.position.x;
      const dy = target.y - unit.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= remaining) {
        unit.position = { x: target.x, y: target.y };
        unit.path.shift();
        remaining -= distance;
      } else {
        unit.position = {
          x: unit.position.x + (dx / distance) * remaining,
          y: unit.position.y + (dy / distance) * remaining,
        };
        remaining = 0;
      }
    }
  }
}

/** Casilla final de la unidad: la última del camino, o la actual si está quieta. */
export function endTile(unit: Unit): Vec2 {
  if (unit.path.length > 0) return unit.path[unit.path.length - 1];
  return { x: Math.round(unit.position.x), y: Math.round(unit.position.y) };
}

/** Altura del sprite de unidad en el mundo, en casillas. El ancho sale de la proporción de la imagen. */
const UNIT_WORLD_HEIGHT = 1.3;
/** Ciclos de tambaleo por segundo. Un ciclo completo son dos pasos (izquierda y derecha). */
const WADDLE_FREQUENCY = 1.5;
/** Inclinación máxima del tambaleo, en radianes (~10°). */
const WADDLE_TILT = 0.17;
/** Altura del saltito en cada paso, en casillas. */
const HOP_AMPLITUDE = 0.12;

/**
 * Vista de three.js de las unidades: sprite del aldeano (`aldeano.png`) con espejo según
 * hacia dónde camina, tambaleo con saltito al moverse, sombra ovalada bajo los pies,
 * anillo de selección y proxy de clic.
 */
export class UnitViews {
  readonly pickMeshes: THREE.Mesh[] = [];
  private readonly sprites = new Map<number, THREE.Sprite>();
  private readonly shadows = new Map<number, THREE.Mesh>();
  private readonly rings = new Map<number, THREE.Mesh>();
  private readonly picks = new Map<number, THREE.Mesh>();
  /** Si la unidad mira hacia la izquierda de la pantalla. Presentación, no estado de juego. */
  private readonly mirrored = new Map<number, boolean>();
  private textures: VillagerTextures | null = null;

  constructor(scene: THREE.Scene, units: Unit[]) {
    const shadowGeometry = new THREE.PlaneGeometry(1.2, 1.2);
    shadowGeometry.rotateX(-Math.PI / 2);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: makeShadowTexture(),
      color: 0x000000,
      transparent: true,
      opacity: PALETTE.unitSprite.shadowOpacity,
      depthWrite: false,
    });
    const ringGeometry = new THREE.RingGeometry(0.45, 0.6, 32);
    ringGeometry.rotateX(-Math.PI / 2);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.selection });
    // Proxy invisible más grande que la figura: hace más fácil acertar el clic.
    const pickGeometry = new THREE.SphereGeometry(0.6, 12, 8);
    const pickMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    for (const unit of units) {
      // Oculto hasta que cargue la imagen: sin mapa, un SpriteMaterial se vería como un cuadrado blanco.
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ alphaTest: 0.5 }));
      sprite.center.set(0.5, 0); // el punto de anclaje es el suelo, bajo los pies
      sprite.visible = false;
      scene.add(sprite);
      this.sprites.set(unit.id, sprite);
      this.mirrored.set(unit.id, false);

      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      shadow.position.y = 0.01;
      scene.add(shadow);
      this.shadows.set(unit.id, shadow);

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = 0.02;
      ring.visible = false;
      scene.add(ring);
      this.rings.set(unit.id, ring);

      const pick = new THREE.Mesh(pickGeometry, pickMaterial);
      pick.position.y = 0.5;
      pick.userData.unitId = unit.id;
      scene.add(pick);
      this.pickMeshes.push(pick);
      this.picks.set(unit.id, pick);
    }

    loadVillagerTextures()
      .then((textures) => {
        this.textures = textures;
        const spriteWidth = (UNIT_WORLD_HEIGHT * textures.width) / textures.height;
        for (const sprite of this.sprites.values()) {
          sprite.scale.set(spriteWidth, UNIT_WORLD_HEIGHT, 1);
          sprite.visible = true;
        }
      })
      .catch((error: unknown) => console.error(error));

    this.sync(units);
  }

  /**
   * Copia posición, orientación y selección del estado lógico a la escena.
   * Mientras la unidad tiene camino, se tambalea y da un saltito en cada paso.
   */
  sync(units: Unit[], timeSeconds: number = performance.now() / 1000): void {
    for (const unit of units) {
      const sprite = this.sprites.get(unit.id);
      const shadow = this.shadows.get(unit.id);
      const ring = this.rings.get(unit.id);
      const pick = this.picks.get(unit.id);
      if (!sprite || !shadow || !ring || !pick) continue;
      const walking = unit.path.length > 0;

      if (walking) {
        const next = unit.path[0];
        const dx = next.x - unit.position.x;
        const dy = next.y - unit.position.y;
        // Componente horizontal en pantalla del siguiente paso (ejes de la cámara).
        const screenX = dx * Math.cos(CAMERA_AZIMUTH) - dy * Math.sin(CAMERA_AZIMUTH);
        // Si el paso es casi vertical en pantalla, se mantiene la orientación anterior.
        if (Math.abs(screenX) > 0.01) this.mirrored.set(unit.id, screenX > 0);
      }

      if (this.textures) {
        sprite.material.map = this.mirrored.get(unit.id) ? this.textures.mirrored : this.textures.normal;
      }

      // Tambaleo: la inclinación va de un lado al otro; el saltito es máximo al cruzar el centro y cae a 0 en los extremos.
      const phase = timeSeconds * Math.PI * 2 * WADDLE_FREQUENCY;
      sprite.material.rotation = walking ? Math.sin(phase) * WADDLE_TILT : 0;
      const hop = walking ? Math.abs(Math.cos(phase)) * HOP_AMPLITUDE : 0;

      sprite.position.set(unit.position.x, hop, unit.position.y);
      shadow.position.set(unit.position.x, 0.01, unit.position.y);
      ring.position.x = unit.position.x;
      ring.position.z = unit.position.y;
      ring.visible = unit.selected;
      pick.position.x = unit.position.x;
      pick.position.z = unit.position.y;
    }
  }
}
