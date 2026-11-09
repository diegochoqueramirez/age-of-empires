import * as THREE from 'three';
import villagerUrl from '../assets/aldeano.png?url';

/** Tamaño de celda plausible en la imagen original, en píxeles (la celda del aldeano ronda 36). */
const MIN_CELL = 8;
const MAX_CELL = 80;

/** Píxeles RGBA de una imagen, con su tamaño. */
interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface VillagerTextures {
  /** Imagen tal cual: el aldeano mira hacia la derecha de la pantalla. */
  normal: THREE.Texture;
  /** Espejo horizontal, para cuando camina hacia la izquierda. */
  mirrored: THREE.Texture;
  /** Tamaño del sprite en píxeles lógicos (una celda de la imagen = un píxel). */
  width: number;
  height: number;
}

/**
 * Carga `aldeano.png`, quita el fondo blanco y el marco rosa, y la reduce a un píxel
 * por celda de pixel-art para que se vea nítida al escalarla.
 */
export async function loadVillagerTextures(url: string = villagerUrl): Promise<VillagerTextures> {
  const image = await loadImage(url);
  const pixels = readPixels(image);
  removeBackground(pixels);
  const box = opaqueBox(pixels);
  const cell = detectCellSize(pixels, box);
  const cols = Math.max(1, Math.round(box.w / cell));
  const rows = Math.max(1, Math.round(box.h / cell));
  const canvas = downsample(pixels, box, cols, rows);
  const normal = pixelTexture(canvas);
  const mirrored = normal.clone();
  mirrored.wrapS = THREE.RepeatWrapping;
  mirrored.repeat.x = -1;
  mirrored.offset.x = 1;
  mirrored.needsUpdate = true;
  return { normal, mirrored, width: cols, height: rows };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen ${url}`));
    image.src = url;
  });
}

function readPixels(image: HTMLImageElement): Pixels {
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
  const ctx = get2d(canvas);
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { width: canvas.width, height: canvas.height, data };
}

/** Blanco de fondo o el marco rosa de la imagen. */
function isBackground(data: Uint8ClampedArray, index: number): boolean {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const white = r > 225 && g > 225 && b > 225;
  const frame = r > 190 && g < 120 && b > 80;
  return white || frame;
}

/**
 * Hace transparente el fondo: solo lo que está conectado con el borde de la imagen,
 * para no borrar blancos interiores de la figura.
 */
function removeBackground(pixels: Pixels): void {
  const { width: w, height: h, data } = pixels;
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];
  const seed = (p: number): void => {
    if (!visited[p] && isBackground(data, p * 4)) {
      visited[p] = 1;
      queue.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (queue.length > 0) {
    const p = queue.pop() as number;
    data[p * 4 + 3] = 0;
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) seed(p - 1);
    if (x < w - 1) seed(p + 1);
    if (y > 0) seed(p - w);
    if (y < h - 1) seed(p + w);
  }
}

/** Rectángulo mínimo que contiene todos los píxeles opacos. */
function opaqueBox(pixels: Pixels): Box {
  const { width: w, height: h, data } = pixels;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('La imagen del aldeano está vacía tras quitar el fondo');
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Tamaño de celda: la longitud de tramo de color igual más frecuente, en horizontal y en vertical.
 * Así se reconoce la malla de píxeles ampliada sin conocerla de antemano.
 */
function detectCellSize(pixels: Pixels, box: Box): number {
  const histogram = new Map<number, number>();
  addRunLengths(pixels, box, true, histogram);
  addRunLengths(pixels, box, false, histogram);
  let best = 1;
  let bestCount = 0;
  for (const [length, count] of histogram) {
    if (count > bestCount || (count === bestCount && length > best)) {
      best = length;
      bestCount = count;
    }
  }
  return best;
}

function addRunLengths(pixels: Pixels, box: Box, horizontal: boolean, histogram: Map<number, number>): void {
  const lines = horizontal ? box.h : box.w;
  const span = horizontal ? box.w : box.h;
  const countRun = (length: number): void => {
    if (length >= MIN_CELL && length <= MAX_CELL) {
      histogram.set(length, (histogram.get(length) ?? 0) + 1);
    }
  };
  for (let line = 0; line < lines; line++) {
    let prev = -1;
    let run = 0;
    for (let k = 0; k < span; k++) {
      const x = horizontal ? box.x + k : box.x + line;
      const y = horizontal ? box.y + line : box.y + k;
      const key = colorKey(pixels, x, y);
      if (key !== -1 && key === prev) {
        run++;
        continue;
      }
      if (prev !== -1) countRun(run);
      prev = key;
      run = key === -1 ? 0 : 1;
    }
    if (prev !== -1) countRun(run);
  }
}

/** Color RGB del píxel como número, o -1 si es transparente. */
function colorKey(pixels: Pixels, x: number, y: number): number {
  const i = (y * pixels.width + x) * 4;
  if (pixels.data[i + 3] === 0) return -1;
  return (pixels.data[i] << 16) | (pixels.data[i + 1] << 8) | pixels.data[i + 2];
}

/** Reduce el recuadro a cols×rows, muestreando el centro de cada celda. */
function downsample(pixels: Pixels, box: Box, cols: number, rows: number): HTMLCanvasElement {
  const canvas = createCanvas(cols, rows);
  const ctx = get2d(canvas);
  const out = ctx.createImageData(cols, rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const sx = box.x + Math.min(box.w - 1, Math.floor(((i + 0.5) * box.w) / cols));
      const sy = box.y + Math.min(box.h - 1, Math.floor(((j + 0.5) * box.h) / rows));
      const src = (sy * pixels.width + sx) * 4;
      const dst = (j * cols + i) * 4;
      out.data[dst] = pixels.data[src];
      out.data[dst + 1] = pixels.data[src + 1];
      out.data[dst + 2] = pixels.data[src + 2];
      out.data[dst + 3] = pixels.data[src + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

/** Textura para sprites de píxeles: sin suavizado ni mipmaps. */
function pixelTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function get2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D no disponible');
  return ctx;
}
