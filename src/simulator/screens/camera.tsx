import { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { A } from '../android';
import { useSim } from '../context';
import { Hit, MIcon } from '../parts';

export function Camera() {
  const { state, dispatch } = useSim();
  const flash = useRef(new Animated.Value(0)).current;
  const [modo, setModo] = useState('Foto');

  const disparar = () => {
    dispatch({ type: 'submit', field: 'camara.disparar' });
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0E1418' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 }}>
        <Pressable onPress={() => dispatch({ type: 'tap_empty' })} hitSlop={8} accessibilityLabel="Flash">
          <MIcon name="flash-auto" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={{ color: '#FFFFFF', fontSize: 13, opacity: 0.8 }}>4:3 · 50 MP</Text>
        <Pressable onPress={() => dispatch({ type: 'tap_empty' })} hitSlop={8} accessibilityLabel="Ajustes de cámara">
          <MIcon name="settings" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Visor: una escena simple (exhibidor de tienda) con la cuadrícula de la cámara. */}
      <View style={{ flex: 1, marginHorizontal: 0, overflow: 'hidden', backgroundColor: '#2B3A44' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', backgroundColor: '#3E4C55' }} />
        <View style={{ position: 'absolute', left: '18%', right: '18%', top: '18%', bottom: '30%', backgroundColor: '#55697A', borderRadius: 6, padding: 10, gap: 8 }}>
          {[0, 1, 2].map((r) => (
            <View key={r} style={{ flex: 1, flexDirection: 'row', gap: 6, borderBottomWidth: 3, borderBottomColor: '#3A4A57' }}>
              {['#C5221F', '#F29900', '#188038', '#1967D2'].map((c, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: c, opacity: 0.75, borderRadius: 3, marginBottom: 2 }} />
              ))}
            </View>
          ))}
        </View>
        {[1, 2].map((i) => (
          <View key={`v${i}`} pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i * 100) / 3}%`, width: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} />
        ))}
        {[1, 2].map((i) => (
          <View key={`h${i}`} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: `${(i * 100) / 3}%`, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} />
        ))}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', opacity: flash }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 26, paddingVertical: 12 }}>
        {['Video', 'Foto', 'Retrato'].map((m) => (
          <Pressable key={m} onPress={() => setModo(m)} hitSlop={6}>
            <Text style={{ color: m === modo ? '#FFFFFF' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: m === modo ? '700' : '400' }}>{m}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 14 }}>
        <Pressable onPress={() => dispatch({ type: 'open', target: 'galeria' })} accessibilityLabel="Ver la última foto" style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: state.camara.fotos ? '#55697A' : 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: state.camara.fotos ? 2 : 0, borderColor: '#FFFFFF' }}>
          <MIcon name="photo" size={22} color="#FFFFFF" />
        </Pressable>
        <Hit id="camara.disparador" radius={38}>
          <Pressable
            onPress={disparar}
            accessibilityRole="button"
            accessibilityLabel="Tomar foto"
            style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
          >
            {({ pressed }) => <View style={{ width: pressed ? 56 : 62, height: pressed ? 56 : 62, borderRadius: 31, backgroundColor: '#FFFFFF' }} />}
          </Pressable>
        </Hit>
        <Pressable onPress={() => dispatch({ type: 'tap_empty' })} accessibilityLabel="Cambiar de cámara" style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name="flip-camera-android" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const FOTOS_AYER = ['#C7A4D6', '#F2D27A', '#7FA6B8', '#D98C8C', '#A9B6E0', '#B8C79E'];
const FOTOS_HOY = ['#8FB2D9', '#E8B898', '#9CCB9F'];

function Thumb({ color, nueva }: { color: string; nueva?: boolean }) {
  const { dispatch } = useSim();
  return (
    <Pressable onPress={() => dispatch({ type: 'tap_empty' })} style={{ width: '33.333%', aspectRatio: 1, padding: 2 }}>
      <View style={{ flex: 1, borderRadius: 10, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <MIcon name={nueva ? 'storefront' : 'image'} size={26} color="rgba(255,255,255,0.75)" />
      </View>
    </Pressable>
  );
}

export function Gallery() {
  const { state } = useSim();
  const [tab, setTab] = useState<'fotos' | 'albumes'>('fotos');
  const nuevas = state.camara.fotos;
  return (
    <ScrollView style={{ backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={{ fontSize: 30, color: A.text, marginTop: 14, marginLeft: 22 }}>Galería</Text>
      <View style={{ flexDirection: 'row', gap: 28, paddingHorizontal: 22, marginTop: 14, borderBottomWidth: 1, borderBottomColor: A.divider }}>
        {([['fotos', 'Fotos'], ['albumes', 'Álbumes']] as const).map(([id, label]) => (
          <Pressable key={id} onPress={() => setTab(id)} style={{ paddingBottom: 8, borderBottomWidth: 3, borderBottomColor: tab === id ? A.accent : 'transparent' }}>
            <Text style={{ fontSize: 15, fontWeight: tab === id ? '600' : '400', color: tab === id ? A.accent : A.text }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'fotos' ? (
        <View style={{ paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: A.text, marginTop: 14, marginBottom: 6, marginLeft: 4 }}>Hoy</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: nuevas }, (_, i) => <Thumb key={`n${i}`} color="#55697A" nueva />)}
            {FOTOS_HOY.map((c) => <Thumb key={c} color={c} />)}
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: A.text, marginTop: 14, marginBottom: 6, marginLeft: 4 }}>Ayer</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {FOTOS_AYER.map((c) => <Thumb key={c} color={c} />)}
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12 }}>
          {[['Cámara', 3 + nuevas, '#8FB2D9'], ['Capturas', 12, '#A9B6E0'], ['WhatsApp', 48, '#9CCB9F'], ['Descargas', 5, '#E8B898']].map(([n, k, c]) => (
            <View key={n as string} style={{ width: '50%', padding: 6 }}>
              <View style={{ aspectRatio: 1, borderRadius: 14, backgroundColor: c as string }} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: A.text, marginTop: 6 }}>{n}</Text>
              <Text style={{ fontSize: 12, color: A.text2 }}>{k} elementos</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
