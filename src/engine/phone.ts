/**
 * Motor del teléfono simulado: estado + reductor puro.
 * No sabe nada de tareas ni de puntuación; solo "qué pasa en el teléfono cuando se hace X".
 */
import type { DeepPartial, PhoneAction, PhoneState, SliderKey, ToggleKey } from './types';
import { normalizeText } from './conditions';
import { DEFAULT_WORLD, type World } from './world';

export const SCREEN_IDS = [
  'inicio',
  'ajustes_rapidos',
  'ajustes',
  'ajustes.red',
  'ajustes.internet',
  'ajustes.bluetooth',
  'ajustes.sonido',
  'ajustes.pantalla',
  'wifi.contrasena',
  'navegador',
  'navegador.escribiendo',
  'navegador.resultados',
  'navegador.pagina',
  'archivos',
  'archivos.busqueda',
  'archivos.documentos',
  'archivos.imagenes',
  'archivos.videos',
  'archivos.audio',
  'archivos.visor',
  'mensajes',
  'mensajes.nuevo',
  'mensajes.redactar',
  'galeria',
  'camara',
  'contactos',
  'contactos.detalle',
  'mapas',
  'telefono',
  'telefono.llamada',
] as const;

const KNOWN = new Set<string>(SCREEN_IDS);
export const isKnownScreen = (id: string): boolean => KNOWN.has(id);

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function createInitialState(overrides?: DeepPartial<PhoneState>): PhoneState {
  const base: PhoneState = {
    pantalla: 'inicio',
    pila: [],
    conectividad: { wifi: false, redWifi: null, datos: true, modoAvion: false, bluetooth: false, dispositivoBt: null },
    sistema: { linterna: false, noMolestar: false, ahorroBateria: false },
    sonido: { multimedia: 60, llamada: 50, timbre: 70, vibrar: true },
    pantallaCfg: { brillo: 60, modoOscuro: false, brilloAdaptable: false },
    navegador: { borrador: '', consulta: null, resultadoAbierto: null },
    wifiDialogo: { ssid: null, clave: '', error: false },
    archivos: { consulta: '', abierto: null },
    mensajes: { conversacion: null, borrador: '', enviados: [], ultimo: null },
    contactos: { seleccionado: null },
    telefono: { numero: '', enLlamada: null, llamadas: [] },
    camara: { fotos: 0 },
    mapas: { consulta: '', buscado: null, ruta: false },
  };
  return overrides ? mergeDeep(base, overrides) : base;
}

function mergeDeep<T>(base: T, patch: DeepPartial<T>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const cur = out[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && cur !== null && typeof cur === 'object' && !Array.isArray(cur)) {
      out[k] = mergeDeep(cur, v as DeepPartial<typeof cur>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

// ───────────────────────────── Navegación ─────────────────────────────

function goto(s: PhoneState, target: string): PhoneState {
  if (!isKnownScreen(target) || target === s.pantalla) return s;
  return { ...s, pantalla: target, pila: [...s.pila, s.pantalla] };
}

/** Limpia lo que no debe sobrevivir al salir de una pantalla (diálogos, llamada en curso). */
function leaving(s: PhoneState, from: string): PhoneState {
  if (from === 'wifi.contrasena') return { ...s, wifiDialogo: { ssid: null, clave: '', error: false } };
  if (from === 'telefono.llamada') return { ...s, telefono: { ...s.telefono, enLlamada: null } };
  return s;
}

function goBack(s: PhoneState): PhoneState {
  if (s.pila.length === 0) return s;
  const pila = s.pila.slice(0, -1);
  const pantalla = s.pila[s.pila.length - 1]!;
  return leaving({ ...s, pantalla, pila }, s.pantalla);
}

function goHome(s: PhoneState): PhoneState {
  if (s.pantalla === 'inicio' && s.pila.length === 0) return s;
  let next: PhoneState = { ...s, pantalla: 'inicio', pila: [] };
  for (const p of [s.pantalla, ...s.pila]) next = leaving(next, p);
  return next;
}

// ───────────────────────────── Ajustes ─────────────────────────────

function toggle(s: PhoneState, key: ToggleKey): PhoneState {
  const c = s.conectividad;
  switch (key) {
    case 'wifi': {
      const wifi = !c.wifi;
      return { ...s, conectividad: { ...c, wifi, redWifi: wifi ? c.redWifi : null } };
    }
    case 'modoAvion': {
      const modoAvion = !c.modoAvion;
      return {
        ...s,
        conectividad: modoAvion
          ? { ...c, modoAvion, wifi: false, redWifi: null, bluetooth: false, dispositivoBt: null }
          : { ...c, modoAvion },
      };
    }
    case 'bluetooth': {
      // Con modo avión activo, Bluetooth no se puede encender (igual que en Android).
      if (c.modoAvion && !c.bluetooth) return s;
      const bluetooth = !c.bluetooth;
      return { ...s, conectividad: { ...c, bluetooth, dispositivoBt: bluetooth ? c.dispositivoBt : null } };
    }
    case 'datos':
      return { ...s, conectividad: { ...c, datos: !c.datos } };
    case 'vibrar':
      return { ...s, sonido: { ...s.sonido, vibrar: !s.sonido.vibrar } };
    case 'modoOscuro':
      return { ...s, pantallaCfg: { ...s.pantallaCfg, modoOscuro: !s.pantallaCfg.modoOscuro } };
    case 'brilloAdaptable':
      return { ...s, pantallaCfg: { ...s.pantallaCfg, brilloAdaptable: !s.pantallaCfg.brilloAdaptable } };
    case 'linterna':
    case 'noMolestar':
    case 'ahorroBateria':
      return { ...s, sistema: { ...s.sistema, [key]: !s.sistema[key] } };
  }
}

function slide(s: PhoneState, key: SliderKey, raw: number): PhoneState {
  const value = Math.max(0, Math.min(100, Math.round(raw)));
  switch (key) {
    case 'brillo':
      return { ...s, pantallaCfg: { ...s.pantallaCfg, brillo: value } };
    case 'volMultimedia':
      return { ...s, sonido: { ...s.sonido, multimedia: value } };
    case 'volLlamada':
      return { ...s, sonido: { ...s.sonido, llamada: value } };
    case 'volTimbre':
      return { ...s, sonido: { ...s.sonido, timbre: value } };
  }
}

// ───────────────────────────── Selección y envío ─────────────────────────────

function startCall(s: PhoneState, numero: string): PhoneState {
  const n = onlyDigits(numero);
  if (!n) return s;
  return goto({ ...s, telefono: { numero: '', enLlamada: n, llamadas: [...s.telefono.llamadas, n] } }, 'telefono.llamada');
}

function select(s: PhoneState, a: Extract<PhoneAction, { type: 'select' }>, w: World): PhoneState {
  switch (a.group) {
    case 'red': {
      const red = w.redes.find((r) => r.ssid === a.value);
      if (!red || !s.conectividad.wifi || s.conectividad.redWifi === red.ssid) return s;
      if (!red.segura) return { ...s, conectividad: { ...s.conectividad, redWifi: red.ssid } };
      return goto({ ...s, wifiDialogo: { ssid: red.ssid, clave: '', error: false } }, 'wifi.contrasena');
    }
    case 'resultado':
      if (s.navegador.consulta === null) return s;
      return goto({ ...s, navegador: { ...s.navegador, resultadoAbierto: a.value } }, 'navegador.pagina');
    case 'sugerencia': {
      const consulta = a.value.trim();
      if (!consulta) return s;
      const base = s.pantalla === 'navegador.escribiendo' ? goBack(s) : s;
      return goto({ ...base, navegador: { borrador: consulta, consulta, resultadoAbierto: null } }, 'navegador.resultados');
    }
    case 'archivo':
      return goto({ ...s, archivos: { ...s.archivos, abierto: a.value } }, 'archivos.visor');
    case 'contacto':
      return goto({ ...s, contactos: { seleccionado: a.value } }, 'contactos.detalle');
    case 'conversacion': {
      // Desde "Nuevo chat" se reemplaza esa pantalla por la conversación (como en Android).
      const base = s.pantalla === 'mensajes.nuevo' ? goBack(s) : s;
      return goto({ ...base, mensajes: { ...base.mensajes, conversacion: a.value, borrador: '' } }, 'mensajes.redactar');
    }
    case 'llamar':
      return startCall(s, a.value);
    case 'bt':
      if (!s.conectividad.bluetooth || !w.dispositivosBt.some((d) => d.nombre === a.value)) return s;
      return { ...s, conectividad: { ...s.conectividad, dispositivoBt: s.conectividad.dispositivoBt === a.value ? null : a.value } };
    case 'lugar': {
      const lugar = a.value.trim();
      if (!lugar) return s;
      return { ...s, mapas: { consulta: lugar, buscado: lugar, ruta: false } };
    }
  }
}

function submit(s: PhoneState, field: Extract<PhoneAction, { type: 'submit' }>['field'], w: World): PhoneState {
  switch (field) {
    case 'navegador.buscar': {
      const consulta = s.navegador.borrador.trim();
      if (!consulta) return s;
      const base = s.pantalla === 'navegador.escribiendo' ? goBack(s) : s;
      return goto({ ...base, navegador: { borrador: consulta, consulta, resultadoAbierto: null } }, 'navegador.resultados');
    }
    case 'wifi.conectar': {
      const red = w.redes.find((r) => r.ssid === s.wifiDialogo.ssid);
      if (!red) return s;
      if (red.clave !== undefined && s.wifiDialogo.clave !== red.clave) {
        return { ...s, wifiDialogo: { ...s.wifiDialogo, error: true } };
      }
      const conectado: PhoneState = {
        ...s,
        conectividad: { ...s.conectividad, wifi: true, redWifi: red.ssid },
        wifiDialogo: { ssid: null, clave: '', error: false },
      };
      return goBack(conectado);
    }
    case 'archivos.buscar': {
      if (!s.archivos.consulta.trim()) return s;
      return goto(s, 'archivos.busqueda');
    }
    case 'mensajes.enviar': {
      const texto = s.mensajes.borrador.trim();
      if (!texto) return s;
      const msg = { a: s.mensajes.conversacion ?? 'Ana López', texto };
      return { ...s, mensajes: { ...s.mensajes, borrador: '', enviados: [...s.mensajes.enviados, msg], ultimo: msg } };
    }
    case 'telefono.llamar':
      return startCall(s, s.telefono.numero);
    case 'telefono.colgar':
      return s.pantalla === 'telefono.llamada' ? goBack(s) : s;
    case 'camara.disparar':
      return { ...s, camara: { fotos: s.camara.fotos + 1 } };
    case 'mapas.buscar': {
      const consulta = s.mapas.consulta.trim();
      if (!consulta) return s;
      return { ...s, mapas: { consulta, buscado: consulta, ruta: false } };
    }
    case 'mapas.ruta':
      return s.mapas.buscado ? { ...s, mapas: { ...s.mapas, ruta: true } } : s;
  }
}

function setText(s: PhoneState, field: Extract<PhoneAction, { type: 'set_text' }>['field'], value: string): PhoneState {
  switch (field) {
    case 'navegador.borrador':
      return { ...s, navegador: { ...s.navegador, borrador: value } };
    case 'wifi.clave':
      return { ...s, wifiDialogo: { ...s.wifiDialogo, clave: value, error: false } };
    case 'archivos.consulta':
      return { ...s, archivos: { ...s.archivos, consulta: value } };
    case 'mensajes.borrador':
      return { ...s, mensajes: { ...s.mensajes, borrador: value } };
    case 'telefono.numero':
      return { ...s, telefono: { ...s.telefono, numero: onlyDigits(value).slice(0, 15) } };
    case 'mapas.consulta':
      return { ...s, mapas: { ...s.mapas, consulta: value } };
  }
}

// ───────────────────────────── Reductor ─────────────────────────────

export function reducePhone(s: PhoneState, a: PhoneAction, w: World = DEFAULT_WORLD): PhoneState {
  switch (a.type) {
    case 'open':
      return goto(s, a.target);
    case 'back':
      return goBack(s);
    case 'home':
      return goHome(s);
    case 'recents':
    case 'tap_empty':
      return s;
    case 'toggle':
      return toggle(s, a.key);
    case 'slide':
      return slide(s, a.key, a.value);
    case 'select':
      return select(s, a, w);
    case 'set_text':
      return setText(s, a.field, a.value);
    case 'submit':
      return submit(s, a.field, w);
  }
}

// ───────────────────────────── Utilidades para tareas y telemetría ─────────────────────────────

/** Clave estable de una acción. Es el vocabulario de `rutasValidas` y `acciones` en las tareas. */
export function actionKey(a: PhoneAction): string {
  switch (a.type) {
    case 'open':
      return `abrir:${a.target}`;
    case 'back':
      return 'atras';
    case 'home':
      return 'inicio';
    case 'recents':
      return 'recientes';
    case 'toggle':
      return `toggle:${a.key}`;
    case 'slide':
      return `deslizar:${a.key}`;
    case 'select':
      return `seleccionar:${a.group}:${a.value}`;
    case 'set_text':
      return `texto:${a.field}`;
    case 'submit':
      return `enviar:${a.field}`;
    case 'tap_empty':
      return 'toque.vacio';
  }
}

export interface EventDescriptor {
  tipo: string;
  objetivo: string | null;
  datos: Record<string, unknown>;
}

/** Cómo se registra la acción en la telemetría. */
export function describeAction(a: PhoneAction, before: PhoneState, after: PhoneState): EventDescriptor {
  const datos: Record<string, unknown> = { pantalla: before.pantalla };
  switch (a.type) {
    case 'open':
      return { tipo: 'abrir', objetivo: a.target, datos };
    case 'back':
      return { tipo: 'atras', objetivo: null, datos };
    case 'home':
      return { tipo: 'inicio', objetivo: null, datos };
    case 'recents':
      return { tipo: 'recientes', objetivo: null, datos };
    case 'toggle': {
      const valor = readToggle(after, a.key);
      return { tipo: 'toggle', objetivo: a.key, datos: { ...datos, valor } };
    }
    case 'slide':
      return { tipo: 'deslizar', objetivo: a.key, datos: { ...datos, valor: a.value } };
    case 'select':
      return { tipo: 'seleccionar', objetivo: `${a.group}:${a.value}`, datos };
    case 'set_text':
      return { tipo: 'texto', objetivo: a.field, datos: { ...datos, texto: a.field === 'wifi.clave' ? '•'.repeat(a.value.length) : a.value } };
    case 'submit':
      return { tipo: 'enviar', objetivo: a.field, datos };
    case 'tap_empty':
      return { tipo: 'toque.vacio', objetivo: null, datos };
  }
}

function readToggle(s: PhoneState, key: ToggleKey): boolean {
  switch (key) {
    case 'wifi':
    case 'modoAvion':
    case 'bluetooth':
    case 'datos':
      return s.conectividad[key];
    case 'vibrar':
      return s.sonido.vibrar;
    case 'modoOscuro':
    case 'brilloAdaptable':
      return s.pantallaCfg[key];
    case 'linterna':
    case 'noMolestar':
    case 'ahorroBateria':
      return s.sistema[key];
  }
}

/** ¿Cambió algo del teléfono además de la navegación? */
export function stateChanged(before: PhoneState, after: PhoneState): boolean {
  const strip = (s: PhoneState) => {
    const { pantalla: _p, pila: _q, ...rest } = s;
    return JSON.stringify(rest);
  };
  return strip(before) !== strip(after);
}

export function isNavigation(a: PhoneAction): boolean {
  return a.type === 'open' || a.type === 'back' || a.type === 'home' || a.type === 'recents';
}

/** Para pruebas y para la interfaz de búsqueda de archivos. */
export function searchFiles(w: World, consulta: string) {
  const q = normalizeText(consulta);
  return w.archivos.filter((f) => normalizeText(f.nombre).includes(q));
}
