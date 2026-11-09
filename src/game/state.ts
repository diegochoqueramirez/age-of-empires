import type { GameMap } from './map';
import type { Unit } from './units';

export interface GameState {
  map: GameMap;
  units: Unit[];
  selectedUnitIds: number[];
}

/** Reemplaza la selección actual y sincroniza el flag `selected` de cada unidad. */
export function setSelection(state: GameState, ids: number[]): void {
  const selected = new Set(ids);
  for (const unit of state.units) {
    unit.selected = selected.has(unit.id);
  }
  state.selectedUnitIds = state.units.filter((u) => u.selected).map((u) => u.id);
}
