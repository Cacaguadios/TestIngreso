import { DatabaseSync } from 'node:sqlite';
import type { Db } from '../../src/db/db';

/** Base SQLite en memoria (node:sqlite) con la misma interfaz que expo-sqlite. */
type Param = string | number | bigint | null;
export function openMemory(): Db {
  const raw = new DatabaseSync(':memory:');
  const p = (a?: unknown[]) => (a ?? []) as Param[];
  return {
    execAsync: async (sql) => { raw.exec(sql); },
    runAsync: async (sql, params) => raw.prepare(sql).run(...p(params)),
    getAllAsync: async <T>(sql: string, params?: unknown[]) => raw.prepare(sql).all(...p(params)) as T[],
    getFirstAsync: async <T>(sql: string, params?: unknown[]) => (raw.prepare(sql).get(...p(params)) as T | undefined) ?? null,
    withTransactionAsync: async (task) => {
      raw.exec('BEGIN');
      try { await task(); raw.exec('COMMIT'); } catch (e) { raw.exec('ROLLBACK'); throw e; }
    },
  };
}
