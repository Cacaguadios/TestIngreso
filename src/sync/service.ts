import NetInfo from '@react-native-community/netinfo';
import { getDb } from '../db/expo-db';
import { loadPaqueteJson, pendingAttemptsCount, savePaquete } from '../db/repo';
import { PaqueteSchema, type Paquete } from '../engine/schema';
import { ApiError } from './api';
import { getApi } from './device';
import { retryDelayMs, syncPending, type SyncReport } from './sync';

let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;

/** Envía lo pendiente si hay red y el equipo está configurado. Nunca lanza. */
export async function triggerSync(): Promise<SyncReport | null> {
  if (running) return null;
  running = true;
  try {
    const net = await NetInfo.fetch();
    if (net.isConnected === false) return schedule({ lotes: 0, eventos: 0, intentosBorrados: 0, error: 'Sin conexión.' });
    const api = await getApi();
    if (!api) return null;
    const db = await getDb();
    if ((await pendingAttemptsCount(db)) === 0) return null;
    const report = await syncPending(db, api);
    return schedule(report);
  } catch {
    return null;
  } finally {
    running = false;
  }
}

function schedule(report: SyncReport): SyncReport {
  if (timer) clearTimeout(timer);
  if (report.error) {
    timer = setTimeout(() => void triggerSync(), retryDelayMs(attempt++));
  } else {
    attempt = 0;
  }
  return report;
}

/** Baja el paquete de evaluaciones de POI y lo guarda para trabajar sin conexión. */
export async function refreshPaquete(): Promise<{ estado: 'actualizado' | 'sin_cambios' | 'sin_configurar' | 'error'; mensaje?: string }> {
  const api = await getApi();
  if (!api) return { estado: 'sin_configurar' };
  try {
    const db = await getDb();
    const actual = await loadPaqueteJson(db);
    const r = await api.paquete(actual?.version);
    if (!r) return { estado: 'sin_cambios' };
    await savePaquete(db, r.paquete);
    return { estado: 'actualizado' };
  } catch (e) {
    return { estado: 'error', mensaje: e instanceof ApiError ? e.message : 'No se pudo actualizar el paquete.' };
  }
}

export async function loadStoredPaquete(): Promise<Paquete | null> {
  const db = await getDb();
  const row = await loadPaqueteJson(db);
  if (!row) return null;
  const parsed = PaqueteSchema.safeParse(JSON.parse(row.json));
  return parsed.success ? parsed.data : null;
}
