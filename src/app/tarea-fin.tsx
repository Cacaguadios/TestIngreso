import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useStore } from '../state/store';
import { AppText, Button, Card, Icon, IconBadge, Screen } from '../ui/components';
import type { IconName } from '../ui/components';
import { colors } from '../ui/theme';
import { useBlockBack } from '../ui/use-block-back';

type Info = { icono: IconName; fondo: string; color: string; titulo: string; texto: string; nota: string; notaIcono: IconName };

function infoFor(estado: string): Info {
  switch (estado) {
    case 'tiempo_agotado':
      return { icono: 'timer', fondo: '#EEF1F3', color: colors.ink, titulo: 'Se acabó el tiempo', texto: 'Pasamos a la siguiente tarea. Lo que hiciste quedó guardado.', nota: 'Esta tarea se marca como no completada.', notaIcono: 'info-outline' };
    case 'omitida':
      return { icono: 'skip-next', fondo: '#EEF1F3', color: colors.ink, titulo: 'Tarea omitida', texto: 'No pasa nada. Continuamos con la siguiente tarea.', nota: 'Lo que hiciste quedó guardado.', notaIcono: 'cloud-done' };
    default:
      return { icono: 'check', fondo: colors.primarySoft, color: colors.primary, titulo: '¡Tarea completada!', texto: 'Lograste realizar la acción solicitada. Continúa con la siguiente tarea.', nota: 'Tus avances se guardaron en el equipo.', notaIcono: 'cloud-done' };
  }
}

/** Resultado de una tarea. No muestra puntuación: el candidato no ve su calificación. */
export default function TareaFin() {
  const finishTask = useStore((s) => s.finishTask);
  const last = useStore((s) => s.last);
  const done = useStore((s) => s.evaluationDone);
  const called = useRef(false);
  useBlockBack();

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    void finishTask();
  }, [finishTask]);

  if (!last) return null;
  const info = infoFor(last.result.estado);
  return (
    <Screen
      eyebrow={false}
      footer={<Button label="Continuar" onPress={() => router.replace(done ? '/final' : '/progreso')} />}
    >
      <View style={{ alignItems: 'center', marginTop: 70, gap: 16 }}>
        <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: info.fondo, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={info.icono} size={84} color={info.color} />
        </View>
        <AppText variant="title" style={{ textAlign: 'center', marginTop: 24 }}>{info.titulo}</AppText>
        <AppText variant="subtitle" style={{ textAlign: 'center', paddingHorizontal: 16 }}>{info.texto}</AppText>
      </View>
      <View style={{ flex: 1, minHeight: 40 }} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <IconBadge name={info.notaIcono} />
        <AppText variant="bodyStrong" style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 }}>{info.nota}</AppText>
      </Card>
    </Screen>
  );
}
