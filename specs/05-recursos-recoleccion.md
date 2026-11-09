# SPEC 05 — Recursos y recolección

> **Estado:** Implementado
> **Depende de:** [01 — MVP AoE1](./01-mvp-aoe1.md), [02 — Identidad visual](./02-identidad-visual.md), [04 — Mapa visual AoE1](./04-mapa-visual-aoe1.md)
> **Fecha:** 2026-11-09
> **Objetivo:** Introducir el bucle económico básico de AoE1: nodos de recurso en el mapa, aldeanos que recolectan, devuelven la carga al centro urbano y suman al almacén del jugador.

## Por qué existe esta spec

El prototipo tiene movimiento, selección y pathfinding, pero no tiene economía. La recolección es la base de casi todas las mecánicas de AoE1: sin ella no hay edificios, población ni ejército. Esta spec añade la **mecánica**; el aspecto visual de los recursos se resuelve con primitivas, siguiendo la decisión de las specs 01 y 02.

## Principio rector

Las reglas de recolección viven en la capa de lógica (`src/game/`), separadas de la capa de vista (`src/render/` y las vistas de `units.ts`). Los números de balance (capacidad, tasa de recolección, recursos iniciales) están en constantes con nombre, para poder ajustarlos sin tocar la lógica.

## Alcance

**Dentro:**

- Cuatro tipos de recurso: comida, madera, oro y piedra.
- Nodos de recurso fijos en el mapa, colocados de forma determinista y sin solaparse con obstáculos, unidades iniciales ni el centro urbano.
- Un centro urbano fijo en el mapa como único punto de entrega.
- Aldeanos: las 5 unidades iniciales pasan a ser aldeanos. Mantienen el movimiento, la selección y el pathfinding de la spec 01.
- Órdenes de recolección: clic derecho sobre un nodo con aldeanos seleccionados los envía a recolectar.
- Ciclo del aldeano: ir al nodo → recolectar hasta llenar la carga → volver al centro urbano → entregar → repetir.
- Agotamiento de nodos: cuando un nodo llega a 0 desaparece del mapa.
- Búsqueda automática de otro nodo del mismo tipo cuando el actual se agota.
- Contador de recursos del jugador en pantalla (HUD mínimo con cuatro números).
- Recursos iniciales del jugador como constante.

**Fuera de alcance (para specs futuras):**

- Construcción de edificios, incluido el centro urbano como edificio que se entrena (spec 06).
- Población máxima y casas (spec 06).
- Combate y otros tipos de unidad (spec 07).
- Mejoras tecnológicas de recolección, como el hacha o el arado (spec posterior de tecnologías).
- Enemigos y recolección de la IA (spec 10).
- Niebla de guerra sobre los nodos (spec 08).
- Arte, sonido o animaciones de recolección más allá del balanceo existente.

## Reglas de juego

Valores iniciales. Son constantes editables y se revisan al probar.

| Concepto | Valor inicial | Nota |
| --- | --- | --- |
| Carga máxima del aldeano | 10 unidades | Un solo tipo de recurso por viaje. |
| Tasa de recolección | 1 unidad por segundo | Tiempo fijo por unidad recogida. |
| Velocidad del aldeano | 3 casillas por segundo | Igual que `UNIT_SPEED` de la spec 01. |
| Cantidad por nodo | comida 200, madera 300, oro 400, piedra 400 | Agotamiento al llegar a 0. |
| Recursos iniciales del jugador | comida 200, madera 200, oro 0, piedra 0 | Constante en `state.ts`. |
| Número de nodos por tipo | 4 de cada tipo | Colocados en el mapa al crear la partida. |
| Punto de entrega | Centro urbano, 2x2 casillas | Fijo, sin construcción. |

Reglas:

- La entrega solo ocurre al llegar a una casilla adyacente al centro urbano. Sumar recursos antes de entregar está prohibido.
- Si un aldeano recibe la orden de recolectar un nodo y ya lleva otro tipo de recurso, primero entrega la carga y luego va al nodo.
- Si el nodo elegido se agota mientras el aldeano recolecta, busca el nodo más cercano del mismo tipo. Si no queda ninguno, pasa a `idle`.
- Dos aldeanos pueden recolectar del mismo nodo.
- Los nodos bloquean el paso igual que un obstáculo para el pathfinding, para que los aldeanos no los atraviesen. Recolectar exige estar en una casilla adyacente.

## Modelo de datos

Cambios intencionados respecto a la spec 02: `Unit` gana un campo `kind`, y se añaden los tipos de recurso.

```ts
// src/game/resources.ts (nuevo)
export type ResourceKind = 'food' | 'wood' | 'gold' | 'stone';

export interface ResourceNode {
  id: number;
  kind: ResourceKind;
  tile: Vec2;      // casilla del nodo; bloquea el paso
  amount: number;  // unidades restantes; 0 = agotado y se retira
}

export interface Stockpile {
  food: number;
  wood: number;
  gold: number;
  stone: number;
}

// src/game/units.ts (campos nuevos)
export interface Villager extends Unit {
  kind: 'villager';
  carrying: { kind: ResourceKind; amount: number } | null;
  task: 'idle' | 'toNode' | 'gathering' | 'toDropoff';
  targetNodeId: number | null;
}

// src/game/state.ts
export interface GameState {
  map: GameMap;
  units: Unit[];
  selectedUnitIds: number[];
  resources: ResourceNode[];
  dropoff: { x: number; y: number }; // esquina superior izquierda del centro urbano
  stockpile: Stockpile;
}
```

Convenciones:

- La generación de nodos es determinista: misma posición en cada recarga. Se fija en una tabla constante en `resources.ts`, igual que `OBSTACLES`.
- La lógica de recolección no depende de three.js. `resources.ts` y la parte de tareas de `units.ts` deben poder probarse sin escena.
- El tiempo de recolección y de movimiento se mide con el delta de tiempo, no por frame.

## Plan de implementación

Cada paso deja el proyecto ejecutable.

1. **Tipos y constantes.** Crear `src/game/resources.ts` con `ResourceKind`, `ResourceNode`, `Stockpile` y las constantes de la tabla de reglas. Prueba: `npm run build` pasa.
2. **Colocación de nodos.** Añadir la tabla fija de nodos y una función que valida que ninguno cae sobre obstáculo, unidad inicial ni centro urbano. Prueba: la validación pasa con la tabla actual.
3. **Centro urbano y nodos visuales.** Renderizar el centro urbano como bloque de 2x2 y cada nodo con una primitiva de su tipo (bayas, árbol de madera, mina de oro y de piedra). Prueba: se ven los cuatro tipos de nodo y el centro urbano en el mapa.
4. **Aldeanos.** Convertir las 5 unidades iniciales en `Villager` con `task: 'idle'`. Los controles de selección y movimiento de la spec 01 siguen funcionando. Prueba: las 5 unidades se seleccionan y se mueven igual que antes.
5. **Orden de recolección.** En `commands.ts`, clic derecho sobre un nodo asigna `task: 'toNode'` a los aldeanos seleccionados. Prueba: los aldeanos caminan hasta el nodo.
6. **Ciclo de recolección.** Implementar los estados `gathering` → `toDropoff` → entrega → vuelta. Prueba: un aldeano llena su carga, la lleva al centro urbano y el contador sube solo al entregar.
7. **Agotamiento y búsqueda.** Retirar nodos agotados y reasignar al nodo más cercano del mismo tipo. Prueba: con un nodo de 10 de comida, el aldeano pasa a otro nodo de comida al agotarlo.
8. **HUD mínimo.** Mostrar los cuatro recursos del `stockpile` en una franja superior. Prueba: los números coinciden con las entregas.
9. **Revisión final.** Actualizar el README con los controles nuevos (recolección con clic derecho) y la lista de tipos de recurso.

## Criterios de aceptación

- [x] `npm run build` pasa sin errores de tipos.
- [x] La consola del navegador no muestra errores al cargar la página.
- [x] Hay 4 nodos de cada tipo, todos sobre casillas libres y sin solaparse con el centro urbano ni con las posiciones iniciales.
- [x] Las 5 unidades iniciales son aldeanos y mantienen selección, caja, clic derecho y pathfinding de la spec 01.
- [x] Clic derecho sobre un nodo con aldeanos seleccionados los envía a recolectar.
- [x] Un aldeano lleva como máximo 10 unidades de un solo recurso.
- [x] El contador del jugador sube solo al entregar en el centro urbano, nunca al recolectar.
- [x] Un nodo agotado desaparece del mapa.
- [x] Al agotarse un nodo, el aldeano va al nodo más cercano del mismo tipo; si no queda ninguno, se queda quieto.
- [x] Un aldeano con carga de un tipo que recibe orden de otro tipo entrega primero la carga.
- [x] Ningún aldeano atraviesa un nodo ni un obstáculo durante el movimiento.
- [x] Recargar la página devuelve el estado inicial: mismos nodos, mismos recursos y mismas posiciones.

## Decisiones

- **Sí:** cuatro recursos (comida, madera, oro, piedra), como en AoE1. Son el núcleo de la economía.
- **Sí:** carga máxima de 10 y entrega en el centro urbano. Es el ciclo básico del juego original.
- **Sí:** nodos fijos y deterministas en el mapa, en lugar de aleatorios. Mantiene la misma verificación manual que las specs anteriores.
- **Sí:** las 5 unidades iniciales pasan a ser aldeanos. Evita añadir unidades nuevas en esta spec.
- **No:** construcción de edificios. El centro urbano es fijo para aislar la mecánica de recolección. Entra en la spec 06.
- **No:** tecnologías de recolección. Se dejan para una spec de tecnologías.
- **No:** tests automatizados. Se mantiene la decisión de las specs 01 y 02. Dado que esta spec introduce reglas de economía con muchos casos de borde, conviene revisarla si aparecen regresiones.
- **Pendiente de confirmar:** los valores de la tabla de reglas son propuestas iniciales. Se ajustan al probar.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Los nodos bloquean pasillos y dejan a las unidades sin ruta. | Validar en el paso 2 que cada nodo tiene al menos una casilla libre adyacente. |
| Varios aldeanos se amontonan en el mismo nodo y se bloquean. | Aceptado en esta spec; se trata en la spec de movimiento posterior, igual que en la spec 01. |
| El estado de tareas se vuelve difícil de seguir. | Cuatro estados fijos (`idle`, `toNode`, `gathering`, `toDropoff`) y transiciones escritas en un único módulo. |
| El HUD tapa el mapa en pantallas pequeñas. | Franja superior de altura fija y pequeña. |

## Lo que **no** está en esta spec

- Edificios, construcción y población.
- Combate y otros tipos de unidad.
- Tecnologías de recolección.
- IA enemiga.
- Niebla de guerra.
- Arte o sonido propios de la recolección.
