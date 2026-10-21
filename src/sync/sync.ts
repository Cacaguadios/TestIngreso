import type { Db } from '../db/db';
import { applyResponse, nextBatch, purgeCompleted } from '../db/repo';
import { ApiError, type Api } from './api';

export interface SyncReport {
  lotes: number;
  eventos: number;
  intentosBorrados: number;
  error: string | null;
}

/**
 * Envía lo pendiente por lotes (nunca un request por evento). Se detiene en el primer error
 * y deja todo lo no confirmado marcado como pendiente, para reintentar después.
 */
export async function syncPending(db: Db, api: Pick<Api, 'lote'>, maxLotes = 100): Promise<SyncReport> {
  const report: SyncReport = { lotes: 0, eventos: 0, intentosBorrados: 0, error: null };
  for (let i = 0; i < maxLotes; i++) {
    const batch = await nextBatch(db);
    if (!batch) break;
    try {
      const res = await api.lote(batch);
      await applyResponse(db, batch, res);
      await purgeCompleted(db, res.intentosCompletos);
      report.lotes++;
      report.eventos += res.aceptados.eventos.length;
      report.intentosBorrados += res.intentosCompletos.length;
      // Si POI no aceptó nada, no hay progreso: salir para no ciclar.
      if (res.aceptados.eventos.length === 0 && res.aceptados.intentos.length === 0) {
        report.error = 'POI no aceptó el lote.';
        break;
      }
    } catch (e) {
      report.error = e instanceof ApiError ? e.message : 'Error inesperado al sincronizar.';
      break;
    }
  }
  return report;
}

/** Espera creciente entre reintentos: 5 s, 30 s, 2 min, 10 min (tope). */
export function retryDelayMs(attempt: number): number {
  const steps = [5_000, 30_000, 120_000, 600_000];
  return steps[Math.min(attempt, steps.length - 1)]!;
}
