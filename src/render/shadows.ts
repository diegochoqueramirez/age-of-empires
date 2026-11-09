import * as THREE from 'three';
import { PALETTE } from './palette';

let blobTexture: THREE.CanvasTexture | null = null;

/** Degradado radial compartido por todas las manchas de contacto. */
function getBlobTexture(): THREE.CanvasTexture {
  if (blobTexture) return blobTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el contexto 2D para las sombras');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  blobTexture = new THREE.CanvasTexture(canvas);
  return blobTexture;
}

/**
 * Mancha de contacto: un disco translúcido plano sobre el suelo, bajo un objeto.
 * Complementa la sombra proyectada por el sol: marca el punto de apoyo del objeto.
 * Su posición (x, z) la fija quien la crea o la sincroniza.
 * `opacity` escala la mancha; por defecto es suave para no duplicar la sombra proyectada.
 */
export function contactShadow(radius: number, opacity: number = 0.5): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: getBlobTexture(),
      color: PALETTE.shadowBlob,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.01;
  return mesh;
}

/** Marca todas las mallas de `object` (y sus hijos) para que proyecten sombra del sol. */
export function setCastShadow(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = true;
  });
}

/** Marca todas las mallas de `object` (y sus hijos) para que reciban sombra del sol. */
export function setReceiveShadow(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) child.receiveShadow = true;
  });
}
