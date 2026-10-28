import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { searchFiles } from '../../engine/phone';
import type { FileItem, FileKind } from '../../engine/world';
import { A } from '../android';
import { useSim } from '../context';
import { AppBar, Hit, MIcon, SectionLabel, TopBar, type IconName } from '../parts';

const KIND: Record<FileKind, { icon: IconName; tint: string; glyph: string }> = {
  pdf: { icon: 'picture-as-pdf', tint: '#FAD8D6', glyph: '#C5221F' },
  hoja: { icon: 'description', tint: '#CEEAD6', glyph: '#188038' },
  imagen: { icon: 'image', tint: '#FAD8D6', glyph: '#D93025' },
  video: { icon: 'videocam', tint: '#D3E3FD', glyph: '#0B57D0' },
  audio: { icon: 'music-note', tint: '#FEEFC3', glyph: '#B06000' },
};

const CATEGORIAS: { id: string; label: string; kinds: FileKind[]; icon: IconName; tint: string; glyph: string }[] = [
  { id: 'archivos.imagenes', label: 'Imágenes', kinds: ['imagen'], icon: 'image', tint: '#FAD8D6', glyph: '#D93025' },
  { id: 'archivos.videos', label: 'Videos', kinds: ['video'], icon: 'videocam', tint: '#D3E3FD', glyph: '#0B57D0' },
  { id: 'archivos.audio', label: 'Audio', kinds: ['audio'], icon: 'music-note', tint: '#FEEFC3', glyph: '#B06000' },
  { id: 'archivos.documentos', label: 'Documentos', kinds: ['pdf', 'hoja'], icon: 'description', tint: '#CEEAD6', glyph: '#188038' },
];

function FileRow({ f }: { f: FileItem }) {
  const { dispatch } = useSim();
  const k = KIND[f.tipo];
  return (
    <Hit id={`archivo.${f.nombre}`}>
      <Pressable
        onPress={() => dispatch({ type: 'select', group: 'archivo', value: f.nombre })}
        accessibilityRole="button"
        accessibilityLabel={f.nombre}
        style={({ pressed }) => ({ minHeight: 64, backgroundColor: pressed ? A.pressed : A.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 })}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: k.tint, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name={k.icon} size={22} color={k.glyph} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '500', color: A.text }}>{f.nombre}</Text>
          <Text numberOfLines={1} style={{ fontSize: 13, color: A.text2, marginTop: 1 }}>{f.detalle}</Text>
        </View>
        <MIcon name="more-vert" size={20} color={A.outline} />
      </Pressable>
    </Hit>
  );
}

/** Campo de búsqueda real (con teclado). Reporta el texto al motor al buscar o al salir del campo. */
function SearchField({ autoFocus }: { autoFocus?: boolean }) {
  const { state, dispatch } = useSim();
  const [text, setText] = useState(state.archivos.consulta);
  const [last, setLast] = useState(state.archivos.consulta);
  const [focus, setFocus] = useState(!!autoFocus);
  const report = () => {
    if (text !== last) {
      setLast(text);
      dispatch({ type: 'set_text', field: 'archivos.consulta', value: text });
    }
  };
  return (
    <Hit id="archivos.buscar" radius={26}>
      <View style={{ height: 52, borderRadius: 26, backgroundColor: A.shade, borderWidth: 2, borderColor: focus ? A.accent : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}>
        <MIcon name="search" size={22} color={A.text2} />
        <TextInput
          autoFocus={autoFocus}
          value={text}
          onChangeText={setText}
          onFocus={() => setFocus(true)}
          onBlur={() => {
            setFocus(false);
            report();
          }}
          onSubmitEditing={() => {
            report();
            dispatch({ type: 'submit', field: 'archivos.buscar' });
          }}
          returnKeyType="search"
          placeholder="Buscar en este teléfono"
          placeholderTextColor={A.text2}
          autoCorrect={false}
          accessibilityLabel="Buscar en este teléfono"
          style={{ flex: 1, fontSize: 16, color: A.text, padding: 0 }}
        />
      </View>
    </Hit>
  );
}

export function FilesHome() {
  const { dispatch, world } = useSim();
  const recientes = world.archivos.filter((f) => f.nombre === 'Lista_precios.xlsx' || f.nombre === 'Foto_exhibidor.jpg');
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 30, color: A.text, marginTop: 14, marginBottom: 10, marginLeft: 8 }}>Archivos</Text>
      <SearchField />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {CATEGORIAS.map((c) => (
          <Hit key={c.id} id={c.id} radius={20} style={{ width: '48.5%' }}>
            <Pressable
              onPress={() => dispatch({ type: 'open', target: c.id })}
              accessibilityRole="button"
              accessibilityLabel={c.label}
              style={({ pressed }) => ({ height: 64, borderRadius: 20, backgroundColor: pressed ? A.pressed : A.card, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 })}
            >
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
                <MIcon name={c.icon} size={19} color={c.glyph} />
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ flex: 1, fontSize: 14, fontWeight: '500', color: A.text }}>{c.label}</Text>
            </Pressable>
          </Hit>
        ))}
      </View>
      <SectionLabel>Archivos recientes</SectionLabel>
      {recientes.map((f) => <FileRow key={f.nombre} f={f} />)}
      <Pressable
        onPress={() => dispatch({ type: 'open', target: 'archivos.documentos' })}
        style={({ pressed }) => ({ minHeight: 64, backgroundColor: pressed ? A.pressed : A.card, borderRadius: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 })}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: A.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name="download" size={22} color={A.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: A.text }}>Descargas</Text>
          <Text style={{ fontSize: 13, color: A.text2 }}>{world.archivos.filter((f) => f.detalle.includes('Descargas')).length} archivos</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

export function FileSearch() {
  const { state, dispatch, world } = useSim();
  const [filtro, setFiltro] = useState<'todo' | 'docs' | 'img'>('todo');
  const all = searchFiles(world, state.archivos.consulta);
  const results = all.filter((f) => filtro === 'todo' || (filtro === 'docs' ? f.tipo === 'pdf' || f.tipo === 'hoja' : f.tipo === 'imagen'));
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }} keyboardShouldPersistTaps="handled">
      <AppBar title="Archivos" onBack={() => dispatch({ type: 'back' })} />
      <SearchField />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {([['todo', 'Todo'], ['docs', 'Documentos'], ['img', 'Imágenes']] as const).map(([id, label]) => (
          <Pressable key={id} onPress={() => setFiltro(id)} style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: filtro === id ? A.accentSoft : A.card, justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: filtro === id ? A.accent : A.text }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <SectionLabel>{results.length === 1 ? '1 resultado' : `${results.length} resultados`}</SectionLabel>
      {results.length ? results.map((f) => <FileRow key={f.nombre} f={f} />) : (
        <Text style={{ color: A.text2, fontSize: 14, marginHorizontal: 8, lineHeight: 20 }}>No se encontraron archivos. Revisa cómo lo escribiste.</Text>
      )}
    </ScrollView>
  );
}

export function FileCategory({ pantalla }: { pantalla: string }) {
  const { dispatch, world } = useSim();
  const cat = CATEGORIAS.find((c) => c.id === pantalla)!;
  const files = world.archivos.filter((f) => cat.kinds.includes(f.tipo));
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}>
      <AppBar title={cat.label} onBack={() => dispatch({ type: 'back' })} />
      <Text style={{ fontSize: 13, color: A.text2, marginLeft: 8, marginBottom: 4 }}>{files.length} archivos · ordenados por fecha</Text>
      {files.map((f) => <FileRow key={f.nombre} f={f} />)}
    </ScrollView>
  );
}

export function FileViewer() {
  const { state, dispatch, world } = useSim();
  const f = world.archivos.find((x) => x.nombre === state.archivos.abierto);
  const isImage = f?.tipo === 'imagen' || f?.tipo === 'video';
  if (isImage) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <TopBar title={f?.nombre} onBack={() => dispatch({ type: 'back' })} dark right={<MIcon name="share" size={22} color="#FFFFFF" />} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: '90%', aspectRatio: 4 / 3, borderRadius: 4, backgroundColor: '#5B86B0', alignItems: 'center', justifyContent: 'center' }}>
            <MIcon name={f?.tipo === 'video' ? 'play-circle-filled' : 'image'} size={64} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </View>
    );
  }
  const anio = f?.nombre.match(/20\d\d/)?.[0];
  return (
    <View style={{ flex: 1, backgroundColor: '#E8EAED' }}>
      <View style={{ backgroundColor: '#FFFFFF' }}>
        <TopBar title={f?.nombre} onBack={() => dispatch({ type: 'back' })} right={<View style={{ paddingRight: 12 }}><MIcon name="share" size={22} color={A.text2} /></View>} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 4, padding: 20, gap: 10, minHeight: 360 }}>
          {f?.tipo === 'hoja' ? (
            <>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#188038' }}>{f.nombre.replace(/\.\w+$/, '').replace(/_/g, ' ')}</Text>
              {['Producto', 'Llanta 175/70 R13', 'Llanta 185/65 R14', 'Batería 12V', 'Aceite 5W-30'].map((t, i) => (
                <View key={t} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E0E2EC', paddingVertical: 4 }}>
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: i === 0 ? '700' : '400', color: A.text }}>{t}</Text>
                  <Text style={{ width: 70, fontSize: 12, fontWeight: i === 0 ? '700' : '400', color: A.text, textAlign: 'right' }}>{i === 0 ? 'Precio' : `$${(890 + i * 415).toLocaleString('es-MX')}`}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#008C44', letterSpacing: 1 }}>ROLY</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: A.text }}>
                {f?.nombre.startsWith('Catalogo') ? `Catálogo ${anio}` : f?.nombre.replace(/\.\w+$/, '').replace(/_/g, ' ')}
              </Text>
              <View style={{ height: 110, borderRadius: 6, backgroundColor: '#E7F6EE', alignItems: 'center', justifyContent: 'center' }}>
                <MIcon name="tire-repair" size={48} color="#008C44" />
              </View>
              {[90, 100, 80, 95, 60, 85].map((w, i) => (
                <View key={i} style={{ height: 8, width: `${w}%`, borderRadius: 4, backgroundColor: '#E0E2EC' }} />
              ))}
            </>
          )}
        </View>
        <Text style={{ textAlign: 'center', fontSize: 12, color: A.text2, marginTop: 10 }}>Página 1 de {f?.tipo === 'pdf' ? 12 : 1}</Text>
      </ScrollView>
    </View>
  );
}
