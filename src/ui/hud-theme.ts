import { PALETTE, cssColor } from '../render/palette';

/**
 * Publica los colores de los marcos del HUD como variables CSS (ver hud.css).
 * Así los colores salen de la paleta y no se repiten en la hoja de estilos.
 */
export function applyHudTheme(root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--frame-blue', cssColor(PALETTE.frameBlue));
  root.style.setProperty('--frame-gold', cssColor(PALETTE.frameGold));
  root.style.setProperty('--hud-text', cssColor(PALETTE.hudText));
}
