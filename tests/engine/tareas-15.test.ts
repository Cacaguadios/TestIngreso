import { describe, expect, it } from 'vitest';
import { SAMPLE_EVALUATION } from '../../src/data/sample-evaluation';
import { SAMPLE_PAQUETE } from '../../src/data/sample-package';
import { counterUuid, ManualClock } from '../../src/engine/clock';
import { PaqueteSchema } from '../../src/engine/schema';
import { EvaluationSession } from '../../src/engine/session';
import { makeRunner } from './helpers';

import { open, select, SOLUCIONES, submit, text } from './soluciones';

describe('evaluación de ejemplo: 15 tareas', () => {
  it('tiene 1 práctica y 15 tareas calificadas, y el paquete es válido', () => {
    const s = new EvaluationSession(SAMPLE_EVALUATION, { uuid: 'p', nombre: 'A', apellidos: 'B', puestoId: 1, sucursalId: 4, aceptoPrivacidadEn: 'x' }, { clock: new ManualClock(), uuid: counterUuid('t') });
    expect(s.total).toBe(16);
    expect(s.calificadasTotal).toBe(15);
    expect(PaqueteSchema.safeParse(SAMPLE_PAQUETE).success).toBe(true);
  });

  for (const slot of SAMPLE_EVALUATION.tareas) {
    const t = slot.definicion;
    it(`«${t.titulo}» se completa con su ruta sin errores`, () => {
      const pasos = SOLUCIONES[t.codigo];
      expect(pasos, `falta la solución de ${t.codigo}`).toBeDefined();
      const { runner } = makeRunner(t);
      for (const a of pasos!) runner.dispatch(a);
      expect(runner.estado).toBe('completada');
      const r = runner.getResult();
      expect(r.conteo.error).toBe(0);
      expect(r.conteo.desviacion).toBe(0);
    });
  }

  it('cada tarea con "mostrarme" tiene pistas y no empieza ya resuelta', () => {
    for (const { definicion: t } of SAMPLE_EVALUATION.tareas) {
      const { runner } = makeRunner(t);
      expect(runner.estado).toBe('en_curso');
      expect(t.ayudas.length).toBeGreaterThan(0);
    }
  });
});

describe('tareas: errores típicos', () => {
  const byCode = (c: string) => SAMPLE_EVALUATION.tareas.find((x) => x.definicion.codigo === c)!.definicion;

  it('abrir el catálogo 2025 cuenta como error', () => {
    const { runner } = makeRunner(byCode('archivos.abrir_catalogo'));
    runner.dispatch(open('archivos'));
    expect(runner.dispatch(select('archivo', 'Catalogo_2025.pdf'))?.clase).toBe('error');
    expect(runner.estado).toBe('en_curso');
  });

  it('mandar el mensaje a otra persona no completa la tarea', () => {
    const { runner } = makeRunner(byCode('msg.enviar_carlos'));
    runner.dispatch(open('mensajes'));
    runner.dispatch(select('conversacion', 'Ana López'));
    runner.dispatch(text('mensajes.borrador', 'Ya llegó el pedido'));
    runner.dispatch(submit('mensajes.enviar'));
    expect(runner.estado).toBe('en_curso');
  });

  it('marcar un número equivocado no completa la tarea', () => {
    const { runner } = makeRunner(byCode('tel.marcar_numero'));
    runner.dispatch(open('telefono'));
    runner.dispatch(text('telefono.numero', '800 123 7658'));
    runner.dispatch(submit('telefono.llamar'));
    expect(runner.estado).toBe('en_curso');
    expect(runner.state.pantalla).toBe('telefono.llamada');
    runner.dispatch(submit('telefono.colgar'));
    expect(runner.state.pantalla).toBe('telefono');
  });

  it('vincular otro dispositivo Bluetooth es error', () => {
    const { runner } = makeRunner(byCode('conect.bluetooth_bocina'));
    runner.dispatch(open('ajustes'));
    runner.dispatch(open('ajustes.bluetooth'));
    runner.dispatch({ type: 'toggle', key: 'bluetooth' });
    expect(runner.dispatch(select('bt', 'Audífonos de Luis'))?.clase).toBe('error');
  });

  it('brillo: subir un poco da crédito parcial, pero no completa', () => {
    const { runner } = makeRunner(byCode('pantalla.subir_brillo'));
    runner.dispatch(open('ajustes_rapidos'));
    runner.dispatch({ type: 'slide', key: 'brillo', value: 30 });
    expect(runner.estado).toBe('en_curso');
    expect(runner.getResult().hitos).toEqual(['encontro_brillo', 'subio_algo']);
  });
});
