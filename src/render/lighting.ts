import * as THREE from 'three';
import { MAP_SIZE } from '../game/map';
import { PALETTE } from './palette';

/**
 * Elevación del sol sobre el plano del mapa. A 45° las sombras eran tan cortas que quedaban
 * tapadas por la base de cada objeto; a 30° se ven con claridad.
 */
const SUN_ELEVATION_DEG = 30;

/**
 * Dirección desde el centro del mapa hacia el sol: de noroeste a sureste en el plano del mapa.
 * Es constante, así que las sombras no cambian entre recargas.
 */
export const SUN_DIRECTION = (() => {
  const elevation = SUN_ELEVATION_DEG * (Math.PI / 180);
  const horizontal = Math.cos(elevation) * Math.SQRT1_2; // componente en x y en z
  return new THREE.Vector3(-horizontal, Math.sin(elevation), -horizontal).normalize();
})();

/** Resolución del mapa de sombras, en píxeles por lado. */
const SHADOW_MAP_SIZE = 2048;
/** Distancia del sol al centro del mapa. Solo importa para que el mapa quede dentro del frustum. */
const SUN_DISTANCE = 60;
/** Mitad del lado del frustum de sombras, en casillas. Cubre el mapa con margen. */
const SHADOW_HALF_EXTENT = MAP_SIZE / 2 + 4;

/** Centro del mapa en coordenadas de mundo: la casilla 0 está en x = 0. */
const MAP_CENTER = (MAP_SIZE - 1) / 2;

/**
 * Crea la luz ambiente y el sol direccional con sombras, y los añade a `scene`.
 * El sol proyecta sombras; los objetos deciden si proyectan con setCastShadow (shadows.ts).
 */
export function createLighting(scene: THREE.Scene): {
  sun: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
} {
  const ambient = new THREE.AmbientLight(PALETTE.ambient, 2.2);

  const center = new THREE.Vector3(MAP_CENTER, 0, MAP_CENTER);
  const sun = new THREE.DirectionalLight(PALETTE.sun, 4.2);
  sun.position.copy(center).addScaledVector(SUN_DIRECTION, SUN_DISTANCE);
  sun.target.position.copy(center);
  sun.castShadow = true;
  sun.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  const shadowCamera = sun.shadow.camera;
  shadowCamera.left = -SHADOW_HALF_EXTENT;
  shadowCamera.right = SHADOW_HALF_EXTENT;
  shadowCamera.top = SHADOW_HALF_EXTENT;
  shadowCamera.bottom = -SHADOW_HALF_EXTENT;
  shadowCamera.near = 1;
  shadowCamera.far = SUN_DISTANCE * 2;
  shadowCamera.updateProjectionMatrix();
  // Sesgo para evitar el autosombreado de árboles y unidades (sin él, se ven negros con la luz ambiental apagada).
  sun.shadow.bias = -0.002;
  sun.shadow.normalBias = 0.06;
  // Oscuridad de la sombra: 1 = negra. 0.8 la deja visible sin cortar el color del pasto.
  sun.shadow.intensity = 0.8;

  scene.add(ambient, sun, sun.target);
  return { sun, ambient };
}
