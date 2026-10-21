import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { A } from '../android';
import { useSim } from '../context';
import { fechaLarga, hhmm, Hit, MIcon, SliderM3, useNow } from '../parts';
import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export const Wallpaper = () => (
  <LinearGradient colors={['#1D3557', '#5B86B0', '#E9B997']} locations={[0, 0.55, 1]} style={{ flex: 1 }} />
);

const APPS: { id: string; label: string; icon: IconName; bg: string; target: string }[] = [
  { id: 'ajustes', label: 'Ajustes', icon: 'settings', bg: '#5F6B7A', target: 'ajustes' },
  { id: 'archivos', label: 'Archivos', icon: 'folder', bg: '#1A73E8', target: 'archivos' },
  { id: 'galeria', label: 'Galería', icon: 'image', bg: '#D93025', target: 'galeria' },
  { id: 'contactos', label: 'Contactos', icon: 'person', bg: '#1967D2', target: 'contactos' },
  { id: 'mapas', label: 'Mapas', icon: 'place', bg: '#188038', target: 'mapas' },
];
const DOCK: typeof APPS = [
  { id: 'telefono', label: 'Teléfono', icon: 'call', bg: '#188038', target: 'telefono' },
  { id: 'mensajes', label: 'Mensajes', icon: 'sms', bg: '#1A73E8', target: 'mensajes' },
  { id: 'navegador', label: 'Navegador', icon: 'public', bg: '#E8710A', target: 'navegador' },
  { id: 'camara', label: 'Cámara', icon: 'photo-camera', bg: '#3C4043', target: 'camara' },
];

function AppIcon({ app }: { app: (typeof APPS)[number] }) {
  const { dispatch } = useSim();
  return (
    <Hit id={`app.${app.id}`} radius={30}>
      <Pressable accessibilityLabel={app.label} onPress={() => dispatch({ type: 'open', target: app.target })} style={{ width: 72, alignItems: 'center', gap: 6 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: app.bg, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name={app.icon} size={28} color="#FFFFFF" />
        </View>
        <Text style={{ fontSize: 12, color: '#FFFFFF' }}>{app.label}</Text>
      </Pressable>
    </Hit>
  );
}

export function Home() {
  const { dispatch } = useSim();
  const now = useNow();
  return (
    <View style={{ flex: 1, paddingHorizontal: 12 }}>
      <View style={{ marginTop: 28, marginLeft: 12 }}>
        <Text style={{ fontSize: 72, fontWeight: '300', color: '#FFFFFF', lineHeight: 80 }}>{hhmm(now)}</Text>
        <Text style={{ fontSize: 16, color: '#FFFFFF' }}>{fechaLarga(now)}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, marginBottom: 28 }}>
        {APPS.map((a) => <AppIcon key={a.id} app={a} />)}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        {DOCK.map((a) => <AppIcon key={a.id} app={a} />)}
      </View>
      <Pressable
        onPress={() => dispatch({ type: 'open', target: 'navegador' })}
        style={{ height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.92)', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 10 }}
      >
        <MIcon name="search" size={22} color={A.text2} />
        <Text style={{ fontSize: 16, color: A.text2 }}>Buscar</Text>
      </Pressable>
    </View>
  );
}

/** Panel de ajustes rápidos (se abre tocando la barra de estado). */
export function QuickSettings() {
  const { state, dispatch } = useSim();
  const now = useNow();
  const c = state.conectividad;
  const Tile = ({ id, label, sub, icon, on, onPress, onLabelPress }: { id: string; label: string; sub?: string; icon: IconName; on: boolean; onPress: () => void; onLabelPress?: () => void }) => (
    <Hit id={id} radius={32}>
      <View style={{ flex: 1, height: 64, borderRadius: 32, backgroundColor: on ? A.accent : A.tileOff, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable accessibilityLabel={label} onPress={onPress} style={{ width: 62, height: 64, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name={icon} size={22} color={on ? '#FFFFFF' : A.text} />
        </Pressable>
        <Pressable onPress={onLabelPress ?? onPress} style={{ flex: 1, paddingRight: 12 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: on ? '#FFFFFF' : A.text }}>{label}</Text>
          {sub ? <Text numberOfLines={1} style={{ fontSize: 12, color: on ? '#E3ECFF' : A.text2 }}>{sub}</Text> : null}
        </Pressable>
      </View>
    </Hit>
  );
  const none = () => dispatch({ type: 'tap_empty' });
  return (
    <View style={{ flex: 1, backgroundColor: A.shade, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
        <View>
          <Text style={{ fontSize: 40, color: A.text }}>{hhmm(now)}</Text>
          <Text style={{ fontSize: 14, color: A.text2 }}>{fechaLarga(now)}</Text>
        </View>
        <Pressable accessibilityLabel="Ajustes" onPress={() => dispatch({ type: 'open', target: 'ajustes' })} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: A.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name="settings" size={22} color={A.accent} />
        </Pressable>
      </View>
      <View style={{ gap: 8, marginTop: 24 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Tile id="qs.wifi" label="Internet" sub={c.wifi ? (c.redWifi ?? 'Wi-Fi') : 'Desactivado'} icon={c.wifi ? 'wifi' : 'wifi-off'} on={c.wifi} onPress={() => dispatch({ type: 'toggle', key: 'wifi' })} onLabelPress={() => dispatch({ type: 'open', target: 'ajustes.internet' })} />
          <Tile id="qs.bluetooth" label="Bluetooth" sub={c.bluetooth ? 'Activado' : 'Desactivado'} icon="bluetooth" on={c.bluetooth} onPress={() => dispatch({ type: 'toggle', key: 'bluetooth' })} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Tile id="qs.linterna" label="Linterna" icon="flashlight-on" on={false} onPress={none} />
          <Tile id="qs.avion" label="Modo avión" icon="airplanemode-active" on={c.modoAvion} onPress={() => dispatch({ type: 'toggle', key: 'modoAvion' })} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Tile id="qs.bateria" label="Ahorro de batería" icon="battery-saver" on={false} onPress={none} />
          <Tile id="qs.nomolestar" label="No molestar" icon="do-not-disturb-on" on={false} onPress={none} />
        </View>
      </View>
      <View style={{ marginTop: 20 }}>
        <SliderM3 value={state.pantallaCfg.brillo} onChange={(v) => dispatch({ type: 'slide', key: 'brillo', value: v })} />
      </View>
      <Text style={{ textAlign: 'center', color: A.outline, fontSize: 14, marginTop: 40 }}>Sin notificaciones</Text>
    </View>
  );
}
