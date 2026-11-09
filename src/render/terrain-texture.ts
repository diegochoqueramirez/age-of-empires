import * as THREE from 'three';
import { PALETTE } from './palette';

/** Tipos de terreno que se pintan en el suelo. */
export type TerrainKind = 'grass' | 'dirt' | 'water';

/** Píxeles de la textura por casilla. Pocos píxeles = lectura de pixel art. */
const PIXELS_PER_TILE = 16;
/** Anchura, en píxeles, de la franja de transición en cada borde entre tipos distintos. */
const EDGE_DEPTH = 2;

/**
 * Índice de variante de pasto para la casilla (x, y). Función suave y determinista:
 * forma manchas de tonos parecidos en lugar de ruido casilla a casilla.
 */
export function grassVariant(x: number, y: number): number {
  const noise = Math.sin(x * 0.45) + Math.cos(y * 0.37) + Math.sin((x + y) * 0.21); // en [-3, 3]
  const t = (noise + 3) / 6; // en [0, 1]
  return Math.min(PALETTE.grass.length - 1, Math.floor(t * PALETTE.grass.length));
}

/** Hash determinista de dos enteros, en el intervalo [0, 1). Misma entrada, misma salida. */
export function hash2(a: number, b: number): number {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

type Rgb = [number, number, number];

function toRgb(hex: number): Rgb {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function shade(color: Rgb, amount: number): Rgb {
  return color.map((c) => Math.min(255, Math.max(0, c + amount))) as Rgb;
}

/**
 * Textura del suelo en píxel, generada en código.
 * Cada casilla ocupa PIXELS_PER_TILE píxeles. Los bordes entre tipos distintos se
 * mezclan con una franja irregular: ambos lados usan la misma máscara, así que la
 * transición es continua aunque cada casilla se pinte por separado.
 */
export function createTerrainTexture(
  mapSize: number,
  kindAt: (x: number, y: number) => TerrainKind,
): THREE.CanvasTexture {
  const P = PIXELS_PER_TILE;
  const D = EDGE_DEPTH;
  const size = mapSize * P;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el contexto 2D para la textura del terreno');
  const image = ctx.createImageData(size, size);
  const data = image.data;

  /** Si el píxel global (gx, gy) cae en una franja de transición, devuelve el tipo del vecino. */
  const pixelKind = (gx: number, gy: number, tx: number, ty: number, base: TerrainKind): TerrainKind => {
    const lx = gx - tx * P;
    const ly = gy - ty * P;
    // Identificador de cada frontera: el mismo para los dos lados, así la máscara es simétrica.
    const candidates: Array<{ nx: number; ny: number; boundary: number; along: number }> = [];
    if (lx < D) candidates.push({ nx: tx - 1, ny: ty, boundary: tx * P * 2, along: gy });
    if (lx >= P - D) candidates.push({ nx: tx + 1, ny: ty, boundary: (tx + 1) * P * 2, along: gy });
    if (ly < D) candidates.push({ nx: tx, ny: ty - 1, boundary: ty * P * 2 + 1, along: gx });
    if (ly >= P - D) candidates.push({ nx: tx, ny: ty + 1, boundary: (ty + 1) * P * 2 + 1, along: gx });

    for (const c of candidates) {
      if (c.nx < 0 || c.ny < 0 || c.nx >= mapSize || c.ny >= mapSize) continue;
      const other = kindAt(c.nx, c.ny);
      if (other !== base && hash2(c.boundary, c.along) < 0.5) return other;
    }
    return base;
  };

  const colorOf = (kind: TerrainKind, gx: number, gy: number, tx: number, ty: number): Rgb => {
    const h = hash2(gx, gy);
    if (kind === 'grass') {
      const base = toRgb(PALETTE.grass[grassVariant(tx, ty)]);
      if (h < 0.06) return shade(base, 18); // mota clara
      if (h > 0.94) return shade(base, -18); // mota oscura
      return base;
    }
    if (kind === 'dirt') {
      const base = toRgb(PALETTE.dirt[Math.min(PALETTE.dirt.length - 1, Math.floor(h * PALETTE.dirt.length))]);
      return h > 0.9 ? shade(base, -22) : base;
    }
    // Agua: dos tonos en franjas horizontales y un brillo fino.
    const base = toRgb(PALETTE.water[(gy >> 2) % 2]);
    return (gy % 6 === 2 && h < 0.5) ? toRgb(PALETTE.waterHighlight) : base;
  };

  for (let gy = 0; gy < size; gy++) {
    for (let gx = 0; gx < size; gx++) {
      const tx = Math.floor(gx / P);
      const ty = Math.floor(gy / P);
      const base = kindAt(tx, ty);
      const kind = pixelKind(gx, gy, tx, ty, base);
      const [r, g, b] = colorOf(kind, gx, gy, tx, ty);
      const i = (gy * size + gx) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
