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
 * Sustituye a las sombras direccionales; el objeto se queda posado en el terreno.
 * Su posición (x, z) la fija quien la crea o la sincroniza.
 */
export function contactShadow(radius: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: getBlobTexture(),
      color: PALETTE.shadowBlob,
      transparent: true,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.01;
  return mesh;
}
