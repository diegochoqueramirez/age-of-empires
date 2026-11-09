/**
 * Paleta única del juego. Todo color visual sale de aquí; la lógica de juego no la usa.
 */
export const PALETTE = {
  /** Variantes de suelo. Se eligen por casilla con una regla suave (ver grassVariant en map.ts). */
  grass: [0x4d7a3a, 0x528240, 0x477335, 0x5a8a45],
  /** Rocas principales. */
  rock: 0x7a6a55,
  /** Rocas pequeñas, un tono más oscuro. */
  rockStone: 0x6e6659,
  tree: { trunk: 0x5b3d24, crown: 0x2f5e2a },
  /** Bando del jugador. */
  player: { body: 0x2f6bff, head: 0xf2d2b0 },
  /** Anillo de selección y borde de la caja. */
  selection: 0xffe14d,
  /** Fondo fuera del mapa: negro casi puro, el mapa se lee como rombo. */
  background: 0x080a09,
  /** Sol cálido. */
  sun: 0xffe2b3,
  /** Luz ambiental fría-neutra. */
  ambient: 0x8d9aaa,
  /** Resolución del mapa de sombras del sol, en píxeles. Bajarla si cuesta FPS. */
  shadowMapSize: 2048,
} as const;
