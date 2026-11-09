import * as THREE from 'three';
import { createCameraControls } from './render/camera-controls';
import { createScene } from './render/scene';
import { MAP_SIZE, buildMapMesh, createMap } from './game/map';
import { issueMoveOrder } from './game/commands';
import { groundPoint, pickUnitAt, unitsInScreenRect, type PointerRect } from './game/selection';
import { setSelection, type GameState } from './game/state';
import { UnitViews, advanceUnits, createUnits } from './game/units';
import { createMinimap } from './ui/minimap';
import { applyHudTheme } from './ui/hud-theme';
import { SAMPLE_RESOURCE_BAR, renderResourceBar } from './ui/resource-bar';
import './ui/hud.css';

/** Distancia mínima en píxeles para considerar que el arrastre es una caja de selección. */
const DRAG_THRESHOLD_PX = 4;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const selectionBox = document.getElementById('selection-box') as HTMLDivElement;

const { renderer, scene, camera } = createScene(canvas);
const map = createMap();
scene.add(buildMapMesh(map));

const state: GameState = { map, units: createUnits(), selectedUnitIds: [] };
const views = new UnitViews(scene, state.units);

applyHudTheme();
renderResourceBar(document.getElementById('hud-bar') as HTMLDivElement, SAMPLE_RESOURCE_BAR);
const minimap = createMinimap(document.getElementById('minimap') as HTMLDivElement, map);

// Centro del mapa: la casilla 0 está en x = 0, así que el centro está en (MAP_SIZE - 1) / 2.
const mapCenter = new THREE.Vector3((MAP_SIZE - 1) / 2, 0, (MAP_SIZE - 1) / 2);
const controls = createCameraControls(canvas, camera, mapCenter);

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const toNdc = (clientX: number, clientY: number): THREE.Vector2 =>
  ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);

let drag: { startX: number; startY: number; active: boolean } | null = null;

canvas.addEventListener('contextmenu', (event) => event.preventDefault());

canvas.addEventListener('pointerdown', (event) => {
  if (event.button === 0) {
    drag = { startX: event.clientX, startY: event.clientY, active: false };
  } else if (event.button === 2) {
    const destination = groundPoint(raycaster, toNdc(event.clientX, event.clientY), camera);
    if (destination) issueMoveOrder(state, destination);
  }
});

window.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (!drag.active && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) drag.active = true;
  if (drag.active) {
    const rect = normalizeRect(drag.startX, drag.startY, event.clientX, event.clientY);
    Object.assign(selectionBox.style, {
      display: 'block',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.right - rect.left}px`,
      height: `${rect.bottom - rect.top}px`,
    });
  }
});

window.addEventListener('pointerup', (event) => {
  if (!drag || event.button !== 0) return;
  const finished = drag;
  drag = null;
  selectionBox.style.display = 'none';

  if (finished.active) {
    const rect = normalizeRect(finished.startX, finished.startY, event.clientX, event.clientY);
    setSelection(state, unitsInScreenRect(state.units, camera, rect, canvas));
  } else {
    // Clic simple: selecciona la unidad bajo el puntero o limpia la selección sobre el vacío.
    const unitId = pickUnitAt(raycaster, toNdc(event.clientX, event.clientY), camera, views);
    setSelection(state, unitId === null ? [] : [unitId]);
  }
});

function normalizeRect(x1: number, y1: number, x2: number, y2: number): PointerRect {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
  };
}

let last = performance.now();
function frame(now: number): void {
  // Limita el delta para que una pestaña en segundo plano no dé saltos enormes.
  const delta = Math.min((now - last) / 1000, 0.05);
  last = now;

  controls.update(delta);
  advanceUnits(state.units, delta);
  views.sync(state.units);
  minimap.update(state.units);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
