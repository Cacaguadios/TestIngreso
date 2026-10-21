import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useStore } from '../state/store';
import { AppText, Button, Card, Icon, IconBadge, Screen } from '../ui/components';
import { colors } from '../ui/theme';
import { useBlockBack } from '../ui/use-block-back';

export default function Final() {
  const closeEvaluation = useStore((s) => s.closeEvaluation);
  useBlockBack();

  const cerrar = async () => {
    const net = await NetInfo.fetch();
    await closeEvaluation();
    router.replace(net.isConnected === false ? '/sin-conexion' : '/');
  };

  return (
    <Screen eyebrow={false} footer={<Button label="Cerrar" onPress={cerrar} />}>
      <View style={{ alignItems: 'center', marginTop: 50, gap: 16 }}>
        <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={84} color={colors.primary} />
        </View>
        <AppText variant="title" style={{ textAlign: 'center', marginTop: 24 }}>¡Evaluación finalizada!</AppText>
        <AppText variant="subtitle" style={{ textAlign: 'center', paddingHorizontal: 16 }}>Gracias por completar tu evaluación de habilidades digitales.</AppText>
      </View>
      <View style={{ flex: 1, minHeight: 30 }} />
      <Card style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <IconBadge name="cloud-done" />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" style={{ fontFamily: 'Inter_700Bold' }}>Respuestas guardadas</AppText>
            <AppText variant="small">Los resultados los revisa personal autorizado desde POI.</AppText>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <IconBadge name="smartphone" />
          <AppText variant="bodyStrong" style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 }}>Entrega el teléfono al encargado de la sucursal.</AppText>
        </View>
      </Card>
    </Screen>
  );
}
