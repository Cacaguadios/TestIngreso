import { Text, View } from 'react-native';
import type { PhoneAction, PhoneState } from '../engine/types';
import { DEFAULT_WORLD, type World } from '../engine/world';
import { A } from './android';
import { SimProvider, useSim } from './context';
import { PhoneShell } from './PhoneShell';
import { BrowserHome, BrowserPage, BrowserResults, BrowserTyping } from './screens/browser';
import { Home, QuickSettings, Wallpaper } from './screens/home';
import { BluetoothSettings, DisplaySettings, InternetSettings, NetworkSettings, SettingsHome, SoundSettings, WifiPassword } from './screens/settings';
import { AppBar, MIcon } from './parts';

const NOMBRES: Record<string, string> = {
  archivos: 'Archivos', 'archivos.busqueda': 'Archivos', mensajes: 'Mensajes', 'mensajes.redactar': 'Mensajes',
  galeria: 'Galería', camara: 'Cámara', contactos: 'Contactos', 'contactos.detalle': 'Contactos', mapas: 'Mapas', telefono: 'Teléfono',
};

/** Apps que el motor ya soporta pero cuya pantalla llegará en una versión posterior. */
function ComingSoon({ pantalla }: { pantalla: string }) {
  const { dispatch } = useSim();
  return (
    <View style={{ flex: 1 }}>
      <AppBar title={NOMBRES[pantalla] ?? 'Aplicación'} onBack={() => dispatch({ type: 'back' })} />
      <View style={{ alignItems: 'center', padding: 32, gap: 10 }}>
        <MIcon name="construction" size={40} color={A.outline} />
        <Text style={{ textAlign: 'center', color: A.text2, fontSize: 15 }}>Esta aplicación estará disponible en una versión posterior.</Text>
      </View>
    </View>
  );
}

function Screen({ pantalla }: { pantalla: string }) {
  switch (pantalla) {
    case 'inicio': return <Home />;
    case 'ajustes_rapidos': return <QuickSettings />;
    case 'ajustes': return <SettingsHome />;
    case 'ajustes.red': return <NetworkSettings />;
    case 'ajustes.internet': return <InternetSettings />;
    case 'wifi.contrasena': return <WifiPassword />;
    case 'ajustes.bluetooth': return <BluetoothSettings />;
    case 'ajustes.sonido': return <SoundSettings />;
    case 'ajustes.pantalla': return <DisplaySettings />;
    case 'navegador': return <BrowserHome />;
    case 'navegador.escribiendo': return <BrowserTyping />;
    case 'navegador.resultados': return <BrowserResults />;
    case 'navegador.pagina': return <BrowserPage />;
    default: return <ComingSoon pantalla={pantalla} />;
  }
}

function Inner() {
  const { state } = useSim();
  const home = state.pantalla === 'inicio';
  return (
    <PhoneShell dark={home} wallpaper={home ? <Wallpaper /> : undefined}>
      <Screen pantalla={state.pantalla} />
    </PhoneShell>
  );
}

/** El teléfono simulado completo. Solo recibe el estado y un `dispatch`; no conoce las tareas. */
export function Simulator({ state, dispatch, highlight = null, world = DEFAULT_WORLD }: { state: PhoneState; dispatch: (a: PhoneAction) => void; highlight?: string | null; world?: World }) {
  return (
    <SimProvider value={{ state, dispatch, highlight, world }}>
      <Inner />
    </SimProvider>
  );
}
