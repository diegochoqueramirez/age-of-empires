/**
 * Paleta única del juego. Todo color visual sale de aquí; la lógica de juego no la usa.
 */
export const PALETTE = {
  /** Variantes de pasto. Se eligen por zona con una regla suave (ver grassVariant en terrain-texture.ts). */
  grass: [0x4d7a3a, 0x528240, 0x477335, 0x5a8a45],
  /** Tierra de caminos y claros. */
  dirt: [0x8a6a44, 0x7d5f3c, 0x9a7a50],
  /** Agua del lago: dos tonos alternos y un brillo fino. */
  water: [0x2c5a6e, 0x335f73],
  waterHighlight: 0x6a9bb0,
  /** Franja oscura alrededor del mapa. */
  edge: 0x12140f,
  /** Rocas principales. */
  rock: 0x7a6a55,
  /** Rocas pequeñas, un tono más oscuro. */
  rockStone: 0x6e6659,
  tree: { trunk: 0x5b3d24, crown: 0x2f5e2a },
  /** Bando del jugador. */
  player: { body: 0x2f6bff, head: 0xf2d2b0 },
  /** Anillo de selección y borde de la caja. */
  selection: 0xffe14d,
  /** Fondo negro, sin cielo ni horizonte. */
  background: 0x000000,
  /** Color de las manchas de contacto bajo árboles, rocas y unidades. */
  shadowBlob: 0x000000,
  /** Sol cálido. */
  sun: 0xffe2b3,
  /** Luz ambiental fría-neutra. */
  ambient: 0x8d9aaa,
} as const;
