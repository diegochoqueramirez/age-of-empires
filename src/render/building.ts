import * as THREE from 'three';

/** Sprites propios de edificaciones. Los archivos están en `public/assets/buildings/`. */
export type BuildingKind = 'church' | 'apartments';

const SPRITE_URLS: Record<BuildingKind, string> = {
  church: '/assets/buildings/church.png',
  apartments: '/assets/buildings/apartments.png',
};

/** Ancho del sprite en unidades de casilla. Un footprint de 3×3 en la proyección 2:1 ocupa unas 4.2 casillas de ancho. */
const SPRITE_WIDTH = 4.2;

const loader = new THREE.TextureLoader();

/**
 * Sprite de una edificación, anclado en la base del centro de su footprint.
 * La textura se carga en segundo plano; mientras tanto el sprite es invisible y luego se escala a su proporción real.
 * Los sprites siempre miran a la cámara, que es ortográfica y fija, así que se ven de pie.
 */
export function buildBuilding(kind: BuildingKind): THREE.Sprite {
  const material = new THREE.SpriteMaterial({ transparent: true, alphaTest: 0.05, opacity: 0 });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0); // el punto de anclaje es la base, en el centro horizontal

  loader.load(SPRITE_URLS[kind], (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.opacity = 1;
    material.needsUpdate = true;
    const aspect = texture.image.height / texture.image.width;
    sprite.scale.set(SPRITE_WIDTH, SPRITE_WIDTH * aspect, 1);
  });

  return sprite;
}
