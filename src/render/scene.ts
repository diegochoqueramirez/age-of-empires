import * as THREE from 'three';
import { PALETTE } from './palette';

/** Altura visible del mundo en unidades de casilla. */
export const VIEW_HEIGHT = 30;
/** Inclinación de la cámara respecto al suelo: 45°. */
export const CAMERA_PITCH = Math.PI / 4;
/** Rotación de la cámara alrededor del eje Y: 45°, como en la vista isométrica clásica. */
export const CAMERA_YAW = Math.PI / 4;
const CAMERA_DISTANCE = 100;
/** Semiancho del área con sombra, en casillas. Cubre el mapa de 40x40 con margen. */
const SHADOW_HALF_EXTENT = 30;

/** Vector unitario desde el objetivo hacia la cámara. */
const OFFSET_DIRECTION = new THREE.Vector3(
  Math.sin(CAMERA_YAW) * Math.cos(CAMERA_PITCH),
  Math.sin(CAMERA_PITCH),
  Math.cos(CAMERA_YAW) * Math.cos(CAMERA_PITCH),
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
    const halfHeight = VIEW_HEIGHT / 2;
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

/** Coloca la cámara mirando a `target` desde la inclinación isométrica. */
export function placeCamera(camera: THREE.OrthographicCamera, target: THREE.Vector3): void {
  camera.position.copy(target).addScaledVector(OFFSET_DIRECTION, CAMERA_DISTANCE);
  camera.lookAt(target);
}
