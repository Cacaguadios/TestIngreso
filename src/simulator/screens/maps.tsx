import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { A } from '../android';
import { useSim } from '../context';
import { Hit, MIcon } from '../parts';

/** Mapa dibujado con vistas simples (calles, manzanas y un río), como en el diseño de Figma. */
function MapCanvas({ ruta }: { ruta: boolean }) {
  const calle = { position: 'absolute' as const, backgroundColor: '#FFFFFF' };
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#E8EDE4', overflow: 'hidden' }}>
      <View style={{ position: 'absolute', right: -20, top: '8%', width: '40%', height: '18%', backgroundColor: '#CFE6CF', borderRadius: 8 }} />
      <View style={{ position: 'absolute', left: '6%', top: '30%', width: '26%', height: '10%', backgroundColor: '#F3EEE6', borderRadius: 6 }} />
      <View style={{ position: 'absolute', left: '40%', top: '32%', width: '20%', height: '12%', backgroundColor: '#F3EEE6', borderRadius: 6 }} />
      <View style={{ ...calle, left: '30%', top: 0, bottom: 0, width: 12, transform: [{ rotate: '-2deg' }] }} />
      <View style={{ ...calle, left: '68%', top: 0, bottom: 0, width: 12, transform: [{ rotate: '3deg' }] }} />
      <View style={{ ...calle, left: -20, right: -20, top: '26%', height: 12, transform: [{ rotate: '4deg' }] }} />
      <View style={{ ...calle, left: -20, right: -20, top: '54%', height: 12, transform: [{ rotate: '-6deg' }] }} />
      <View style={{ ...calle, left: '10%', width: '90%', top: '50%', height: 10, transform: [{ rotate: '32deg' }] }} />
      <View style={{ position: 'absolute', left: -60, right: -60, bottom: -80, height: '34%', backgroundColor: '#BFDDF2', borderTopLeftRadius: 300, borderTopRightRadius: 200 }} />
      {ruta ? (
        <>
          <View style={{ position: 'absolute', left: '30%', top: '45%', width: 6, height: '15%', backgroundColor: A.accent, borderRadius: 3 }} />
          <View style={{ position: 'absolute', left: '30%', top: '45%', width: '22%', height: 6, backgroundColor: A.accent, borderRadius: 3 }} />
        </>
      ) : null}
    </View>
  );
}

const CHIPS = ['Restaurantes', 'Gasolineras', 'Farmacias', 'Cajeros'];

export function Maps() {
  const { state, dispatch, world } = useSim();
  const m = state.mapas;
  const [text, setText] = useState(m.consulta);
  const [last, setLast] = useState(m.consulta);
  const [focus, setFocus] = useState(false);
  const lugar = m.buscado ? world.buscarLugar(m.buscado)[0] : undefined;

  const report = (value = text) => {
    if (value !== last) {
      setLast(value);
      dispatch({ type: 'set_text', field: 'mapas.consulta', value });
    }
  };
  const buscar = () => {
    report();
    dispatch({ type: 'submit', field: 'mapas.buscar' });
    setFocus(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <MapCanvas ruta={m.ruta} />
      {/* Ubicación del candidato y del lugar buscado. */}
      <View style={{ position: 'absolute', left: '28%', top: '58%', width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(11,87,208,0.2)', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: A.accent, borderWidth: 2, borderColor: '#FFFFFF' }} />
      </View>
      {lugar ? (
        <View style={{ position: 'absolute', left: '48%', top: '34%' }}>
          <MIcon name="place" size={44} color="#D93025" />
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 12, paddingTop: 8, gap: 10 }}>
        <Hit id="mapas.buscar" radius={26}>
          <View style={{ height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderWidth: 2, borderColor: focus ? A.accent : 'transparent', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
            <MIcon name="search" size={22} color={A.text2} />
            <TextInput
              value={text}
              onChangeText={setText}
              onFocus={() => setFocus(true)}
              onBlur={() => {
                setFocus(false);
                report();
              }}
              onSubmitEditing={buscar}
              returnKeyType="search"
              placeholder="Buscar aquí"
              placeholderTextColor={A.text2}
              autoCorrect={false}
              accessibilityLabel="Buscar un lugar en el mapa"
              style={{ flex: 1, fontSize: 16, color: A.text, padding: 0 }}
            />
            {text ? (
              <Pressable onPress={() => setText('')} hitSlop={10} accessibilityLabel="Borrar búsqueda">
                <MIcon name="close" size={20} color={A.text2} />
              </Pressable>
            ) : (
              <MIcon name="mic" size={22} color={A.text2} />
            )}
          </View>
        </Hit>
        {focus && text.trim().length >= 2 ? (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 4, elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6 }}>
            {world.buscarLugar(text).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setText(p.nombre);
                  setLast(p.nombre);
                  setFocus(false);
                  dispatch({ type: 'select', group: 'lugar', value: p.nombre });
                }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: pressed ? A.pressed : 'transparent' })}
              >
                <MIcon name="place" size={20} color={A.text2} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: A.text }}>{p.nombre}</Text>
                  <Text style={{ fontSize: 12, color: A.text2 }}>{p.direccion}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
            {CHIPS.map((c) => (
              <Pressable key={c} onPress={() => dispatch({ type: 'tap_empty' })} style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: '#FFFFFF', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: A.text }}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={{ flex: 1 }} />

      {lugar ? (
        <View style={{ margin: 10, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, gap: 4, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 }}>
          <Text style={{ fontSize: 19, fontWeight: '600', color: A.text }}>{lugar.nombre}</Text>
          <Text style={{ fontSize: 13, color: A.text2 }}>{lugar.direccion}</Text>
          <Text style={{ fontSize: 13, color: m.ruta ? A.accent : '#188038', fontWeight: '500' }}>{m.ruta ? 'Ruta en auto · 12 min (4,3 km)' : lugar.detalle}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Hit id="mapas.ruta" radius={20}>
              <Pressable
                onPress={() => dispatch({ type: 'submit', field: 'mapas.ruta' })}
                accessibilityRole="button"
                accessibilityLabel="Cómo llegar"
                style={({ pressed }) => ({ height: 40, borderRadius: 20, paddingHorizontal: 16, backgroundColor: pressed ? '#0842A0' : A.accent, flexDirection: 'row', alignItems: 'center', gap: 8 })}
              >
                <MIcon name="directions" size={20} color="#FFFFFF" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{m.ruta ? 'Iniciar' : 'Cómo llegar'}</Text>
              </Pressable>
            </Hit>
            <Pressable onPress={() => dispatch({ type: 'tap_empty' })} style={{ height: 40, borderRadius: 20, paddingHorizontal: 16, backgroundColor: A.accentSoft, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MIcon name="call" size={18} color={A.accent} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: A.accent }}>Llamar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'flex-end', padding: 14 }}>
          <Pressable onPress={() => dispatch({ type: 'tap_empty' })} accessibilityLabel="Mi ubicación" style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6 }}>
            <MIcon name="my-location" size={24} color={A.accent} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
