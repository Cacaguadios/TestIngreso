import { router } from 'expo-router';
import { View } from 'react-native';
import { Pressable } from 'react-native';
import { useStore } from '../state/store';
import { AppText, Button, Card, Icon, IconBadge, Screen } from '../ui/components';
import { colors } from '../ui/theme';
import { useBlockBack } from '../ui/use-block-back';

const fmt = (s: number) => (s >= 60 ? `${Math.round(s / 60)} ${Math.round(s / 60) === 1 ? 'minuto' : 'minutos'}` : `${s} segundos`);

export default function DetalleTarea() {
  const session = useStore((s) => s.session);
  const beginTask = useStore((s) => s.beginTask);
  const skipTask = useStore((s) => s.skipTask);
  useBlockBack();
  const slot = session?.currentSlot;
  if (!session || !slot) return null;
  const t = slot.definicion;
  const numero = session.calificadasHechas + (slot.practica ? 0 : 1);

  const abrir = () => {
    beginTask();
    router.replace('/simulador');
  };
  const omitir = () => {
    beginTask();
    skipTask();
    router.replace('/tarea-fin');
  };

  return (
    <Screen
      title={slot.practica ? 'Tarea de práctica' : `Tarea ${String(numero).padStart(2, '0')} de ${session.calificadasTotal}`}
      subtitle={slot.practica ? 'Conoce el teléfono simulado' : t.categoria.charAt(0).toUpperCase() + t.categoria.slice(1)}
      footer={
        <>
          <Button label="Abrir teléfono simulado" onPress={abrir} />
          <Pressable onPress={omitir} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: 8 }}>
            <AppText style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.muted }}>No sé cómo hacerlo · Omitir tarea</AppText>
          </Pressable>
        </>
      }
    >
      <Card style={{ padding: 20, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <IconBadge name="settings" size={56} />
          {slot.practica ? (
            <View style={{ backgroundColor: colors.primarySoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6 }}>
              <AppText style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.primaryDark }}>NO CUENTA</AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="big" style={{ fontSize: 24, marginTop: 8 }}>{t.titulo}</AppText>
        <AppText variant="subtitle">{t.instruccion}</AppText>
      </Card>
      <Card style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Icon name="timer" color={colors.primary} />
          <AppText variant="bodyStrong" style={{ flex: 1, fontSize: 14 }}>{t.tiempoLimiteSeg ? `Tiempo máximo: ${fmt(t.tiempoLimiteSeg)}` : 'Sin límite de tiempo'}</AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Icon name="lightbulb" color={colors.primary} />
          <AppText variant="bodyStrong" style={{ flex: 1, fontSize: 14 }}>{slot.practica ? 'Puedes pedir ayuda las veces que quieras.' : 'Puedes pedir pistas con Ayuda; se registran.'}</AppText>
        </View>
        {!slot.practica ? (
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Icon name="skip-next" color={colors.primary} />
            <AppText variant="bodyStrong" style={{ flex: 1, fontSize: 14 }}>Si no sabes cómo hacerlo, puedes omitir.</AppText>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
