import { PALETTE, cssColor } from '../render/palette';

export interface ResourceBarValues {
  wood: number;
  food: number;
  gold: number;
  stone: number;
  population: number;
  populationCap: number;
}

/** Valores de muestra tomados de la referencia. Se sustituyen por el stockpile en la spec 05. */
export const SAMPLE_RESOURCE_BAR: ResourceBarValues = {
  wood: 2715,
  food: 2198,
  gold: 2210,
  stone: 3303,
  population: 46,
  populationCap: 76,
};

type Icon = 'wood' | 'food' | 'gold' | 'stone' | 'population';

const LABELS: Record<Icon, string> = {
  wood: 'Madera',
  food: 'Comida',
  gold: 'Oro',
  stone: 'Piedra',
  population: 'Población',
};

/** Iconos en SVG inline, con colores de la paleta. Es marcado constante, sin datos del usuario. */
const ICONS: Record<Icon, string> = {
  wood: `<svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="1" y="3" width="14" height="4" rx="2" fill="${cssColor(PALETTE.tree.trunk)}"/>
    <rect x="2" y="9" width="12" height="4" rx="2" fill="${cssColor(PALETTE.tree.trunk)}"/>
  </svg>`,
  food: `<svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="11" y="2" width="3" height="5" rx="1" fill="${cssColor(PALETTE.player.head)}"/>
    <ellipse cx="7" cy="9.5" rx="6" ry="4.5" fill="${cssColor(PALETTE.hudFood)}"/>
  </svg>`,
  gold: `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2 12 L4 6 H12 L14 12 Z" fill="${cssColor(PALETTE.hudGold)}"/>
  </svg>`,
  stone: `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 13 L5 5 L10 3 L13 7 L12 13 Z" fill="${cssColor(PALETTE.rock)}"/>
  </svg>`,
  population: `<svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="4.5" r="2.5" fill="${cssColor(PALETTE.player.body)}"/>
    <path d="M3 14 Q3 8 8 8 Q13 8 13 14 Z" fill="${cssColor(PALETTE.player.body)}"/>
  </svg>`,
};

/** Pinta la barra superior dentro de `root`. Los valores son fijos durante la partida. */
export function renderResourceBar(root: HTMLElement, values: ResourceBarValues): void {
  root.replaceChildren(
    createItem('wood', String(values.wood)),
    createItem('food', String(values.food)),
    createItem('gold', String(values.gold)),
    createItem('stone', String(values.stone)),
    createItem('population', `${values.population}/${values.populationCap}`),
  );
}

function createItem(icon: Icon, text: string): HTMLElement {
  const item = document.createElement('div');
  item.className = 'hud-item';
  item.title = LABELS[icon];

  const glyph = document.createElement('span');
  glyph.className = 'hud-icon';
  glyph.innerHTML = ICONS[icon];

  const value = document.createElement('span');
  value.className = 'hud-value';
  value.textContent = text;

  item.append(glyph, value);
  return item;
}
