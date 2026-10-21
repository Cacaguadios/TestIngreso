import * as SQLite from 'expo-sqlite';
import { migrate, type Db } from './db';

let opening: Promise<Db> | null = null;

/** Abre (una sola vez) la base local y aplica migraciones. */
export function getDb(): Promise<Db> {
  opening ??= (async () => {
    const raw = await SQLite.openDatabaseAsync('evaluacion.db');
    await raw.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = OFF;');
    const db: Db = {
      execAsync: (sql) => raw.execAsync(sql),
      runAsync: (sql, params = []) => raw.runAsync(sql, params as SQLite.SQLiteBindParams),
      getAllAsync: <T>(sql: string, params: unknown[] = []) => raw.getAllAsync<T>(sql, params as SQLite.SQLiteBindParams),
      getFirstAsync: <T>(sql: string, params: unknown[] = []) => raw.getFirstAsync<T>(sql, params as SQLite.SQLiteBindParams),
      withTransactionAsync: (task) => raw.withTransactionAsync(task),
    };
    await migrate(db);
    return db;
  })();
  return opening;
}
