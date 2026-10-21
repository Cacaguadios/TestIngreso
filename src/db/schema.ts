/** Esquema de SQLite local. Ver docs/02_TELEMETRIA.md. */

export const SCHEMA_VERSION = 1;

export const MIGRATIONS: Record<number, string> = {
  1: `
CREATE TABLE IF NOT EXISTS paquete (
  version TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  descargado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS participante (
  uuid TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  puesto_id INTEGER NOT NULL,
  sucursal_id INTEGER,
  acepto_privacidad_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS intento (
  uuid TEXT PRIMARY KEY,
  participante_uuid TEXT NOT NULL,
  evaluacion_version_id INTEGER NOT NULL,
  inicio TEXT NOT NULL,
  fin TEXT,
  estado TEXT NOT NULL,
  puntuacion REAL,
  nivel TEXT,
  total_eventos INTEGER NOT NULL DEFAULT 0,
  sincronizado INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS intento_tarea (
  uuid TEXT PRIMARY KEY,
  intento_uuid TEXT NOT NULL,
  tarea_codigo TEXT NOT NULL,
  tarea_version INTEGER NOT NULL,
  orden INTEGER NOT NULL,
  estado TEXT NOT NULL,
  duracion_ms INTEGER NOT NULL,
  acciones INTEGER NOT NULL,
  errores INTEGER NOT NULL,
  ayudas INTEGER NOT NULL,
  puntuacion REAL NOT NULL,
  detalle_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS evento (
  uuid TEXT PRIMARY KEY,
  intento_tarea_uuid TEXT NOT NULL,
  seq INTEGER NOT NULL,
  t_rel_ms INTEGER NOT NULL,
  ts_dispositivo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  objetivo TEXT,
  datos_json TEXT NOT NULL,
  clase TEXT,
  enviado INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_evento_pend ON evento(enviado, intento_tarea_uuid);
CREATE INDEX IF NOT EXISTS idx_tarea_intento ON intento_tarea(intento_uuid);
`,
};
