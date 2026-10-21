import { scoreEvaluation, scoreTask } from './scoring';
import { TaskRunner, type RunnerDeps } from './task-runner';
import type { Level, ScoringWeights, SimEvent, TaskDefinition, TaskResult, TaskScore } from './types';

export interface TaskSlot {
  orden: number;
  peso: number;
  practica: boolean;
  definicion: TaskDefinition;
}

export interface EvaluationDefinition {
  versionId: number;
  codigo: string;
  nombre: string;
  requierePin: boolean;
  pesos: ScoringWeights;
  niveles: Level[];
  tareas: TaskSlot[];
}

export interface Participant {
  uuid: string;
  nombre: string;
  apellidos: string;
  puestoId: number;
  sucursalId: number | null;
  aceptoPrivacidadEn: string;
}

export interface CompletedTask {
  slot: TaskSlot;
  result: TaskResult;
  score: TaskScore;
  events: SimEvent[];
}

export type AttemptEstado = 'en_curso' | 'terminado' | 'abandonado';

export interface EvaluationSummary {
  puntuacion: number;
  nivel: string | null;
  tareas: { codigo: string; practica: boolean; estado: string; puntuacion: number }[];
}

/** Lleva el orden de las tareas de un intento y junta sus resultados. */
export class EvaluationSession {
  readonly intentoUuid: string;
  readonly inicio: string;
  private _fin: string | null = null;
  private _estado: AttemptEstado = 'en_curso';
  private index = 0;
  private runner: TaskRunner | null = null;
  private readonly _completed: CompletedTask[] = [];
  private readonly slots: TaskSlot[];

  constructor(
    readonly definition: EvaluationDefinition,
    readonly participant: Participant,
    private readonly deps: RunnerDeps,
  ) {
    this.slots = [...definition.tareas].sort((a, b) => a.orden - b.orden);
    this.intentoUuid = deps.uuid();
    this.inicio = deps.clock.iso();
  }

  get total(): number {
    return this.slots.length;
  }
  /** Cuántas tareas calificadas (sin práctica) hay en total / completadas. */
  get calificadasTotal(): number {
    return this.slots.filter((s) => !s.practica).length;
  }
  get calificadasHechas(): number {
    return this._completed.filter((c) => !c.slot.practica).length;
  }
  get position(): number {
    return this.index;
  }
  get currentSlot(): TaskSlot | null {
    return this.slots[this.index] ?? null;
  }
  get currentRunner(): TaskRunner | null {
    return this.runner;
  }
  get isFinished(): boolean {
    return this._estado !== 'en_curso';
  }
  get estado(): AttemptEstado {
    return this._estado;
  }
  get fin(): string | null {
    return this._fin;
  }
  get completed(): readonly CompletedTask[] {
    return this._completed;
  }

  startTask(): TaskRunner {
    const slot = this.currentSlot;
    if (!slot) throw new Error('No quedan tareas por iniciar.');
    if (this.runner && !this.runner.finished) throw new Error('La tarea actual sigue en curso.');
    this.runner = new TaskRunner(slot.definicion, this.deps);
    this.runner.start();
    return this.runner;
  }

  /** Cierra la tarea actual (debe estar terminada), la califica y avanza a la siguiente. */
  finishTask(): CompletedTask {
    const slot = this.currentSlot;
    const runner = this.runner;
    if (!slot || !runner) throw new Error('No hay tarea en curso.');
    if (!runner.finished) throw new Error('La tarea todavía no termina.');
    const result = runner.getResult();
    const score = scoreTask(slot.definicion, result, this.definition.pesos);
    const done: CompletedTask = { slot, result, score, events: [...runner.events] };
    this._completed.push(done);
    this.runner = null;
    this.index++;
    if (this.index >= this.slots.length) {
      this._estado = 'terminado';
      this._fin = this.deps.clock.iso();
    }
    return done;
  }

  abandon(): void {
    if (this.isFinished) return;
    this.runner?.interrupt();
    this._estado = 'abandonado';
    this._fin = this.deps.clock.iso();
  }

  summary(): EvaluationSummary {
    const { puntuacion, nivel } = scoreEvaluation(
      this._completed.map((c) => ({ peso: c.slot.peso, practica: c.slot.practica, puntuacion: c.score.puntuacion })),
      this.definition.niveles,
    );
    return {
      puntuacion,
      nivel,
      tareas: this._completed.map((c) => ({
        codigo: c.slot.definicion.codigo,
        practica: c.slot.practica,
        estado: c.result.estado,
        puntuacion: c.score.puntuacion,
      })),
    };
  }

  /** Registros listos para guardar en SQLite y enviar a POI. */
  toRecords() {
    const s = this.summary();
    const eventos = this._completed.flatMap((c) => c.events);
    return {
      participante: this.participant,
      intento: {
        uuid: this.intentoUuid,
        participanteUuid: this.participant.uuid,
        evaluacionVersionId: this.definition.versionId,
        inicio: this.inicio,
        fin: this._fin,
        estado: this._estado,
        puntuacion: s.puntuacion,
        nivel: s.nivel,
        totalEventos: eventos.length,
      },
      intentoTareas: this._completed.map((c) => ({
        uuid: c.result.intentoTareaUuid,
        intentoUuid: this.intentoUuid,
        tareaCodigo: c.result.tareaCodigo,
        tareaVersion: c.result.tareaVersion,
        orden: c.slot.orden,
        estado: c.result.estado,
        duracionMs: Math.round(c.result.duracionMs),
        acciones: c.result.acciones,
        errores: c.result.conteo.error,
        ayudas: c.result.ayudas,
        puntuacion: c.score.puntuacion,
        detalle: { conteo: c.result.conteo, hitos: c.result.hitos, desglose: c.score.desglose, toquesVacios: c.result.toquesVacios },
      })),
      eventos,
    };
  }
}
