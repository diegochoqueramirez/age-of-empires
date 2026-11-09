import * as THREE from 'three';
import { PALETTE } from './palette';
import { createLighting } from './lighting';

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
  // Sombras proyectadas por el sol (ver lighting.ts). Los objetos eligen si proyectan o reciben.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.background);

  createLighting(scene);

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
