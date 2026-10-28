import { MaterialIcons } from '@expo/vector-icons';
import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { A } from './android';
import { useSim } from './context';
import { hhmm, Hit, useNow } from './parts';

/**
 * Marco del teléfono Android: bisel, barra de estado y botones de navegación (atrás, inicio,
 * recientes). Los botones llaman al motor; nunca salen de la app.
 *
 * - La barra de estado abre el Centro de control al tocarla o al deslizar hacia abajo (como en HyperOS).
 * - El brillo del teléfono simulado oscurece la pantalla de verdad, para que la tarea de brillo se sienta real.
 */
export function PhoneShell({ children, dark = false, wallpaper, navTransparent, bg }: { children: ReactNode; dark?: boolean; wallpaper?: ReactNode; navTransparent?: boolean; bg?: string }) {
  const { state, dispatch } = useSim();
  const now = useNow();
  const c = dark ? '#FFFFFF' : A.text;
  const k = state.conectividad;
  const sonido = state.sonido;
  const start = useRef(0);

  const onGrant = (e: GestureResponderEvent) => {
    start.current = e.nativeEvent.pageY;
  };
  // Tocar o deslizar hacia abajo abren el Centro de control; deslizar hacia arriba no hace nada.
  const onRelease = (e: GestureResponderEvent) => {
    if (e.nativeEvent.pageY - start.current >= -6 && state.pantalla !== 'ajustes_rapidos') {
      dispatch({ type: 'open', target: 'ajustes_rapidos' });
    }
  };

  const wifiConectado = k.wifi && !!k.redWifi && !k.modoAvion;
  const silencio = sonido.timbre === 0;
  // Por debajo de 50 % la pantalla se oscurece; en 0 queda muy oscura pero aún legible.
  const dim = Math.max(0, (50 - state.pantallaCfg.brillo) / 50) * 0.68;

  return (
    <View style={styles.bezel}>
      <View style={[styles.screen, bg ? { backgroundColor: bg } : null]}>
        {wallpaper ? <View style={StyleSheet.absoluteFill}>{wallpaper}</View> : null}
        <Hit id="statusbar" radius={8}>
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel="Barra de estado: desliza hacia abajo para abrir el Centro de control"
            onStartShouldSetResponder={() => true}
            onResponderGrant={onGrant}
            onResponderRelease={onRelease}
            hitSlop={{ top: 0, bottom: 14, left: 0, right: 0 }}
            style={styles.status}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: c }}>{hhmm(now)}</Text>
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              {state.sistema.noMolestar ? <MaterialIcons name="do-not-disturb-on" size={14} color={c} /> : null}
              {silencio ? <MaterialIcons name={sonido.vibrar ? 'vibration' : 'notifications-off'} size={14} color={c} /> : null}
              {k.bluetooth ? <MaterialIcons name={k.dispositivoBt ? 'bluetooth-connected' : 'bluetooth'} size={14} color={c} /> : null}
              {k.modoAvion ? (
                <MaterialIcons name="airplanemode-active" size={15} color={c} />
              ) : (
                <>
                  {k.datos && !wifiConectado ? <Text style={{ fontSize: 10, fontWeight: '700', color: c }}>4G</Text> : null}
                  <MaterialIcons name="signal-cellular-alt" size={15} color={c} />
                </>
              )}
              {wifiConectado ? <MaterialIcons name="wifi" size={15} color={c} /> : null}
              <View style={[styles.battery, { borderColor: c }]}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: c }}>82</Text>
              </View>
            </View>
          </View>
        </Hit>

        <Pressable style={{ flex: 1 }} onPress={() => dispatch({ type: 'tap_empty' })} accessible={false}>
          {children}
        </Pressable>

        <View style={[styles.nav, (dark || !!wallpaper || navTransparent || !!bg) && { backgroundColor: 'transparent' }]}>
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

        {dim > 0.01 ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: dim }]} /> : null}
      </View>
    </View>
  );
}

function NavButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.5 }]} hitSlop={4}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bezel: { flex: 1, backgroundColor: A.bezel, borderRadius: 40, padding: 8 },
  screen: { flex: 1, borderRadius: 32, overflow: 'hidden', backgroundColor: A.bg },
  status: { height: 30, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  battery: { minWidth: 22, height: 13, borderRadius: 4, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  nav: { height: 44, flexDirection: 'row', backgroundColor: A.bg },
  navBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
