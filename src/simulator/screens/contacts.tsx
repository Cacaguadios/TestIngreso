import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { contactByNumber, formatNumber } from '../../engine/world';
import { A } from '../android';
import { useSim } from '../context';
import { Avatar, Hit, MIcon, SearchPill, TopBar, type IconName } from '../parts';

export function ContactList() {
  const { dispatch, world } = useSim();
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
        <Text style={{ fontSize: 30, color: A.text, marginTop: 14, marginBottom: 12, marginLeft: 8 }}>Contactos</Text>
        <SearchPill label="Buscar contactos" onPress={() => dispatch({ type: 'tap_empty' })} />
        <Text style={{ fontSize: 13, color: A.text2, marginTop: 14, marginBottom: 4, marginLeft: 8 }}>{world.contactos.length} contactos</Text>
        {world.contactos.map((c) => (
          <Hit key={c.nombre} id={`contacto.${c.nombre}`} radius={18}>
            <Pressable
              onPress={() => dispatch({ type: 'select', group: 'contacto', value: c.nombre })}
              accessibilityRole="button"
              accessibilityLabel={c.nombre}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 18, backgroundColor: pressed ? A.pressed : 'transparent' })}
            >
              <Avatar name={c.nombre} color={c.color} size={44} />
              <Text style={{ fontSize: 16, fontWeight: '500', color: A.text }}>{c.nombre}</Text>
            </Pressable>
          </Hit>
        ))}
      </ScrollView>
      <Pressable
        onPress={() => dispatch({ type: 'tap_empty' })}
        accessibilityLabel="Crear contacto"
        style={{ position: 'absolute', right: 16, bottom: 16, width: 64, height: 64, borderRadius: 20, backgroundColor: A.accentSoft, alignItems: 'center', justifyContent: 'center' }}
      >
        <MIcon name="add" size={28} color={A.accent} />
      </Pressable>
    </View>
  );
}

function ActionButton({ icon, label, onPress, id }: { icon: IconName; label: string; onPress: () => void; id?: string }) {
  const btn = (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ alignItems: 'center', gap: 6 }}>
      {({ pressed }) => (
        <>
          <View style={{ width: 68, height: 44, borderRadius: 22, backgroundColor: pressed ? '#BFD3F8' : A.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <MIcon name={icon} size={22} color={A.accent} />
          </View>
          <Text style={{ fontSize: 13, color: A.text }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
  return id ? <Hit id={id} radius={22}>{btn}</Hit> : btn;
}

export function ContactDetail() {
  const { state, dispatch, world } = useSim();
  const c = world.contactos.find((x) => x.nombre === state.contactos.seleccionado);
  if (!c) return null;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <TopBar onBack={() => dispatch({ type: 'back' })} right={<View style={{ flexDirection: 'row', gap: 16, paddingRight: 12 }}><MIcon name="star-border" size={22} color={A.text2} /><MIcon name="edit" size={22} color={A.text2} /></View>} />
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <Avatar name={c.nombre} color={c.color} size={96} />
        <Text style={{ fontSize: 26, color: A.text, marginTop: 14 }}>{c.nombre}</Text>
        <Text style={{ fontSize: 14, color: A.text2, marginTop: 2 }}>{c.etiqueta}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 22, paddingHorizontal: 12 }}>
        <ActionButton id="contacto.llamar" icon="call" label="Llamar" onPress={() => dispatch({ type: 'select', group: 'llamar', value: c.numero })} />
        <ActionButton id="contacto.mensaje" icon="message" label="Mensaje" onPress={() => dispatch({ type: 'select', group: 'conversacion', value: c.nombre })} />
        <ActionButton icon="videocam" label="Video" onPress={() => dispatch({ type: 'tap_empty' })} />
        <ActionButton icon="mail" label="Correo" onPress={() => dispatch({ type: 'tap_empty' })} />
      </View>
      <View style={{ marginHorizontal: 16, marginTop: 24, backgroundColor: A.card, borderRadius: 20, paddingHorizontal: 16 }}>
        <Pressable onPress={() => dispatch({ type: 'select', group: 'llamar', value: c.numero })} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 }}>
          <MIcon name="call" size={22} color={A.text2} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, color: A.text }}>{formatNumber(c.numero)}</Text>
            <Text style={{ fontSize: 13, color: A.text2 }}>Móvil</Text>
          </View>
          <MIcon name="message" size={22} color={A.accent} />
        </Pressable>
        {c.correo ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: A.divider }}>
            <MIcon name="mail" size={22} color={A.text2} />
            <View>
              <Text style={{ fontSize: 16, color: A.text }}>{c.correo}</Text>
              <Text style={{ fontSize: 13, color: A.text2 }}>Trabajo</Text>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const KEYS: [string, string][] = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
  ['*', ''], ['0', '+'], ['#', ''],
];

/**
 * Marcador del Teléfono. Las teclas se juntan en local y el número completo se reporta al motor
 * (un solo evento `texto`) al tocar llamar, igual que el resto de los campos.
 */
export function Dialer() {
  const { state, dispatch, world } = useSim();
  const [numero, setNumero] = useState(state.telefono.numero);
  const recientes = [...state.telefono.llamadas].reverse().slice(0, 3);
  const match = contactByNumber(world, numero);

  const llamar = () => {
    if (!numero) return;
    if (numero !== state.telefono.numero) dispatch({ type: 'set_text', field: 'telefono.numero', value: numero });
    dispatch({ type: 'submit', field: 'telefono.llamar' });
    setNumero('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 26, color: A.text, marginTop: 10 }}>Teléfono</Text>
        {numero ? null : (
          <>
            <Text style={{ fontSize: 14, fontWeight: '600', color: A.accent, marginTop: 12 }}>Recientes</Text>
            {recientes.length ? recientes.map((n, i) => (
              <View key={`${n}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                <MIcon name="call-made" size={18} color={A.call} />
                <Text style={{ fontSize: 15, color: A.text }}>{contactByNumber(world, n)?.nombre ?? formatNumber(n)}</Text>
              </View>
            )) : <Text style={{ fontSize: 14, color: A.text2, marginTop: 8 }}>No hay llamadas recientes.</Text>}
          </>
        )}
      </View>
      <View style={{ alignItems: 'center', minHeight: 64, justifyContent: 'center', paddingHorizontal: 16 }}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 34, color: A.text, letterSpacing: 1 }}>{formatNumber(numero)}</Text>
        {match ? <Text style={{ fontSize: 13, color: A.accent }}>{match.nombre}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24 }}>
        {KEYS.map(([k, sub]) => (
          <Pressable
            key={k}
            onPress={() => setNumero((n) => (n.length < 15 ? n + k.replace(/\D/, '') : n))}
            accessibilityRole="button"
            accessibilityLabel={`Tecla ${k}`}
            style={({ pressed }) => ({ width: '33.33%', height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: pressed ? A.shade : 'transparent' })}
          >
            <Text style={{ fontSize: 26, color: A.text }}>{k}</Text>
            <Text style={{ fontSize: 9, color: A.text2, letterSpacing: 1, height: 12 }}>{sub}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
        <View style={{ width: 72 }} />
        <Hit id="telefono.llamar" radius={32}>
          <Pressable
            onPress={llamar}
            accessibilityRole="button"
            accessibilityLabel="Llamar"
            style={({ pressed }) => ({ width: 64, height: 64, borderRadius: 32, backgroundColor: pressed ? '#16733A' : A.call, alignItems: 'center', justifyContent: 'center' })}
          >
            <MIcon name="call" size={28} color="#FFFFFF" />
          </Pressable>
        </Hit>
        <Pressable
          onPress={() => setNumero((n) => n.slice(0, -1))}
          onLongPress={() => setNumero('')}
          accessibilityLabel="Borrar"
          style={{ width: 72, alignItems: 'center', opacity: numero ? 1 : 0 }}
          disabled={!numero}
        >
          <MIcon name="backspace" size={24} color={A.text2} />
        </Pressable>
      </View>
    </View>
  );
}

export function InCall() {
  const { state, dispatch, world } = useSim();
  const n = state.telefono.enLlamada ?? '';
  const c = contactByNumber(world, n);
  const [seg, setSeg] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeg((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const estado = seg < 2 ? 'Llamando…' : `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;
  const botones: [IconName, string][] = [['mic-off', 'Silenciar'], ['dialpad', 'Teclado'], ['volume-up', 'Altavoz'], ['person-add', 'Añadir']];
  return (
    <View style={{ flex: 1, backgroundColor: '#1F2A36', alignItems: 'center' }}>
      <View style={{ marginTop: 40, alignItems: 'center', gap: 10 }}>
        <Avatar name={c?.nombre ?? '#'} color={c?.color ?? '#5F6B7A'} size={88} />
        <Text style={{ fontSize: 26, color: '#FFFFFF' }}>{c?.nombre ?? formatNumber(n)}</Text>
        {c ? <Text style={{ fontSize: 15, color: '#C4CCD6' }}>{formatNumber(n)}</Text> : null}
        <Text style={{ fontSize: 15, color: '#C4CCD6' }}>{estado}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignSelf: 'stretch', paddingHorizontal: 8 }}>
        {botones.map(([icon, label]) => (
          <Pressable key={label} onPress={() => dispatch({ type: 'tap_empty' })} style={{ alignItems: 'center', gap: 6, width: 64 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MIcon name={icon} size={24} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 12, color: '#C4CCD6' }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() => dispatch({ type: 'submit', field: 'telefono.colgar' })}
        accessibilityRole="button"
        accessibilityLabel="Colgar"
        style={({ pressed }) => ({ width: 68, height: 68, borderRadius: 34, backgroundColor: pressed ? '#9C1D17' : '#D93025', alignItems: 'center', justifyContent: 'center', marginVertical: 24 })}
      >
        <MIcon name="call-end" size={30} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
