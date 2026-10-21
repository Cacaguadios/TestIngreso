import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { migrate, type Db } from '../../src/db/db';
import { applyResponse, nextBatch, pendingAttemptsCount, purgeCompleted, saveAttempt, staleAttempts, closeStaleAttempt, type SyncBatch, type SyncResponse } from '../../src/db/repo';
import { counterUuid, ManualClock } from '../../src/engine/clock';
import { EvaluationSession } from '../../src/engine/session';
import { SAMPLE_EVALUATION } from '../../src/data/sample-evaluation';
import { syncPending } from '../../src/sync/sync';
import { A, WIFI_RUTA_1 } from '../engine/helpers';

type Param = string | number | bigint | null;
function openMemory(): Db {
  const raw = new DatabaseSync(':memory:');
  const p = (a?: unknown[]) => (a ?? []) as Param[];
  return {
    execAsync: async (sql) => { raw.exec(sql); },
    runAsync: async (sql, params) => raw.prepare(sql).run(...p(params)),
    getAllAsync: async <T>(sql: string, params?: unknown[]) => raw.prepare(sql).all(...p(params)) as T[],
    getFirstAsync: async <T>(sql: string, params?: unknown[]) => (raw.prepare(sql).get(...p(params)) as T | undefined) ?? null,
    withTransactionAsync: async (task) => {
      raw.exec('BEGIN');
      try { await task(); raw.exec('COMMIT'); } catch (e) { raw.exec('ROLLBACK'); throw e; }
    },
  };
}

function playSession(extra = 0) {
  const clock = new ManualClock();
  const s = new EvaluationSession(
    SAMPLE_EVALUATION,
    { uuid: 'p1', nombre: 'Ana', apellidos: 'Pérez', puestoId: 1, sucursalId: 4, aceptoPrivacidadEn: '2026-10-21T16:00:00Z' },
    { clock, uuid: counterUuid('x') },
  );
  let r = s.startTask(); r.dispatch(A.abrir('ajustes')); s.finishTask();
  r = s.startTask(); r.dispatch(A.abrir('navegador')); s.finishTask();
  r = s.startTask(); r.skip(); s.finishTask();
  r = s.startTask(); r.skip(); s.finishTask();
  r = s.startTask();
  for (let i = 0; i < extra; i++) r.dispatch({ type: 'tap_empty' }); // eventos extra para probar lotes
  for (const a of WIFI_RUTA_1) r.dispatch(a);
  s.finishTask();
  return s;
}

const aceptarTodo = (b: SyncBatch, completo: boolean): SyncResponse => ({
  aceptados: {
    participantes: b.participantes.map((x) => x.uuid),
    intentos: b.intentos.map((x) => x.uuid),
    intentoTareas: b.intentoTareas.map((x) => x.uuid),
    eventos: b.eventos.map((x) => x.uuid),
  },
  intentosCompletos: completo ? b.intentos.map((x) => x.uuid) : [],
});

describe('SQLite local + sincronización', () => {
  it('migra una sola vez', async () => {
    const db = openMemory();
    await migrate(db);
    await migrate(db);
    expect((await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(1);
  });

  it('guarda un intento y es idempotente', async () => {
    const db = openMemory(); await migrate(db);
    const s = playSession();
    await saveAttempt(db, s.toRecords());
    await saveAttempt(db, s.toRecords());
    const n = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM evento');
    expect(n?.n).toBe(s.toRecords().eventos.length);
    expect(await pendingAttemptsCount(db)).toBe(1);
  });

  it('el lote trae participante, tareas y eventos, y al confirmar se borra todo del teléfono', async () => {
    const db = openMemory(); await migrate(db);
    const s = playSession();
    await saveAttempt(db, s.toRecords());

    const batch = (await nextBatch(db))!;
    expect(batch.participantes[0]).toMatchObject({ nombre: 'Ana', apellidos: 'Pérez' });
    expect(batch.intentoTareas).toHaveLength(5);
    expect(batch.eventos).toHaveLength(s.toRecords().eventos.length);

    await applyResponse(db, batch, aceptarTodo(batch, true));
    expect(await nextBatch(db)).toBeNull();
    await purgeCompleted(db, [batch.intentos[0]!.uuid]);
    for (const t of ['participante', 'intento', 'intento_tarea', 'evento']) {
      expect((await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`))?.n).toBe(0);
    }
  });

  it('divide los eventos en lotes de máximo 500', async () => {
    const db = openMemory(); await migrate(db);
    const s = playSession(1200);
    await saveAttempt(db, s.toRecords());
    const total = s.toRecords().eventos.length;
    expect(total).toBeGreaterThan(1200);

    const sizes: number[] = [];
    const api = {
      lote: async (b: SyncBatch) => { sizes.push(b.eventos.length); return aceptarTodo(b, sizes.reduce((a, x) => a + x, 0) >= total); },
    };
    const rep = await syncPending(db, api);
    expect(rep.error).toBeNull();
    expect(Math.max(...sizes)).toBeLessThanOrEqual(500);
    expect(sizes.reduce((a, x) => a + x, 0)).toBe(total);
    expect(rep.intentosBorrados).toBe(1);
    expect(await pendingAttemptsCount(db)).toBe(0);
  });

  it('si POI falla, no se pierde nada y se reintenta después', async () => {
    const db = openMemory(); await migrate(db);
    await saveAttempt(db, playSession().toRecords());
    const caido = { lote: async () => { throw new Error('x'); } };
    const rep = await syncPending(db, caido as never);
    expect(rep.error).not.toBeNull();
    expect(await nextBatch(db)).not.toBeNull();
    expect(await pendingAttemptsCount(db)).toBe(1);
  });

  it('un intento en curso no se envía; si la app se cerró se marca abandonado y entonces sí', async () => {
    const db = openMemory(); await migrate(db);
    const clock = new ManualClock();
    const s = new EvaluationSession(SAMPLE_EVALUATION, { uuid: 'p2', nombre: 'Luis', apellidos: 'Gómez', puestoId: 1, sucursalId: 4, aceptoPrivacidadEn: 'x' }, { clock, uuid: counterUuid('y') });
    const r = s.startTask(); r.dispatch(A.abrir('ajustes')); s.finishTask();
    await saveAttempt(db, s.toRecords());
    expect(await nextBatch(db)).toBeNull();
    const stale = await staleAttempts(db);
    expect(stale).toHaveLength(1);
    await closeStaleAttempt(db, stale[0]!);
    expect(await nextBatch(db)).not.toBeNull();
  });
});
