import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { Network } from '../../engine/world';
import { A } from '../android';
import { useSim } from '../context';
import { AppBar, Chevron, Hit, ListRow, MIcon, SearchPill, SectionLabel, SliderRow, SwitchM3, type IconName } from '../parts';

const pad = { paddingHorizontal: 16, gap: 6, paddingBottom: 24 } as const;

export function SettingsHome() {
  const { dispatch } = useSim();
  const open = (target: string) => () => dispatch({ type: 'open', target });
  const none = () => dispatch({ type: 'tap_empty' });
  return (
    <ScrollView contentContainerStyle={pad}>
      <Text style={{ fontSize: 30, color: A.text, marginTop: 14, marginBottom: 12, marginLeft: 8 }}>Ajustes</Text>
      <SearchPill label="Buscar en Ajustes" onPress={none} />
      <Pressable onPress={none} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: A.card, borderRadius: 20, padding: 14, marginTop: 8, marginBottom: 6 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FF6900', alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name="smartphone" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: A.text }}>Sobre el teléfono</Text>
          <Text style={{ fontSize: 13, color: A.text2 }}>Redmi 15C · HyperOS</Text>
        </View>
        <Chevron />
      </Pressable>
      <ListRow icon="wifi" title="Red e Internet" sub="Wi-Fi, datos móviles, modo avión" onPress={open('ajustes.red')} highlightId="ajustes.red" />
      <ListRow icon="bluetooth" title="Dispositivos conectados" sub="Bluetooth, vincular dispositivo" onPress={open('ajustes.bluetooth')} highlightId="ajustes.bluetooth" />
      <ListRow icon="volume-up" title="Sonido y vibración" sub="Volumen, tono, vibración" onPress={open('ajustes.sonido')} highlightId="ajustes.sonido" />
      <ListRow icon="brightness-6" title="Pantalla" sub="Brillo, tema oscuro" onPress={open('ajustes.pantalla')} highlightId="ajustes.pantalla" />
      <ListRow icon="notifications" title="Notificaciones" sub="Historial, No molestar" onPress={none} />
      <ListRow icon="apps" title="Aplicaciones" sub="Apps recientes, predeterminadas" onPress={none} />
      <ListRow icon="battery-std" title="Batería" sub="82 % · unas 14 h restantes" onPress={none} />
      <ListRow icon="storage" title="Almacenamiento" sub="54 % usado · 58 GB libres" onPress={none} />
      <ListRow icon="lock" title="Seguridad y privacidad" sub="Bloqueo de pantalla, huella" onPress={none} />
    </ScrollView>
  );
}

export function NetworkSettings() {
  const { state, dispatch } = useSim();
  const c = state.conectividad;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <AppBar title="Red e Internet" onBack={() => dispatch({ type: 'back' })} />
      <View style={pad}>
        <ListRow
          icon="wifi"
          title="Internet"
          sub={c.modoAvion && !c.wifi ? 'Modo avión activado' : c.wifi ? (c.redWifi ?? 'Wi-Fi activado · sin conectar') : 'Wi-Fi desactivado'}
          trailing={<Chevron />}
          onPress={() => dispatch({ type: 'open', target: 'ajustes.internet' })}
          highlightId="ajustes.internet"
        />
        <ListRow
          icon="sim-card"
          title="Datos móviles"
          sub={c.modoAvion ? 'No disponible en modo avión' : c.datos ? 'Telcel · Activados' : 'Desactivados'}
          trailing={<SwitchM3 on={c.datos} disabled={c.modoAvion} onPress={() => dispatch({ type: 'toggle', key: 'datos' })} />}
        />
        <View style={{ height: 8 }} />
        <ListRow
          icon="airplanemode-active"
          title="Modo avión"
          sub={c.modoAvion ? 'Activado: sin llamadas ni datos' : undefined}
          trailing={
            <Hit id="ajustes.avion" radius={16}>
              <SwitchM3 on={c.modoAvion} onPress={() => dispatch({ type: 'toggle', key: 'modoAvion' })} />
            </Hit>
          }
        />
        <ListRow icon="wifi-tethering" title="Zona Wi-Fi y conexión compartida" sub="Desactivada" trailing={<Chevron />} onPress={() => dispatch({ type: 'tap_empty' })} />
      </View>
    </ScrollView>
  );
}

const signalIcon = (n = 4): IconName => (n >= 3 ? 'wifi' : n === 2 ? 'wifi-2-bar' : 'wifi-1-bar');

export function InternetSettings() {
  const { state, dispatch, world } = useSim();
  const c = state.conectividad;
  const connected = c.wifi ? world.redes.find((r) => r.ssid === c.redWifi) : undefined;
  const others = world.redes.filter((r) => r.ssid !== c.redWifi);
  const netRow = (r: Network, isConnected: boolean) => (
    <ListRow
      key={r.ssid}
      icon={signalIcon(r.senal)}
      tint={isConnected ? A.accentSoft : A.shade}
      glyph={isConnected ? A.accent : A.text2}
      title={r.ssid}
      sub={isConnected ? 'Conectado' : r.segura ? 'Protegida' : 'Abierta'}
      subColor={isConnected ? A.accent : A.text2}
      trailing={r.segura ? <MIcon name="lock" size={18} color={A.outline} /> : undefined}
      onPress={() => dispatch({ type: 'select', group: 'red', value: r.ssid })}
      highlightId={`red.${r.ssid}`}
    />
  );
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <AppBar title="Internet" onBack={() => dispatch({ type: 'back' })} />
      <View style={pad}>
        <ListRow
          title="Wi-Fi"
          sub={c.wifi ? 'Activado' : 'Desactivado'}
          trailing={
            <Hit id="ajustes.wifi" radius={16}>
              <SwitchM3 on={c.wifi} onPress={() => dispatch({ type: 'toggle', key: 'wifi' })} />
            </Hit>
          }
        />
        {c.wifi ? (
          <>
            {connected ? (
              <>
                <SectionLabel>Red conectada</SectionLabel>
                {netRow(connected, true)}
              </>
            ) : null}
            <SectionLabel>{connected ? 'Otras redes' : 'Redes disponibles'}</SectionLabel>
            {others.map((r) => netRow(r, false))}
          </>
        ) : (
          <Text style={{ color: A.text2, fontSize: 14, marginTop: 14, marginHorizontal: 8, lineHeight: 20 }}>
            Activa el Wi-Fi para ver las redes disponibles.
          </Text>
        )}
        <SectionLabel>Datos móviles</SectionLabel>
        <ListRow icon="sim-card" title="Telcel" sub={c.modoAvion ? 'Modo avión activado' : c.datos ? 'Datos móviles activados · 4G' : 'Datos móviles desactivados'} />
      </View>
    </ScrollView>
  );
}

/** Diálogo de contraseña sobre la pantalla de Internet. */
export function WifiPassword() {
  const { state, dispatch } = useSim();
  const d = state.wifiDialogo;
  const [text, setText] = useState(d.clave);
  const [show, setShow] = useState(false);
  const report = () => {
    if (text !== d.clave) dispatch({ type: 'set_text', field: 'wifi.clave', value: text });
  };
  const connect = () => {
    // Si el texto aún no se reportó, el motor lo necesita antes de intentar conectar.
    report();
    dispatch({ type: 'submit', field: 'wifi.conectar' });
  };
  return (
    <View style={{ flex: 1 }}>
      <InternetSettings />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 12 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 28, padding: 22 }}>
          <Text style={{ fontSize: 13, color: A.text2 }}>Conectar a la red</Text>
          <Text style={{ fontSize: 22, color: A.text, marginBottom: 16, marginTop: 2 }} numberOfLines={1}>{d.ssid}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 2, borderColor: d.error ? A.danger : A.accent, borderRadius: 14, paddingHorizontal: 14 }}>
            <TextInput
              autoFocus
              secureTextEntry={!show}
              value={text}
              onChangeText={setText}
              onBlur={report}
              onSubmitEditing={connect}
              placeholder="Contraseña"
              placeholderTextColor={A.outline}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel="Contraseña de la red"
              style={{ flex: 1, fontSize: 18, color: A.text, padding: 0 }}
            />
            <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} accessibilityLabel={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              <MIcon name={show ? 'visibility' : 'visibility-off'} size={22} color={A.text2} />
            </Pressable>
          </View>
          {d.error ? <Text style={{ color: A.danger, fontSize: 13, marginTop: 6 }}>Contraseña incorrecta. Vuelve a intentarlo.</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Pressable onPress={() => dispatch({ type: 'back' })} style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: 24, backgroundColor: pressed ? '#D9E1F0' : A.shade, alignItems: 'center', justifyContent: 'center' })}>
              <Text style={{ color: A.text, fontSize: 15, fontWeight: '600' }}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={connect} disabled={!text} style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: 24, backgroundColor: pressed ? '#0842A0' : A.accent, alignItems: 'center', justifyContent: 'center', opacity: text ? 1 : 0.5 })}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Conectar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const BT_ICON: Record<string, IconName> = { bocina: 'speaker', audifonos: 'headphones', impresora: 'print' };

export function BluetoothSettings() {
  const { state, dispatch, world } = useSim();
  const c = state.conectividad;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <AppBar title="Bluetooth" onBack={() => dispatch({ type: 'back' })} />
      <View style={pad}>
        <ListRow
          title="Usar Bluetooth"
          sub={c.modoAvion && !c.bluetooth ? 'No disponible en modo avión' : c.bluetooth ? 'Activado' : 'Desactivado'}
          trailing={
            <Hit id="bt.switch" radius={16}>
              <SwitchM3 on={c.bluetooth} disabled={c.modoAvion && !c.bluetooth} onPress={() => dispatch({ type: 'toggle', key: 'bluetooth' })} />
            </Hit>
          }
        />
        <ListRow title="Nombre del dispositivo" sub="Redmi 15C de la sucursal" trailing={<Chevron />} />
        {c.bluetooth ? (
          <>
            <SectionLabel>Dispositivos disponibles</SectionLabel>
            {world.dispositivosBt.map((d) => {
              const on = c.dispositivoBt === d.nombre;
              return (
                <ListRow
                  key={d.nombre}
                  icon={BT_ICON[d.tipo] ?? 'bluetooth'}
                  tint={on ? A.accentSoft : A.shade}
                  glyph={on ? A.accent : A.text2}
                  title={d.nombre}
                  sub={on ? 'Conectado' : 'Toca para vincular'}
                  subColor={on ? A.accent : A.text2}
                  onPress={() => dispatch({ type: 'select', group: 'bt', value: d.nombre })}
                  highlightId={`bt.${d.nombre}`}
                />
              );
            })}
          </>
        ) : (
          <Text style={{ color: A.text2, fontSize: 14, marginTop: 14, marginHorizontal: 8, lineHeight: 20 }}>Activa el Bluetooth para ver los dispositivos cercanos.</Text>
        )}
      </View>
    </ScrollView>
  );
}

export function SoundSettings() {
  const { state, dispatch } = useSim();
  const s = state.sonido;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <AppBar title="Sonido y vibración" onBack={() => dispatch({ type: 'back' })} />
      <View style={pad}>
        <SliderRow title="Volumen de multimedia" icon="music-note" value={s.multimedia} onChange={(v) => dispatch({ type: 'slide', key: 'volMultimedia', value: v })} />
        <SliderRow title="Volumen de llamada" icon="phone-in-talk" value={s.llamada} onChange={(v) => dispatch({ type: 'slide', key: 'volLlamada', value: v })} />
        <SliderRow title="Volumen de timbre" icon="notifications-active" value={s.timbre} onChange={(v) => dispatch({ type: 'slide', key: 'volTimbre', value: v })} highlightId="sonido.timbre" />
        <View style={{ height: 8 }} />
        <ListRow title="Vibrar al sonar" sub={s.vibrar ? 'Activado' : 'Desactivado'} trailing={<SwitchM3 on={s.vibrar} onPress={() => dispatch({ type: 'toggle', key: 'vibrar' })} />} />
        <ListRow title="Tono de llamada" sub="Mi Ringtone" trailing={<Chevron />} onPress={() => dispatch({ type: 'tap_empty' })} />
      </View>
    </ScrollView>
  );
}

export function DisplaySettings() {
  const { state, dispatch } = useSim();
  const d = state.pantallaCfg;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <AppBar title="Pantalla" onBack={() => dispatch({ type: 'back' })} />
      <View style={pad}>
        <SliderRow title="Nivel de brillo" icon="brightness-6" value={d.brillo} onChange={(v) => dispatch({ type: 'slide', key: 'brillo', value: v })} highlightId="pantalla.brillo" />
        <View style={{ height: 8 }} />
        <ListRow title="Brillo automático" sub={d.brilloAdaptable ? 'Activado' : 'Desactivado'} trailing={<SwitchM3 on={d.brilloAdaptable} onPress={() => dispatch({ type: 'toggle', key: 'brilloAdaptable' })} />} />
        <ListRow title="Tema oscuro" sub={d.modoOscuro ? 'Activado' : 'Desactivado'} trailing={<SwitchM3 on={d.modoOscuro} onPress={() => dispatch({ type: 'toggle', key: 'modoOscuro' })} />} />
        <ListRow title="Suspender pantalla" sub="Después de 30 segundos" trailing={<Chevron />} onPress={() => dispatch({ type: 'tap_empty' })} />
      </View>
    </ScrollView>
  );
}
