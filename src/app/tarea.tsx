import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../state/store';
import { AppText, Button, Card, Icon, IconBadge, Screen, type IconName } from '../ui/components';
import { colors } from '../ui/theme';
import { useBlockBack } from '../ui/use-block-back';

/** Ícono y nombre visible de cada categoría de tarea. */
const CATEGORIAS: Record<string, { icono: IconName; nombre: string }> = {
  practica: { icono: 'school', nombre: 'Práctica' },
  navegacion: { icono: 'public', nombre: 'Internet' },
  conectividad: { icono: 'wifi', nombre: 'Conectividad' },
  sistema: { icono: 'flashlight-on', nombre: 'Funciones del teléfono' },
  pantalla: { icono: 'brightness-6', nombre: 'Pantalla' },
  sonido: { icono: 'volume-up', nombre: 'Sonido' },
  camara: { icono: 'photo-camera', nombre: 'Cámara' },
  comunicacion: { icono: 'call', nombre: 'Llamadas y mensajes' },
  archivos: { icono: 'folder', nombre: 'Archivos' },
  mapas: { icono: 'place', nombre: 'Mapas' },
};

const fmt = (s: number) => (s >= 60 ? `${Math.round(s / 60)} ${Math.round(s / 60) === 1 ? 'minuto' : 'minutos'}` : `${s} segundos`);

export default function DetalleTarea() {
  const session = useStore((s) => s.session);
  const beginTask = useStore((s) => s.beginTask);
  const skipTask = useStore((s) => s.skipTask);
  const [confirmar, setConfirmar] = useState(false);
  useBlockBack(() => setConfirmar(false));
  const slot = session?.currentSlot;
  if (!session || !slot) return null;
  const t = slot.definicion;
  const numero = session.calificadasHechas + (slot.practica ? 0 : 1);
  const cat = CATEGORIAS[t.categoria] ?? { icono: 'smartphone' as IconName, nombre: t.categoria.charAt(0).toUpperCase() + t.categoria.slice(1) };

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
      subtitle={slot.practica ? 'Conoce el teléfono simulado' : cat.nombre}
      footer={
        confirmar ? (
          <>
            <AppText variant="small" style={{ textAlign: 'center', marginBottom: 4 }}>La tarea quedará como no completada y no podrás regresar a ella.</AppText>
            <Button label="Sí, omitir esta tarea" variant="secondary" onPress={omitir} />
            <Button label="Mejor la intento" onPress={() => setConfirmar(false)} />
          </>
        ) : (
          <>
            <Button label="Abrir teléfono simulado" icon="smartphone" onPress={abrir} />
            <Pressable onPress={() => setConfirmar(true)} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: 8 }}>
              <AppText style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.muted }}>No sé cómo hacerlo · Omitir tarea</AppText>
            </Pressable>
          </>
        )
      }
    >
      <Card style={{ padding: 20, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <IconBadge name={cat.icono} size={56} />
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
