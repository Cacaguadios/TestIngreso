import { router } from 'expo-router';
import { View } from 'react-native';
import { useStore } from '../state/store';
import { AppText, Button, Card, Icon, ProgressBar, Screen } from '../ui/components';
import { colors } from '../ui/theme';
import { useBlockBack } from '../ui/use-block-back';

export default function Progreso() {
  const session = useStore((s) => s.session);
  useBlockBack();
  if (!session) return null;
  const done = session.completed.length;

  const rows = session.definition.tareas
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((slot, i) => {
      const n = slot.practica ? 'Práctica' : `Tarea ${String(i).padStart(2, '0')}`;
      const estado = i < done ? 'hecha' : i === done ? 'actual' : 'pendiente';
      return { key: slot.orden, nombre: n, estado, num: i };
    });

  return (
    <Screen title="Tu evaluación" subtitle="Evaluación de habilidades digitales" footer={<Button label="Ver siguiente tarea" onPress={() => router.replace('/tarea')} />}>
      <Card>
        <AppText variant="small">Progreso general</AppText>
        <AppText variant="big">{session.calificadasHechas} de {session.calificadasTotal} tareas</AppText>
        <ProgressBar value={session.calificadasTotal ? session.calificadasHechas / session.calificadasTotal : 0} />
      </Card>
      {rows.map((r) => (
        <Card key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderWidth: r.estado === 'actual' ? 2 : 1, borderColor: r.estado === 'actual' ? colors.primary : colors.border }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: r.estado === 'hecha' ? colors.primarySoft : r.estado === 'actual' ? colors.primary : '#EEF1F3' }}>
            {r.estado === 'hecha' ? <Icon name="check" size={18} color={colors.primary} /> : r.estado === 'actual' ? <Icon name="play-arrow" size={18} color={colors.white} /> : <AppText variant="small" style={{ fontFamily: 'Inter_700Bold' }}>{r.num}</AppText>}
          </View>
          <View>
            <AppText variant="bodyStrong" style={{ fontFamily: 'Inter_700Bold' }}>{r.nombre}</AppText>
            <AppText variant="small" style={{ fontSize: 12, color: r.estado === 'actual' ? colors.primaryDark : colors.muted }}>
              {r.estado === 'hecha' ? 'Completada' : r.estado === 'actual' ? 'Siguiente tarea' : 'Pendiente'}
            </AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
