import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, space } from './theme';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

export function Icon({ name, size = 22, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

type Variant = 'title' | 'subtitle' | 'body' | 'bodyStrong' | 'small' | 'eyebrow' | 'big';
const textStyles: Record<Variant, TextStyle> = {
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.ink },
  big: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.6, color: colors.primary },
};

export function AppText({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text {...rest} style={[textStyles[variant], style]} />;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: IconName;
}) {
  const fg = variant === 'primary' ? colors.white : variant === 'secondary' ? colors.primaryDark : colors.muted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.primarySoft },
        variant === 'ghost' && { backgroundColor: 'transparent', minHeight: 44 },
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <Text style={{ fontFamily: variant === 'ghost' ? fonts.semibold : fonts.bold, fontSize: variant === 'ghost' ? 13 : 16, color: fg }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function IconBadge({ name, size = 44, tint = colors.primarySoft, color = colors.primary }: { name: IconName; size?: number; tint?: string; color?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={Math.round(size * 0.5)} color={color} />
    </View>
  );
}

/** Pantalla de la app evaluadora: fondo, área segura y desplazamiento si el contenido no cabe. */
export function Screen({ children, footer, eyebrow = true, title, subtitle }: { children?: ReactNode; footer?: ReactNode; eyebrow?: boolean; title?: string; subtitle?: string }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {eyebrow ? <AppText variant="eyebrow">ROLY  /  EVALUACIÓN DIGITAL</AppText> : null}
        {title ? <AppText variant="title" style={{ marginTop: 4 }}>{title}</AppText> : null}
        {subtitle ? <AppText variant="subtitle" style={{ marginTop: 4 }}>{subtitle}</AppText> : null}
        <View style={{ marginTop: title ? space.xl : 0, gap: space.md }}>{children}</View>
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Field({ label, style, ...rest }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.faint} {...rest} style={[styles.fieldInput, style]} />
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%` }]} />
    </View>
  );
}

export function Row({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
      <IconBadge name={icon} size={40} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: space.xl, paddingBottom: space.xxl, flexGrow: 1 },
  footer: { padding: space.xl, paddingTop: space.md, gap: space.sm },
  button: {
    minHeight: 54, borderRadius: radius.md, paddingHorizontal: space.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm,
  },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.md },
  field: { backgroundColor: colors.surface, borderRadius: radius.sm + 1, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.lg, paddingTop: 8, paddingBottom: 4 },
  fieldLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  fieldInput: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: 6, minHeight: 36 },
  track: { height: 10, borderRadius: 5, backgroundColor: '#E8EDF0', overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5, backgroundColor: colors.primary },
});
