import * as THREE from 'three';
import { PALETTE } from './palette';

/**
 * Proyección de la cámara. Con elevación de 30° y giro de 45°, una casilla cuadrada
 * se ve como rombo 2:1 (sin(30°) = 0.5), como en AoE1.
 */
export const CAMERA = {
  /** Ángulo sobre el plano del suelo. */
  elevationDeg: 30,
  /** Giro alrededor del eje Y; alinea los ejes del mapa con las diagonales de pantalla. */
  azimuthDeg: 45,
  /**
   * Altura visible en unidades de casilla. El mapa 40x40 ocupa ~28.3 de alto en pantalla
   * con este ángulo; 34 deja margen alrededor.
   */
  viewSize: 34,
} as const;

const DEG_TO_RAD = Math.PI / 180;
const CAMERA_DISTANCE = 100;
/** Semiancho del área con sombra, en casillas. Cubre el mapa de 40x40 con margen. */
const SHADOW_HALF_EXTENT = 30;

const ELEVATION = CAMERA.elevationDeg * DEG_TO_RAD;
/** Giro en radianes; también usado por camera-controls para orientar WASD. */
export const CAMERA_AZIMUTH = CAMERA.azimuthDeg * DEG_TO_RAD;

/** Vector unitario desde el objetivo hacia la cámara. */
const OFFSET_DIRECTION = new THREE.Vector3(
  Math.sin(CAMERA_AZIMUTH) * Math.cos(ELEVATION),
  Math.sin(ELEVATION),
  Math.cos(CAMERA_AZIMUTH) * Math.cos(ELEVATION),
);

export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  /** Ajusta renderer y frustum al tamaño actual de la ventana. */
  resize(): void;
}

export function createScene(canvas: HTMLCanvasElement): SceneContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  // PCFSoftShadowMap fue retirado en three 0.187; PCFShadowMap es el reemplazo directo.
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.background);

  scene.add(new THREE.AmbientLight(PALETTE.ambient, 0.6));

  // Sol cálido que apunta al centro del mapa, con sombras.
  // El centro del mapa está en (19.5, 0, 19.5), así que el objetivo y la posición se desplazan desde ahí.
  const mapCenterX = 19.5;
  const mapCenterZ = 19.5;
  const sun = new THREE.DirectionalLight(PALETTE.sun, 0.8);
  sun.position.set(mapCenterX + 10, 20, mapCenterZ + 10);
  sun.target.position.set(mapCenterX, 0, mapCenterZ);
  sun.castShadow = true;
  sun.shadow.mapSize.set(PALETTE.shadowMapSize, PALETTE.shadowMapSize);
  sun.shadow.camera.left = -SHADOW_HALF_EXTENT;
  sun.shadow.camera.right = SHADOW_HALF_EXTENT;
  sun.shadow.camera.top = SHADOW_HALF_EXTENT;
  sun.shadow.camera.bottom = -SHADOW_HALF_EXTENT;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(sun.target);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  placeCamera(camera, new THREE.Vector3(0, 0, 0));

  const resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    const halfHeight = CAMERA.viewSize / 2;
    const halfWidth = halfHeight * (width / height);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  return { renderer, scene, camera, resize };
}

/** Coloca la cámara mirando a `target` desde la proyección 2:1. */
export function placeCamera(camera: THREE.OrthographicCamera, target: THREE.Vector3): void {
  camera.position.copy(target).addScaledVector(OFFSET_DIRECTION, CAMERA_DISTANCE);
  camera.lookAt(target);
}
