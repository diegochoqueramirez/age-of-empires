import * as THREE from 'three';
import type { Unit, UnitViews, Vec2 } from './units';

export interface PointerRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Id de la unidad bajo el puntero (raycast contra los proxies de clic), o `null`. */
export function pickUnitAt(
  raycaster: THREE.Raycaster,
  ndc: THREE.Vector2,
  camera: THREE.Camera,
  views: UnitViews,
): number | null {
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(views.pickMeshes, false)[0];
  return hit ? (hit.object.userData.unitId as number) : null;
}

/** Punto del suelo (y = 0) bajo el puntero, en coordenadas de casilla, o `null`. */
export function groundPoint(
  raycaster: THREE.Raycaster,
  ndc: THREE.Vector2,
  camera: THREE.Camera,
): Vec2 | null {
  raycaster.setFromCamera(ndc, camera);
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const point = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(ground, point)) return null;
  return { x: point.x, y: point.z };
}

/** Unidades cuya posición en pantalla cae dentro del rectángulo (coordenadas de ventana). */
export function unitsInScreenRect(
  units: Unit[],
  camera: THREE.Camera,
  rect: PointerRect,
  canvas: HTMLCanvasElement,
): number[] {
  const ids: number[] = [];
  const projected = new THREE.Vector3();
  for (const unit of units) {
    projected.set(unit.position.x, 0.5, unit.position.y).project(camera);
    const screenX = ((projected.x + 1) / 2) * canvas.clientWidth;
    const screenY = ((1 - projected.y) / 2) * canvas.clientHeight;
    if (screenX >= rect.left && screenX <= rect.right && screenY >= rect.top && screenY <= rect.bottom) {
      ids.push(unit.id);
    }
  }
  return ids;
}
