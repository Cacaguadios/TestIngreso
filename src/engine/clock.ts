import type { Clock } from './types';

export const systemClock: Clock = {
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  iso: () => new Date().toISOString(),
};

/** Reloj controlable para pruebas. */
export class ManualClock implements Clock {
  private t = 0;
  constructor(private readonly start = Date.UTC(2026, 9, 21, 16, 34, 10)) {}
  now(): number {
    return this.t;
  }
  iso(): string {
    return new Date(this.start + this.t).toISOString();
  }
  advance(ms: number): void {
    this.t += ms;
  }
}

/** Generador de UUID determinista para pruebas. */
export function counterUuid(prefix = 'id'): () => string {
  let n = 0;
  return () => `${prefix}-${++n}`;
}
