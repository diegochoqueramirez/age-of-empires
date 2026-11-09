import pointerUrl from '../assets/cursor-pointer.png?url';

/** Punto activo del cursor (la punta del dedo), en píxeles de `cursor-pointer.png`. */
const POINTER_HOTSPOT = { x: 7, y: 4 };

/** Usa el cursor de mano señalando (de `referencias/cursores 2.jpg`) sobre el elemento dado. */
export function applyPointerCursor(element: HTMLElement): void {
  element.style.cursor = `url("${pointerUrl}") ${POINTER_HOTSPOT.x} ${POINTER_HOTSPOT.y}, auto`;
}
