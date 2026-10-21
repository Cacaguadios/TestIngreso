import type { Paquete } from '../engine/schema';
import type { EvaluationSession } from '../engine/session';
import type { Db } from './db';

type Records = ReturnType<EvaluationSession['toRecords']>;

// ───────────────────────────── Paquete descargado de POI ─────────────────────────────

export async function savePaquete(db: Db, paquete: Paquete, now = new Date().toISOString()): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM paquete');
    await db.runAsync('INSERT INTO paquete (version, json, descargado_en) VALUES (?, ?, ?)', [paquete.version, JSON.stringify(paquete), now]);
  });
}

export async function loadPaqueteJson(db: Db): Promise<{ version: string; json: string } | null> {
  return db.getFirstAsync<{ version: string; json: string }>('SELECT version, json FROM paquete LIMIT 1');
}

// ───────────────────────────── Intentos ─────────────────────────────

/**
 * Guarda (o actualiza) un intento. Es idempotente: se llama después de cada tarea para no
 * perder nada si la app se cierra. Cada vez que cambia el intento vuelve a quedar "por sincronizar".
 */
export async function saveAttempt(db: Db, rec: Records): Promise<void> {
  const p = rec.participante;
  const i = rec.intento;
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO participante (uuid, nombre, apellidos, puesto_id, sucursal_id, acepto_privacidad_en)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [p.uuid, p.nombre, p.apellidos, p.puestoId, p.sucursalId, p.aceptoPrivacidadEn],
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO intento
       (uuid, participante_uuid, evaluacion_version_id, inicio, fin, estado, puntuacion, nivel, total_eventos, sincronizado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [i.uuid, i.participanteUuid, i.evaluacionVersionId, i.inicio, i.fin, i.estado, i.puntuacion, i.nivel, i.totalEventos],
    );
    for (const t of rec.intentoTareas) {
      await db.runAsync(
        `INSERT OR IGNORE INTO intento_tarea
         (uuid, intento_uuid, tarea_codigo, tarea_version, orden, estado, duracion_ms, acciones, errores, ayudas, puntuacion, detalle_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.uuid, t.intentoUuid, t.tareaCodigo, t.tareaVersion, t.orden, t.estado, t.duracionMs, t.acciones, t.errores, t.ayudas, t.puntuacion, JSON.stringify(t.detalle)],
      );
    }
    for (const e of rec.eventos) {
      await db.runAsync(
        `INSERT OR IGNORE INTO evento
         (uuid, intento_tarea_uuid, seq, t_rel_ms, ts_dispositivo, tipo, objetivo, datos_json, clase, enviado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [e.uuid, e.intentoTareaUuid, e.seq, e.tRelMs, e.tsDispositivo, e.tipo, e.objetivo, JSON.stringify(e.datos), e.clase],
      );
    }
  });
}

/** Intentos terminados o abandonados que todavía no se borran del teléfono. */
export async function pendingAttemptsCount(db: Db): Promise<number> {
  const r = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM intento WHERE estado != 'en_curso'");
  return r?.n ?? 0;
}

/** Intentos que quedaron "en curso" (la app se cerró a media evaluación). */
export async function staleAttempts(db: Db): Promise<string[]> {
  const rows = await db.getAllAsync<{ uuid: string }>("SELECT uuid FROM intento WHERE estado = 'en_curso'");
  return rows.map((r) => r.uuid);
}

export async function closeStaleAttempt(db: Db, uuid: string, now = new Date().toISOString()): Promise<void> {
  await db.runAsync("UPDATE intento SET estado = 'abandonado', fin = COALESCE(fin, ?), sincronizado = 0 WHERE uuid = ? AND estado = 'en_curso'", [now, uuid]);
}

// ───────────────────────────── Sincronización ─────────────────────────────

export interface SyncBatch {
  participantes: {
    uuid: string; nombre: string; apellidos: string; puestoId: number; sucursalId: number | null; aceptoPrivacidadEn: string;
  }[];
  intentos: {
    uuid: string; participanteUuid: string; evaluacionVersionId: number; inicio: string; fin: string | null;
    estado: string; puntuacion: number | null; nivel: string | null; totalEventos: number;
  }[];
  intentoTareas: {
    uuid: string; intentoUuid: string; tareaCodigo: string; tareaVersion: number; orden: number; estado: string;
    duracionMs: number; acciones: number; errores: number; ayudas: number; puntuacion: number; detalle: unknown;
  }[];
  eventos: {
    uuid: string; intentoTareaUuid: string; seq: number; tRelMs: number; tsDispositivo: string; tipo: string;
    objetivo: string | null; datos: unknown; clase: string | null;
  }[];
}

export interface SyncResponse {
  aceptados: { participantes: string[]; intentos: string[]; intentoTareas: string[]; eventos: string[] };
  intentosCompletos: string[];
}

interface IntentoRow {
  uuid: string; participante_uuid: string; evaluacion_version_id: number; inicio: string; fin: string | null;
  estado: string; puntuacion: number | null; nivel: string | null; total_eventos: number;
}

export const MAX_EVENTS_PER_BATCH = 500;

/**
 * Arma el siguiente lote (un intento a la vez, hasta 500 eventos). Devuelve null si no hay
 * nada pendiente. Solo se envían intentos que ya no están en curso.
 */
export async function nextBatch(db: Db, maxEvents = MAX_EVENTS_PER_BATCH): Promise<SyncBatch | null> {
  const intento = await db.getFirstAsync<IntentoRow>(
    `SELECT i.* FROM intento i
     WHERE i.estado != 'en_curso'
       AND (i.sincronizado = 0 OR EXISTS (
         SELECT 1 FROM evento e JOIN intento_tarea t ON t.uuid = e.intento_tarea_uuid
         WHERE t.intento_uuid = i.uuid AND e.enviado = 0))
     ORDER BY i.inicio LIMIT 1`,
  );
  if (!intento) return null;

  const p = await db.getFirstAsync<{
    uuid: string; nombre: string; apellidos: string; puesto_id: number; sucursal_id: number | null; acepto_privacidad_en: string;
  }>('SELECT * FROM participante WHERE uuid = ?', [intento.participante_uuid]);
  const tareas = await db.getAllAsync<{
    uuid: string; intento_uuid: string; tarea_codigo: string; tarea_version: number; orden: number; estado: string;
    duracion_ms: number; acciones: number; errores: number; ayudas: number; puntuacion: number; detalle_json: string;
  }>('SELECT * FROM intento_tarea WHERE intento_uuid = ? ORDER BY orden', [intento.uuid]);
  const eventos = await db.getAllAsync<{
    uuid: string; intento_tarea_uuid: string; seq: number; t_rel_ms: number; ts_dispositivo: string; tipo: string;
    objetivo: string | null; datos_json: string; clase: string | null;
  }>(
    `SELECT e.* FROM evento e JOIN intento_tarea t ON t.uuid = e.intento_tarea_uuid
     WHERE t.intento_uuid = ? AND e.enviado = 0
     ORDER BY t.orden, e.seq LIMIT ?`,
    [intento.uuid, maxEvents],
  );

  return {
    participantes: p
      ? [{ uuid: p.uuid, nombre: p.nombre, apellidos: p.apellidos, puestoId: p.puesto_id, sucursalId: p.sucursal_id, aceptoPrivacidadEn: p.acepto_privacidad_en }]
      : [],
    intentos: [{
      uuid: intento.uuid, participanteUuid: intento.participante_uuid, evaluacionVersionId: intento.evaluacion_version_id,
      inicio: intento.inicio, fin: intento.fin, estado: intento.estado, puntuacion: intento.puntuacion, nivel: intento.nivel,
      totalEventos: intento.total_eventos,
    }],
    intentoTareas: tareas.map((t) => ({
      uuid: t.uuid, intentoUuid: t.intento_uuid, tareaCodigo: t.tarea_codigo, tareaVersion: t.tarea_version, orden: t.orden,
      estado: t.estado, duracionMs: t.duracion_ms, acciones: t.acciones, errores: t.errores, ayudas: t.ayudas,
      puntuacion: t.puntuacion, detalle: JSON.parse(t.detalle_json) as unknown,
    })),
    eventos: eventos.map((e) => ({
      uuid: e.uuid, intentoTareaUuid: e.intento_tarea_uuid, seq: e.seq, tRelMs: e.t_rel_ms, tsDispositivo: e.ts_dispositivo,
      tipo: e.tipo, objetivo: e.objetivo, datos: JSON.parse(e.datos_json) as unknown, clase: e.clase,
    })),
  };
}

/** Marca como enviado lo que POI aceptó. */
export async function applyResponse(db: Db, batch: SyncBatch, res: SyncResponse): Promise<void> {
  const aceptados = new Set(res.aceptados.eventos);
  await db.withTransactionAsync(async () => {
    for (const e of batch.eventos) {
      if (aceptados.has(e.uuid)) await db.runAsync('UPDATE evento SET enviado = 1 WHERE uuid = ?', [e.uuid]);
    }
    for (const uuid of res.aceptados.intentos) {
      await db.runAsync('UPDATE intento SET sincronizado = 1 WHERE uuid = ?', [uuid]);
    }
  });
}

/**
 * Borra del teléfono los intentos que POI confirmó completos (el equipo es compartido:
 * no deben quedar datos personales de candidatos anteriores).
 */
export async function purgeCompleted(db: Db, intentoUuids: string[]): Promise<void> {
  if (intentoUuids.length === 0) return;
  await db.withTransactionAsync(async () => {
    for (const uuid of intentoUuids) {
      const row = await db.getFirstAsync<{ participante_uuid: string }>('SELECT participante_uuid FROM intento WHERE uuid = ?', [uuid]);
      await db.runAsync('DELETE FROM evento WHERE intento_tarea_uuid IN (SELECT uuid FROM intento_tarea WHERE intento_uuid = ?)', [uuid]);
      await db.runAsync('DELETE FROM intento_tarea WHERE intento_uuid = ?', [uuid]);
      await db.runAsync('DELETE FROM intento WHERE uuid = ?', [uuid]);
      if (row) {
        const otros = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM intento WHERE participante_uuid = ?', [row.participante_uuid]);
        if ((otros?.n ?? 0) === 0) await db.runAsync('DELETE FROM participante WHERE uuid = ?', [row.participante_uuid]);
      }
    }
  });
}
