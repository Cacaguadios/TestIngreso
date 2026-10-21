import type { Cond, PhoneState } from './types';

export interface EvalContext {
  state: PhoneState;
  /** Pantallas por las que ha pasado el candidato (incluida la inicial). */
  visited: ReadonlySet<string>;
  /** Eventos ocurridos, como `tipo:objetivo`. */
  events: ReadonlySet<string>;
}

export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function getByPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function evaluate(cond: Cond, ctx: EvalContext): boolean {
  if ('todas' in cond) return cond.todas.every((c) => evaluate(c, ctx));
  if ('alguna' in cond) return cond.alguna.some((c) => evaluate(c, ctx));
  if ('no' in cond) return !evaluate(cond.no, ctx);
  if ('visito' in cond) return ctx.visited.has(cond.visito);
  if ('evento' in cond) return ctx.events.has(cond.evento);
  const value = getByPath(ctx.state, cond.estado);
  if ('igual' in cond) return deepEqual(value, cond.igual);
  if ('contiene' in cond) {
    return typeof value === 'string' && normalizeText(value).includes(normalizeText(cond.contiene));
  }
  const exists = value !== null && value !== undefined && value !== '';
  return exists === cond.existe;
}

/** `seleccionar:resultado:*` coincide con cualquier cosa tras el prefijo. */
export function matchesPattern(key: string, pattern: string): boolean {
  if (pattern.endsWith('*')) return key.startsWith(pattern.slice(0, -1));
  return key === pattern;
}

export function matchesAny(key: string, patterns: readonly string[] | undefined): boolean {
  return !!patterns && patterns.some((p) => matchesPattern(key, p));
}
