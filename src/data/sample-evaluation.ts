/**
 * Evaluación de ejemplo "Vendedor — Básico". Sirve para desarrollar sin conexión a POI;
 * en producción el paquete real llega desde POI (`GET /paquete`).
 */
import type { EvaluationDefinition } from '../engine/session';
import { DEFAULT_WEIGHTS, type TaskDefinition } from '../engine/types';

export const T_PRACTICA_AJUSTES: TaskDefinition = {
  codigo: 'practica.abrir_ajustes',
  version: 1,
  titulo: 'Abre Ajustes',
  instruccion: 'Esta tarea es para que conozcas el teléfono simulado. Abre la aplicación Ajustes.',
  categoria: 'practica',
  nivel: 1,
  practica: true,
  exito: { estado: 'pantalla', igual: 'ajustes' },
  pasosOptimos: 1,
  rutasValidas: [['abrir:ajustes']],
  ayudas: ['Busca una aplicación con un ícono de engrane.', 'Está en la pantalla de inicio: se llama Ajustes.'],
  mostrarme: 'app.ajustes',
  tiempoReferenciaSeg: 20,
  tiempoLimiteSeg: null,
};

export const T_ABRIR_NAVEGADOR: TaskDefinition = {
  codigo: 'nav.abrir',
  version: 1,
  titulo: 'Abre el navegador',
  instruccion: 'Abre el navegador de Internet.',
  categoria: 'navegacion',
  nivel: 1,
  exito: { estado: 'pantalla', igual: 'navegador' },
  pasosOptimos: 1,
  rutasValidas: [['abrir:navegador']],
  acciones: { neutras: ['abrir:ajustes', 'abrir:galeria', 'abrir:mapas'] },
  ayudas: ['Busca una aplicación relacionada con Internet.', 'El navegador tiene un ícono de globo.'],
  mostrarme: 'app.navegador',
  tiempoReferenciaSeg: 15,
  tiempoLimiteSeg: 90,
};

const buscarEnInternet = (codigo: string, titulo: string, consulta: string, clave: string): TaskDefinition => ({
  codigo,
  version: 1,
  titulo,
  instruccion: `Abre el navegador y busca «${consulta}». Después abre uno de los resultados.`,
  categoria: 'navegacion',
  nivel: 1,
  exito: {
    todas: [
      { estado: 'navegador.consulta', contiene: clave },
      { estado: 'navegador.resultadoAbierto', existe: true },
    ],
  },
  hitos: [
    { id: 'abrio_navegador', peso: 0.15, cuando: { visito: 'navegador' } },
    { id: 'hizo_busqueda', peso: 0.45, cuando: { estado: 'navegador.consulta', contiene: clave } },
  ],
  pasosOptimos: 5,
  rutasValidas: [
    ['abrir:navegador', 'abrir:navegador.escribiendo', 'texto:navegador.borrador', 'enviar:navegador.buscar', 'seleccionar:resultado:*'],
    ['abrir:navegador', 'abrir:navegador.escribiendo', 'seleccionar:sugerencia:*', 'seleccionar:resultado:*'],
  ],
  acciones: { neutras: ['abrir:ajustes', 'abrir:galeria', 'abrir:mapas', 'abrir:archivos'] },
  ayudas: [
    'Abre el navegador: tiene un ícono de globo.',
    'Toca la barra de direcciones para escribir.',
    'Escribe lo que quieres buscar y confirma con el botón de abajo a la derecha del teclado.',
  ],
  tiempoReferenciaSeg: 45,
  tiempoLimiteSeg: 180,
});

export const T_BUSCAR_LLANTA = buscarEnInternet('nav.buscar_llanta', 'Buscar información', 'cómo cambiar una llanta', 'llanta');
export const T_BUSCAR_HANDY = buscarEnInternet('nav.buscar_handy', 'Buscar Handy', 'Handy', 'handy');

export const T_WIFI: TaskDefinition = {
  codigo: 'conect.wifi_conectar',
  version: 1,
  titulo: 'Conéctate al Wi-Fi',
  instruccion: 'Conéctate a la red Wi-Fi «Roly-Sucursal». La contraseña es roly1234.',
  categoria: 'conectividad',
  nivel: 1,
  estadoInicial: { conectividad: { wifi: false, redWifi: null, datos: true } },
  exito: { todas: [{ estado: 'conectividad.wifi', igual: true }, { estado: 'conectividad.redWifi', igual: 'Roly-Sucursal' }] },
  hitos: [
    { id: 'llego_a_wifi', peso: 0.25, cuando: { alguna: [{ visito: 'ajustes.internet' }, { visito: 'ajustes_rapidos' }] } },
    { id: 'wifi_encendido', peso: 0.35, cuando: { estado: 'conectividad.wifi', igual: true } },
  ],
  pasosOptimos: 6,
  rutasValidas: [
    ['abrir:ajustes', 'abrir:ajustes.red', 'abrir:ajustes.internet', 'toggle:wifi', 'seleccionar:red:Roly-Sucursal', 'texto:wifi.clave', 'enviar:wifi.conectar'],
    ['abrir:ajustes_rapidos', 'toggle:wifi', 'abrir:ajustes.internet', 'seleccionar:red:Roly-Sucursal', 'texto:wifi.clave', 'enviar:wifi.conectar'],
  ],
  acciones: {
    error: ['toggle:modoAvion', 'seleccionar:red:*'],
    neutras: ['abrir:ajustes.bluetooth', 'abrir:ajustes.sonido', 'abrir:ajustes.pantalla'],
  },
  ayudas: [
    'El Wi-Fi se configura en Ajustes. También puedes deslizar desde arriba para ver los ajustes rápidos.',
    'En Ajustes entra a Red e Internet y luego a Internet.',
    'Activa el interruptor de Wi-Fi, toca la red «Roly-Sucursal» e ingresa la contraseña.',
  ],
  mostrarme: 'ajustes.red',
  tiempoReferenciaSeg: 40,
  tiempoLimiteSeg: 120,
};

export const SAMPLE_EVALUATION: EvaluationDefinition = {
  versionId: 1,
  codigo: 'vendedor-basico',
  nombre: 'Vendedor — Básico',
  requierePin: false,
  pesos: DEFAULT_WEIGHTS,
  niveles: [
    { nombre: 'Básico', min: 0 },
    { nombre: 'Intermedio', min: 60 },
    { nombre: 'Avanzado', min: 85 },
  ],
  tareas: [
    { orden: 0, peso: 1, practica: true, definicion: T_PRACTICA_AJUSTES },
    { orden: 1, peso: 1, practica: false, definicion: T_ABRIR_NAVEGADOR },
    { orden: 2, peso: 1, practica: false, definicion: T_BUSCAR_LLANTA },
    { orden: 3, peso: 1, practica: false, definicion: T_BUSCAR_HANDY },
    { orden: 4, peso: 1, practica: false, definicion: T_WIFI },
  ],
};
