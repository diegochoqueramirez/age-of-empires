import * as THREE from 'three';
import { MAP_SIZE } from '../game/map';
import { CAMERA_YAW, placeCamera } from './scene';

/** Distancia en píxeles al borde de la ventana que activa el desplazamiento. Ajustable al probar. */
export const EDGE_MARGIN_PX = 20;
/** Velocidad de desplazamiento de la cámara, en casillas por segundo. */
export const PAN_SPEED = 12;

// Los límites son los bordes del mapa: la casilla 0 está centrada en x = 0.
const MIN_COORD = -0.5;
const MAX_COORD = MAP_SIZE - 0.5;

// Direcciones en el plano del suelo según la rotación de la cámara.
const FORWARD = new THREE.Vector3(-Math.sin(CAMERA_YAW), 0, -Math.cos(CAMERA_YAW));
const RIGHT = new THREE.Vector3(Math.cos(CAMERA_YAW), 0, -Math.sin(CAMERA_YAW));

export interface CameraControls {
  /** Punto del suelo al que mira la cámara. */
  readonly target: THREE.Vector3;
  update(deltaSeconds: number): void;
}

export function createCameraControls(
  canvas: HTMLCanvasElement,
  camera: THREE.OrthographicCamera,
  initialTarget: THREE.Vector3,
): CameraControls {
  const target = initialTarget.clone();
  const keys = new Set<string>();
  let pointer: { x: number; y: number } | null = null;

  window.addEventListener('keydown', (event) => keys.add(event.code));
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());
  canvas.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerleave', () => {
    pointer = null;
  });

  const controls: CameraControls = {
    target,
    update(deltaSeconds: number): void {
      const pan = new THREE.Vector3();

      if (keys.has('KeyW')) pan.add(FORWARD);
      if (keys.has('KeyS')) pan.sub(FORWARD);
      if (keys.has('KeyD')) pan.add(RIGHT);
      if (keys.has('KeyA')) pan.sub(RIGHT);

      if (pointer) {
        const { innerWidth: width, innerHeight: height } = window;
        if (pointer.y < EDGE_MARGIN_PX) pan.add(FORWARD);
        if (pointer.y > height - EDGE_MARGIN_PX) pan.sub(FORWARD);
        if (pointer.x > width - EDGE_MARGIN_PX) pan.add(RIGHT);
        if (pointer.x < EDGE_MARGIN_PX) pan.sub(RIGHT);
      }

      if (pan.lengthSq() > 0) {
        pan.normalize().multiplyScalar(PAN_SPEED * deltaSeconds);
        target.add(pan);
      }
      target.x = THREE.MathUtils.clamp(target.x, MIN_COORD, MAX_COORD);
      target.z = THREE.MathUtils.clamp(target.z, MIN_COORD, MAX_COORD);
      placeCamera(camera, target);
    },
  };
  placeCamera(camera, target);
  return controls;
}
