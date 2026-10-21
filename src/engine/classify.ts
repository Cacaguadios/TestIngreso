import type { Clase, TaskDefinition } from './types';
import { matchesAny } from './conditions';

const NAV_KEYS = new Set(['atras', 'inicio', 'recientes', 'toque.vacio']);

export function routeSteps(task: TaskDefinition): string[] {
  return task.rutasValidas.flat();
}

export interface ClassifyInput {
  task: TaskDefinition;
  key: string;
  /** La acción solo navega (abrir, atrás, inicio). */
  navigation: boolean;
  /** Cambió algo del teléfono aparte de la navegación. */
  changed: boolean;
  /** La acción deshizo un hito que ya estaba logrado. */
  undidMilestone: boolean;
}

/**
 * Orden de decisión (el primero que aplica gana):
 * 1. Deshacer un hito logrado → error.
 * 2. Está en alguna ruta válida → necesaria. (Así `seleccionar:red:*` puede ser error y
 *    `seleccionar:red:Roly-Sucursal` necesaria dentro de la misma tarea.)
 * 3. Coincide con `acciones.error` → error.
 * 4. Coincide con `acciones.neutras`, o es solo navegación → exploración.
 * 5. Cambió el teléfono sin relación con la tarea → desviación.
 * 6. Cualquier otra cosa → exploración.
 */
export function classifyAction(i: ClassifyInput): Clase {
  if (i.undidMilestone) return 'error';
  if (matchesAny(i.key, routeSteps(i.task))) return 'necesaria';
  if (matchesAny(i.key, i.task.acciones?.error)) return 'error';
  if (matchesAny(i.key, i.task.acciones?.neutras)) return 'exploracion';
  if (i.navigation || NAV_KEYS.has(i.key)) return 'exploracion';
  if (i.changed) return 'desviacion';
  return 'exploracion';
}
