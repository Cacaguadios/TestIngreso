import { MIGRATIONS, SCHEMA_VERSION } from './schema';

/**
 * Subconjunto de la API de `expo-sqlite` que usa la app. Al depender de esta interfaz,
 * el repositorio se puede probar en Node con `node:sqlite`.
 */
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let v = row?.user_version ?? 0;
  while (v < SCHEMA_VERSION) {
    v++;
    const sql = MIGRATIONS[v];
    if (!sql) throw new Error(`Falta la migración ${v}`);
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${v}`);
    });
  }
}
