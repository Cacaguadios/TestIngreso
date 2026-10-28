import { createContext, useContext } from 'react';
import type { PhoneAction, PhoneState } from '../engine/types';
import { DEFAULT_WORLD, type World } from '../engine/world';

export interface SimContextValue {
  state: PhoneState;
  dispatch: (a: PhoneAction) => void;
  /**
   * Elemento que "Mostrarme" está señalando ahora mismo (o null).
   * Es el último elemento de la ruta guiada que está visible en pantalla.
   */
  activeHighlight: string | null;
  /** Los elementos resaltables avisan que están en pantalla (para elegir cuál señalar). */
  registerHit: (id: string) => () => void;
  world: World;
}

const SimContext = createContext<SimContextValue | null>(null);
export const SimProvider = SimContext.Provider;

export function useSim(): SimContextValue {
  const v = useContext(SimContext);
  if (!v) throw new Error('useSim debe usarse dentro de <SimProvider>');
  return v;
}

export { DEFAULT_WORLD };
