import type { PhoneAction } from '../../src/engine/types';

export const open = (target: string): PhoneAction => ({ type: 'open', target });
export const text = (field: Extract<PhoneAction, { type: 'set_text' }>['field'], value: string): PhoneAction => ({ type: 'set_text', field, value });
export const submit = (field: Extract<PhoneAction, { type: 'submit' }>['field']): PhoneAction => ({ type: 'submit', field });
export const select = (group: Extract<PhoneAction, { type: 'select' }>['group'], value: string): PhoneAction => ({ type: 'select', group, value });

/** Camino correcto de cada tarea, escrito como lo haría una persona en el teléfono. */
export const SOLUCIONES: Record<string, PhoneAction[]> = {
  'practica.abrir_ajustes': [open('ajustes')],
  'nav.abrir': [open('navegador')],
  'sistema.linterna': [open('ajustes_rapidos'), { type: 'toggle', key: 'linterna' }],
  'camara.tomar_foto': [open('camara'), submit('camara.disparar')],
  'conect.modo_avion_off': [open('ajustes_rapidos'), { type: 'toggle', key: 'modoAvion' }],
  'pantalla.subir_brillo': [open('ajustes_rapidos'), { type: 'slide', key: 'brillo', value: 80 }],
  'sonido.timbre_silencio': [open('ajustes'), open('ajustes.sonido'), { type: 'slide', key: 'volTimbre', value: 0 }],
  'tel.llamar_contacto': [open('contactos'), select('contacto', 'Proveedor Llantas'), select('llamar', '2229081122')],
  'tel.marcar_numero': [open('telefono'), text('telefono.numero', '800 123 7659'), submit('telefono.llamar')],
  'nav.buscar_llanta': [open('navegador'), open('navegador.escribiendo'), text('navegador.borrador', 'como cambiar una llanta'), submit('navegador.buscar'), select('resultado', 'llanta-1')],
  'nav.buscar_handy': [open('navegador'), open('navegador.escribiendo'), text('navegador.borrador', 'Handy'), submit('navegador.buscar'), select('resultado', 'handy-1')],
  'conect.bluetooth_bocina': [open('ajustes'), open('ajustes.bluetooth'), { type: 'toggle', key: 'bluetooth' }, select('bt', 'Bocina Sucursal')],
  'msg.enviar_carlos': [open('mensajes'), select('conversacion', 'Carlos Pérez'), text('mensajes.borrador', 'Ya llegó el pedido'), submit('mensajes.enviar')],
  'archivos.abrir_catalogo': [open('archivos'), text('archivos.consulta', 'catalogo'), submit('archivos.buscar'), select('archivo', 'Catalogo_2026.pdf')],
  'mapas.ruta_sucursal': [open('mapas'), text('mapas.consulta', 'Roly Puebla Centro'), submit('mapas.buscar'), submit('mapas.ruta')],
  'conect.wifi_conectar': [
    open('ajustes'), open('ajustes.red'), open('ajustes.internet'), { type: 'toggle', key: 'wifi' },
    select('red', 'Roly-Sucursal'), text('wifi.clave', 'roly1234'), submit('wifi.conectar'),
  ],
};
