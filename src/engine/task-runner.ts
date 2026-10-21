import { classifyAction } from './classify';
import { evaluate, type EvalContext } from './conditions';
import { actionKey, createInitialState, describeAction, isNavigation, reducePhone, stateChanged } from './phone';
import type {
  ActionCounts,
  Clase,
  Clock,
  PhoneAction,
  PhoneState,
  SimEvent,
  TaskDefinition,
  TaskEstado,
  TaskResult,
} from './types';
import { DEFAULT_WORLD, type World } from './world';

export interface RunnerDeps {
  clock: Clock;
  uuid: () => string;
  world?: World;
}

export interface DispatchOutcome {
  event: SimEvent;
  clase: Clase;
  estado: TaskEstado;
}

export type HintResult =
  | { tipo: 'pista'; indice: number; texto: string }
  | { tipo: 'mostrarme'; objetivo: string };

/**
 * Ejecuta UNA tarea: aplica las acciones al teléfono, las clasifica, registra eventos,
 * evalúa hitos y condición de éxito, y administra pistas y tiempo.
 * No conoce la interfaz: la UI solo llama a `dispatch()`.
 */
export class TaskRunner {
  readonly intentoTareaUuid: string;
  private readonly world: World;
  private _state: PhoneState;
  private _estado: TaskEstado = 'en_curso';
  private started = false;
  private startedAt = 0;
  private endedAt: number | null = null;
  private pausedAt: number | null = null;
  private pausedTotal = 0;
  private seq = 0;
  private readonly _events: SimEvent[] = [];
  private readonly visited = new Set<string>();
  private readonly seen = new Set<string>();
  private achieved = new Set<string>();
  private readonly conteo: ActionCounts = { necesaria: 0, exploracion: 0, desviacion: 0, error: 0 };
  private ayudas = 0;
  private guiada = false;
  private toquesVacios = 0;

  constructor(
    readonly task: TaskDefinition,
    private readonly deps: RunnerDeps,
  ) {
    this.intentoTareaUuid = deps.uuid();
    this.world = deps.world ?? DEFAULT_WORLD;
    this._state = createInitialState(task.estadoInicial);
  }

  // ───── estado observable ─────
  get state(): PhoneState {
    return this._state;
  }
  get estado(): TaskEstado {
    return this._estado;
  }
  get events(): readonly SimEvent[] {
    return this._events;
  }
  get finished(): boolean {
    return this._estado !== 'en_curso';
  }
  get paused(): boolean {
    return this.pausedAt !== null;
  }
  get hintsUsed(): number {
    return this.ayudas;
  }
  get hasMoreHints(): boolean {
    return this.ayudas < this.task.ayudas.length || (!!this.task.mostrarme && !this.guiada);
  }
  /** Milisegundos activos de la tarea (sin contar el tiempo en pausa). */
  elapsedMs(): number {
    if (!this.started) return 0;
    const end = this.endedAt ?? this.pausedAt ?? this.deps.clock.now();
    return Math.max(0, end - this.startedAt - this.pausedTotal);
  }
  remainingMs(): number | null {
    if (this.task.tiempoLimiteSeg === null) return null;
    return Math.max(0, this.task.tiempoLimiteSeg * 1000 - this.elapsedMs());
  }

  // ───── ciclo de vida ─────
  start(): PhoneState {
    if (this.started) return this._state;
    this.started = true;
    this.startedAt = this.deps.clock.now();
    this.visited.add(this._state.pantalla);
    this.record('tarea.inicio', this.task.codigo, { version: this.task.version }, null);
    return this._state;
  }

  dispatch(action: PhoneAction): DispatchOutcome | null {
    if (!this.started || this.finished || this.paused) return null;
    if (this.checkTimeout()) return null;

    const before = this._state;
    const after = reducePhone(before, action, this.world);
    const key = actionKey(action);

    const ctxAfter = this.context(after, new Set([...this.visited, after.pantalla]));
    const nowAchieved = new Set((this.task.hitos ?? []).filter((h) => evaluate(h.cuando, ctxAfter)).map((h) => h.id));
    const undidMilestone = [...this.achieved].some((id) => !nowAchieved.has(id));

    const clase = classifyAction({
      task: this.task,
      key,
      navigation: isNavigation(action),
      changed: stateChanged(before, after),
      undidMilestone,
    });
    this.conteo[clase]++;
    if (action.type === 'tap_empty') this.toquesVacios++;

    this._state = after;
    this.visited.add(after.pantalla);
    this.achieved = nowAchieved;

    const d = describeAction(action, before, after);
    const event = this.record(d.tipo, d.objetivo, d.datos, clase);

    if (evaluate(this.task.exito, this.context(after, this.visited))) {
      this.finish(this.guiada ? 'completada_con_guia' : 'completada');
    }
    return { event, clase, estado: this._estado };
  }

  /** Pista siguiente. Cuando se acaban, ofrece "Mostrarme" (si la tarea lo define). */
  requestHint(): HintResult | null {
    if (!this.started || this.finished) return null;
    if (this.ayudas < this.task.ayudas.length) {
      const indice = this.ayudas;
      this.ayudas++;
      this.record('ayuda.mostrada', null, { indice, tipo: 'pista' }, null);
      return { tipo: 'pista', indice, texto: this.task.ayudas[indice]! };
    }
    if (this.task.mostrarme && !this.guiada) {
      this.guiada = true;
      this.ayudas++;
      this.record('ayuda.mostrada', this.task.mostrarme, { tipo: 'mostrarme' }, null);
      return { tipo: 'mostrarme', objetivo: this.task.mostrarme };
    }
    return null;
  }

  skip(): void {
    if (this.started && !this.finished) this.finish('omitida');
  }

  /** La app se cerró o el teléfono se apagó a media tarea. */
  interrupt(): void {
    if (this.started && !this.finished) this.finish('interrumpida');
  }

  /** Revisa el tiempo límite. Devuelve true si la tarea terminó por tiempo. */
  checkTimeout(): boolean {
    if (this.finished || this.task.tiempoLimiteSeg === null) return false;
    if (this.elapsedMs() >= this.task.tiempoLimiteSeg * 1000) {
      this.finish('tiempo_agotado');
      return true;
    }
    return false;
  }

  /** La app pasó a segundo plano: el tiempo deja de contar. */
  pause(): void {
    if (!this.started || this.finished || this.paused) return;
    this.record('app.segundo_plano', null, {}, null);
    this.pausedAt = this.deps.clock.now();
  }

  resume(): void {
    if (this.pausedAt === null) return;
    this.pausedTotal += this.deps.clock.now() - this.pausedAt;
    this.pausedAt = null;
    this.record('app.primer_plano', null, {}, null);
  }

  getResult(): TaskResult {
    const c = this.conteo;
    return {
      intentoTareaUuid: this.intentoTareaUuid,
      tareaCodigo: this.task.codigo,
      tareaVersion: this.task.version,
      estado: this._estado,
      duracionMs: this.elapsedMs(),
      conteo: { ...c },
      acciones: c.necesaria + c.exploracion + c.desviacion + c.error,
      ayudas: this.ayudas,
      guiada: this.guiada,
      toquesVacios: this.toquesVacios,
      hitos: [...this.achieved],
    };
  }

  // ───── internos ─────
  private context(state: PhoneState, visited: ReadonlySet<string>): EvalContext {
    return { state, visited, events: this.seen };
  }

  private finish(estado: TaskEstado): void {
    if (this.finished) return;
    this.endedAt = this.pausedAt ?? this.deps.clock.now();
    this._estado = estado;
    this.record('tarea.fin', this.task.codigo, { estado }, null);
  }

  private record(tipo: string, objetivo: string | null, datos: Record<string, unknown>, clase: Clase | null): SimEvent {
    const event: SimEvent = {
      uuid: this.deps.uuid(),
      intentoTareaUuid: this.intentoTareaUuid,
      seq: ++this.seq,
      tRelMs: Math.round(this.elapsedMs()),
      tsDispositivo: this.deps.clock.iso(),
      tipo,
      objetivo,
      datos,
      clase,
    };
    this._events.push(event);
    this.seen.add(`${tipo}:${objetivo ?? ''}`);
    this.seen.add(tipo);
    return event;
  }
}
