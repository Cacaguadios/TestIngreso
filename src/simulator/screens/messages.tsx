import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { A } from '../android';
import { useSim } from '../context';
import { Avatar, Hit, MIcon, SearchPill, TopBar } from '../parts';

function useContactColor() {
  const { world } = useSim();
  return (name: string) => world.contactos.find((c) => c.nombre === name)?.color ?? '#5F6B7A';
}

export function MessageList() {
  const { state, dispatch, world } = useSim();
  const color = useContactColor();
  // Las conversaciones con mensajes recién enviados suben al principio, como en Android.
  const enviadosA = [...new Set(state.mensajes.enviados.map((m) => m.a))].reverse();
  const convs = [
    ...enviadosA.map((con) => world.conversaciones.find((c) => c.con === con) ?? { con, hora: 'Ahora', mensajes: [] }),
    ...world.conversaciones.filter((c) => !enviadosA.includes(c.con)),
  ];
  const ultimo = (con: string) => {
    const mios = state.mensajes.enviados.filter((m) => m.a === con);
    if (mios.length) return { texto: `Tú: ${mios[mios.length - 1]!.texto}`, hora: 'Ahora' };
    const c = world.conversaciones.find((x) => x.con === con);
    const m = c?.mensajes[c.mensajes.length - 1];
    return { texto: m ? (m.yo ? `Tú: ${m.texto}` : m.texto) : '', hora: c?.hora ?? '' };
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
        <Text style={{ fontSize: 30, color: A.text, marginTop: 14, marginBottom: 12, marginLeft: 8 }}>Mensajes</Text>
        <SearchPill label="Buscar conversaciones" onPress={() => dispatch({ type: 'tap_empty' })} />
        <View style={{ marginTop: 8 }}>
          {convs.map((c) => {
            const u = ultimo(c.con);
            return (
              <Hit key={c.con} id={`conv.${c.con}`} radius={18}>
                <Pressable
                  onPress={() => dispatch({ type: 'select', group: 'conversacion', value: c.con })}
                  accessibilityRole="button"
                  accessibilityLabel={`Conversación con ${c.con}`}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 18, backgroundColor: pressed ? A.pressed : 'transparent' })}
                >
                  <Avatar name={c.con} color={color(c.con)} size={44} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: '600', color: A.text }}>{c.con}</Text>
                      <Text style={{ fontSize: 12, color: A.text2 }}>{u.hora}</Text>
                    </View>
                    <Text numberOfLines={1} style={{ fontSize: 14, color: A.text2, marginTop: 2 }}>{u.texto}</Text>
                  </View>
                </Pressable>
              </Hit>
            );
          })}
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', right: 16, bottom: 16 }}>
        <Hit id="mensajes.nuevo" radius={18}>
          <Pressable
            onPress={() => dispatch({ type: 'open', target: 'mensajes.nuevo' })}
            accessibilityRole="button"
            accessibilityLabel="Iniciar chat"
            style={({ pressed }) => ({ height: 56, borderRadius: 18, backgroundColor: pressed ? '#BFD3F8' : A.accentSoft, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18 })}
          >
            <MIcon name="chat" size={22} color={A.accent} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: A.accent }}>Iniciar chat</Text>
          </Pressable>
        </Hit>
      </View>
    </View>
  );
}

/** "Iniciar chat": elegir a quién escribir. */
export function NewChat() {
  const { dispatch, world } = useSim();
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <TopBar title="Nueva conversación" onBack={() => dispatch({ type: 'back' })} />
      <View style={{ marginHorizontal: 16, height: 48, borderBottomWidth: 2, borderBottomColor: A.accent, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 15, color: A.text2 }}>Para:</Text>
        <Text style={{ fontSize: 15, color: A.outline }}>Escribe un nombre o número</Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: A.accent, marginTop: 16, marginBottom: 6, marginLeft: 20 }}>Contactos</Text>
      {world.contactos.map((c) => (
        <Hit key={c.nombre} id={`conv.${c.nombre}`} radius={16}>
          <Pressable
            onPress={() => dispatch({ type: 'select', group: 'conversacion', value: c.nombre })}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: pressed ? A.pressed : 'transparent' })}
          >
            <Avatar name={c.nombre} color={c.color} size={40} />
            <View>
              <Text style={{ fontSize: 16, color: A.text }}>{c.nombre}</Text>
              <Text style={{ fontSize: 13, color: A.text2 }}>Móvil</Text>
            </View>
          </Pressable>
        </Hit>
      ))}
    </ScrollView>
  );
}

/** Conversación: burbujas + campo de texto con el teclado real del teléfono. */
export function Conversation() {
  const { state, dispatch, world } = useSim();
  const color = useContactColor();
  const con = state.mensajes.conversacion ?? 'Ana López';
  const previos = world.conversaciones.find((c) => c.con === con)?.mensajes ?? [];
  const nuevos = state.mensajes.enviados.filter((m) => m.a === con).map((m) => ({ yo: true, texto: m.texto }));
  const [text, setText] = useState(state.mensajes.borrador);
  const [last, setLast] = useState(state.mensajes.borrador);

  const report = (value = text) => {
    if (value !== last) {
      setLast(value);
      dispatch({ type: 'set_text', field: 'mensajes.borrador', value });
    }
  };
  const send = () => {
    if (!text.trim()) return;
    report();
    dispatch({ type: 'submit', field: 'mensajes.enviar' });
    setText('');
    setLast('');
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar
        onBack={() => dispatch({ type: 'back' })}
        left={<Avatar name={con} color={color(con)} size={36} />}
        title={con}
        right={
          <View style={{ flexDirection: 'row', gap: 14, paddingRight: 12 }}>
            <MIcon name="call" size={22} color={A.text2} />
            <MIcon name="more-vert" size={22} color={A.text2} />
          </View>
        }
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 8, flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
        {[...previos, ...nuevos].map((m, i) => (
          <View
            key={i}
            style={{
              alignSelf: m.yo ? 'flex-end' : 'flex-start', maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10,
              borderRadius: 20, backgroundColor: m.yo ? A.accent : '#E3E8F2',
              borderBottomRightRadius: m.yo ? 6 : 20, borderBottomLeftRadius: m.yo ? 20 : 6,
            }}
          >
            <Text style={{ fontSize: 15, color: m.yo ? '#FFFFFF' : A.text, lineHeight: 20 }}>{m.texto}</Text>
          </View>
        ))}
        {nuevos.length ? (
          <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, color: A.text2 }}>Enviado</Text>
            <MIcon name="done-all" size={16} color={A.accent} />
          </View>
        ) : null}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
        <View style={{ flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: '#E3E8F2', paddingHorizontal: 16, justifyContent: 'center' }}>
          <TextInput
            value={text}
            onChangeText={setText}
            onBlur={() => report()}
            placeholder="Mensaje de texto"
            placeholderTextColor={A.text2}
            multiline
            accessibilityLabel="Escribe un mensaje"
            style={{ fontSize: 16, color: A.text, paddingVertical: 10, maxHeight: 110 }}
          />
        </View>
        <Hit id="mensajes.enviar" radius={24}>
          <Pressable
            onPress={send}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: text.trim() ? (pressed ? '#0842A0' : A.accent) : '#D5DCEA' })}
          >
            <MIcon name="send" size={22} color={text.trim() ? '#FFFFFF' : A.outline} />
          </Pressable>
        </Hit>
      </View>
    </View>
  );
}
