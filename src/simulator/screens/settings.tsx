import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { A } from '../android';
import { useSim } from '../context';
import { AppBar, Chevron, ListRow, MIcon, SectionLabel, SliderRow, SwitchM3 } from '../parts';

const pad = { paddingHorizontal: 16, gap: 4, paddingBottom: 24 } as const;

export function SettingsHome() {
  const { dispatch } = useSim();
  const open = (target: string) => () => dispatch({ type: 'open', target });
  return (
    <ScrollView contentContainerStyle={pad}>
      <Text style={{ fontSize: 30, color: A.text, marginTop: 14, marginBottom: 12, marginLeft: 8 }}>Ajustes</Text>
      <View style={{ height: 52, borderRadius: 26, backgroundColor: A.shade, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 10 }}>
        <MIcon name="search" size={22} color={A.text2} />
        <Text style={{ fontSize: 16, color: A.text2 }}>Buscar en Ajustes</Text>
      </View>
      <ListRow icon="wifi" title="Red e Internet" sub="Internet, SIM, Modo avión" onPress={open('ajustes.red')} highlightId="ajustes.red" />
      <ListRow icon="bluetooth" title="Dispositivos conectados" sub="Bluetooth, vincular dispositivo" onPress={open('ajustes.bluetooth')} />
      <ListRow icon="apps" title="Aplicaciones" sub="Apps recientes" onPress={() => dispatch({ type: 'tap_empty' })} />
      <ListRow icon="battery-std" title="Batería" sub="82 %" onPress={() => dispatch({ type: 'tap_empty' })} />
      <ListRow icon="storage" title="Almacenamiento" sub="54 % usado" onPress={() => dispatch({ type: 'tap_empty' })} />
      <ListRow icon="volume-up" title="Sonido y vibración" sub="Volumen, No molestar" onPress={open('ajustes.sonido')} />
      <ListRow icon="brightness-7" title="Pantalla" sub="Brillo, modo oscuro" onPress={open('ajustes.pantalla')} />
    </ScrollView>
  );
}

export function NetworkSettings() {
  const { state, dispatch } = useSim();
  const c = state.conectividad;
  return (
    <View>
      <AppBar title="Red e Internet" onBack={() => dispatch({ type: 'back' })} />
      <View style={pad}>
        <ListRow icon="wifi" title="Internet" sub={c.wifi ? (c.redWifi ?? 'Wi-Fi activado') : 'Wi-Fi desactivado'} trailing={<Chevron />} onPress={() => dispatch({ type: 'open', target: 'ajustes.internet' })} highlightId="ajustes.internet" />
        <ListRow icon="sim-card" title="Datos móviles" sub={c.datos && !c.modoAvion ? 'Activados' : 'Desactivados'} trailing={<SwitchM3 on={c.datos} onPress={() => dispatch({ type: 'toggle', key: 'datos' })} />} />
        <View style={{ height: 8 }} />
        <ListRow icon="airplanemode-active" title="Modo avión" trailing={<SwitchM3 on={c.modoAvion} onPress={() => dispatch({ type: 'toggle', key: 'modoAvion' })} />} />
        <ListRow icon="wifi-tethering" title="Zona Wi-Fi" sub="Desactivada" trailing={<Chevron />} onPress={() => dispatch({ type: 'tap_empty' })} />
      </View>
    </View>
  );
}

export function InternetSettings() {
  const { state, dispatch, world } = useSim();
  const c = state.conectividad;
  const connected = c.wifi ? world.redes.find((r) => r.ssid === c.redWifi) : undefined;
  const others = world.redes.filter((r) => r.ssid !== c.redWifi);
  const netRow = (r: (typeof world.redes)[number], isConnected: boolean) => (
    <ListRow
      key={r.ssid}
      icon="wifi"
      tint={isConnected ? A.accentSoft : A.shade}
      glyph={isConnected ? A.accent : A.text2}
      title={r.ssid}
      sub={isConnected ? 'Conectado' : r.segura ? 'Protegida · WPA2' : 'Abierta'}
      subColor={isConnected ? A.accent : A.text2}
      trailing={r.segura ? <MIcon name="lock" size={18} color={A.outline} /> : undefined}
      onPress={() => dispatch({ type: 'select', group: 'red', value: r.ssid })}
    />
  );
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <AppBar title="Internet" onBack={() => dispatch({ type: 'back' })} />
      <View style={pad}>
        <ListRow
          title="Usar Wi-Fi"
          sub={c.wifi ? 'Activado' : 'Desactivado'}
          trailing={<SwitchM3 on={c.wifi} onPress={() => dispatch({ type: 'toggle', key: 'wifi' })} />}
          highlightId="ajustes.wifi"
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
          <Text style={{ color: A.text2, fontSize: 14, marginTop: 14, marginLeft: 8 }}>Activa el Wi-Fi para ver las redes disponibles.</Text>
        )}
        <SectionLabel>Datos móviles</SectionLabel>
        <ListRow icon="sim-card" title="Telcel" sub={c.datos && !c.modoAvion ? 'Datos móviles activados' : 'Datos móviles desactivados'} />
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
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#ECEFF8', borderRadius: 28, padding: 24 }}>
          <Text style={{ fontSize: 24, color: A.text, marginBottom: 16 }}>{d.ssid}</Text>
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
            style={{ height: 56, borderWidth: 2, borderColor: d.error ? '#B3261E' : A.accent, borderRadius: 4, paddingHorizontal: 14, fontSize: 18, color: A.text }}
          />
          {d.error ? <Text style={{ color: '#B3261E', fontSize: 13, marginTop: 6 }}>Contraseña incorrecta</Text> : null}
          <Pressable onPress={() => setShow((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <MIcon name={show ? 'check-box' : 'check-box-outline-blank'} size={22} color={A.text2} />
            <Text style={{ fontSize: 14, color: A.text }}>Mostrar contraseña</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 20 }}>
            <Pressable onPress={() => dispatch({ type: 'back' })}><Text style={{ color: A.accent, fontSize: 14, fontWeight: '500' }}>Cancelar</Text></Pressable>
            <Pressable onPress={connect}><Text style={{ color: A.accent, fontSize: 14, fontWeight: '500' }}>Conectar</Text></Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export function BluetoothSettings() {
  const { state, dispatch } = useSim();
  return (
    <View>
      <AppBar title="Bluetooth" onBack={() => dispatch({ type: 'back' })} />
      <View style={pad}>
        <ListRow title="Usar Bluetooth" sub={state.conectividad.bluetooth ? 'Activado' : 'Desactivado'} trailing={<SwitchM3 on={state.conectividad.bluetooth} onPress={() => dispatch({ type: 'toggle', key: 'bluetooth' })} />} />
        <ListRow title="Nombre del dispositivo" sub="Teléfono de evaluación" trailing={<Chevron />} />
        <Text style={{ color: A.text2, fontSize: 14, marginTop: 14, marginLeft: 8 }}>
          {state.conectividad.bluetooth ? 'Buscando dispositivos cercanos…' : 'Activa el Bluetooth para ver los dispositivos cercanos.'}
        </Text>
      </View>
    </View>
  );
}

export function SoundSettings() {
  const { state, dispatch } = useSim();
  const s = state.sonido;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <AppBar title="Sonido y vibración" onBack={() => dispatch({ type: 'back' })} />
      <View style={pad}>
        <SliderRow title="Volumen de multimedia" icon="volume-up" value={s.multimedia} onChange={(v) => dispatch({ type: 'slide', key: 'volMultimedia', value: v })} />
        <SliderRow title="Volumen de llamada" icon="phone" value={s.llamada} onChange={(v) => dispatch({ type: 'slide', key: 'volLlamada', value: v })} />
        <SliderRow title="Volumen de timbre" icon="notifications" value={s.timbre} onChange={(v) => dispatch({ type: 'slide', key: 'volTimbre', value: v })} />
        <View style={{ height: 8 }} />
        <ListRow title="Vibrar al sonar" trailing={<SwitchM3 on={s.vibrar} onPress={() => dispatch({ type: 'toggle', key: 'vibrar' })} />} />
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
        <SliderRow title="Nivel de brillo" icon="brightness-7" value={d.brillo} onChange={(v) => dispatch({ type: 'slide', key: 'brillo', value: v })} />
        <View style={{ height: 8 }} />
        <ListRow title="Brillo adaptable" sub={d.brilloAdaptable ? 'Activado' : 'Desactivado'} trailing={<SwitchM3 on={d.brilloAdaptable} onPress={() => dispatch({ type: 'toggle', key: 'brilloAdaptable' })} />} />
        <ListRow title="Tema oscuro" sub={d.modoOscuro ? 'Activado' : 'Desactivado'} trailing={<SwitchM3 on={d.modoOscuro} onPress={() => dispatch({ type: 'toggle', key: 'modoOscuro' })} />} />
        <ListRow title="Tiempo de espera de pantalla" sub="30 segundos" trailing={<Chevron />} />
      </View>
    </ScrollView>
  );
}
