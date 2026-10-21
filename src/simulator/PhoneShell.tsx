import { MaterialIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { A } from './android';
import { useSim } from './context';
import { hhmm, useNow } from './parts';

/**
 * Marco del teléfono Android: bisel, barra de estado y botones de navegación (atrás, inicio,
 * recientes). Los botones llaman al motor; nunca salen de la app.
 */
export function PhoneShell({ children, dark = false, wallpaper }: { children: ReactNode; dark?: boolean; wallpaper?: ReactNode }) {
  const { state, dispatch } = useSim();
  const now = useNow();
  const c = dark ? '#FFFFFF' : A.text;
  const c2 = state.conectividad;

  return (
    <View style={styles.bezel}>
      <View style={styles.screen}>
        {wallpaper ? <View style={StyleSheet.absoluteFill}>{wallpaper}</View> : null}
        <Pressable
          accessibilityLabel="Barra de estado: tocar para ver los ajustes rápidos"
          onPress={() => dispatch({ type: 'open', target: 'ajustes_rapidos' })}
          style={styles.status}
        >
          <Text style={{ fontSize: 13, fontWeight: '500', color: c }}>{hhmm(now)}</Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {c2.bluetooth ? <MaterialIcons name="bluetooth" size={14} color={c} /> : null}
            {c2.modoAvion ? <MaterialIcons name="airplanemode-active" size={14} color={c} /> : null}
            <MaterialIcons name={c2.wifi ? 'wifi' : 'wifi-off'} size={15} color={c} />
            <MaterialIcons name={c2.modoAvion || !c2.datos ? 'signal-cellular-off' : 'signal-cellular-alt'} size={15} color={c} />
            <MaterialIcons name="battery-full" size={15} color={c} />
          </View>
        </Pressable>

        <Pressable style={{ flex: 1 }} onPress={() => dispatch({ type: 'tap_empty' })}>
          {children}
        </Pressable>

        <View style={[styles.nav, (dark || !!wallpaper) && { backgroundColor: 'transparent' }]}>
          <NavButton label="Atrás" onPress={() => dispatch({ type: 'back' })}>
            <MaterialIcons name="play-arrow" size={22} color={c} style={{ transform: [{ rotate: '180deg' }] }} />
          </NavButton>
          <NavButton label="Inicio" onPress={() => dispatch({ type: 'home' })}>
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: c }} />
          </NavButton>
          <NavButton label="Recientes" onPress={() => dispatch({ type: 'recents' })}>
            <View style={{ width: 14, height: 14, borderRadius: 3, borderWidth: 2, borderColor: c }} />
          </NavButton>
        </View>
      </View>
    </View>
  );
}

function NavButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={styles.navBtn} hitSlop={4}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bezel: { flex: 1, backgroundColor: A.bezel, borderRadius: 40, padding: 8 },
  screen: { flex: 1, borderRadius: 32, overflow: 'hidden', backgroundColor: A.bg },
  status: { height: 30, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  nav: { height: 48, flexDirection: 'row', backgroundColor: A.bg },
  navBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
