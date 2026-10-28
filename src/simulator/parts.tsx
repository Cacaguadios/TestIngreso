import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { A } from './android';
import { useSim } from './context';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];
export const MIcon = ({ name, size = 22, color = A.text }: { name: IconName; size?: number; color?: string }) => (
  <MaterialIcons name={name} size={size} color={color} />
);

/** Anillo verde que late alrededor del elemento que "Mostrarme" señala. No cambia el tamaño del elemento. */
function GuideRing({ radius }: { radius: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
        borderWidth: 3, borderColor: A.guide, borderRadius: radius + 4,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
      }}
    />
  );
}

/**
 * Envuelve un elemento que "Mostrarme" puede señalar. Pasa `style` cuando el elemento necesita
 * ocupar espacio en una fila (p. ej. `{ flex: 1 }`), para no romper el acomodo.
 */
export function Hit({ id, children, radius = 20, style }: { id: string; children: ReactNode; radius?: number; style?: StyleProp<ViewStyle> }) {
  const { activeHighlight, registerHit } = useSim();
  useEffect(() => registerHit(id), [id, registerHit]);
  return (
    <View style={style}>
      {children}
      {activeHighlight === id ? <GuideRing radius={radius} /> : null}
    </View>
  );
}

export function SwitchM3({ on, onPress, disabled }: { on: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled: !!disabled }}
      style={{
        width: 52, height: 32, borderRadius: 16, justifyContent: 'center',
        backgroundColor: on ? A.accent : '#E1E2EC', borderWidth: on ? 0 : 2, borderColor: A.outline,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <View
        style={{
          position: 'absolute', left: on ? 24 : 6, width: on ? 24 : 16, height: on ? 24 : 16,
          borderRadius: 12, backgroundColor: on ? '#FFFFFF' : A.outline, alignItems: 'center', justifyContent: 'center',
        }}
      >
        {on ? <MIcon name="check" size={16} color={A.accent} /> : null}
      </View>
    </Pressable>
  );
}

export function ListRow({
  title, sub, subColor, icon, tint = A.accentSoft, glyph = A.accent, trailing, onPress, highlightId, disabled,
}: {
  title: string; sub?: string; subColor?: string; icon?: IconName; tint?: string; glyph?: string;
  trailing?: ReactNode; onPress?: () => void; highlightId?: string; disabled?: boolean;
}) {
  const row = (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      style={({ pressed }) => ({
        minHeight: 64, backgroundColor: pressed ? A.pressed : A.card, borderRadius: 20, paddingHorizontal: 14,
        paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: disabled ? 0.5 : 1,
      })}
    >
      {icon ? (
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name={icon} size={22} color={glyph} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: A.text }} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={{ fontSize: 13, color: subColor ?? A.text2, marginTop: 1 }} numberOfLines={2}>{sub}</Text> : null}
      </View>
      {trailing}
    </Pressable>
  );
  return highlightId ? <Hit id={highlightId}>{row}</Hit> : row;
}

export const Chevron = () => <MIcon name="chevron-right" size={22} color={A.outline} />;

/** Encabezado de pantalla estilo HyperOS: flecha atrás y título grande. */
export function AppBar({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingTop: 4, paddingBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} accessibilityLabel="Atrás" hitSlop={8} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: pressed ? A.pressed : 'transparent' })}>
          <MIcon name="arrow-back" size={24} />
        </Pressable>
        {right}
      </View>
      <Text style={{ fontSize: 30, color: A.text, marginTop: 6, marginLeft: 16 }} numberOfLines={1}>{title}</Text>
    </View>
  );
}

/** Encabezado compacto (conversación, ficha de contacto, visor). */
export function TopBar({ title, onBack, left, right, dark }: { title?: string; onBack: () => void; left?: ReactNode; right?: ReactNode; dark?: boolean }) {
  const c = dark ? '#FFFFFF' : A.text;
  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 4 }}>
      <Pressable onPress={onBack} accessibilityLabel="Atrás" hitSlop={8} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: pressed ? (dark ? 'rgba(255,255,255,0.15)' : A.pressed) : 'transparent' })}>
        <MIcon name="arrow-back" size={24} color={c} />
      </Pressable>
      {left}
      {title ? <Text numberOfLines={1} style={{ flex: 1, fontSize: 19, fontWeight: '500', color: c }}>{title}</Text> : <View style={{ flex: 1 }} />}
      {right}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={{ fontSize: 14, fontWeight: '500', color: A.accent, marginTop: 14, marginBottom: 6, marginLeft: 8 }}>{children}</Text>;
}

/** Barra de búsqueda tipo píldora que solo navega (la escritura ocurre en otra pantalla). */
export function SearchPill({ label, onPress, highlightId }: { label: string; onPress: () => void; highlightId?: string }) {
  const pill = (
    <Pressable
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel={label}
      style={({ pressed }) => ({ height: 52, borderRadius: 26, backgroundColor: pressed ? '#D9E1F0' : A.shade, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 })}
    >
      <MIcon name="search" size={22} color={A.text2} />
      <Text style={{ fontSize: 16, color: A.text2 }}>{label}</Text>
    </Pressable>
  );
  return highlightId ? <Hit id={highlightId} radius={26}>{pill}</Hit> : pill;
}

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.42, fontWeight: '500' }}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function useSliderResponder(onChange: (v: number) => void, inset = 0) {
  const [w, setW] = useState(0);
  const set = (e: GestureResponderEvent) => {
    const usable = w - inset * 2;
    if (usable <= 0) return;
    onChange(Math.round(Math.max(0, Math.min(1, (e.nativeEvent.locationX - inset) / usable)) * 100));
  };
  return {
    onLayout: (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width),
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    // Evita que el desplazamiento vertical de la pantalla "robe" el arrastre del deslizador.
    onResponderTerminationRequest: () => false,
    onResponderGrant: set,
    onResponderMove: set,
  };
}

/** Deslizador 0–100 (Material 3) que responde al toque y al arrastre. */
export function SliderM3({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) {
  const responder = useSliderResponder(onChange, 10);
  return (
    <View
      {...responder}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: value }}
      style={{ height: 40, justifyContent: 'center', paddingHorizontal: 10 }}
    >
      <View style={{ height: 12, borderRadius: 6, backgroundColor: '#E0E2EC', overflow: 'hidden' }}>
        <View style={{ width: `${value}%`, height: 12, backgroundColor: A.accent }} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: 10, right: 10, top: 0, bottom: 0, justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: `${value}%`, marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: A.accent, borderWidth: 3, borderColor: '#FFFFFF' }} />
      </View>
    </View>
  );
}

/** Deslizador grueso del Centro de control (brillo / volumen), como en HyperOS. */
export function SliderPill({ value, onChange, icon, label }: { value: number; onChange: (v: number) => void; icon: IconName; label: string }) {
  const responder = useSliderResponder(onChange);
  const fill = Math.max(value, 14);
  return (
    <View
      {...responder}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: value }}
      style={{ height: 52, borderRadius: 26, backgroundColor: A.tileOff, overflow: 'hidden', justifyContent: 'center' }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill}%`, backgroundColor: A.accent, borderRadius: 26 }} />
      <View pointerEvents="none" style={{ paddingLeft: 18 }}>
        <MIcon name={icon} size={22} color="#FFFFFF" />
      </View>
    </View>
  );
}

export function SliderRow({ title, icon, value, onChange, highlightId }: { title: string; icon: IconName; value: number; onChange: (v: number) => void; highlightId?: string }) {
  const row = (
    <View style={{ backgroundColor: A.card, borderRadius: 20, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6 }}>
        <MIcon name={value === 0 && icon.startsWith('volume') ? 'volume-off' : icon} size={22} color={A.text2} />
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: A.text }}>{title}</Text>
        <Text style={{ fontSize: 13, color: A.text2 }}>{value} %</Text>
      </View>
      <SliderM3 value={value} onChange={onChange} label={title} />
    </View>
  );
  return highlightId ? <Hit id={highlightId}>{row}</Hit> : row;
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
