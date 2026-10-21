import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { AppText, Button, Row } from '../ui/components';
import { colors } from '../ui/theme';
import { useBlockBack } from '../ui/use-block-back';

export default function Bienvenida() {
  const sucursal = useStore((s) => s.sucursal.nombre);
  const pendientes = useStore((s) => s.pendientes);
  const reset = useStore((s) => s.reset);
  const taps = useRef(0);
  useBlockBack();

  // Acceso oculto para el encargado: 7 toques seguidos en el logo abren la configuración del equipo.
  const onLogo = () => {
    taps.current++;
    if (taps.current >= 7) {
      taps.current = 0;
      router.push('/equipo');
    }
    setTimeout(() => (taps.current = 0), 4000);
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={[styles.deco, { width: 280, height: 280, left: -70, top: -80 }]} />
        <View style={[styles.deco, { width: 220, height: 220, right: -50, bottom: -30 }]} />
        <SafeAreaView edges={['top']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Pressable onPress={onLogo} accessibilityLabel="Roly" style={styles.logo}>
            <AppText style={{ fontSize: 30, fontFamily: 'Inter_700Bold', color: colors.primary }}>ROLY</AppText>
          </Pressable>
        </SafeAreaView>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.body}>
        <View style={{ gap: 6 }}>
          <AppText variant="title" style={{ fontSize: 30 }}>Evaluación Digital</AppText>
          <AppText variant="subtitle">Demuestra tus habilidades usando un teléfono en un entorno simulado.</AppText>
        </View>
        <View style={{ gap: 12, marginTop: 20 }}>
          <Row icon="smartphone"><AppText variant="bodyStrong">Practicas en un teléfono simulado</AppText></Row>
          <Row icon="help-outline"><AppText variant="bodyStrong">Puedes pedir ayuda cuando la necesites</AppText></Row>
          <Row icon="verified-user"><AppText variant="bodyStrong">Solo personal autorizado ve tus resultados</AppText></Row>
        </View>
        <View style={{ flex: 1 }} />
        {pendientes > 0 ? (
          <AppText variant="small" style={{ textAlign: 'center', marginBottom: 8 }}>
            {pendientes} {pendientes === 1 ? 'evaluación pendiente' : 'evaluaciones pendientes'} de enviar a POI
          </AppText>
        ) : null}
        <Button
          label="Comenzar evaluación"
          onPress={() => {
            reset();
            router.push('/registro');
          }}
        />
        <AppText variant="small" style={{ textAlign: 'center', marginTop: 10 }}>Equipo asignado: {sucursal}</AppText>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  hero: { height: '42%', backgroundColor: colors.primary, borderBottomLeftRadius: 44, borderBottomRightRadius: 44, overflow: 'hidden' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  logo: {
    width: 120, height: 120, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
});
