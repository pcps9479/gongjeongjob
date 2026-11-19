import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { color, font, radius, shadow, space, toneStyles, Tone } from '../theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* ───────────── Chip ───────────── */
export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [styles.chip, active ? styles.chipActive : null, pressed ? styles.pressed : null]}
    >
      {icon ? <Ionicons name={icon} size={13} color={active ? '#FFFFFF' : color.inkSoft} /> : null}
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ───────────── Badge ───────────── */
export function Badge({
  label,
  tone = 'gray',
  icon,
  small,
}: {
  label: string;
  tone?: Tone;
  icon?: IconName;
  small?: boolean;
}) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }, small ? styles.badgeSmall : null]}>
      {icon ? <Ionicons name={icon} size={small ? 10 : 11} color={t.fg} /> : null}
      <Text style={[styles.badgeText, { color: t.fg }, small ? { fontSize: 10.5 } : null]}>{label}</Text>
    </View>
  );
}

/* ───────────── Button ───────────── */
type ButtonVariant = 'primary' | 'dark' | 'outline' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  size = 'md',
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: ViewStyle;
}) {
  const bg: Record<ButtonVariant, string> = {
    primary: color.accent,
    dark: color.brand,
    outline: color.surface,
    ghost: 'transparent',
    danger: color.redSoft,
  };
  const fg: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    dark: '#FFFFFF',
    outline: color.ink,
    ghost: color.inkSoft,
    danger: color.red,
  };
  const height = size === 'lg' ? 54 : size === 'sm' ? 38 : 46;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg[variant],
          height,
          borderColor: variant === 'outline' ? color.lineStrong : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius: size === 'sm' ? radius.sm : radius.md,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 14 : 17} color={fg[variant]} /> : null}
          <Text style={[styles.buttonText, { color: fg[variant], fontSize: size === 'sm' ? 13 : 15.5 }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* ───────────── Section header ───────────── */
export function SectionHeader({
  title,
  caption,
  right,
  style,
}: {
  title: string;
  caption?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/* ───────────── Stepper ───────────── */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  format,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  disabled?: boolean;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 10) / 10));
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(clamp(value - step))}
        disabled={disabled || value <= min}
        style={({ pressed }) => [
          styles.stepperBtn,
          (disabled || value <= min) && styles.stepperBtnDisabled,
          pressed && styles.pressed,
        ]}
        accessibilityLabel="감소"
      >
        <Ionicons name="remove" size={16} color={color.ink} />
      </Pressable>
      <Text style={styles.stepperValue}>{format ? format(value) : String(value)}</Text>
      <Pressable
        onPress={() => onChange(clamp(value + step))}
        disabled={disabled || value >= max}
        style={({ pressed }) => [
          styles.stepperBtn,
          (disabled || value >= max) && styles.stepperBtnDisabled,
          pressed && styles.pressed,
        ]}
        accessibilityLabel="증가"
      >
        <Ionicons name="add" size={16} color={color.ink} />
      </Pressable>
    </View>
  );
}

/* ───────────── Stars ───────────── */
export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= full ? 'star' : 'star-outline'} size={size} color="#F5A524" />
      ))}
    </View>
  );
}

/* ───────────── Field label ───────────── */
export function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {required ? <Text style={styles.required}>*</Text> : null}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

/* ───────────── Divider ───────────── */
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

/* ───────────── Info row ───────────── */
export function InfoRow({
  icon,
  label,
  value,
  valueStyle,
}: {
  icon?: IconName;
  label: string;
  value: string;
  valueStyle?: TextStyle;
}) {
  return (
    <View style={styles.infoRow}>
      {icon ? <Ionicons name={icon} size={14} color={color.muted} style={{ marginTop: 1 }} /> : null}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  chipActive: { backgroundColor: color.brand, borderColor: color.brand },
  chipText: { ...font.small, color: color.inkSoft, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  badgeSmall: { paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
  },
  buttonText: { fontWeight: '700', letterSpacing: -0.2 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: space.x3,
  },
  sectionTitle: { ...font.h3, color: color.ink },
  sectionCaption: { ...font.tiny, color: color.muted, marginTop: 2, fontWeight: '500' },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    overflow: 'hidden',
  },
  stepperBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { opacity: 0.3 },
  stepperValue: {
    minWidth: 46,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: color.ink,
  },

  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 7 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: color.inkSoft },
  required: { color: color.accent, fontWeight: '800', fontSize: 13 },
  fieldHint: { ...font.tiny, color: color.muted, fontWeight: '500', marginLeft: 4 },

  divider: { height: 1, backgroundColor: color.line },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingVertical: 5 },
  infoLabel: { width: 62, fontSize: 12.5, color: color.muted, fontWeight: '600' },
  infoValue: { flex: 1, fontSize: 13, color: color.ink, fontWeight: '600', lineHeight: 19 },
});

export const cardStyle: ViewStyle = {
  backgroundColor: color.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: color.line,
  ...shadow.card,
};
