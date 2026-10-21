import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Card, Icon, IconBadge, Screen } from '../ui/components';
import { colors } from '../ui/theme';
import { useBlockBack } from '../ui/use-block-back';

const PASOS = ['Lee cada tarea.', 'Navega dentro del teléfono simulado.', 'Pide una pista con el botón Ayuda si la necesitas.', 'Intenta completar cada tarea sin ayuda.'];

export default function Instrucciones() {
  useBlockBack(() => router.back());
  return (
    <Screen title="Antes de comenzar" subtitle="Lee cuidadosamente las indicaciones." footer={<Button label="Entendido, iniciar" onPress={() => router.replace('/tarea')} />}>
      <Card style={{ padding: 20, gap: 16 }}>
        <AppText variant="big" style={{ fontSize: 20 }}>Tu misión</AppText>
        <AppText variant="subtitle" style={{ fontSize: 14, lineHeight: 20 }}>Realizarás diferentes tareas dentro de un teléfono Android simulado.</AppText>
        {PASOS.map((p, i) => (
          <View key={p} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ fontFamily: 'Inter_700Bold', color: colors.primaryDark }}>{i + 1}</AppText>
            </View>
            <AppText variant="bodyStrong" style={{ flex: 1, fontFamily: 'Inter_500Medium' }}>{p}</AppText>
          </View>
        ))}
      </Card>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <IconBadge name="info-outline" />
        <AppText variant="small" style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>Es un teléfono simulado: no se modifica la configuración real del equipo.</AppText>
      </Card>
    </Screen>
  );
}
