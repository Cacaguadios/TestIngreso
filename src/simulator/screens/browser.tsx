import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { A } from '../android';
import { useSim } from '../context';
import { Hit, MIcon } from '../parts';

const SUGERENCIAS = [
  'cómo cambiar una llanta',
  'cómo cambiar una llanta paso a paso',
  'cómo cambiar una llanta ponchada',
  'handy roly',
  'clima en puebla',
  'tipo de cambio dólar hoy',
];

function AddressBar({ text, onPress, secure }: { text: string; onPress?: () => void; secure?: boolean }) {
  return (
    <Hit id="navegador.barra" radius={24} style={{ margin: 12 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="search"
        accessibilityLabel="Barra de búsqueda y direcciones"
        style={({ pressed }) => ({ height: 48, borderRadius: 24, backgroundColor: pressed ? '#E2E7F2' : '#EEF1F8', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 })}
      >
        <MIcon name={secure ? 'lock' : 'search'} size={secure ? 18 : 22} color={A.text2} />
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, color: text ? A.text : A.text2 }}>{text || 'Buscar o escribir dirección web'}</Text>
        <MIcon name="mic" size={22} color={A.text2} />
      </Pressable>
    </Hit>
  );
}

function Tabs() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', height: 48, borderTopWidth: 1, borderTopColor: A.divider }}>
      {(['arrow-back-ios', 'arrow-forward-ios', 'home', 'filter-1', 'more-vert'] as const).map((i) => (
        <MIcon key={i} name={i} size={20} color={A.text2} />
      ))}
    </View>
  );
}

export function BrowserHome() {
  const { dispatch } = useSim();
  const atajos: [string, string, string][] = [
    ['R', 'Roly', '#008C44'],
    ['N', 'Noticias', '#C5221F'],
    ['C', 'Clima', '#F29900'],
    ['B', 'Banco', '#1967D2'],
  ];
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1 }}>
        <View style={{ alignItems: 'center', marginTop: 48 }}>
          <MIcon name="public" size={64} color={A.accent} />
          <Text style={{ fontSize: 26, color: A.text, marginTop: 8 }}>Navegador</Text>
        </View>
        <AddressBar text="" onPress={() => dispatch({ type: 'open', target: 'navegador.escribiendo' })} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingHorizontal: 8 }}>
          {atajos.map(([l, t, color]) => (
            <Pressable key={t} onPress={() => dispatch({ type: 'tap_empty' })} style={{ alignItems: 'center', gap: 6, width: 70 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEF1F8', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '600', color }}>{l}</Text>
              </View>
              <Text style={{ fontSize: 12, color: A.text2 }}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Tabs />
    </View>
  );
}

/** Escribir en la barra: usa el teclado real del teléfono. */
export function BrowserTyping() {
  const { state, dispatch } = useSim();
  const [text, setText] = useState(state.navegador.borrador);
  const [last, setLast] = useState(state.navegador.borrador);
  const report = () => {
    if (text !== last) {
      setLast(text);
      dispatch({ type: 'set_text', field: 'navegador.borrador', value: text });
    }
  };
  const search = () => {
    report();
    dispatch({ type: 'submit', field: 'navegador.buscar' });
  };
  const q = text.trim().toLowerCase();
  const sugerencias = q ? SUGERENCIAS.filter((s) => s.includes(q)).slice(0, 5) : SUGERENCIAS.slice(0, 4);
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', margin: 12, gap: 6 }}>
        <Pressable onPress={() => dispatch({ type: 'back' })} accessibilityLabel="Atrás" hitSlop={8} style={{ width: 36, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name="arrow-back" size={22} color={A.text2} />
        </Pressable>
        <View style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: '#EEF1F8', borderWidth: 2, borderColor: A.accent, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 }}>
          <TextInput
            autoFocus
            value={text}
            onChangeText={setText}
            onBlur={report}
            onSubmitEditing={search}
            returnKeyType="search"
            placeholder="Buscar o escribir dirección web"
            placeholderTextColor={A.text2}
            autoCorrect={false}
            accessibilityLabel="Escribe tu búsqueda"
            style={{ flex: 1, fontSize: 16, color: A.text, padding: 0 }}
          />
          {text ? (
            <Pressable onPress={() => setText('')} hitSlop={10} accessibilityLabel="Borrar texto">
              <MIcon name="close" size={20} color={A.text2} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        {sugerencias.map((s) => (
          <Pressable
            key={s}
            onPress={() => dispatch({ type: 'select', group: 'sugerencia', value: s })}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: pressed ? '#F1F3F9' : 'transparent' })}
          >
            <MIcon name="search" size={20} color={A.outline} />
            <Text style={{ flex: 1, fontSize: 16, color: A.text }}>{s}</Text>
            <MIcon name="north-west" size={20} color={A.outline} />
          </Pressable>
        ))}
        {text.trim() ? (
          <Pressable onPress={search} style={{ marginHorizontal: 20, marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 16, height: 40, borderRadius: 20, backgroundColor: A.accent, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MIcon name="search" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Buscar «{text.trim()}»</Text>
          </Pressable>
        ) : null}
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
            <Text style={{ fontSize: 14, fontWeight: i === 0 ? '600' : '400', color: i === 0 ? A.accent : A.text2 }}>{t}</Text>
          </View>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 22 }}>
        <Text style={{ fontSize: 12, color: A.outline }}>Cerca de {(results.length * 310_000).toLocaleString('es-MX')} resultados</Text>
        {results.map((r) => (
          <Hit key={r.id} id={`resultado.${r.id}`} radius={12}>
            <Pressable
              onPress={() => dispatch({ type: 'select', group: 'resultado', value: r.id })}
              accessibilityRole="link"
              accessibilityLabel={r.titulo}
              style={({ pressed }) => ({ gap: 4, borderRadius: 12, padding: 4, backgroundColor: pressed ? '#F1F3F9' : 'transparent' })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: A.shade, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: A.text2 }}>{r.sitio.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 12, color: A.text2 }}>{r.sitio}</Text>
              </View>
              <Text style={{ fontSize: 18, color: '#1A0DAB' }}>{r.titulo}</Text>
              <Text style={{ fontSize: 13, color: '#4D5156', lineHeight: 19 }}>{r.descripcion}</Text>
            </Pressable>
          </Hit>
        ))}
      </ScrollView>
    </View>
  );
}

export function BrowserPage() {
  const { state, dispatch, world } = useSim();
  const r = world.buscar(state.navegador.consulta ?? '').find((x) => x.id === state.navegador.resultadoAbierto);
  const parrafos = r?.contenido ?? [r?.descripcion ?? '', 'Esta página tiene más información sobre el tema que buscaste.'];
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <AddressBar text={r?.sitio ?? ''} secure onPress={() => dispatch({ type: 'open', target: 'navegador.escribiendo' })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: A.accent, letterSpacing: 0.5 }}>{r?.sitio.toUpperCase()}</Text>
        <Text style={{ fontSize: 26, color: A.text, lineHeight: 32 }}>{r?.titulo}</Text>
        <View style={{ height: 140, borderRadius: 12, backgroundColor: A.shade, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name="image" size={40} color="#AFC0DD" />
        </View>
        {parrafos.map((p) => (
          <Text key={p} style={{ fontSize: 15, color: '#3C4043', lineHeight: 23 }}>{p}</Text>
        ))}
      </ScrollView>
      <Tabs />
    </View>
  );
}
