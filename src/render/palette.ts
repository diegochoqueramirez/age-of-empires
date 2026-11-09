/**
 * Paleta única del juego. Todo color visual sale de aquí; la lógica de juego no la usa.
 */
export const PALETTE = {
  /** Variantes de pasto. Se eligen por zona con una regla suave (ver grassVariant en terrain-texture.ts). */
  /** Pasto medido en `referencias/mapa.webp` (#7e8338) y variantes más claras y oscuras. */
  grass: [0x7e8338, 0x8a8f3e, 0x6f7434, 0x959a4c],
  /** Tierra medida en la referencia (#958a47). */
  dirt: [0x958a47, 0xa0944f, 0x847a3c],
  /** Agua medida en la referencia (#567687) con dos tonos alternos. */
  water: [0x567687, 0x4e6d7e],
  /** Espuma de la referencia (#7da09a). */
  waterHighlight: 0x7da09a,
  /** Franja oscura alrededor del mapa. */
  edge: 0x12140f,
  /** Rocas principales. */
  rock: 0x7a6a55,
  /** Rocas pequeñas, un tono más oscuro. */
  rockStone: 0x6e6659,
  tree: { trunk: 0x5b3d24, crown: 0x3f7a35 },
  /** Bando del jugador. */
  player: { body: 0x2f6bff, head: 0xf2d2b0 },
  /** Anillo de selección y borde de la caja. */
  selection: 0xffe14d,
  /** Fondo negro, sin cielo ni horizonte. */
  background: 0x000000,
  /** Color de las manchas de contacto bajo árboles, rocas y unidades. */
  shadowBlob: 0x000000,
  /** Sol cálido de día, como en la referencia. */
  sun: 0xfff0cc,
  /** Luz ambiental clara y fría-neutra. */
  ambient: 0xb9c6d4,
  /** Marcos del HUD: azul acero y filete dorado. */
  frameBlue: 0x1f2f45,
  frameGold: 0xc9a54a,
  /** Texto del HUD. */
  hudText: 0xffffff,
  /** Puntos de unidades en el minimapa. */
  unitMarker: 0x4a7bd6,
  /** Iconos de comida y oro en la barra de recursos. Madera, piedra y población reusan colores del mapa. */
  hudFood: 0xa83232,
  hudGold: 0xd9a92b,
  /** Colores de las siete edificaciones de `referencias/edificios.jpg`, medidos a ojo y con muestreo. */
  building: {
    wall: 0x8a8a86, // piedra gris
    wallMid: 0x6a6a68, // remates de torre, gris medio
    wallLight: 0xd8ccb0, // muros beige de la casa europea
    wallDark: 0x2d2e2f, // huecos y patios
    roofTerracotta: 0xb5622e,
    roofBrown: 0x8d5828,
    roofBrownMuted: 0x7a4f2c, // conos de los castillos pequeños, menos saturados
    stoneBrown: 0x6e4d2f,
    stoneBrownLight: 0x8a6a4a,
    wood: 0x7a5a3a, // pisos de la pagoda, más claros que el tejado
    woodRoof: 0x2e2016, // tejados oscuros de la pagoda
    stepStone: 0xa89a6e, // piedra arenisca clara de la pirámide
    stepDark: 0x4a4236, // escalera de la pirámide
    magenta: 0x8a3a6a,
    blue: 0x2e4a8a,
    red: 0x8a2a2a,
    door: 0x1e1a16,
    /** Color del filete dorado, usado también por el minimapa. */
    trim: 0xc9a54a,
  },
} as const;

/** Convierte un color hexadecimal de la paleta a cadena CSS, por ejemplo `#c9a54a`. */
export function cssColor(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
