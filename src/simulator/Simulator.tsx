import { useCallback, useMemo, useState } from 'react';
import type { PhoneAction, PhoneState } from '../engine/types';
import { DEFAULT_WORLD, type World } from '../engine/world';
import { SimProvider, useSim } from './context';
import { PhoneShell } from './PhoneShell';
import { BrowserHome, BrowserPage, BrowserResults, BrowserTyping } from './screens/browser';
import { Camera, Gallery } from './screens/camera';
import { ContactDetail, ContactList, Dialer, InCall } from './screens/contacts';
import { FileCategory, FileSearch, FilesHome, FileViewer } from './screens/files';
import { Home, QuickSettings, Wallpaper } from './screens/home';
import { Maps } from './screens/maps';
import { Conversation, MessageList, NewChat } from './screens/messages';
import { BluetoothSettings, DisplaySettings, InternetSettings, NetworkSettings, SettingsHome, SoundSettings, WifiPassword } from './screens/settings';

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
    case 'archivos': return <FilesHome />;
    case 'archivos.busqueda': return <FileSearch />;
    case 'archivos.documentos':
    case 'archivos.imagenes':
    case 'archivos.videos':
    case 'archivos.audio': return <FileCategory pantalla={pantalla} />;
    case 'archivos.visor': return <FileViewer />;
    case 'mensajes': return <MessageList />;
    case 'mensajes.nuevo': return <NewChat />;
    case 'mensajes.redactar': return <Conversation />;
    case 'contactos': return <ContactList />;
    case 'contactos.detalle': return <ContactDetail />;
    case 'telefono': return <Dialer />;
    case 'telefono.llamada': return <InCall />;
    case 'camara': return <Camera />;
    case 'galeria': return <Gallery />;
    case 'mapas': return <Maps />;
    default: return <Home />;
  }
}

/** Pantallas con fondo oscuro: la barra de estado y los botones se dibujan en blanco sobre este color. */
const DARK_BG: Record<string, string> = { camara: '#0E1418', 'telefono.llamada': '#1F2A36', 'archivos.visor': '#000000' };
/** Pantallas con fondo blanco puro. */
const WHITE = new Set(['navegador', 'navegador.escribiendo', 'navegador.resultados', 'navegador.pagina', 'galeria', 'telefono']);

function Inner() {
  const { state } = useSim();
  const home = state.pantalla === 'inicio';
  // El visor solo es oscuro para fotos y videos; los documentos se ven sobre fondo claro.
  const docVisor = state.pantalla === 'archivos.visor' && !/\.(jpg|png|mp4)$/i.test(state.archivos.abierto ?? '');
  const darkBg = docVisor ? undefined : DARK_BG[state.pantalla];
  return (
    <PhoneShell
      dark={home || !!darkBg}
      bg={darkBg ?? (docVisor || WHITE.has(state.pantalla) ? '#FFFFFF' : undefined)}
      wallpaper={home ? <Wallpaper /> : undefined}
      navTransparent={state.pantalla === 'mapas'}
    >
      <Screen pantalla={state.pantalla} />
    </PhoneShell>
  );
}

/**
 * El teléfono simulado completo. Solo recibe el estado y un `dispatch`; no conoce las tareas.
 * `highlight` es la ruta que "Mostrarme" debe señalar: se marca el último elemento de la lista
 * que esté visible, así la guía avanza sola conforme el candidato navega.
 */
export function Simulator({ state, dispatch, highlight = [], world = DEFAULT_WORLD }: { state: PhoneState; dispatch: (a: PhoneAction) => void; highlight?: readonly string[]; world?: World }) {
  // Cuántas veces está montado cada elemento señalable (id → contador).
  const [mounted, setMounted] = useState<Record<string, number>>({});

  const registerHit = useCallback((id: string) => {
    setMounted((m) => ({ ...m, [id]: (m[id] ?? 0) + 1 }));
    return () =>
      setMounted((m) => {
        const next = { ...m };
        const n = (next[id] ?? 1) - 1;
        if (n <= 0) delete next[id];
        else next[id] = n;
        return next;
      });
  }, []);

  const activeHighlight = useMemo(() => {
    for (let i = highlight.length - 1; i >= 0; i--) if (mounted[highlight[i]!]) return highlight[i]!;
    return null;
  }, [highlight, mounted]);

  return (
    <SimProvider value={{ state, dispatch, activeHighlight, registerHit, world }}>
      <Inner />
    </SimProvider>
  );
}
