import { describe, expect, it } from 'vitest';
import { evaluate, matchesPattern, normalizeText } from '../../src/engine/conditions';
import { counterUuid, ManualClock } from '../../src/engine/clock';
import { createInitialState } from '../../src/engine/phone';
import { levelFor, scoreEvaluation } from '../../src/engine/scoring';
import { PaqueteSchema, TaskDefinitionSchema } from '../../src/engine/schema';
import { EvaluationSession, type Participant } from '../../src/engine/session';
import type { Cond } from '../../src/engine/types';
import { EVALUACION_CORTA, T_WIFI } from '../../src/data/sample-evaluation';
import { A, WIFI_RUTA_1 } from './helpers';

const ctx = (over: Partial<Parameters<typeof evaluate>[1]> = {}) => ({
  state: createInitialState({ conectividad: { wifi: true, redWifi: 'Roly-Sucursal' } }),
  visited: new Set(['inicio', 'ajustes']),
  events: new Set(['abrir:ajustes']),
  ...over,
});

describe('condiciones', () => {
  it('igual / contiene / existe', () => {
    expect(evaluate({ estado: 'conectividad.wifi', igual: true }, ctx())).toBe(true);
    expect(evaluate({ estado: 'conectividad.redWifi', contiene: 'ROLY' }, ctx())).toBe(true);
    expect(evaluate({ estado: 'navegador.consulta', existe: false }, ctx())).toBe(true);
    expect(evaluate({ estado: 'navegador.consulta', existe: true }, ctx())).toBe(false);
  });
  it('contiene ignora acentos y mayúsculas', () => {
    const c = ctx({ state: createInitialState({ navegador: { consulta: 'Cómo cambiar una LLANTA' } }) });
    expect(evaluate({ estado: 'navegador.consulta', contiene: 'como cambiar' }, c)).toBe(true);
    expect(normalizeText('  ÁÉÍ ')).toBe('aei');
  });
  it('visito / evento / combinaciones', () => {
    expect(evaluate({ visito: 'ajustes' }, ctx())).toBe(true);
    expect(evaluate({ visito: 'mapas' }, ctx())).toBe(false);
    expect(evaluate({ evento: 'abrir:ajustes' }, ctx())).toBe(true);
    const cond: Cond = { todas: [{ visito: 'ajustes' }, { alguna: [{ visito: 'mapas' }, { no: { visito: 'camara' } }] }] };
    expect(evaluate(cond, ctx())).toBe(true);
  });
  it('comodines en patrones', () => {
    expect(matchesPattern('seleccionar:red:X', 'seleccionar:red:*')).toBe(true);
    expect(matchesPattern('seleccionar:redes', 'seleccionar:red:*')).toBe(false);
    expect(matchesPattern('atras', 'atras')).toBe(true);
  });
});

describe('esquema del paquete de POI', () => {
  it('la evaluación de ejemplo es válida', () => {
    const paquete = {
      version: 'test',
      puestos: [{ id: 1, nombre: 'Vendedor', evaluacionVersionId: 1 }],
      sucursales: [{ id: 4, nombre: 'Puebla Centro' }],
      evaluaciones: [EVALUACION_CORTA],
    };
    expect(PaqueteSchema.safeParse(paquete).success).toBe(true);
  });

  it('rechaza hitos que suman 1 o más', () => {
    const mala = { ...T_WIFI, hitos: [{ id: 'a', peso: 0.6, cuando: { visito: 'x' } }, { id: 'b', peso: 0.5, cuando: { visito: 'y' } }] };
    expect(TaskDefinitionSchema.safeParse(mala).success).toBe(false);
  });

  it('rechaza condiciones mal formadas y límite menor que la referencia', () => {
    expect(TaskDefinitionSchema.safeParse({ ...T_WIFI, exito: { estado: 'x' } }).success).toBe(false);
    expect(TaskDefinitionSchema.safeParse({ ...T_WIFI, tiempoLimiteSeg: 10 }).success).toBe(false);
    expect(TaskDefinitionSchema.safeParse({ ...T_WIFI, rutasValidas: [] }).success).toBe(false);
  });

  it('acepta igual: false y igual: null', () => {
    expect(TaskDefinitionSchema.safeParse({ ...T_WIFI, exito: { estado: 'conectividad.wifi', igual: false } }).success).toBe(true);
    expect(TaskDefinitionSchema.safeParse({ ...T_WIFI, exito: { estado: 'conectividad.redWifi', igual: null } }).success).toBe(true);
  });
});

describe('niveles y puntuación de la evaluación', () => {
  const niveles = EVALUACION_CORTA.niveles;
  it('asigna nivel por umbral', () => {
    expect(levelFor(10, niveles)).toBe('Básico');
    expect(levelFor(60, niveles)).toBe('Intermedio');
    expect(levelFor(99, niveles)).toBe('Avanzado');
  });
  it('promedio ponderado e ignora la práctica', () => {
    const r = scoreEvaluation(
      [
        { peso: 1, practica: true, puntuacion: 0 },
        { peso: 1, practica: false, puntuacion: 100 },
        { peso: 3, practica: false, puntuacion: 60 },
      ],
      niveles,
    );
    expect(r.puntuacion).toBe(70);
    expect(r.nivel).toBe('Intermedio');
  });
});

describe('sesión de evaluación', () => {
  const participant: Participant = { uuid: 'p1', nombre: 'Ana', apellidos: 'Pérez', puestoId: 1, sucursalId: 4, aceptoPrivacidadEn: '2026-10-21T16:00:00.000Z' };
  const make = () => {
    const clock = new ManualClock();
    return { clock, s: new EvaluationSession(EVALUACION_CORTA, participant, { clock, uuid: counterUuid('s') }) };
  };

  it('recorre las tareas en orden y produce los registros para POI', () => {
    const { s, clock } = make();
    expect(s.total).toBe(5);
    expect(s.calificadasTotal).toBe(4);

    // 0 práctica
    let r = s.startTask();
    r.dispatch(A.abrir('ajustes'));
    s.finishTask();
    // 1 abrir navegador
    r = s.startTask();
    r.dispatch(A.abrir('navegador'));
    s.finishTask();
    // 2 buscar llanta: se omite
    r = s.startTask();
    r.skip();
    s.finishTask();
    // 3 buscar handy: se agota el tiempo
    r = s.startTask();
    clock.advance(200_000);
    r.checkTimeout();
    s.finishTask();
    // 4 wifi
    r = s.startTask();
    for (const a of WIFI_RUTA_1) r.dispatch(a);
    s.finishTask();

    expect(s.isFinished).toBe(true);
    expect(s.estado).toBe('terminado');
    const sum = s.summary();
    expect(sum.tareas.map((t) => t.estado)).toEqual(['completada', 'completada', 'omitida', 'tiempo_agotado', 'completada']);
    expect(sum.puntuacion).toBeGreaterThan(0);

    const rec = s.toRecords();
    expect(rec.intentoTareas).toHaveLength(5);
    expect(rec.intento.totalEventos).toBe(rec.eventos.length);
    expect(new Set(rec.eventos.map((e) => e.uuid)).size).toBe(rec.eventos.length);
    expect(rec.intentoTareas.every((t) => t.intentoUuid === rec.intento.uuid)).toBe(true);
  });

  it('no deja iniciar otra tarea con una en curso ni cerrarla antes de tiempo', () => {
    const { s } = make();
    s.startTask();
    expect(() => s.startTask()).toThrow();
    expect(() => s.finishTask()).toThrow();
  });

  it('abandonar marca el intento y la tarea interrumpida', () => {
    const { s } = make();
    const r = s.startTask();
    s.abandon();
    expect(r.estado).toBe('interrumpida');
    expect(s.estado).toBe('abandonado');
  });
});
