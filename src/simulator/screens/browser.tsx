import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { A } from '../android';
import { useSim } from '../context';
import { MIcon } from '../parts';

const SUGERENCIAS = ['cómo cambiar una llanta', 'cómo cambiar una llanta paso a paso', 'cómo cambiar una llanta ponchada', 'cómo cambiar una llanta sin gato'];

function AddressBar({ text, active, onPress }: { text: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Barra de direcciones"
      style={{ margin: 12, height: 48, borderRadius: 24, backgroundColor: '#EEF1F8', borderWidth: active ? 2 : 0, borderColor: A.accent, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }}
    >
      <MIcon name="search" size={22} color={A.text2} />
      <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, color: text ? A.text : A.text2 }}>{text || 'Buscar o escribir URL'}</Text>
    </Pressable>
  );
}

export function BrowserHome() {
  const { dispatch } = useSim();
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <AddressBar text="" onPress={() => dispatch({ type: 'open', target: 'navegador.escribiendo' })} />
      <View style={{ alignItems: 'center', marginTop: 64 }}>
        <MIcon name="public" size={72} color={A.accent} />
        <Text style={{ fontSize: 28, color: A.text, marginTop: 12 }}>Navegador</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 48, paddingHorizontal: 8 }}>
        {[['R', 'Roly'], ['N', 'Noticias'], ['M', 'Mapas'], ['C', 'Clima']].map(([l, t]) => (
          <Pressable key={t} onPress={() => dispatch({ type: 'tap_empty' })} style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEF1F8', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '500', color: A.accent }}>{l}</Text>
            </View>
            <Text style={{ fontSize: 12, color: A.text2 }}>{t}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Escribir en la barra: usa el teclado real del teléfono. */
export function BrowserTyping() {
  const { state, dispatch } = useSim();
  const [text, setText] = useState(state.navegador.borrador);
  const last = useRef(state.navegador.borrador);
  const report = () => {
    if (text !== last.current) {
      last.current = text;
      dispatch({ type: 'set_text', field: 'navegador.borrador', value: text });
    }
  };
  const search = () => {
    report();
    dispatch({ type: 'submit', field: 'navegador.buscar' });
  };
  const q = text.trim().toLowerCase();
  const sugerencias = q ? SUGERENCIAS.filter((s) => s.includes(q)) : SUGERENCIAS;
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ margin: 12, height: 48, borderRadius: 24, backgroundColor: '#EEF1F8', borderWidth: 2, borderColor: A.accent, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }}>
        <MIcon name="search" size={22} color={A.text2} />
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          onBlur={report}
          onSubmitEditing={search}
          returnKeyType="search"
          placeholder="Buscar o escribir URL"
          placeholderTextColor={A.text2}
          autoCorrect={false}
          style={{ flex: 1, fontSize: 16, color: A.text, padding: 0 }}
        />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        {sugerencias.map((s) => (
          <Pressable key={s} onPress={() => dispatch({ type: 'select', group: 'sugerencia', value: s })} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14 }}>
            <MIcon name="search" size={20} color={A.outline} />
            <Text style={{ flex: 1, fontSize: 16, color: A.text }}>{s}</Text>
            <MIcon name="north-west" size={20} color={A.outline} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function BrowserResults() {
  const { state, dispatch, world } = useSim();
  const q = state.navegador.consulta ?? '';
  const results = world.buscar(q);
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <AddressBar text={q} onPress={() => dispatch({ type: 'open', target: 'navegador.escribiendo' })} />
      <View style={{ flexDirection: 'row', gap: 20, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: A.divider }}>
        {['Todo', 'Imágenes', 'Videos', 'Noticias'].map((t, i) => (
          <View key={t} style={{ paddingBottom: 8, borderBottomWidth: i === 0 ? 3 : 0, borderBottomColor: A.accent }}>
            <Text style={{ fontSize: 14, fontWeight: i === 0 ? '500' : '400', color: i === 0 ? A.accent : A.text2 }}>{t}</Text>
          </View>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 20 }}>
        {results.map((r) => (
          <Pressable key={r.id} onPress={() => dispatch({ type: 'select', group: 'resultado', value: r.id })} accessibilityLabel={r.titulo} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: A.shade }} />
              <Text style={{ fontSize: 12, color: A.text2 }}>{r.sitio}</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#1A0DAB' }}>{r.titulo}</Text>
            <Text style={{ fontSize: 13, color: '#4D5156', lineHeight: 19 }}>{r.descripcion}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function BrowserPage() {
  const { state, dispatch, world } = useSim();
  const r = world.buscar(state.navegador.consulta ?? '').find((x) => x.id === state.navegador.resultadoAbierto);
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <AddressBar text={r?.sitio ?? ''} onPress={() => dispatch({ type: 'tap_empty' })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={{ fontSize: 26, color: A.text }}>{r?.titulo}</Text>
        <Text style={{ fontSize: 15, color: '#4D5156', lineHeight: 23 }}>{r?.descripcion}</Text>
        <View style={{ height: 150, borderRadius: 12, backgroundColor: A.shade }} />
        <Text style={{ fontSize: 15, color: '#4D5156', lineHeight: 23 }}>Contenido de ejemplo de la página. En la evaluación real solo importa que el candidato logre abrir el resultado.</Text>
      </ScrollView>
    </View>
  );
}
