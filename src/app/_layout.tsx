import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { colors } from '../ui/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const init = useStore((s) => s.init);
  const pause = useStore((s) => s.pause);
  const resume = useStore((s) => s.resume);

  // El teléfono es de la empresa y se usa en modo dedicado: pantalla siempre encendida
  // y a pantalla completa (sin barras del sistema).
  useKeepAwake();
  useEffect(() => {
    if (Platform.OS === 'android') NavigationBar.setHidden(true);
  }, []);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Si la app pasa a segundo plano, el tiempo de la tarea deja de contar.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => (st === 'active' ? resume() : pause()));
    return () => sub.remove();
  }, [pause, resume]);

  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade', contentStyle: { backgroundColor: colors.canvas } }} />
    </SafeAreaProvider>
  );
}
