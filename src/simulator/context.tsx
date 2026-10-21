import { createContext, useContext } from 'react';
import type { PhoneAction, PhoneState } from '../engine/types';
import { DEFAULT_WORLD, type World } from '../engine/world';

export interface SimContextValue {
  state: PhoneState;
  dispatch: (a: PhoneAction) => void;
  /** Id del elemento a resaltar cuando el candidato usó "Mostrarme". */
  highlight: string | null;
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
