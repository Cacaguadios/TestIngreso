/**
 * "Mundo" del teléfono simulado: redes, resultados de búsqueda, archivos, contactos y lugares.
 * Es contenido de ejemplo; en versiones posteriores puede venir del paquete de POI.
 */
import { normalizeText } from './conditions';

export interface Network {
  ssid: string;
  segura: boolean;
  clave?: string;
  /** Intensidad de la señal 1–4 (solo visual). */
  senal?: number;
}

export interface SearchResult {
  id: string;
  sitio: string;
  titulo: string;
  descripcion: string;
  /** Párrafos de la página al abrir el resultado. */
  contenido?: string[];
}

export type FileKind = 'pdf' | 'hoja' | 'imagen' | 'video' | 'audio';

export interface FileItem {
  nombre: string;
  detalle: string;
  tipo: FileKind;
}

export interface Contact {
  nombre: string;
  /** Solo dígitos. */
  numero: string;
  etiqueta: string;
  correo?: string;
  color: string;
}

export interface Conversation {
  con: string;
  hora: string;
  /** Mensajes previos: `yo` = enviados por el dueño del teléfono. */
  mensajes: { yo: boolean; texto: string }[];
}

export interface BtDevice {
  nombre: string;
  tipo: 'bocina' | 'audifonos' | 'impresora';
}

export interface Place {
  id: string;
  nombre: string;
  direccion: string;
  detalle: string;
}

export interface World {
  redes: Network[];
  buscar(consulta: string): SearchResult[];
  archivos: FileItem[];
  contactos: Contact[];
  conversaciones: Conversation[];
  dispositivosBt: BtDevice[];
  buscarLugar(consulta: string): Place[];
}

const LLANTA: SearchResult[] = [
  {
    id: 'llanta-1',
    sitio: 'guiaautomotriz.mx',
    titulo: 'Cómo cambiar una llanta paso a paso',
    descripcion: 'Guía básica para reemplazar un neumático de forma segura.',
    contenido: [
      '1. Estaciona en un lugar plano y enciende las luces intermitentes.',
      '2. Afloja las tuercas antes de levantar el auto con el gato.',
      '3. Retira la llanta dañada, coloca la de refacción y aprieta las tuercas en cruz.',
    ],
  },
  { id: 'llanta-2', sitio: 'mecanicafacil.mx', titulo: 'Herramientas para cambiar una llanta', descripcion: 'Revisa lo necesario antes de empezar: gato, llave y refacción.' },
  { id: 'llanta-3', sitio: 'seguridadvial.mx', titulo: 'Consejos de seguridad en carretera', descripcion: 'Procedimiento práctico y precauciones al detenerte.' },
  { id: 'llanta-4', sitio: 'videos.ejemplo.mx', titulo: 'Cómo cambiar una llanta ponchada (video)', descripcion: 'Mira el proceso completo en menos de cinco minutos.' },
];

const HANDY: SearchResult[] = [
  { id: 'handy-3', sitio: 'noticias.ejemplo.mx', titulo: 'Handy llega a más sucursales', descripcion: 'Novedades sobre el despliegue de Handy en el país.' },
  {
    id: 'handy-1',
    sitio: 'roly.mx',
    titulo: 'Handy · Sitio oficial de Roly',
    descripcion: 'Conoce Handy, la solución de Roly para tu negocio.',
    contenido: ['Handy es la herramienta de Roly para registrar ventas, inventario y pedidos desde el celular.', 'Pregunta en tu sucursal cómo activarla.'],
  },
  { id: 'handy-2', sitio: 'tiendaonline.ejemplo.mx', titulo: 'Handy — ofertas y precios', descripcion: 'Compara precios de productos Handy en tiendas en línea.' },
  { id: 'handy-4', sitio: 'foro.ejemplo.mx', titulo: '¿Alguien ha usado Handy?', descripcion: 'Opiniones de usuarios sobre Handy.' },
];

const GENERICO: SearchResult[] = [
  { id: 'gen-1', sitio: 'ejemplo.mx', titulo: 'Resultados de búsqueda', descripcion: 'Información relacionada con tu búsqueda.' },
  { id: 'gen-2', sitio: 'ejemplo.mx/ayuda', titulo: 'Más información', descripcion: 'Consulta más detalles sobre el tema.' },
];

const LUGARES: Place[] = [
  { id: 'roly-centro', nombre: 'Roly Puebla Centro', direccion: 'Av. Reforma 512, Centro, Puebla', detalle: 'Abierto · Cierra a las 20:00' },
  { id: 'roly-angelopolis', nombre: 'Roly Angelópolis', direccion: 'Blvd. del Niño Poblano 2510, Puebla', detalle: 'Abierto · Cierra a las 21:00' },
];

export const DEFAULT_WORLD: World = {
  redes: [
    { ssid: 'Roly-Sucursal', segura: true, clave: 'roly1234', senal: 4 },
    { ssid: 'Roly-Invitados', segura: true, clave: 'invitados', senal: 3 },
    { ssid: 'INFINITUM_4F2A', segura: true, clave: 'infinitum', senal: 2 },
    { ssid: 'TOTALPLAY-8821', segura: true, clave: 'totalplay', senal: 2 },
    { ssid: 'CAFE_LIBRE', segura: false, senal: 1 },
  ],
  buscar(consulta) {
    const q = normalizeText(consulta);
    if (q.includes('llanta') || q.includes('neumatico')) return LLANTA;
    if (q.includes('handy')) return HANDY;
    return GENERICO;
  },
  archivos: [
    { nombre: 'Catalogo_2026.pdf', detalle: '2,4 MB · Descargas · hoy', tipo: 'pdf' },
    { nombre: 'Lista_precios.xlsx', detalle: '180 KB · Descargas · hoy', tipo: 'hoja' },
    { nombre: 'Foto_exhibidor.jpg', detalle: '1,2 MB · DCIM · ayer', tipo: 'imagen' },
    { nombre: 'Inventario_octubre.xlsx', detalle: '96 KB · Documentos · 20 oct', tipo: 'hoja' },
    { nombre: 'Reglamento_interno.pdf', detalle: '640 KB · Documentos · 15 oct', tipo: 'pdf' },
    { nombre: 'Catalogo_2025.pdf', detalle: '1,9 MB · Descargas · 12 oct', tipo: 'pdf' },
    { nombre: 'Promo_noviembre.jpg', detalle: '880 KB · WhatsApp · 10 oct', tipo: 'imagen' },
    { nombre: 'Capacitacion_Handy.mp4', detalle: '24 MB · Descargas · 2 oct', tipo: 'video' },
    { nombre: 'Nota_de_voz_0912.m4a', detalle: '210 KB · Grabaciones · 12 sep', tipo: 'audio' },
  ],
  contactos: [
    { nombre: 'Ana López', numero: '2221234567', etiqueta: 'Cliente · Puebla', correo: 'ana.lopez@ejemplo.mx', color: '#0B57D0' },
    { nombre: 'Carlos Pérez', numero: '2227654321', etiqueta: 'Compañero de trabajo', correo: 'carlos.perez@roly.mx', color: '#B06000' },
    { nombre: 'Gerente Sucursal', numero: '2225550101', etiqueta: 'Roly Puebla Centro', correo: 'gerencia.centro@roly.mx', color: '#7B1FA2' },
    { nombre: 'Proveedor Llantas', numero: '2229081122', etiqueta: 'Proveedor', color: '#188038' },
    { nombre: 'Soporte Roly', numero: '8001237659', etiqueta: 'Mesa de ayuda', correo: 'soporte@roly.mx', color: '#C5221F' },
  ],
  conversaciones: [
    { con: 'Ana López', hora: '10:21', mensajes: [{ yo: false, texto: 'Hola, ¿ya tienes el catálogo?' }, { yo: true, texto: 'Te lo envío en un momento' }, { yo: false, texto: 'Ya quedó el pedido, gracias' }] },
    { con: 'Soporte Roly', hora: '9:48', mensajes: [{ yo: true, texto: 'Buen día, no puedo entrar a Handy' }, { yo: false, texto: 'Tu solicitud fue recibida' }] },
    { con: 'Carlos Pérez', hora: 'Ayer', mensajes: [{ yo: false, texto: '¿Mañana pasas a la sucursal?' }] },
    { con: 'Gerente Sucursal', hora: 'Ayer', mensajes: [{ yo: false, texto: 'Recuerda el cierre de caja' }] },
  ],
  dispositivosBt: [
    { nombre: 'Bocina Sucursal', tipo: 'bocina' },
    { nombre: 'Impresora de tickets', tipo: 'impresora' },
    { nombre: 'Audífonos de Luis', tipo: 'audifonos' },
  ],
  buscarLugar(consulta) {
    const q = normalizeText(consulta);
    if (!q) return [];
    if (q.includes('roly')) return LUGARES;
    return [{ id: 'gen', nombre: consulta.trim(), direccion: 'Puebla, Pue.', detalle: 'Resultado en el mapa' }];
  },
};

/** Busca el contacto que coincide con un número (solo dígitos). */
export function contactByNumber(w: World, numero: string): Contact | undefined {
  return w.contactos.find((c) => c.numero === numero);
}

/** "2221234567" → "222 123 4567" */
export function formatNumber(n: string): string {
  const d = n.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return d;
}
