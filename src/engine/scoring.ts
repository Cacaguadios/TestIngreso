import { DEFAULT_WEIGHTS, type Level, type ScoreBreakdown, type ScoringWeights, type TaskDefinition, type TaskResult, type TaskScore } from './types';

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const isCompleted = (r: Pick<TaskResult, 'estado'>): boolean =>
  r.estado === 'completada' || r.estado === 'completada_con_guia';

/**
 * Acciones que cuentan para la eficiencia: no se castiga explorar (hasta 2× los pasos óptimos),
 * solo lo que pasa de ahí, más las desviaciones y los errores.
 */
export function effectiveActions(task: TaskDefinition, r: TaskResult): number {
  const allowance = 2 * task.pasosOptimos;
  const exceso = Math.max(0, r.conteo.exploracion - allowance);
  return r.conteo.necesaria + r.conteo.desviacion + r.conteo.error + exceso;
}

export function scoreTask(task: TaskDefinition, r: TaskResult, w: ScoringWeights = DEFAULT_WEIGHTS): TaskScore {
  const done = isCompleted(r);

  // Resultado: completa = todo; si no, crédito parcial por hitos (los pesos suman < 1).
  let resultado = w.resultado;
  if (!done) {
    const got = (task.hitos ?? []).filter((h) => r.hitos.includes(h.id)).reduce((a, h) => a + h.peso, 0);
    resultado = w.resultado * clamp(got, 0, 1);
  }

  let eficiencia = 0;
  let tiempo = 0;
  if (done) {
    const efectivas = effectiveActions(task, r);
    eficiencia = w.eficiencia * (efectivas <= 0 ? 1 : Math.min(1, task.pasosOptimos / efectivas));

    const t = r.duracionMs / 1000;
    const ref = task.tiempoReferenciaSeg;
    const limite = task.tiempoLimiteSeg;
    if (t <= ref || limite === null || limite <= ref) tiempo = w.tiempo;
    else tiempo = w.tiempo * clamp(1 - (t - ref) / (limite - ref), 0, 1);
  }

  const independencia = r.guiada ? 0 : Math.max(0, w.independencia - w.ayuda * r.ayudas);
  const errores = -Math.min(w.errorMax, w.error * r.conteo.error);

  const desglose: ScoreBreakdown = {
    resultado: round1(resultado),
    eficiencia: round1(eficiencia),
    tiempo: round1(tiempo),
    independencia: round1(independencia),
    errores: round1(errores),
  };
  const total = desglose.resultado + desglose.eficiencia + desglose.tiempo + desglose.independencia + desglose.errores;
  return { puntuacion: round1(clamp(total, 0, 100)), desglose };
}

export interface ScoredTask {
  peso: number;
  practica: boolean;
  puntuacion: number;
}

/** Promedio ponderado de las tareas calificadas (la práctica no cuenta). */
export function scoreEvaluation(tareas: ScoredTask[], niveles: Level[]): { puntuacion: number; nivel: string | null } {
  const calificadas = tareas.filter((t) => !t.practica);
  const pesoTotal = calificadas.reduce((a, t) => a + t.peso, 0);
  if (calificadas.length === 0 || pesoTotal <= 0) return { puntuacion: 0, nivel: null };
  const puntuacion = round1(calificadas.reduce((a, t) => a + t.puntuacion * t.peso, 0) / pesoTotal);
  return { puntuacion, nivel: levelFor(puntuacion, niveles) };
}

export function levelFor(puntuacion: number, niveles: Level[]): string | null {
  const orden = [...niveles].sort((a, b) => a.min - b.min);
  let nivel: string | null = null;
  for (const l of orden) if (puntuacion >= l.min) nivel = l.nombre;
  return nivel;
}
