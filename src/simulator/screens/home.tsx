import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ToggleKey } from '../../engine/types';
import { A } from '../android';
import { useSim } from '../context';
import { fechaLarga, hhmm, Hit, MIcon, SliderPill, useNow, type IconName } from '../parts';

export const Wallpaper = () => (
  <LinearGradient colors={['#1D3557', '#5B86B0', '#E9B997']} locations={[0, 0.55, 1]} style={{ flex: 1 }} />
);

type App = { id: string; label: string; icon: IconName; bg: string; target: string };

const APPS: App[] = [
  { id: 'ajustes', label: 'Ajustes', icon: 'settings', bg: '#5F6B7A', target: 'ajustes' },
  { id: 'archivos', label: 'Archivos', icon: 'folder', bg: '#1A73E8', target: 'archivos' },
  { id: 'galeria', label: 'Galería', icon: 'image', bg: '#D93025', target: 'galeria' },
  { id: 'contactos', label: 'Contactos', icon: 'person', bg: '#1967D2', target: 'contactos' },
  { id: 'mapas', label: 'Mapas', icon: 'place', bg: '#188038', target: 'mapas' },
];
const DOCK: App[] = [
  { id: 'telefono', label: 'Teléfono', icon: 'call', bg: '#188038', target: 'telefono' },
  { id: 'mensajes', label: 'Mensajes', icon: 'sms', bg: '#1A73E8', target: 'mensajes' },
  { id: 'navegador', label: 'Navegador', icon: 'public', bg: '#1E9E5A', target: 'navegador' },
  { id: 'camara', label: 'Cámara', icon: 'photo-camera', bg: '#3C4043', target: 'camara' },
];

function AppIcon({ app }: { app: App }) {
  const { dispatch } = useSim();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={app.label}
      onPress={() => dispatch({ type: 'open', target: app.target })}
      style={({ pressed }) => ({ width: '25%', alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}
    >
      <Hit id={`app.${app.id}`} radius={26}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: app.bg, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name={app.icon} size={28} color="#FFFFFF" />
        </View>
      </Hit>
      <Text numberOfLines={1} style={{ fontSize: 12, color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 3 }}>{app.label}</Text>
    </Pressable>
  );
}

export function Home() {
  const { dispatch } = useSim();
  const now = useNow();
  return (
    <View style={{ flex: 1, paddingHorizontal: 8 }}>
      <View style={{ marginTop: 20, marginLeft: 16 }}>
        <Text style={{ fontSize: 64, fontWeight: '200', color: '#FFFFFF', lineHeight: 72 }}>{hhmm(now)}</Text>
        <Text style={{ fontSize: 15, color: '#FFFFFF' }}>{fechaLarga(now)}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, marginBottom: 24 }}>
        {APPS.map((a) => <AppIcon key={a.id} app={a} />)}
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        {DOCK.map((a) => <AppIcon key={a.id} app={a} />)}
      </View>
      <Hit id="home.buscar" radius={24}>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Buscar en Internet"
          onPress={() => {
            dispatch({ type: 'open', target: 'navegador' });
            dispatch({ type: 'open', target: 'navegador.escribiendo' });
          }}
          style={{ height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.92)', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginHorizontal: 8, marginBottom: 8 }}
        >
          <MIcon name="search" size={22} color={A.text2} />
          <Text style={{ fontSize: 16, color: A.text2 }}>Buscar</Text>
        </Pressable>
      </Hit>
    </View>
  );
}

type TileDef = { id: string; label: string; sub?: string; icon: IconName; on: boolean; toggle?: ToggleKey; open?: string; disabled?: boolean };

/** Centro de control (se abre tocando o deslizando la barra de estado hacia abajo). */
export function QuickSettings() {
  const { state, dispatch } = useSim();
  const now = useNow();
  const c = state.conectividad;
  const sys = state.sistema;

  const tiles: TileDef[][] = [
    [
      { id: 'qs.wifi', label: 'Wi-Fi', sub: c.wifi ? (c.redWifi ?? 'Sin conectar') : 'Desactivado', icon: c.wifi ? 'wifi' : 'wifi-off', on: c.wifi, toggle: 'wifi', open: 'ajustes.internet' },
      { id: 'qs.datos', label: 'Datos', sub: c.modoAvion ? 'No disponible' : c.datos ? 'Telcel · 4G' : 'Desactivados', icon: 'swap-vert', on: c.datos && !c.modoAvion, toggle: 'datos', open: 'ajustes.red' },
    ],
    [
      { id: 'qs.bluetooth', label: 'Bluetooth', sub: c.bluetooth ? (c.dispositivoBt ?? 'Activado') : 'Desactivado', icon: c.dispositivoBt ? 'bluetooth-connected' : 'bluetooth', on: c.bluetooth, toggle: 'bluetooth', open: 'ajustes.bluetooth' },
      { id: 'qs.avion', label: 'Modo avión', sub: c.modoAvion ? 'Activado' : 'Desactivado', icon: 'airplanemode-active', on: c.modoAvion, toggle: 'modoAvion' },
    ],
    [
      { id: 'qs.linterna', label: 'Linterna', sub: sys.linterna ? 'Encendida' : 'Apagada', icon: sys.linterna ? 'flashlight-on' : 'flashlight-off', on: sys.linterna, toggle: 'linterna' },
      { id: 'qs.nomolestar', label: 'No molestar', sub: sys.noMolestar ? 'Activado' : 'Desactivado', icon: 'do-not-disturb-on', on: sys.noMolestar, toggle: 'noMolestar' },
    ],
    [
      { id: 'qs.bateria', label: 'Ahorro', sub: sys.ahorroBateria ? 'Batería · activado' : 'Batería · 82 %', icon: 'battery-saver', on: sys.ahorroBateria, toggle: 'ahorroBateria' },
      { id: 'qs.oscuro', label: 'Tema oscuro', sub: state.pantallaCfg.modoOscuro ? 'Activado' : 'Desactivado', icon: 'dark-mode', on: state.pantallaCfg.modoOscuro, toggle: 'modoOscuro' },
    ],
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: A.shade }} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
        <View>
          <Text style={{ fontSize: 40, color: A.text, fontWeight: '300' }}>{hhmm(now)}</Text>
          <Text style={{ fontSize: 14, color: A.text2 }}>{fechaLarga(now)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir Ajustes"
          onPress={() => dispatch({ type: 'open', target: 'ajustes' })}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: pressed ? '#BFD3F8' : A.accentSoft, alignItems: 'center', justifyContent: 'center', marginTop: 8 })}
        >
          <MIcon name="settings" size={22} color={A.accent} />
        </Pressable>
      </View>

      <View style={{ gap: 8, marginTop: 18 }}>
        {tiles.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map((t) => <Tile key={t.id} t={t} />)}
          </View>
        ))}
      </View>

      <View style={{ gap: 10, marginTop: 14 }}>
        <Hit id="qs.brillo" radius={26}>
          <SliderPill value={state.pantallaCfg.brillo} onChange={(v) => dispatch({ type: 'slide', key: 'brillo', value: v })} icon="light-mode" label="Brillo" />
        </Hit>
        <SliderPill value={state.sonido.multimedia} onChange={(v) => dispatch({ type: 'slide', key: 'volMultimedia', value: v })} icon={state.sonido.multimedia === 0 ? 'volume-off' : 'volume-up'} label="Volumen de multimedia" />
      </View>

      <View style={{ height: 1, backgroundColor: '#C9D3E6', marginTop: 18 }} />
      <Text style={{ textAlign: 'center', color: A.outline, fontSize: 14, marginTop: 24 }}>Sin notificaciones</Text>
    </ScrollView>
  );
}

function Tile({ t }: { t: TileDef }) {
  const { dispatch } = useSim();
  const fg = t.on ? '#FFFFFF' : A.text;
  const toggle = () => (t.toggle ? dispatch({ type: 'toggle', key: t.toggle }) : dispatch({ type: 'tap_empty' }));
  return (
    <Hit id={t.id} radius={32} style={{ flex: 1 }}>
      <View style={{ height: 64, borderRadius: 32, backgroundColor: t.on ? A.accent : A.tileOff, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel={t.label}
          accessibilityState={{ checked: t.on }}
          onPress={toggle}
          style={({ pressed }) => ({ width: 52, height: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(0,0,0,0.08)' : 'transparent' })}
        >
          <MIcon name={t.icon} size={22} color={fg} />
        </Pressable>
        {/* Tocar el texto abre el ajuste completo (si existe); si no, también activa/desactiva. */}
        <Pressable
          accessibilityLabel={t.open ? `Abrir ajustes de ${t.label}` : t.label}
          onPress={t.open ? () => dispatch({ type: 'open', target: t.open! }) : toggle}
          style={{ flex: 1, height: 64, justifyContent: 'center', paddingRight: 12 }}
        >
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{ fontSize: 14, fontWeight: '600', color: fg }}>{t.label}</Text>
          {t.sub ? <Text numberOfLines={1} style={{ fontSize: 12, color: t.on ? '#E3ECFF' : A.text2 }}>{t.sub}</Text> : null}
        </Pressable>
      </View>
    </Hit>
  );
}
