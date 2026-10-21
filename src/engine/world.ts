/**
 * "Mundo" del teléfono simulado: redes, resultados de búsqueda, archivos y contactos.
 * Es contenido de ejemplo; en versiones posteriores puede venir del paquete de POI.
 */
import { normalizeText } from './conditions';

export interface Network {
  ssid: string;
  segura: boolean;
  clave?: string;
}

export interface SearchResult {
  id: string;
  sitio: string;
  titulo: string;
  descripcion: string;
}

export interface FileItem {
  nombre: string;
  detalle: string;
}

export interface World {
  redes: Network[];
  buscar(consulta: string): SearchResult[];
  archivos: FileItem[];
  contactos: string[];
}

const LLANTA: SearchResult[] = [
  { id: 'llanta-1', sitio: 'guiaautomotriz.mx', titulo: 'Cómo cambiar una llanta paso a paso', descripcion: 'Guía básica para reemplazar un neumático de forma segura.' },
  { id: 'llanta-2', sitio: 'mecanicafacil.mx', titulo: 'Herramientas para cambiar una llanta', descripcion: 'Revisa lo necesario antes de empezar: gato, llave y refacción.' },
  { id: 'llanta-3', sitio: 'seguridadvial.mx', titulo: 'Consejos de seguridad en carretera', descripcion: 'Procedimiento práctico y precauciones al detenerte.' },
  { id: 'llanta-4', sitio: 'videos.ejemplo.mx', titulo: 'Cómo cambiar una llanta ponchada (video)', descripcion: 'Mira el proceso completo en menos de cinco minutos.' },
];

const HANDY: SearchResult[] = [
  { id: 'handy-1', sitio: 'roly.mx', titulo: 'Handy · Roly', descripcion: 'Conoce Handy, la solución de Roly para tu negocio.' },
  { id: 'handy-2', sitio: 'roly.mx/productos', titulo: 'Productos Handy', descripcion: 'Catálogo de productos Handy disponibles en sucursal.' },
  { id: 'handy-3', sitio: 'noticias.ejemplo.mx', titulo: 'Handy llega a más sucursales', descripcion: 'Novedades sobre el despliegue de Handy.' },
];

const GENERICO: SearchResult[] = [
  { id: 'gen-1', sitio: 'ejemplo.mx', titulo: 'Resultados de búsqueda', descripcion: 'Información relacionada con tu búsqueda.' },
  { id: 'gen-2', sitio: 'ejemplo.mx/ayuda', titulo: 'Más información', descripcion: 'Consulta más detalles sobre el tema.' },
];

export const DEFAULT_WORLD: World = {
  redes: [
    { ssid: 'Roly-Sucursal', segura: true, clave: 'roly1234' },
    { ssid: 'Roly-Invitados', segura: true, clave: 'invitados' },
    { ssid: 'INFINITUM_4F2A', segura: true, clave: 'infinitum' },
    { ssid: 'TOTALPLAY-8821', segura: true, clave: 'totalplay' },
    { ssid: 'CAFE_LIBRE', segura: false },
  ],
  buscar(consulta) {
    const q = normalizeText(consulta);
    if (q.includes('llanta') || q.includes('neumatico')) return LLANTA;
    if (q.includes('handy')) return HANDY;
    return GENERICO;
  },
  archivos: [
    { nombre: 'Catalogo_2026.pdf', detalle: '2,4 MB · Descargas · hoy' },
    { nombre: 'Catalogo_2025.pdf', detalle: '1,9 MB · Descargas · 12 oct' },
    { nombre: 'Lista_precios.xlsx', detalle: '180 KB · hoy' },
    { nombre: 'Foto_exhibidor.jpg', detalle: '1,2 MB · ayer' },
  ],
  contactos: ['Ana López', 'Carlos Pérez', 'Gerente Sucursal', 'Proveedor Llantas', 'Soporte Roly'],
};
