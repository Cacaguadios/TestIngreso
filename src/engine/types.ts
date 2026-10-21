/**
 * Tipos del motor de evaluación. Este módulo y todo `src/engine` son TypeScript puro:
 * no importan React, Expo ni nada de la interfaz, para poder probarse en Node.
 */

// ───────────────────────────── Teléfono simulado ─────────────────────────────

export interface PhoneState {
  /** Pantalla visible. Ver `SCREEN_IDS` en phone.ts. */
  pantalla: string;
  /** Historial de pantallas anteriores (la última es a la que regresa "atrás"). */
  pila: string[];
  conectividad: {
    wifi: boolean;
    redWifi: string | null;
    datos: boolean;
    modoAvion: boolean;
    bluetooth: boolean;
  };
  sonido: { multimedia: number; llamada: number; timbre: number; vibrar: boolean };
  pantallaCfg: { brillo: number; modoOscuro: boolean; brilloAdaptable: boolean };
  navegador: { borrador: string; consulta: string | null; resultadoAbierto: string | null };
  wifiDialogo: { ssid: string | null; clave: string; error: boolean };
  archivos: { consulta: string; abierto: string | null };
  mensajes: { borrador: string; enviados: { a: string; texto: string }[] };
  contactos: { seleccionado: string | null };
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

export type ToggleKey = 'wifi' | 'modoAvion' | 'bluetooth' | 'datos' | 'vibrar' | 'modoOscuro' | 'brilloAdaptable';
export type SliderKey = 'brillo' | 'volMultimedia' | 'volLlamada' | 'volTimbre';
export type TextField = 'navegador.borrador' | 'wifi.clave' | 'archivos.consulta' | 'mensajes.borrador';
export type SubmitField =
  | 'navegador.buscar'
  | 'wifi.conectar'
  | 'archivos.buscar'
  | 'mensajes.enviar';

/** Todo lo que el candidato puede hacer en el teléfono simulado. */
export type PhoneAction =
  | { type: 'open'; target: string }
  | { type: 'back' }
  | { type: 'home' }
  | { type: 'recents' }
  | { type: 'toggle'; key: ToggleKey }
  | { type: 'slide'; key: SliderKey; value: number }
  | { type: 'select'; group: 'red' | 'resultado' | 'sugerencia' | 'archivo' | 'contacto'; value: string }
  | { type: 'set_text'; field: TextField; value: string }
  | { type: 'submit'; field: SubmitField }
  | { type: 'tap_empty' };

// ───────────────────────────── Condiciones de tarea ─────────────────────────────

export type Cond =
  | { estado: string; igual: unknown }
  | { estado: string; contiene: string }
  | { estado: string; existe: boolean }
  | { visito: string }
  | { evento: string }
  | { todas: Cond[] }
  | { alguna: Cond[] }
  | { no: Cond };

export interface Hito {
  id: string;
  /** Peso relativo para dar crédito parcial. Se normaliza entre todos los hitos. */
  peso: number;
  cuando: Cond;
}

// ───────────────────────────── Definición de tarea ─────────────────────────────

export interface TaskDefinition {
  codigo: string;
  version: number;
  titulo: string;
  instruccion: string;
  categoria: string;
  nivel: number;
  practica?: boolean;
  estadoInicial?: DeepPartial<PhoneState>;
  exito: Cond;
  hitos?: Hito[];
  pasosOptimos: number;
  /** Rutas válidas. Los pasos aceptan `*` al final como comodín (`seleccionar:resultado:*`). */
  rutasValidas: string[][];
  acciones?: { error?: string[]; neutras?: string[] };
  ayudas: string[];
  /** Si existe, tras la última pista se ofrece "Mostrarme" resaltando este elemento. */
  mostrarme?: string;
  tiempoReferenciaSeg: number;
  /** `null` = sin límite (p. ej. tarea de práctica). */
  tiempoLimiteSeg: number | null;
}

// ───────────────────────────── Eventos y resultados ─────────────────────────────

export type Clase = 'necesaria' | 'exploracion' | 'desviacion' | 'error';

export interface SimEvent {
  uuid: string;
  intentoTareaUuid: string;
  seq: number;
  /** Milisegundos desde el inicio de la tarea (reloj monotónico, sin tiempo en pausa). */
  tRelMs: number;
  /** Hora del dispositivo (solo para mostrar). */
  tsDispositivo: string;
  tipo: string;
  objetivo: string | null;
  datos: Record<string, unknown>;
  clase: Clase | null;
}

export type TaskEstado =
  | 'en_curso'
  | 'completada'
  | 'completada_con_guia'
  | 'tiempo_agotado'
  | 'omitida'
  | 'interrumpida';

export interface ActionCounts {
  necesaria: number;
  exploracion: number;
  desviacion: number;
  error: number;
}

export interface TaskResult {
  intentoTareaUuid: string;
  tareaCodigo: string;
  tareaVersion: number;
  estado: TaskEstado;
  duracionMs: number;
  conteo: ActionCounts;
  /** Total de acciones del candidato (necesarias + exploración + desviaciones + errores). */
  acciones: number;
  ayudas: number;
  guiada: boolean;
  toquesVacios: number;
  hitos: string[];
}

// ───────────────────────────── Puntuación ─────────────────────────────

export interface ScoringWeights {
  resultado: number;
  eficiencia: number;
  tiempo: number;
  independencia: number;
  /** Puntos que resta cada error. */
  error: number;
  /** Máximo total que pueden restar los errores. */
  errorMax: number;
  /** Puntos que resta cada ayuda. */
  ayuda: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  resultado: 50,
  eficiencia: 20,
  tiempo: 15,
  independencia: 15,
  error: 3,
  errorMax: 15,
  ayuda: 5,
};

export interface ScoreBreakdown {
  resultado: number;
  eficiencia: number;
  tiempo: number;
  independencia: number;
  errores: number;
}

export interface TaskScore {
  puntuacion: number;
  desglose: ScoreBreakdown;
}

export interface Level {
  nombre: string;
  min: number;
}

export interface Clock {
  /** Milisegundos de un reloj monotónico. */
  now(): number;
  /** Hora de pared en ISO 8601. */
  iso(): string;
}
