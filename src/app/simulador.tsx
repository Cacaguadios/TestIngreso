import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Simulator } from '../simulator/Simulator';
import { useStore } from '../state/store';
import { AppText, Button, Icon } from '../ui/components';
import { colors } from '../ui/theme';
import { useBlockBack } from '../ui/use-block-back';

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function SimuladorScreen() {
  const runner = useStore((s) => s.runner);
  const phone = useStore((s) => s.phone);
  const estado = useStore((s) => s.taskEstado);
  const hint = useStore((s) => s.hint);
  const session = useStore((s) => s.session);
  const dispatch = useStore((s) => s.dispatch);
  const requestHint = useStore((s) => s.requestHint);
  const clearHint = useStore((s) => s.clearHint);
  const skipTask = useStore((s) => s.skipTask);
  const tick = useStore((s) => s.tick);
  const [, force] = useState(0);
  const [sheet, setSheet] = useState(false);

  // Reloj de la tarea: refresca el contador y revisa el tiempo límite.
  useEffect(() => {
    const id = setInterval(() => {
      tick();
      force((n) => n + 1);
    }, 500);
    return () => clearInterval(id);
  }, [tick]);

  // Cuando la tarea termina (éxito, tiempo o omitida) pasa a la pantalla de resultado.
  useEffect(() => {
    if (estado && estado !== 'en_curso') router.replace('/tarea-fin');
  }, [estado]);

  // El botón "atrás" del sistema real es el "atrás" del teléfono simulado.
  const onBack = useCallback(() => {
    if (sheet) setSheet(false);
    else dispatch({ type: 'back' });
  }, [sheet, dispatch]);
  useBlockBack(onBack);

  if (!runner || !phone || !session?.currentSlot) return null;
  const limit = runner.task.tiempoLimiteSeg;
  const remaining = runner.remainingMs();
  const timeText = limit === null ? `⏱ ${mmss(runner.elapsedMs())}` : `⏱ ${mmss(remaining ?? 0)}`;
  const low = remaining !== null && remaining < 15_000;
  const slot = session.currentSlot;
  const etiqueta = slot.practica ? 'Práctica' : `Tarea ${String(session.calificadasHechas + 1).padStart(2, '0')}`;

  const pedirAyuda = () => {
    requestHint();
    setSheet(true);
  };
  const cerrarSheet = () => {
    setSheet(false);
    clearHint();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <View style={styles.chip}>
          <AppText style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primaryDark }}>{etiqueta}</AppText>
        </View>
        <AppText style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, color: low ? colors.danger : colors.ink }}>{timeText}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Ayuda" onPress={pedirAyuda} style={styles.help}>
          <Icon name="lightbulb" size={16} color={colors.white} />
          <AppText style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.white }}>Ayuda</AppText>
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 12, paddingBottom: 12 }}>
        <Simulator state={phone} dispatch={dispatch} highlight={hint.resaltar} />
      </View>

      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <AppText variant="eyebrow" style={{ color: colors.primaryDark }}>
              {hint.texto ? `PISTA ${hint.numero}${runner.task.ayudas.length ? ` DE ${runner.task.ayudas.length}` : ''}` : 'SIN MÁS PISTAS'}
            </AppText>
            <AppText variant="big" style={{ fontSize: 20, lineHeight: 28 }}>
              {hint.texto ?? 'Ya viste todas las pistas de esta tarea.'}
            </AppText>
            <AppText variant="small">Las pistas se registran como parte de la evaluación.</AppText>
            <View style={{ gap: 10, marginTop: 8 }}>
              <Button label="Volver al teléfono" onPress={cerrarSheet} />
              {runner.hasMoreHints ? (
                <Button
                  label={runner.hintsUsed >= runner.task.ayudas.length && runner.task.mostrarme ? 'Mostrarme dónde tocar' : 'Otra pista'}
                  variant="secondary"
                  onPress={() => {
                    requestHint();
                    // Si fue "Mostrarme", se cierra la hoja para que se vea el resaltado.
                    if (runner.hintsUsed > runner.task.ayudas.length) setSheet(false);
                  }}
                />
              ) : null}
              <Button
                label="No sé cómo hacerlo · Omitir tarea"
                variant="ghost"
                onPress={() => {
                  setSheet(false);
                  skipTask();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  bar: {
    margin: 12, height: 52, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12,
  },
  chip: { backgroundColor: colors.primarySoft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  help: { height: 36, borderRadius: 18, backgroundColor: colors.primary, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 32, gap: 8 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9D1D8', marginBottom: 8 },
});
