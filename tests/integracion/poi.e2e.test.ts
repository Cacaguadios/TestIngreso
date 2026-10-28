/**
 * Prueba de punta a punta contra un POI real (no corre en `npm test` normal).
 *
 *   POI_URL=http://poi.test/api/evaluacion/v1 POI_CODIGO=ABC-123 npx vitest run tests/integracion
 *   (o POI_TOKEN=<token> si el equipo ya está enrolado)
 *
 * Enrola, baja el paquete, juega la evaluación completa con un candidato de prueba
 * (con pistas, "mostrarme", un error y una tarea omitida) y la sincroniza.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { migrate } from '../../src/db/db';
import { nextBatch, pendingAttemptsCount, saveAttempt } from '../../src/db/repo';
import { ManualClock } from '../../src/engine/clock';
import type { Paquete } from '../../src/engine/schema';
import { EvaluationSession } from '../../src/engine/session';
import { createApi } from '../../src/sync/api';
import { syncPending } from '../../src/sync/sync';
import { openMemory } from '../db/memory-db';
import { open, SOLUCIONES } from '../engine/soluciones';

const URL = process.env.POI_URL;
const CODIGO = process.env.POI_CODIGO;
let token = process.env.POI_TOKEN ?? null;

describe.skipIf(!URL)('integración con POI', () => {
  const api = createApi({ baseUrl: URL ?? '', getToken: async () => token });
  let paquete: Paquete;
  let sucursalId: number | null = null;

  it('enrola el equipo', async () => {
    if (token) return;
    expect(CODIGO, 'falta POI_CODIGO o POI_TOKEN').toBeTruthy();
    const r = await api.enrolar({ codigoEnrolamiento: CODIGO!, modelo: 'Redmi 15C', androidId: `e2e-${Date.now()}`, appVersion: '1.0.0' });
    expect(r.token).toMatch(/^[0-9a-f]{64}$/);
    token = r.token;
    sucursalId = r.sucursalId;
    console.log(`Enrolado: dispositivo ${r.dispositivoId}, sucursal ${r.sucursal}. POI_TOKEN=${r.token}`);
  });

  it('un código usado ya no sirve', async () => {
    if (!CODIGO) return;
    await expect(api.enrolar({ codigoEnrolamiento: CODIGO, modelo: 'x', androidId: 'x', appVersion: '1' })).rejects.toThrow();
  });

  it('baja el paquete y coincide con las tareas de la app', async () => {
    const r = await api.paquete();
    expect(r).not.toBeNull();
    paquete = r!.paquete;
    expect(paquete.puestos.length).toBeGreaterThan(0);
    const local = JSON.parse(readFileSync('docs/poi/evaluacion-vendedor-basico.json', 'utf8'));
    const ev = paquete.evaluaciones.find((e) => e.codigo === 'vendedor-basico');
    expect(ev, 'POI no manda la evaluación vendedor-basico').toBeDefined();
    expect(ev!.tareas).toHaveLength(16);
    expect(ev!.pesos).toEqual(local.pesos);
    expect(ev!.tareas.map((t) => t.definicion)).toEqual(local.tareas.map((t: { definicion: unknown }) => t.definicion));
    for (const p of paquete.puestos) expect(paquete.evaluaciones.some((e) => e.versionId === p.evaluacionVersionId)).toBe(true);
    // Con el mismo ETag no vuelve a descargar.
    if (r!.etag) expect(await api.paquete(r!.etag)).toBeNull();
  });

  it('sincroniza una evaluación completa y POI la confirma', async () => {
    const puesto = paquete.puestos[0]!;
    const ev = paquete.evaluaciones.find((e) => e.versionId === puesto.evaluacionVersionId)!;
    const clock = new ManualClock(Date.now());
    const s = new EvaluationSession(
      ev,
      { uuid: crypto.randomUUID(), nombre: 'Prueba', apellidos: 'Integración', puestoId: puesto.id, sucursalId: sucursalId ?? paquete.sucursales[0]?.id ?? null, aceptoPrivacidadEn: new Date().toISOString() },
      { clock, uuid: () => crypto.randomUUID() },
    );
    for (let i = 0; i < s.total; i++) {
      const codigo = s.currentSlot!.definicion.codigo;
      const r = s.startTask();
      clock.advance(3000);
      if (codigo === 'pantalla.subir_brillo') {
        r.skip(); // omitida
      } else {
        if (codigo === 'sonido.timbre_silencio') r.requestHint(); // 1 pista
        if (codigo === 'mapas.ruta_sucursal') while (r.requestHint()?.tipo !== 'mostrarme'); // guiada
        if (codigo === 'archivos.abrir_catalogo') { r.dispatch(open('galeria')); clock.advance(2000); r.dispatch({ type: 'back' }); } // desvío
        for (const a of SOLUCIONES[codigo]!) { r.dispatch(a); clock.advance(1500 + (i % 4) * 700); }
      }
      if (!r.finished) r.skip();
      s.finishTask();
      clock.advance(1000);
    }
    expect(s.isFinished).toBe(true);

    const db = openMemory();
    await migrate(db);
    await saveAttempt(db, s.toRecords());
    const lote = (await nextBatch(db))!;

    const rep = await syncPending(db, api);
    expect(rep.error).toBeNull();
    expect(rep.intentosBorrados).toBe(1);
    expect(await pendingAttemptsCount(db)).toBe(0);

    // Reenviar el mismo lote es seguro (idempotente).
    const again = await api.lote(lote);
    expect(again.aceptados.eventos.sort()).toEqual(lote.eventos.map((e) => e.uuid).sort());
    expect(again.intentosCompletos).toEqual([lote.intentos[0]!.uuid]);

    const { puntuacion, nivel } = s.summary();
    console.log(`Intento ${lote.intentos[0]!.uuid}: ${puntuacion} pts (${nivel}), ${lote.eventos.length} eventos.`);
  });
});

