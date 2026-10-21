import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { A } from './android';
import { useSim } from './context';

type IconName = ComponentProps<typeof MaterialIcons>['name'];
export const MIcon = ({ name, size = 22, color = A.text }: { name: IconName; size?: number; color?: string }) => (
  <MaterialIcons name={name} size={size} color={color} />
);

/** Marca con un anillo verde el elemento que "Mostrarme" señaló. */
export function Hit({ id, children, radius = 20 }: { id: string; children: ReactNode; radius?: number }) {
  const { highlight } = useSim();
  const on = highlight === id;
  return (
    <View style={on ? { borderWidth: 3, borderColor: '#008C44', borderRadius: radius + 3, padding: 2 } : undefined}>
      {children}
    </View>
  );
}

export function SwitchM3({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={{
        width: 52, height: 32, borderRadius: 16, justifyContent: 'center',
        backgroundColor: on ? A.accent : '#E1E2EC', borderWidth: on ? 0 : 2, borderColor: A.outline,
      }}
    >
      <View
        style={{
          position: 'absolute', left: on ? 24 : 6, width: on ? 24 : 16, height: on ? 24 : 16,
          borderRadius: 12, backgroundColor: on ? '#FFFFFF' : A.outline,
        }}
      />
    </Pressable>
  );
}

export function ListRow({
  title, sub, subColor, icon, tint = A.accentSoft, glyph = A.accent, trailing, onPress, highlightId,
}: {
  title: string; sub?: string; subColor?: string; icon?: IconName; tint?: string; glyph?: string;
  trailing?: ReactNode; onPress?: () => void; highlightId?: string;
}) {
  const row = (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        minHeight: 64, backgroundColor: pressed ? '#EDEFF7' : A.card, borderRadius: 20, paddingHorizontal: 14,
        paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
      })}
    >
      {icon ? (
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name={icon} size={22} color={glyph} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: A.text }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 13, color: subColor ?? A.text2, marginTop: 1 }}>{sub}</Text> : null}
      </View>
      {trailing}
    </Pressable>
  );
  return highlightId ? <Hit id={highlightId}>{row}</Hit> : row;
}

export const Chevron = () => <MIcon name="chevron-right" size={22} color={A.outline} />;

export function AppBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 12 }}>
      <Pressable onPress={onBack} accessibilityLabel="Atrás" hitSlop={8} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
        <MIcon name="arrow-back" size={24} />
      </Pressable>
      <Text style={{ fontSize: 30, color: A.text, marginTop: 8, marginLeft: 16 }}>{title}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={{ fontSize: 14, fontWeight: '500', color: A.accent, marginTop: 14, marginBottom: 6, marginLeft: 8 }}>{children}</Text>;
}

/** Deslizador 0–100 que responde al toque y al arrastre. */
export function SliderM3({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [w, setW] = useState(0);
  const set = (e: GestureResponderEvent) => {
    if (w <= 0) return;
    onChange(Math.round(Math.max(0, Math.min(1, e.nativeEvent.locationX / w)) * 100));
  };
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  return (
    <View
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={set}
      onResponderMove={set}
      style={{ height: 40, justifyContent: 'center' }}
    >
      <View style={{ height: 12, borderRadius: 6, backgroundColor: '#E0E2EC', overflow: 'hidden' }}>
        <View style={{ width: `${value}%`, height: 12, backgroundColor: A.accent }} />
      </View>
      <View style={{ position: 'absolute', left: `${value}%`, marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: A.accent }} />
    </View>
  );
}

export function SliderRow({ title, icon, value, onChange }: { title: string; icon: IconName; value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ backgroundColor: A.card, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <MIcon name={icon} size={22} color={A.text2} />
        <Text style={{ fontSize: 16, fontWeight: '500', color: A.text }}>{title}</Text>
      </View>
      <SliderM3 value={value} onChange={onChange} />
    </View>
  );
}

export function useNow(intervalMs = 20_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export const hhmm = (d: Date) => d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
export const fechaLarga = (d: Date) => d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'long' });

/**
 * Campo de texto del simulador. Guarda lo escrito en local y lo reporta al motor al terminar
 * (no en cada tecla): así la telemetría registra un evento `texto` con el texto final.
 */
export function useBufferedText(initial: string) {
  const [text, setText] = useState(initial);
  useEffect(() => setText(initial), [initial]);
  return [text, setText] as const;
}
