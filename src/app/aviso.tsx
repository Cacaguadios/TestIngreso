import { router } from 'expo-router';
import { View } from 'react-native';
import { useStore } from '../state/store';
import { AppText, Button, Card, Screen } from '../ui/components';

const BLOQUES: [string, string][] = [
  ['Qué datos se recaban', 'Tu nombre, apellidos, puesto y sucursal, y el registro de tus acciones durante la evaluación: tiempos, errores y ayudas solicitadas.'],
  ['Para qué se usan', 'Para conocer tus habilidades digitales y apoyar procesos de contratación, capacitación y seguimiento en Roly.'],
  ['Quién puede verlos', 'Solo personal autorizado, desde el módulo de Evaluaciones de POI.'],
  ['Tu teléfono', 'La evaluación ocurre en un teléfono simulado. No se modifica ni se lee nada del equipo real.'],
];

export default function Aviso() {
  const setDraft = useStore((s) => s.setDraft);
  return (
    <Screen
      title="Aviso de privacidad"
      subtitle="Lee cómo se usarán tus datos."
      footer={
        <>
          <Button label="Acepto y continuar" onPress={() => { setDraft({ acepto: true }); router.back(); }} />
          <Button label="Regresar" variant="ghost" onPress={() => router.back()} />
        </>
      }
    >
      <Card style={{ padding: 20, gap: 14 }}>
        {BLOQUES.map(([t, b]) => (
          <View key={t} style={{ gap: 4 }}>
            <AppText variant="bodyStrong">{t}</AppText>
            <AppText variant="small" style={{ fontSize: 13, lineHeight: 19, color: '#4A5864' }}>{b}</AppText>
          </View>
        ))}
      </Card>
      <AppText variant="small" style={{ fontSize: 11, color: '#98A4AE' }}>Texto de ejemplo: pendiente de validar con Jurídico.</AppText>
    </Screen>
  );
}
