import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { SAMPLE_PAQUETE, SAMPLE_SUCURSAL } from '../data/sample-package';
import { closeStaleAttempt, pendingAttemptsCount, saveAttempt, staleAttempts } from '../db/repo';
import { getDb } from '../db/expo-db';
import { systemClock } from '../engine/clock';
import type { Paquete } from '../engine/schema';
import { EvaluationSession, type CompletedTask, type EvaluationDefinition } from '../engine/session';
import type { TaskRunner } from '../engine/task-runner';
import type { PhoneAction, PhoneState, TaskEstado } from '../engine/types';
import { getDeviceInfo } from '../sync/device';
import { loadStoredPaquete, triggerSync } from '../sync/service';

const deps = { clock: systemClock, uuid: () => Crypto.randomUUID() };

export interface Draft {
  nombre: string;
  apellidos: string;
  puestoId: number | null;
  pin: string;
  acepto: boolean;
}

const emptyDraft: Draft = { nombre: '', apellidos: '', puestoId: null, pin: '', acepto: false };

export interface HintState {
  texto: string | null;
  resaltar: string | null;
  numero: number;
}

interface Store {
  paquete: Paquete;
  sucursal: { id: number; nombre: string };
  pendientes: number;
  draft: Draft;
  session: EvaluationSession | null;
  runner: TaskRunner | null;
  phone: PhoneState | null;
  taskEstado: TaskEstado | null;
  hint: HintState;
  last: CompletedTask | null;
  evaluationDone: boolean;

  init(): Promise<void>;
  setDraft(patch: Partial<Draft>): void;
  definitionForDraft(): EvaluationDefinition | null;
  startEvaluation(): boolean;
  beginTask(): void;
  dispatch(action: PhoneAction): void;
  requestHint(): void;
  clearHint(): void;
  skipTask(): void;
  tick(): void;
  pause(): void;
  resume(): void;
  finishTask(): Promise<CompletedTask | null>;
  closeEvaluation(): Promise<void>;
  reset(): void;
}

const noHint: HintState = { texto: null, resaltar: null, numero: 0 };

export const useStore = create<Store>((set, get) => {
  const sync = () => {
    const r = get().runner;
    if (!r) return set({ phone: null, taskEstado: null });
    set({ phone: r.state, taskEstado: r.estado });
  };

  const persist = async () => {
    const s = get().session;
    if (!s) return;
    try {
      await saveAttempt(await getDb(), s.toRecords());
    } catch (e) {
      console.warn('No se pudo guardar el intento en SQLite', e);
    }
  };

  return {
    paquete: SAMPLE_PAQUETE,
    sucursal: SAMPLE_SUCURSAL,
    pendientes: 0,
    draft: emptyDraft,
    session: null,
    runner: null,
    phone: null,
    taskEstado: null,
    hint: noHint,
    last: null,
    evaluationDone: false,

    async init() {
      try {
        const db = await getDb();
        // Intentos que quedaron a medias (se cerró la app): se cierran como abandonados.
        for (const uuid of await staleAttempts(db)) await closeStaleAttempt(db, uuid);
        const stored = await loadStoredPaquete();
        const info = await getDeviceInfo();
        set({
          paquete: stored ?? SAMPLE_PAQUETE,
          sucursal: info ? { id: info.sucursalId, nombre: info.sucursal } : SAMPLE_SUCURSAL,
          pendientes: await pendingAttemptsCount(db),
        });
        void triggerSync();
      } catch (e) {
        console.warn('Inicialización parcial', e);
      }
    },

    setDraft(patch) {
      set((st) => ({ draft: { ...st.draft, ...patch } }));
    },

    definitionForDraft() {
      const { paquete, draft } = get();
      const puesto = paquete.puestos.find((p) => p.id === draft.puestoId);
      if (!puesto) return null;
      return (paquete.evaluaciones.find((e) => e.versionId === puesto.evaluacionVersionId) as EvaluationDefinition | undefined) ?? null;
    },

    startEvaluation() {
      const { draft, sucursal } = get();
      const def = get().definitionForDraft();
      if (!def || draft.puestoId === null) return false;
      const session = new EvaluationSession(
        def,
        {
          uuid: Crypto.randomUUID(),
          nombre: draft.nombre.trim(),
          apellidos: draft.apellidos.trim(),
          puestoId: draft.puestoId,
          sucursalId: sucursal.id,
          aceptoPrivacidadEn: new Date().toISOString(),
        },
        deps,
      );
      set({ session, runner: null, phone: null, taskEstado: null, last: null, hint: noHint, evaluationDone: false });
      return true;
    },

    beginTask() {
      const s = get().session;
      if (!s) return;
      const runner = s.startTask();
      set({ runner, hint: noHint });
      sync();
    },

    dispatch(action) {
      const r = get().runner;
      if (!r) return;
      r.dispatch(action);
      // Ya mostró lo que se pidió resaltar: al primer movimiento se quita el resaltado.
      if (get().hint.resaltar) set({ hint: { ...get().hint, resaltar: null } });
      sync();
    },

    requestHint() {
      const r = get().runner;
      if (!r) return;
      const h = r.requestHint();
      if (!h) return;
      set({
        hint:
          h.tipo === 'pista'
            ? { texto: h.texto, resaltar: null, numero: r.hintsUsed }
            : { texto: 'Te mostramos dónde tocar.', resaltar: h.objetivo, numero: r.hintsUsed },
      });
    },

    clearHint() {
      set({ hint: { ...get().hint, texto: null } });
    },

    skipTask() {
      get().runner?.skip();
      sync();
    },

    tick() {
      const r = get().runner;
      if (r && !r.finished && r.checkTimeout()) sync();
    },

    pause() {
      get().runner?.pause();
    },
    resume() {
      get().runner?.resume();
      get().tick();
    },

    async finishTask() {
      const s = get().session;
      if (!s || !s.currentRunner) return null;
      const done = s.finishTask();
      set({ last: done, runner: null, phone: null, taskEstado: null, hint: noHint, evaluationDone: s.isFinished });
      await persist();
      return done;
    },

    async closeEvaluation() {
      await persist();
      try {
        set({ pendientes: await pendingAttemptsCount(await getDb()) });
      } catch {}
      void triggerSync();
      get().reset();
    },

    reset() {
      set({ draft: emptyDraft, session: null, runner: null, phone: null, taskEstado: null, hint: noHint, last: null, evaluationDone: false });
    },
  };
});
