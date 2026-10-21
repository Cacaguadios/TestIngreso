import { describe, expect, it } from 'vitest';
import { scoreTask } from '../../src/engine/scoring';
import { T_ABRIR_NAVEGADOR, T_BUSCAR_LLANTA, T_PRACTICA_AJUSTES, T_WIFI } from '../../src/data/sample-evaluation';
import { A, makeRunner, WIFI_RUTA_1 } from './helpers';

describe('tarea de práctica', () => {
  it('se completa con un paso y registra inicio, acción y fin', () => {
    const { runner } = makeRunner(T_PRACTICA_AJUSTES);
    const out = runner.dispatch(A.abrir('ajustes'));
    expect(out?.clase).toBe('necesaria');
    expect(runner.estado).toBe('completada');
    expect(runner.events.map((e) => e.tipo)).toEqual(['tarea.inicio', 'abrir', 'tarea.fin']);
    expect(runner.events.map((e) => e.seq)).toEqual([1, 2, 3]);
    expect(runner.dispatch(A.abrir('navegador'))).toBeNull(); // ya terminó
  });
});

describe('tarea de Wi-Fi', () => {
  it('camino correcto: todo necesario, completada y con buena puntuación', () => {
    const { runner, clock } = makeRunner(T_WIFI);
    for (const a of WIFI_RUTA_1) {
      clock.advance(3000);
      runner.dispatch(a);
    }
    expect(runner.estado).toBe('completada');
    const r = runner.getResult();
    expect(r.conteo).toEqual({ necesaria: 7, exploracion: 0, desviacion: 0, error: 0 });
    expect(r.duracionMs).toBe(21000);
    const score = scoreTask(T_WIFI, r);
    expect(score.desglose.resultado).toBe(50);
    expect(score.desglose.tiempo).toBe(15);
    expect(score.desglose.independencia).toBe(15);
    expect(score.desglose.eficiencia).toBeCloseTo(17.1, 1); // 6 óptimos / 7 acciones
    expect(score.puntuacion).toBeGreaterThan(95);
  });

  it('el camino alterno por ajustes rápidos también es válido', () => {
    const { runner } = makeRunner(T_WIFI);
    for (const a of [A.abrir('ajustes_rapidos'), A.toggle('wifi'), A.abrir('ajustes.internet'), A.red('Roly-Sucursal'), A.clave('roly1234'), A.conectar]) {
      runner.dispatch(a);
    }
    expect(runner.estado).toBe('completada');
    expect(runner.getResult().conteo.necesaria).toBe(6);
  });

  it('modo avión es error; otra red es error; Bluetooth es exploración; Bluetooth encendido es desviación', () => {
    const { runner } = makeRunner(T_WIFI);
    expect(runner.dispatch(A.abrir('ajustes'))!.clase).toBe('necesaria');
    expect(runner.dispatch(A.abrir('ajustes.bluetooth'))!.clase).toBe('exploracion');
    expect(runner.dispatch(A.toggle('bluetooth'))!.clase).toBe('desviacion');
    expect(runner.dispatch(A.atras)!.clase).toBe('exploracion');
    expect(runner.dispatch(A.abrir('ajustes.red'))!.clase).toBe('necesaria');
    expect(runner.dispatch(A.toggle('modoAvion'))!.clase).toBe('error');
    expect(runner.dispatch(A.abrir('ajustes.internet'))!.clase).toBe('necesaria');
    expect(runner.dispatch(A.toggle('wifi'))!.clase).toBe('necesaria');
    expect(runner.dispatch(A.red('CAFE_LIBRE'))!.clase).toBe('error');
    expect(runner.estado).toBe('en_curso');
  });

  it('apagar el Wi-Fi después de encenderlo (deshacer un hito) cuenta como error', () => {
    const { runner } = makeRunner(T_WIFI);
    runner.dispatch(A.abrir('ajustes_rapidos'));
    expect(runner.dispatch(A.toggle('wifi'))!.clase).toBe('necesaria');
    expect(runner.dispatch(A.toggle('wifi'))!.clase).toBe('error');
  });

  it('clave incorrecta no completa la tarea', () => {
    const { runner } = makeRunner(T_WIFI);
    for (const a of [A.abrir('ajustes_rapidos'), A.toggle('wifi'), A.abrir('ajustes.internet'), A.red('Roly-Sucursal'), A.clave('mala'), A.conectar]) runner.dispatch(a);
    expect(runner.estado).toBe('en_curso');
    expect(runner.state.wifiDialogo.error).toBe(true);
  });

  it('omitir da crédito parcial solo por hitos', () => {
    const { runner } = makeRunner(T_WIFI);
    runner.dispatch(A.abrir('ajustes_rapidos'));
    runner.dispatch(A.toggle('wifi'));
    runner.skip();
    expect(runner.estado).toBe('omitida');
    const r = runner.getResult();
    expect(r.hitos.sort()).toEqual(['llego_a_wifi', 'wifi_encendido']);
    const s = scoreTask(T_WIFI, r);
    expect(s.desglose.resultado).toBe(30); // 50 × (0.25 + 0.35)
    expect(s.desglose.eficiencia).toBe(0);
    expect(s.desglose.tiempo).toBe(0);
  });
});

describe('exploración vs error', () => {
  it('explorar hasta 2× los pasos óptimos no baja la eficiencia', () => {
    const { runner } = makeRunner(T_ABRIR_NAVEGADOR); // óptimo = 1 → permite 2 de exploración
    runner.dispatch(A.abrir('ajustes'));
    runner.dispatch(A.atras);
    runner.dispatch(A.abrir('navegador'));
    const r = runner.getResult();
    expect(r.conteo).toEqual({ necesaria: 1, exploracion: 2, desviacion: 0, error: 0 });
    expect(scoreTask(T_ABRIR_NAVEGADOR, r).desglose.eficiencia).toBe(20);
  });

  it('explorar de más sí baja la eficiencia', () => {
    const { runner } = makeRunner(T_ABRIR_NAVEGADOR);
    for (let i = 0; i < 4; i++) { runner.dispatch(A.abrir('ajustes')); runner.dispatch(A.atras); }
    runner.dispatch(A.abrir('navegador'));
    const r = runner.getResult();
    expect(r.conteo.exploracion).toBe(8);
    // efectivas = 1 + (8 − 2) = 7 → 20 × 1/7
    expect(scoreTask(T_ABRIR_NAVEGADOR, r).desglose.eficiencia).toBeCloseTo(2.9, 1);
  });

  it('los toques en vacío se cuentan aparte', () => {
    const { runner } = makeRunner(T_ABRIR_NAVEGADOR);
    runner.dispatch({ type: 'tap_empty' });
    runner.dispatch({ type: 'tap_empty' });
    expect(runner.getResult().toquesVacios).toBe(2);
  });
});

describe('búsqueda en el navegador', () => {
  it('completa solo con consulta + resultado abierto', () => {
    const { runner } = makeRunner(T_BUSCAR_LLANTA);
    runner.dispatch(A.abrir('navegador'));
    runner.dispatch(A.abrir('navegador.escribiendo'));
    runner.dispatch({ type: 'set_text', field: 'navegador.borrador', value: 'Cómo cambiar una LLANTA' });
    runner.dispatch({ type: 'submit', field: 'navegador.buscar' });
    expect(runner.estado).toBe('en_curso'); // falta abrir un resultado
    const out = runner.dispatch({ type: 'select', group: 'resultado', value: 'llanta-2' });
    expect(out?.clase).toBe('necesaria');
    expect(runner.estado).toBe('completada');
  });

  it('buscar otra cosa no cuenta como éxito', () => {
    const { runner } = makeRunner(T_BUSCAR_LLANTA);
    runner.dispatch(A.abrir('navegador'));
    runner.dispatch(A.abrir('navegador.escribiendo'));
    runner.dispatch({ type: 'set_text', field: 'navegador.borrador', value: 'clima' });
    runner.dispatch({ type: 'submit', field: 'navegador.buscar' });
    runner.dispatch({ type: 'select', group: 'resultado', value: 'gen-1' });
    expect(runner.estado).toBe('en_curso');
  });
});

describe('ayudas', () => {
  it('entrega pistas en orden y luego "mostrarme"', () => {
    const { runner } = makeRunner(T_WIFI);
    expect(runner.hasMoreHints).toBe(true);
    expect(runner.requestHint()).toMatchObject({ tipo: 'pista', indice: 0 });
    expect(runner.requestHint()).toMatchObject({ tipo: 'pista', indice: 1 });
    expect(runner.requestHint()).toMatchObject({ tipo: 'pista', indice: 2 });
    expect(runner.requestHint()).toEqual({ tipo: 'mostrarme', objetivo: 'ajustes.red' });
    expect(runner.requestHint()).toBeNull();
    expect(runner.hasMoreHints).toBe(false);
    expect(runner.events.filter((e) => e.tipo === 'ayuda.mostrada')).toHaveLength(4);
  });

  it('cada ayuda resta independencia', () => {
    const { runner } = makeRunner(T_WIFI);
    runner.requestHint();
    runner.requestHint();
    for (const a of WIFI_RUTA_1) runner.dispatch(a);
    const s = scoreTask(T_WIFI, runner.getResult());
    expect(s.desglose.independencia).toBe(5); // 15 − 2×5
  });

  it('usar "mostrarme" deja la tarea como completada con guía y sin independencia', () => {
    const { runner } = makeRunner(T_WIFI);
    for (let i = 0; i < 4; i++) runner.requestHint();
    for (const a of WIFI_RUTA_1) runner.dispatch(a);
    expect(runner.estado).toBe('completada_con_guia');
    const s = scoreTask(T_WIFI, runner.getResult());
    expect(s.desglose.independencia).toBe(0);
    expect(s.desglose.resultado).toBe(50);
  });
});

describe('tiempo', () => {
  it('se agota al llegar al límite', () => {
    const { runner, clock } = makeRunner(T_WIFI);
    runner.dispatch(A.abrir('ajustes'));
    clock.advance(121_000);
    expect(runner.dispatch(A.abrir('ajustes.red'))).toBeNull();
    expect(runner.estado).toBe('tiempo_agotado');
    expect(runner.events.at(-1)).toMatchObject({ tipo: 'tarea.fin', datos: { estado: 'tiempo_agotado' } });
  });

  it('el tiempo en segundo plano no cuenta', () => {
    const { runner, clock } = makeRunner(T_WIFI);
    clock.advance(10_000);
    runner.pause();
    clock.advance(600_000); // 10 minutos fuera de la app
    runner.resume();
    clock.advance(5_000);
    expect(runner.elapsedMs()).toBe(15_000);
    expect(runner.dispatch(A.abrir('ajustes'))).not.toBeNull();
    expect(runner.events.map((e) => e.tipo)).toContain('app.segundo_plano');
  });

  it('en pausa no se aceptan acciones', () => {
    const { runner } = makeRunner(T_WIFI);
    runner.pause();
    expect(runner.dispatch(A.abrir('ajustes'))).toBeNull();
  });

  it('puntaje de tiempo baja linealmente entre referencia y límite', () => {
    const { runner, clock } = makeRunner(T_WIFI); // ref 40 s, límite 120 s
    clock.advance(80_000); // a mitad de camino
    for (const a of WIFI_RUTA_1) runner.dispatch(a);
    expect(scoreTask(T_WIFI, runner.getResult()).desglose.tiempo).toBe(7.5);
  });

  it('la práctica no tiene límite y su tiempo no se castiga', () => {
    const { runner, clock } = makeRunner(T_PRACTICA_AJUSTES);
    clock.advance(10 * 60_000);
    expect(runner.checkTimeout()).toBe(false);
    expect(runner.remainingMs()).toBeNull();
  });
});

describe('telemetría', () => {
  it('cada evento lleva uuid, seq, tiempo relativo y clase', () => {
    const { runner, clock } = makeRunner(T_WIFI);
    clock.advance(2500);
    runner.dispatch(A.abrir('ajustes'));
    const e = runner.events[1]!;
    expect(e).toMatchObject({ tipo: 'abrir', objetivo: 'ajustes', seq: 2, tRelMs: 2500, clase: 'necesaria' });
    expect(new Set(runner.events.map((x) => x.uuid)).size).toBe(runner.events.length);
  });

  it('la contraseña no se guarda en claro', () => {
    const { runner } = makeRunner(T_WIFI);
    runner.dispatch(A.clave('roly1234'));
    const e = runner.events.find((x) => x.tipo === 'texto')!;
    expect(e.datos.texto).toBe('••••••••');
  });
});
