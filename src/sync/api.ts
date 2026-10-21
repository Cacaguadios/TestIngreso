import { PaqueteSchema, type Paquete } from '../engine/schema';
import type { SyncBatch, SyncResponse } from '../db/repo';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
  }
  /** Sin conexión o servidor caído: conviene reintentar más tarde. */
  get retryable(): boolean {
    return this.status === null || this.status >= 500 || this.status === 429;
  }
}

export interface ApiConfig {
  baseUrl: string; // p. ej. https://poi.roly.mx/api/evaluacion/v1
  getToken(): Promise<string | null>;
  fetchImpl?: typeof fetch;
}

export function createApi(cfg: ApiConfig) {
  const f = cfg.fetchImpl ?? fetch;

  async function call(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json', ...(init.headers as Record<string, string> | undefined) };
    if (init.auth !== false) {
      const token = await cfg.getToken();
      if (!token) throw new ApiError('El equipo no está enrolado en POI.', 401);
      headers.Authorization = `Bearer ${token}`;
    }
    let res: Response;
    try {
      res = await f(`${cfg.baseUrl}${path}`, { ...init, headers });
    } catch {
      throw new ApiError('Sin conexión con POI.', null);
    }
    if (!res.ok && res.status !== 304) throw new ApiError(`POI respondió ${res.status}.`, res.status);
    return res;
  }

  return {
    async enrolar(body: { codigoEnrolamiento: string; modelo: string; androidId: string; appVersion: string }) {
      const res = await call('/dispositivos/enrolar', {
        method: 'POST', auth: false, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      return (await res.json()) as { dispositivoId: number; token: string; sucursalId: number; sucursal: string };
    },

    /** Devuelve null si el paquete no cambió (ETag igual). Valida la forma antes de usarlo. */
    async paquete(etag?: string | null): Promise<{ paquete: Paquete; etag: string | null } | null> {
      const res = await call('/paquete', { headers: etag ? { 'If-None-Match': etag } : {} });
      if (res.status === 304) return null;
      const parsed = PaqueteSchema.safeParse(await res.json());
      if (!parsed.success) throw new ApiError('El paquete de POI no tiene el formato esperado.', 422);
      return { paquete: parsed.data, etag: res.headers.get('ETag') };
    },

    async lote(batch: SyncBatch): Promise<SyncResponse> {
      const res = await call('/sync/lote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batch) });
      return (await res.json()) as SyncResponse;
    },
  };
}

export type Api = ReturnType<typeof createApi>;
