import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../state/store';
import { AppText, Button, Card, Field, Icon, Screen } from '../ui/components';
import { colors } from '../ui/theme';

export default function Registro() {
  const draft = useStore((s) => s.draft);
  const setDraft = useStore((s) => s.setDraft);
  const puestos = useStore((s) => s.paquete.puestos);
  const sucursal = useStore((s) => s.sucursal.nombre);
  const definitionForDraft = useStore((s) => s.definitionForDraft);
  const startEvaluation = useStore((s) => s.startEvaluation);
  const [abierto, setAbierto] = useState(false);

  const puesto = puestos.find((p) => p.id === draft.puestoId);
  const requierePin = definitionForDraft()?.requierePin ?? false;
  const pinOk = !requierePin || /^\d{4,6}$/.test(draft.pin);
  const valido = draft.nombre.trim().length > 0 && draft.apellidos.trim().length > 0 && !!puesto && draft.acepto && pinOk;

  return (
    <Screen
      title="Tus datos"
      subtitle="Completa la información para iniciar."
      footer={
        <Button
          label="Continuar"
          disabled={!valido}
          onPress={() => {
            if (startEvaluation()) router.push('/instrucciones');
          }}
        />
      }
    >
      <Field label="Nombre" value={draft.nombre} onChangeText={(v) => setDraft({ nombre: v })} placeholder="Escribe tu nombre" autoCapitalize="words" returnKeyType="next" />
      <Field label="Apellidos" value={draft.apellidos} onChangeText={(v) => setDraft({ apellidos: v })} placeholder="Escribe tus apellidos" autoCapitalize="words" returnKeyType="next" />

      <Pressable onPress={() => setAbierto((v) => !v)} accessibilityRole="button" accessibilityLabel="Puesto">
        <Card style={{ paddingVertical: 10, gap: 0 }}>
          <AppText variant="small">Puesto</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText style={{ fontSize: 16, color: puesto ? colors.ink : colors.faint, paddingVertical: 6 }}>{puesto?.nombre ?? 'Selecciona tu puesto'}</AppText>
            <Icon name={abierto ? 'expand-less' : 'expand-more'} color={colors.muted} />
          </View>
        </Card>
      </Pressable>
      {abierto ? (
        <Card style={{ padding: 4, gap: 0 }}>
          {puestos.map((p) => (
            <Pressable key={p.id} onPress={() => { setDraft({ puestoId: p.id }); setAbierto(false); }} style={{ padding: 14 }}>
              <AppText variant={p.id === draft.puestoId ? 'bodyStrong' : 'body'}>{p.nombre}</AppText>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Card style={{ paddingVertical: 10, gap: 0, backgroundColor: '#EEF2F4' }}>
        <AppText variant="small">Sucursal (asignada a este equipo)</AppText>
        <AppText style={{ fontSize: 16, paddingVertical: 6 }}>{sucursal}</AppText>
      </Card>

      {requierePin ? (
        <Field label="PIN de sucursal (te lo da el encargado)" value={draft.pin} onChangeText={(v) => setDraft({ pin: v.replace(/\D/g, '').slice(0, 6) })} keyboardType="number-pad" secureTextEntry placeholder="••••" />
      ) : null}

      <Pressable
        onPress={() => setDraft({ acepto: !draft.acepto })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: draft.acepto }}
        style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 6 }}
      >
        <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: draft.acepto ? colors.primary : colors.surface, borderWidth: draft.acepto ? 0 : 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          {draft.acepto ? <Icon name="check" size={16} color={colors.white} /> : null}
        </View>
        <AppText variant="bodyStrong" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>He leído y acepto el Aviso de privacidad.</AppText>
      </Pressable>
      <Pressable onPress={() => router.push('/aviso')} style={{ marginLeft: 36 }}>
        <AppText style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.primaryDark }}>Leer aviso de privacidad</AppText>
      </Pressable>
      <AppText variant="small" style={{ fontSize: 12 }}>Tus resultados solo los consulta personal autorizado de Roly.</AppText>
    </Screen>
  );
}
