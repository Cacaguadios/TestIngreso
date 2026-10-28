import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
  const skipTask = useStore((s) => s.skipTask);
  const tick = useStore((s) => s.tick);
  const [, force] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Reloj de la tarea: refresca el contador y revisa el tiempo límite.
  useEffect(() => {
    const id = setInterval(() => {
      tick();
      force((n) => n + 1);
    }, 500);
    return () => clearInterval(id);
  }, [tick]);

  // Cuando la tarea termina (éxito, tiempo u omitida) pasa a la pantalla de resultado,
  // con una pausa corta para que el candidato vea el efecto de su última acción.
  useEffect(() => {
    if (!estado || estado === 'en_curso') return;
    setSheet(false);
    const t = setTimeout(() => router.replace('/tarea-fin'), estado === 'omitida' ? 0 : 700);
    return () => clearTimeout(t);
  }, [estado]);

  // El botón "atrás" del sistema real es el "atrás" del teléfono simulado.
  const onBack = useCallback(() => {
    if (sheet) setSheet(false);
    else dispatch({ type: 'back' });
  }, [sheet, dispatch]);
  useBlockBack(onBack);

  if (!runner || !phone || !session?.currentSlot) return null;
  const task = runner.task;
  const limit = task.tiempoLimiteSeg;
  const remaining = runner.remainingMs();
  const timeText = limit === null ? mmss(runner.elapsedMs()) : mmss(remaining ?? 0);
  const low = remaining !== null && remaining < 15_000;
  const slot = session.currentSlot;
  const etiqueta = slot.practica ? 'Práctica' : `Tarea ${String(session.calificadasHechas + 1).padStart(2, '0')} de ${session.calificadasTotal}`;

  const total = task.ayudas.length;
  const vistas = task.ayudas.slice(0, Math.min(runner.hintsUsed, total));
  const quedanPistas = runner.hintsUsed < total;
  const puedeMostrar = !quedanPistas && runner.hasMoreHints;
  const guiaActiva = hint.resaltar.length > 0;

  const abrirAyuda = () => {
    setConfirmSkip(false);
    setSheet(true);
  };
  const otraPista = () => {
    requestHint();
    if (puedeMostrar) setSheet(false); // "Mostrarme": se cierra para ver el resaltado.
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <View style={styles.chip}>
          <AppText style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primaryDark }}>{etiqueta}</AppText>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel={limit === null ? `Tiempo transcurrido ${timeText}` : `Tiempo restante ${timeText}`}>
          <Icon name="timer" size={16} color={low ? colors.danger : colors.muted} />
          <AppText style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: low ? colors.danger : colors.ink }}>{timeText}</AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ayuda" onPress={abrirAyuda} style={({ pressed }) => [styles.help, pressed && { opacity: 0.85 }]}>
          <Icon name="lightbulb" size={16} color={colors.white} />
          <AppText style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.white }}>Ayuda</AppText>
        </Pressable>
      </View>

      {/* La instrucción siempre visible: el candidato no tiene que memorizarla. */}
      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" accessibilityLabel={`Instrucción: ${task.instruccion}`} style={styles.task}>
        <Icon name={guiaActiva ? 'touch-app' : 'flag'} size={18} color={colors.primary} />
        <AppText numberOfLines={expanded ? undefined : 2} style={{ flex: 1, fontSize: 13, lineHeight: 18, color: colors.ink }}>
          {guiaActiva ? 'Guía activa: toca lo que tiene el contorno verde. ' : ''}
          {task.instruccion}
        </AppText>
        <Icon name={expanded ? 'expand-less' : 'expand-more'} size={18} color={colors.muted} />
      </Pressable>

      <View style={{ flex: 1, paddingHorizontal: 12, paddingBottom: 10 }}>
        <Simulator state={phone} dispatch={dispatch} highlight={hint.resaltar} />
      </View>

      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <Pressable style={styles.scrim} onPress={() => setSheet(false)} accessibilityLabel="Cerrar ayuda">
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            {confirmSkip ? (
              <>
                <AppText variant="big" style={{ fontSize: 20, lineHeight: 28 }}>¿Omitir esta tarea?</AppText>
                <AppText variant="subtitle">Pasarás a la siguiente y esta quedará como no completada. No podrás regresar a ella.</AppText>
                <View style={{ gap: 10, marginTop: 12 }}>
                  <Button label="Sí, omitir tarea" variant="secondary" onPress={() => { setSheet(false); skipTask(); }} />
                  <Button label="Seguir intentando" onPress={() => setConfirmSkip(false)} />
                </View>
              </>
            ) : (
              <>
                <AppText variant="eyebrow" style={{ color: colors.primaryDark }}>AYUDA · {task.titulo.toUpperCase()}</AppText>
                <AppText variant="small" style={{ marginBottom: 4 }}>{task.instruccion}</AppText>
                <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ gap: 8 }}>
                  {vistas.length === 0 ? (
                    <AppText variant="body" style={{ color: colors.muted }}>Todavía no has pedido pistas. Cada pista te dice un poco más de cómo hacerlo.</AppText>
                  ) : (
                    vistas.map((p, i) => (
                      <View key={p} style={styles.hintRow}>
                        <View style={styles.hintNum}>
                          <AppText style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.primaryDark }}>{i + 1}</AppText>
                        </View>
                        <AppText variant="bodyStrong" style={{ flex: 1, fontFamily: 'Inter_500Medium' }}>{p}</AppText>
                      </View>
                    ))
                  )}
                </ScrollView>
                {slot.practica ? null : (
                  <AppText variant="small" style={{ fontSize: 12 }}>Las pistas quedan registradas. Volver a leer las que ya viste no cuenta de nuevo.</AppText>
                )}
                <View style={{ gap: 10, marginTop: 8 }}>
                  {quedanPistas ? (
                    <Button label={`Ver pista ${runner.hintsUsed + 1} de ${total}`} icon="lightbulb" variant="secondary" onPress={otraPista} />
                  ) : puedeMostrar ? (
                    <Button label="Mostrarme dónde tocar" icon="touch-app" variant="secondary" onPress={otraPista} />
                  ) : null}
                  <Button label="Volver al teléfono" onPress={() => setSheet(false)} />
                  <Button label="No sé cómo hacerlo · Omitir tarea" variant="ghost" onPress={() => setConfirmSkip(true)} />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  bar: {
    marginHorizontal: 12, marginTop: 10, height: 52, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 10,
  },
  chip: { backgroundColor: colors.primarySoft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  help: { height: 36, borderRadius: 18, backgroundColor: colors.primary, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  task: {
    marginHorizontal: 12, marginTop: 8, marginBottom: 8, borderRadius: 14, backgroundColor: colors.primarySoft,
    paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 32, gap: 8 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9D1D8', marginBottom: 8 },
  hintRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.canvas, borderRadius: 14, padding: 12 },
  hintNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
