import * as THREE from 'three';

/** Altura visible del mundo en unidades de casilla. */
export const VIEW_HEIGHT = 30;
/** Inclinación de la cámara respecto al suelo: 45°. */
export const CAMERA_PITCH = Math.PI / 4;
/** Rotación de la cámara alrededor del eje Y: 45°, como en la vista isométrica clásica. */
export const CAMERA_YAW = Math.PI / 4;
const CAMERA_DISTANCE = 100;

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

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b1f24);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(10, 20, 10);
  scene.add(sun);

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
