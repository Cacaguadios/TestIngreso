import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Card, Icon } from '../ui/components';
import { Screen } from '../ui/components';
import { colors } from '../ui/theme';
import { useBlockBack } from '../ui/use-block-back';

export default function SinConexion() {
  useBlockBack();
  return (
    <Screen title="Sincronización pendiente" subtitle="No perderás tu progreso." footer={<Button label="Entendido" onPress={() => router.replace('/')} />}>
      <View style={{ alignItems: 'center', marginTop: 36, gap: 16 }}>
        <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sync" size={84} color={colors.primary} />
        </View>
        <AppText variant="title" style={{ textAlign: 'center', fontSize: 26, marginTop: 16 }}>Guardado en el equipo</AppText>
        <AppText variant="subtitle" style={{ textAlign: 'center', paddingHorizontal: 16 }}>Tus respuestas y acciones se enviarán a POI cuando vuelva la conexión.</AppText>
      </View>
      <View style={{ flex: 1, minHeight: 30 }} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="schedule" color={colors.primary} />
        <AppText style={{ fontFamily: 'Inter_700Bold', color: colors.primaryDark }}>Pendiente de sincronizar</AppText>
      </Card>
    </Screen>
  );
}
