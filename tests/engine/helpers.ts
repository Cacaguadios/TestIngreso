import { counterUuid, ManualClock } from '../../src/engine/clock';
import { TaskRunner } from '../../src/engine/task-runner';
import type { PhoneAction, TaskDefinition } from '../../src/engine/types';

export function makeRunner(task: TaskDefinition) {
  const clock = new ManualClock();
  const runner = new TaskRunner(task, { clock, uuid: counterUuid('u') });
  runner.start();
  return { runner, clock };
}

export const A = {
  abrir: (target: string): PhoneAction => ({ type: 'open', target }),
  toggle: (key: Extract<PhoneAction, { type: 'toggle' }>['key']): PhoneAction => ({ type: 'toggle', key }),
  red: (value: string): PhoneAction => ({ type: 'select', group: 'red', value }),
  clave: (value: string): PhoneAction => ({ type: 'set_text', field: 'wifi.clave', value }),
  conectar: { type: 'submit', field: 'wifi.conectar' } as PhoneAction,
  atras: { type: 'back' } as PhoneAction,
};

/** Camino correcto de la tarea de Wi-Fi (ruta 1). */
export const WIFI_RUTA_1: PhoneAction[] = [
  A.abrir('ajustes'),
  A.abrir('ajustes.red'),
  A.abrir('ajustes.internet'),
  A.toggle('wifi'),
  A.red('Roly-Sucursal'),
  A.clave('roly1234'),
  A.conectar,
];
