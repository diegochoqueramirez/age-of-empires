import * as THREE from 'three';
import { PALETTE } from '../render/palette';
import { contactShadow } from '../render/shadows';

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

/** Pasos de balanceo por segundo mientras la unidad camina. */
const BOB_FREQUENCY = 2;
/** Amplitud del balanceo vertical, en casillas. */
const BOB_AMPLITUDE = 0.05;

/**
 * Vista de three.js de las unidades: silueta de cuerpo cónico y cabeza esférica
 * en el color del bando, anillo de selección y proxy de clic.
 */
export class UnitViews {
  readonly pickMeshes: THREE.Mesh[] = [];
  private readonly figures = new Map<number, THREE.Group>();
  private readonly rings = new Map<number, THREE.Mesh>();
  private readonly picks = new Map<number, THREE.Mesh>();
  private readonly shadows = new Map<number, THREE.Mesh>();

  constructor(scene: THREE.Scene, units: Unit[]) {
    const bodyGeometry = new THREE.ConeGeometry(0.3, 0.8, 12);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.player.body });
    const headGeometry = new THREE.SphereGeometry(0.22, 12, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.player.head });
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
      const figure = new THREE.Group();
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.4; // la base del cono queda en el suelo
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 0.95;
      figure.add(body, head);
      scene.add(figure);
      this.figures.set(unit.id, figure);

      const shadow = contactShadow(0.35);
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
    this.sync(units);
  }

  /**
   * Copia posición y selección del estado lógico a la escena.
   * Mientras la unidad tiene camino, la figura oscila verticalmente para parecer que camina.
   */
  sync(units: Unit[], timeSeconds: number = performance.now() / 1000): void {
    for (const unit of units) {
      const figure = this.figures.get(unit.id);
      const ring = this.rings.get(unit.id);
      const pick = this.picks.get(unit.id);
      const shadow = this.shadows.get(unit.id);
      if (!figure || !ring || !pick || !shadow) continue;
      const walking = unit.path.length > 0;
      const bob = walking ? Math.abs(Math.sin(timeSeconds * Math.PI * BOB_FREQUENCY)) * BOB_AMPLITUDE : 0;
      figure.position.x = unit.position.x;
      figure.position.z = unit.position.y;
      figure.position.y = bob;
      shadow.position.x = unit.position.x;
      shadow.position.z = unit.position.y;
      ring.position.x = unit.position.x;
      ring.position.z = unit.position.y;
      ring.visible = unit.selected;
      pick.position.x = unit.position.x;
      pick.position.z = unit.position.y;
    }
  }
}
