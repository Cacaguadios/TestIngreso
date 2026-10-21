import { describe, expect, it } from 'vitest';
import { actionKey, createInitialState, reducePhone, stateChanged } from '../../src/engine/phone';
import type { PhoneAction, PhoneState } from '../../src/engine/types';

const run = (s: PhoneState, ...actions: PhoneAction[]) => actions.reduce((st, a) => reducePhone(st, a), s);

describe('navegación del teléfono', () => {
  it('abrir apila la pantalla y atrás regresa', () => {
    const s = run(createInitialState(), { type: 'open', target: 'ajustes' }, { type: 'open', target: 'ajustes.red' });
    expect(s.pantalla).toBe('ajustes.red');
    expect(s.pila).toEqual(['inicio', 'ajustes']);
    const b = run(s, { type: 'back' });
    expect(b.pantalla).toBe('ajustes');
  });

  it('atrás en inicio no hace nada y no saca del teléfono', () => {
    const s = run(createInitialState(), { type: 'back' });
    expect(s.pantalla).toBe('inicio');
    expect(s.pila).toEqual([]);
  });

  it('inicio limpia el historial', () => {
    const s = run(createInitialState(), { type: 'open', target: 'ajustes' }, { type: 'home' });
    expect(s.pantalla).toBe('inicio');
    expect(s.pila).toEqual([]);
  });

  it('ignora pantallas desconocidas', () => {
    const s = createInitialState();
    expect(reducePhone(s, { type: 'open', target: 'no.existe' })).toBe(s);
  });
});

describe('conectividad', () => {
  it('apagar Wi-Fi desconecta la red', () => {
    let s = createInitialState({ conectividad: { wifi: true, redWifi: 'Roly-Sucursal' } });
    s = run(s, { type: 'toggle', key: 'wifi' });
    expect(s.conectividad).toMatchObject({ wifi: false, redWifi: null });
  });

  it('modo avión apaga Wi-Fi y Bluetooth', () => {
    let s = createInitialState({ conectividad: { wifi: true, redWifi: 'CAFE_LIBRE', bluetooth: true } });
    s = run(s, { type: 'toggle', key: 'modoAvion' });
    expect(s.conectividad).toMatchObject({ modoAvion: true, wifi: false, redWifi: null, bluetooth: false });
  });

  it('no se puede encender Bluetooth con modo avión', () => {
    const s0 = createInitialState({ conectividad: { modoAvion: true } });
    expect(run(s0, { type: 'toggle', key: 'bluetooth' }).conectividad.bluetooth).toBe(false);
  });

  it('red segura pide contraseña; clave incorrecta marca error y la correcta conecta', () => {
    let s = createInitialState({ conectividad: { wifi: true } });
    s = run(s, { type: 'open', target: 'ajustes.internet' }, { type: 'select', group: 'red', value: 'Roly-Sucursal' });
    expect(s.pantalla).toBe('wifi.contrasena');
    expect(s.wifiDialogo.ssid).toBe('Roly-Sucursal');

    s = run(s, { type: 'set_text', field: 'wifi.clave', value: 'mala' }, { type: 'submit', field: 'wifi.conectar' });
    expect(s.pantalla).toBe('wifi.contrasena');
    expect(s.wifiDialogo.error).toBe(true);
    expect(s.conectividad.redWifi).toBeNull();

    s = run(s, { type: 'set_text', field: 'wifi.clave', value: 'roly1234' }, { type: 'submit', field: 'wifi.conectar' });
    expect(s.pantalla).toBe('ajustes.internet');
    expect(s.conectividad).toMatchObject({ wifi: true, redWifi: 'Roly-Sucursal' });
    expect(s.wifiDialogo.ssid).toBeNull();
  });

  it('red abierta conecta directo', () => {
    let s = createInitialState({ conectividad: { wifi: true } });
    s = run(s, { type: 'open', target: 'ajustes.internet' }, { type: 'select', group: 'red', value: 'CAFE_LIBRE' });
    expect(s.conectividad.redWifi).toBe('CAFE_LIBRE');
    expect(s.pantalla).toBe('ajustes.internet');
  });

  it('con Wi-Fi apagado no se puede elegir red', () => {
    const s = run(createInitialState(), { type: 'select', group: 'red', value: 'CAFE_LIBRE' });
    expect(s.conectividad.redWifi).toBeNull();
  });

  it('cancelar el diálogo (atrás) lo limpia', () => {
    let s = createInitialState({ conectividad: { wifi: true } });
    s = run(s, { type: 'open', target: 'ajustes.internet' }, { type: 'select', group: 'red', value: 'Roly-Sucursal' }, { type: 'back' });
    expect(s.pantalla).toBe('ajustes.internet');
    expect(s.wifiDialogo.ssid).toBeNull();
  });
});

describe('navegador', () => {
  it('escribir y buscar abre resultados; el resultado abre la página', () => {
    let s = run(
      createInitialState(),
      { type: 'open', target: 'navegador' },
      { type: 'open', target: 'navegador.escribiendo' },
      { type: 'set_text', field: 'navegador.borrador', value: '  cómo cambiar una llanta ' },
      { type: 'submit', field: 'navegador.buscar' },
    );
    expect(s.pantalla).toBe('navegador.resultados');
    expect(s.navegador.consulta).toBe('cómo cambiar una llanta');
    // atrás desde resultados regresa al inicio del navegador, no a la pantalla de escritura
    expect(run(s, { type: 'back' }).pantalla).toBe('navegador');

    s = run(s, { type: 'select', group: 'resultado', value: 'llanta-1' });
    expect(s.pantalla).toBe('navegador.pagina');
    expect(s.navegador.resultadoAbierto).toBe('llanta-1');
  });

  it('buscar con el campo vacío no hace nada', () => {
    const s0 = run(createInitialState(), { type: 'open', target: 'navegador' }, { type: 'open', target: 'navegador.escribiendo' });
    const s = run(s0, { type: 'submit', field: 'navegador.buscar' });
    expect(s.pantalla).toBe('navegador.escribiendo');
  });

  it('tocar una sugerencia va directo a resultados', () => {
    const s = run(
      createInitialState(),
      { type: 'open', target: 'navegador' },
      { type: 'open', target: 'navegador.escribiendo' },
      { type: 'select', group: 'sugerencia', value: 'cómo cambiar una llanta' },
    );
    expect(s.pantalla).toBe('navegador.resultados');
    expect(s.navegador.consulta).toBe('cómo cambiar una llanta');
  });
});

describe('mensajes y archivos', () => {
  it('enviar un mensaje lo guarda y limpia el borrador', () => {
    const s = run(
      createInitialState(),
      { type: 'open', target: 'mensajes' },
      { type: 'set_text', field: 'mensajes.borrador', value: 'Hola' },
      { type: 'submit', field: 'mensajes.enviar' },
    );
    expect(s.mensajes.enviados).toEqual([{ a: 'Ana López', texto: 'Hola' }]);
    expect(s.mensajes.borrador).toBe('');
  });

  it('buscar un archivo abre la pantalla de resultados', () => {
    const s = run(
      createInitialState(),
      { type: 'open', target: 'archivos' },
      { type: 'set_text', field: 'archivos.consulta', value: 'catálogo' },
      { type: 'submit', field: 'archivos.buscar' },
    );
    expect(s.pantalla).toBe('archivos.busqueda');
  });
});

describe('utilidades', () => {
  it('los deslizadores se limitan a 0–100', () => {
    expect(run(createInitialState(), { type: 'slide', key: 'brillo', value: 250 }).pantallaCfg.brillo).toBe(100);
    expect(run(createInitialState(), { type: 'slide', key: 'brillo', value: -5 }).pantallaCfg.brillo).toBe(0);
  });

  it('stateChanged ignora la navegación', () => {
    const a = createInitialState();
    expect(stateChanged(a, run(a, { type: 'open', target: 'ajustes' }))).toBe(false);
    expect(stateChanged(a, run(a, { type: 'toggle', key: 'bluetooth' }))).toBe(true);
  });

  it('actionKey es estable', () => {
    expect(actionKey({ type: 'select', group: 'red', value: 'X' })).toBe('seleccionar:red:X');
    expect(actionKey({ type: 'toggle', key: 'wifi' })).toBe('toggle:wifi');
    expect(actionKey({ type: 'back' })).toBe('atras');
  });
});
