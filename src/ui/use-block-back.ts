import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/**
 * Bloquea el botón "atrás" del sistema mientras la pantalla está visible.
 * Si se pasa `handler`, se ejecuta en su lugar (el simulador lo usa para su propio "atrás").
 */
export function useBlockBack(handler?: () => boolean | void) {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handler?.();
        return true;
      });
      return () => sub.remove();
    }, [handler]),
  );
}
