/**
 * Evaluación de ejemplo "Vendedor — Básico" (1 práctica + 15 tareas calificadas).
 * Sirve para desarrollar sin conexión a POI; en producción el paquete real llega desde POI (`GET /paquete`).
 *
 * Las tareas van de lo más sencillo (abrir una app) a lo más complejo (conectarse a un Wi-Fi con
 * contraseña). Cada una describe una situación real de sucursal para que el candidato entienda
 * para qué serviría hacerlo.
 */
import type { EvaluationDefinition } from '../engine/session';
import { DEFAULT_WEIGHTS, type TaskDefinition } from '../engine/types';

// ───────────────────────────── Práctica ─────────────────────────────

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

// ───────────────────────────── Nivel 1 · Lo básico ─────────────────────────────

export const T_ABRIR_NAVEGADOR: TaskDefinition = {
  codigo: 'nav.abrir',
  version: 1,
  titulo: 'Abre el navegador',
  instruccion: 'Un cliente te pide consultar algo en Internet. Abre el navegador.',
  categoria: 'navegacion',
  nivel: 1,
  exito: { estado: 'pantalla', igual: 'navegador' },
  pasosOptimos: 1,
  rutasValidas: [['abrir:navegador']],
  acciones: { neutras: ['abrir:ajustes', 'abrir:galeria', 'abrir:mapas'] },
  ayudas: ['Busca una aplicación relacionada con Internet.', 'El navegador tiene un ícono de globo terráqueo, abajo en la pantalla de inicio.'],
  mostrarme: 'app.navegador',
  tiempoReferenciaSeg: 15,
  tiempoLimiteSeg: 90,
};

export const T_LINTERNA: TaskDefinition = {
  codigo: 'sistema.linterna',
  version: 1,
  titulo: 'Enciende la linterna',
  instruccion: 'Se fue la luz en la bodega y necesitas buscar una caja. Enciende la linterna del teléfono.',
  categoria: 'sistema',
  nivel: 1,
  exito: { estado: 'sistema.linterna', igual: true },
  hitos: [{ id: 'abrio_centro_control', peso: 0.4, cuando: { visito: 'ajustes_rapidos' } }],
  pasosOptimos: 2,
  rutasValidas: [['abrir:ajustes_rapidos', 'toggle:linterna']],
  acciones: { neutras: ['abrir:ajustes', 'abrir:camara'] },
  ayudas: [
    'La linterna está en el Centro de control.',
    'Desliza hacia abajo desde la parte de arriba de la pantalla (donde está la hora).',
    'Toca el botón «Linterna».',
  ],
  mostrarme: ['statusbar', 'qs.linterna'],
  tiempoReferenciaSeg: 20,
  tiempoLimiteSeg: 90,
};

export const T_MODO_AVION: TaskDefinition = {
  codigo: 'conect.modo_avion_off',
  version: 1,
  titulo: 'Quita el modo avión',
  instruccion: 'El teléfono no recibe llamadas porque quedó en modo avión. Desactiva el modo avión.',
  categoria: 'conectividad',
  nivel: 1,
  estadoInicial: { conectividad: { modoAvion: true, wifi: false, redWifi: null, bluetooth: false } },
  exito: { estado: 'conectividad.modoAvion', igual: false },
  hitos: [{ id: 'llego_al_ajuste', peso: 0.4, cuando: { alguna: [{ visito: 'ajustes_rapidos' }, { visito: 'ajustes.red' }] } }],
  pasosOptimos: 2,
  rutasValidas: [
    ['abrir:ajustes_rapidos', 'toggle:modoAvion'],
    ['abrir:ajustes', 'abrir:ajustes.red', 'toggle:modoAvion'],
  ],
  acciones: { neutras: ['abrir:ajustes.internet'] },
  ayudas: [
    'Fíjate en la barra de arriba: el avión indica que el modo avión está activo.',
    'Desliza hacia abajo desde la parte de arriba para abrir el Centro de control.',
    'Toca el botón «Modo avión» para apagarlo.',
  ],
  mostrarme: ['statusbar', 'qs.avion', 'ajustes.red', 'ajustes.avion'],
  tiempoReferenciaSeg: 25,
  tiempoLimiteSeg: 90,
};

export const T_BRILLO: TaskDefinition = {
  codigo: 'pantalla.subir_brillo',
  version: 1,
  titulo: 'Sube el brillo',
  instruccion: 'Estás afuera de la tienda y casi no ves la pantalla. Sube el brillo a más de la mitad.',
  categoria: 'pantalla',
  nivel: 1,
  estadoInicial: { pantallaCfg: { brillo: 8, brilloAdaptable: false } },
  exito: { estado: 'pantallaCfg.brillo', mayorIgual: 50 },
  hitos: [
    { id: 'encontro_brillo', peso: 0.3, cuando: { alguna: [{ visito: 'ajustes_rapidos' }, { visito: 'ajustes.pantalla' }] } },
    { id: 'subio_algo', peso: 0.2, cuando: { estado: 'pantallaCfg.brillo', mayorIgual: 25 } },
  ],
  pasosOptimos: 2,
  rutasValidas: [
    ['abrir:ajustes_rapidos', 'deslizar:brillo'],
    ['abrir:ajustes', 'abrir:ajustes.pantalla', 'deslizar:brillo'],
  ],
  ayudas: [
    'El brillo se ajusta desde el Centro de control o en Ajustes › Pantalla.',
    'Desliza hacia abajo desde la parte de arriba de la pantalla.',
    'Arrastra la barra con el ícono de sol hacia la derecha.',
  ],
  mostrarme: ['statusbar', 'qs.brillo', 'ajustes.pantalla', 'pantalla.brillo'],
  tiempoReferenciaSeg: 25,
  tiempoLimiteSeg: 90,
};

export const T_FOTO: TaskDefinition = {
  codigo: 'camara.tomar_foto',
  version: 1,
  titulo: 'Toma una foto',
  instruccion: 'Tu gerente quiere ver cómo quedó el exhibidor. Abre la cámara y toma una foto.',
  categoria: 'camara',
  nivel: 1,
  exito: { estado: 'camara.fotos', mayorIgual: 1 },
  hitos: [{ id: 'abrio_camara', peso: 0.5, cuando: { visito: 'camara' } }],
  pasosOptimos: 2,
  rutasValidas: [['abrir:camara', 'enviar:camara.disparar']],
  acciones: { neutras: ['abrir:galeria'] },
  ayudas: ['Busca la aplicación Cámara en la pantalla de inicio.', 'Para tomar la foto, toca el botón redondo grande de abajo.'],
  mostrarme: ['app.camara', 'camara.disparador'],
  tiempoReferenciaSeg: 20,
  tiempoLimiteSeg: 90,
};

// ───────────────────────────── Nivel 2 · Uso cotidiano ─────────────────────────────

export const T_SILENCIO: TaskDefinition = {
  codigo: 'sonido.timbre_silencio',
  version: 1,
  titulo: 'Silencia el timbre',
  instruccion: 'Vas a entrar a una junta. Baja el volumen del timbre hasta el mínimo para que el teléfono no suene.',
  categoria: 'sonido',
  nivel: 2,
  estadoInicial: { sonido: { timbre: 80, multimedia: 60 } },
  exito: { estado: 'sonido.timbre', menorIgual: 5 },
  hitos: [
    { id: 'llego_a_sonido', peso: 0.3, cuando: { visito: 'ajustes.sonido' } },
    { id: 'bajo_algo', peso: 0.2, cuando: { estado: 'sonido.timbre', menorIgual: 40 } },
  ],
  pasosOptimos: 3,
  rutasValidas: [['abrir:ajustes', 'abrir:ajustes.sonido', 'deslizar:volTimbre']],
  acciones: { neutras: ['abrir:ajustes_rapidos', 'abrir:ajustes.pantalla'] },
  ayudas: [
    'El volumen de cada sonido se ajusta en Ajustes.',
    'Entra a «Sonido y vibración».',
    'Arrastra la barra «Volumen de timbre» hasta el extremo izquierdo.',
  ],
  mostrarme: ['app.ajustes', 'ajustes.sonido', 'sonido.timbre'],
  tiempoReferenciaSeg: 35,
  tiempoLimiteSeg: 120,
};

export const T_BLUETOOTH: TaskDefinition = {
  codigo: 'conect.bluetooth_bocina',
  version: 1,
  titulo: 'Conecta la bocina',
  instruccion: 'Quieres poner música en la tienda. Enciende el Bluetooth y conéctate a «Bocina Sucursal».',
  categoria: 'conectividad',
  nivel: 2,
  exito: {
    todas: [
      { estado: 'conectividad.bluetooth', igual: true },
      { estado: 'conectividad.dispositivoBt', igual: 'Bocina Sucursal' },
    ],
  },
  hitos: [
    { id: 'llego_a_bluetooth', peso: 0.2, cuando: { visito: 'ajustes.bluetooth' } },
    { id: 'bt_encendido', peso: 0.3, cuando: { estado: 'conectividad.bluetooth', igual: true } },
  ],
  pasosOptimos: 4,
  rutasValidas: [
    ['abrir:ajustes', 'abrir:ajustes.bluetooth', 'toggle:bluetooth', 'seleccionar:bt:Bocina Sucursal'],
    ['abrir:ajustes_rapidos', 'toggle:bluetooth', 'abrir:ajustes.bluetooth', 'seleccionar:bt:Bocina Sucursal'],
  ],
  acciones: { error: ['seleccionar:bt:*', 'toggle:modoAvion'] },
  ayudas: [
    'El Bluetooth está en Ajustes › Dispositivos conectados.',
    'Activa el interruptor «Usar Bluetooth» y espera la lista de dispositivos.',
    'Toca «Bocina Sucursal» en la lista.',
  ],
  mostrarme: ['app.ajustes', 'ajustes.bluetooth', 'bt.switch', 'bt.Bocina Sucursal'],
  tiempoReferenciaSeg: 40,
  tiempoLimiteSeg: 150,
};

export const T_LLAMAR_CONTACTO: TaskDefinition = {
  codigo: 'tel.llamar_contacto',
  version: 1,
  titulo: 'Llama a un contacto',
  instruccion: 'Faltan llantas en el inventario. Busca en Contactos a «Proveedor Llantas» y llámale.',
  categoria: 'comunicacion',
  nivel: 2,
  exito: { estado: 'telefono.enLlamada', igual: '2229081122' },
  hitos: [
    { id: 'abrio_contactos', peso: 0.2, cuando: { visito: 'contactos' } },
    { id: 'abrio_ficha', peso: 0.3, cuando: { estado: 'contactos.seleccionado', igual: 'Proveedor Llantas' } },
  ],
  pasosOptimos: 3,
  rutasValidas: [['abrir:contactos', 'seleccionar:contacto:Proveedor Llantas', 'seleccionar:llamar:2229081122']],
  acciones: { error: ['seleccionar:llamar:*'] },
  ayudas: [
    'Abre la aplicación Contactos (ícono de persona).',
    'Toca el nombre «Proveedor Llantas».',
    'Toca el botón «Llamar».',
  ],
  mostrarme: ['app.contactos', 'contacto.Proveedor Llantas', 'contacto.llamar'],
  tiempoReferenciaSeg: 30,
  tiempoLimiteSeg: 120,
};

export const T_MARCAR: TaskDefinition = {
  codigo: 'tel.marcar_numero',
  version: 1,
  titulo: 'Marca un número',
  instruccion: 'Tu cliente necesita ayuda con Handy. Llama a la mesa de ayuda marcando el 800 123 7659.',
  categoria: 'comunicacion',
  nivel: 2,
  exito: { estado: 'telefono.enLlamada', igual: '8001237659' },
  hitos: [{ id: 'abrio_telefono', peso: 0.3, cuando: { visito: 'telefono' } }],
  pasosOptimos: 3,
  rutasValidas: [
    ['abrir:telefono', 'texto:telefono.numero', 'enviar:telefono.llamar'],
    ['abrir:contactos', 'seleccionar:contacto:Soporte Roly', 'seleccionar:llamar:8001237659'],
  ],
  acciones: { error: ['seleccionar:llamar:*'] },
  ayudas: [
    'Abre la aplicación Teléfono (ícono de auricular).',
    'Escribe el número con el teclado: 8 0 0 1 2 3 7 6 5 9.',
    'Toca el botón verde para llamar.',
  ],
  mostrarme: ['app.telefono', 'telefono.llamar'],
  tiempoReferenciaSeg: 40,
  tiempoLimiteSeg: 150,
};

const buscarEnInternet = (codigo: string, titulo: string, instruccion: string, clave: string, resultado: string): TaskDefinition => ({
  codigo,
  version: 1,
  titulo,
  instruccion,
  categoria: 'navegacion',
  nivel: 2,
  exito: {
    todas: [
      { estado: 'navegador.consulta', contiene: clave },
      { estado: 'navegador.resultadoAbierto', igual: resultado },
    ],
  },
  hitos: [
    { id: 'abrio_navegador', peso: 0.15, cuando: { visito: 'navegador' } },
    { id: 'hizo_busqueda', peso: 0.4, cuando: { estado: 'navegador.consulta', contiene: clave } },
  ],
  pasosOptimos: 5,
  rutasValidas: [
    ['abrir:navegador', 'abrir:navegador.escribiendo', 'texto:navegador.borrador', 'enviar:navegador.buscar', `seleccionar:resultado:${resultado}`],
    ['abrir:navegador', 'abrir:navegador.escribiendo', 'seleccionar:sugerencia:*', `seleccionar:resultado:${resultado}`],
    ['abrir:navegador.escribiendo', 'texto:navegador.borrador', 'enviar:navegador.buscar', `seleccionar:resultado:${resultado}`],
  ],
  acciones: { neutras: ['abrir:ajustes', 'abrir:galeria', 'abrir:mapas', 'abrir:archivos'] },
  ayudas: [
    'Abre el navegador: tiene un ícono de globo terráqueo.',
    'Toca la barra de búsqueda de arriba y escribe lo que buscas.',
    'Confirma con la tecla de búsqueda del teclado y lee los resultados con atención.',
  ],
  mostrarme: ['app.navegador', 'navegador.barra', `resultado.${resultado}`],
  tiempoReferenciaSeg: 50,
  tiempoLimiteSeg: 180,
});

export const T_BUSCAR_LLANTA = buscarEnInternet(
  'nav.buscar_llanta',
  'Busca información',
  'Un cliente pregunta cómo cambiar una llanta. Busca en Internet «cómo cambiar una llanta» y abre la guía paso a paso.',
  'llanta',
  'llanta-1',
);
export const T_BUSCAR_HANDY = buscarEnInternet(
  'nav.buscar_handy',
  'Encuentra el sitio oficial',
  'Busca «Handy» en Internet y abre la página oficial de Roly (roly.mx). Cuidado: no todos los resultados son oficiales.',
  'handy',
  'handy-1',
);

export const T_MENSAJE: TaskDefinition = {
  codigo: 'msg.enviar_carlos',
  version: 1,
  titulo: 'Envía un mensaje',
  instruccion: 'Avísale a tu compañero Carlos Pérez por mensaje de texto que ya llegó el pedido.',
  categoria: 'comunicacion',
  nivel: 2,
  exito: {
    todas: [
      { estado: 'mensajes.ultimo.a', igual: 'Carlos Pérez' },
      { estado: 'mensajes.ultimo.texto', contiene: 'pedido' },
    ],
  },
  hitos: [
    { id: 'abrio_mensajes', peso: 0.15, cuando: { visito: 'mensajes' } },
    { id: 'abrio_chat_carlos', peso: 0.35, cuando: { estado: 'mensajes.conversacion', igual: 'Carlos Pérez' } },
  ],
  pasosOptimos: 4,
  rutasValidas: [
    ['abrir:mensajes', 'seleccionar:conversacion:Carlos Pérez', 'texto:mensajes.borrador', 'enviar:mensajes.enviar'],
    ['abrir:mensajes', 'abrir:mensajes.nuevo', 'seleccionar:conversacion:Carlos Pérez', 'texto:mensajes.borrador', 'enviar:mensajes.enviar'],
    ['abrir:contactos', 'seleccionar:contacto:Carlos Pérez', 'seleccionar:conversacion:Carlos Pérez', 'texto:mensajes.borrador', 'enviar:mensajes.enviar'],
  ],
  ayudas: [
    'Abre la aplicación Mensajes.',
    'Toca la conversación con Carlos Pérez.',
    'Escribe «Ya llegó el pedido» y toca el botón de enviar (la flecha).',
  ],
  mostrarme: ['app.mensajes', 'conv.Carlos Pérez', 'mensajes.enviar'],
  tiempoReferenciaSeg: 60,
  tiempoLimiteSeg: 180,
};

export const T_ARCHIVO: TaskDefinition = {
  codigo: 'archivos.abrir_catalogo',
  version: 1,
  titulo: 'Encuentra un archivo',
  instruccion: 'Un cliente quiere ver el catálogo de este año. Busca el archivo «Catalogo_2026.pdf» y ábrelo.',
  categoria: 'archivos',
  nivel: 2,
  exito: { estado: 'archivos.abierto', igual: 'Catalogo_2026.pdf' },
  hitos: [
    { id: 'abrio_archivos', peso: 0.2, cuando: { visito: 'archivos' } },
    { id: 'encontro_lista', peso: 0.25, cuando: { alguna: [{ visito: 'archivos.busqueda' }, { visito: 'archivos.documentos' }] } },
  ],
  pasosOptimos: 4,
  rutasValidas: [
    ['abrir:archivos', 'texto:archivos.consulta', 'enviar:archivos.buscar', 'seleccionar:archivo:Catalogo_2026.pdf'],
    ['abrir:archivos', 'abrir:archivos.documentos', 'seleccionar:archivo:Catalogo_2026.pdf'],
    ['abrir:archivos', 'seleccionar:archivo:Catalogo_2026.pdf'],
  ],
  acciones: { error: ['seleccionar:archivo:Catalogo_2025.pdf'] },
  ayudas: [
    'Los documentos guardados están en la aplicación Archivos (ícono de carpeta).',
    'Usa la barra «Buscar en este teléfono» o entra a «Documentos».',
    'Abre «Catalogo_2026.pdf» (cuidado: también existe el de 2025).',
  ],
  mostrarme: ['app.archivos', 'archivos.documentos', 'archivo.Catalogo_2026.pdf'],
  tiempoReferenciaSeg: 45,
  tiempoLimiteSeg: 150,
};

export const T_MAPAS: TaskDefinition = {
  codigo: 'mapas.ruta_sucursal',
  version: 1,
  titulo: 'Cómo llegar a la sucursal',
  instruccion: 'Un cliente pregunta cómo llegar a «Roly Puebla Centro». Búscala en Mapas y toca «Cómo llegar».',
  categoria: 'mapas',
  nivel: 2,
  exito: {
    todas: [
      { estado: 'mapas.buscado', contiene: 'roly' },
      { estado: 'mapas.ruta', igual: true },
    ],
  },
  hitos: [
    { id: 'abrio_mapas', peso: 0.15, cuando: { visito: 'mapas' } },
    { id: 'busco_sucursal', peso: 0.4, cuando: { estado: 'mapas.buscado', contiene: 'roly' } },
  ],
  pasosOptimos: 4,
  rutasValidas: [
    ['abrir:mapas', 'texto:mapas.consulta', 'enviar:mapas.buscar', 'enviar:mapas.ruta'],
    ['abrir:mapas', 'seleccionar:lugar:*', 'enviar:mapas.ruta'],
  ],
  ayudas: [
    'Abre la aplicación Mapas (ícono de ubicación).',
    'Toca «Buscar aquí» y escribe «Roly Puebla Centro».',
    'En la tarjeta del lugar, toca «Cómo llegar».',
  ],
  mostrarme: ['app.mapas', 'mapas.buscar', 'mapas.ruta'],
  tiempoReferenciaSeg: 50,
  tiempoLimiteSeg: 180,
};

// ───────────────────────────── Nivel 3 · Varios pasos ─────────────────────────────

export const T_WIFI: TaskDefinition = {
  codigo: 'conect.wifi_conectar',
  version: 1,
  titulo: 'Conéctate al Wi-Fi',
  instruccion: 'Para no gastar datos, conéctate a la red Wi-Fi «Roly-Sucursal». La contraseña es roly1234.',
  categoria: 'conectividad',
  nivel: 3,
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
    'El Wi-Fi se configura en Ajustes. También puedes deslizar desde arriba para abrir el Centro de control.',
    'En Ajustes entra a «Red e Internet» y luego a «Internet».',
    'Activa el interruptor de Wi-Fi, toca la red «Roly-Sucursal» y escribe la contraseña.',
  ],
  mostrarme: ['app.ajustes', 'ajustes.red', 'ajustes.internet', 'ajustes.wifi', 'red.Roly-Sucursal'],
  tiempoReferenciaSeg: 40,
  tiempoLimiteSeg: 120,
};

const ORDEN: TaskDefinition[] = [
  T_ABRIR_NAVEGADOR,
  T_LINTERNA,
  T_FOTO,
  T_MODO_AVION,
  T_BRILLO,
  T_SILENCIO,
  T_LLAMAR_CONTACTO,
  T_MARCAR,
  T_BUSCAR_LLANTA,
  T_BUSCAR_HANDY,
  T_BLUETOOTH,
  T_MENSAJE,
  T_ARCHIVO,
  T_MAPAS,
  T_WIFI,
];

const NIVELES = [
  { nombre: 'Básico', min: 0 },
  { nombre: 'Intermedio', min: 60 },
  { nombre: 'Avanzado', min: 85 },
];

export const SAMPLE_EVALUATION: EvaluationDefinition = {
  versionId: 1,
  codigo: 'vendedor-basico',
  nombre: 'Vendedor — Básico',
  requierePin: false,
  pesos: DEFAULT_WEIGHTS,
  niveles: NIVELES,
  tareas: [
    { orden: 0, peso: 1, practica: true, definicion: T_PRACTICA_AJUSTES },
    // Las tareas de nivel 3 pesan un poco más que las de nivel 1.
    ...ORDEN.map((definicion, i) => ({ orden: i + 1, peso: definicion.nivel === 3 ? 1.5 : 1, practica: false, definicion })),
  ],
};

/** Evaluación corta (práctica + 4 tareas). Se usa en las pruebas automáticas. */
export const EVALUACION_CORTA: EvaluationDefinition = {
  ...SAMPLE_EVALUATION,
  versionId: 2,
  codigo: 'demo-corta',
  nombre: 'Demo — Corta',
  tareas: [
    { orden: 0, peso: 1, practica: true, definicion: T_PRACTICA_AJUSTES },
    { orden: 1, peso: 1, practica: false, definicion: T_ABRIR_NAVEGADOR },
    { orden: 2, peso: 1, practica: false, definicion: T_BUSCAR_LLANTA },
    { orden: 3, peso: 1, practica: false, definicion: T_BUSCAR_HANDY },
    { orden: 4, peso: 1, practica: false, definicion: T_WIFI },
  ],
};
