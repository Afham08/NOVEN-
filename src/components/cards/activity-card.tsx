import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GlassFill } from '@/components/ui/glass';

export type ActivityCardProps = PressableProps & {
  title: string; description?: string; meta?: string; icon?: ReactNode;
  tint?: 'accent' | 'sage'; rightLabel?: string;
  gradientColors?: readonly [string, string, ...string[]]; isHero?: boolean; style?: StyleProp<ViewStyle>;
};
export function ActivityCard({ title, description, meta, icon, tint, rightLabel, gradientColors,
  isHero, disabled, style, ...rest }: ActivityCardProps) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled}
      style={({ pressed, hovered }) => [styles.card, { backgroundColor: theme.activityGlass,
        borderColor: hovered ? theme.accentStrong : theme.activityGlassBorder,
        boxShadow: `0 8px 24px ${theme.activityShadow}`,
        shadowColor: theme.activityShadow,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]} {...rest}>
      <View pointerEvents="none" style={styles.glassClip}><GlassFill /></View>
      {icon && <View style={[styles.icon, { backgroundColor: theme.backgroundElement }]}>{icon}</View>}
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.heading }]}>{title}</Text>
        {description && <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>}
        {meta && <Text style={[styles.meta, { color: theme.textSecondary }]}>{meta}</Text>}
        {rightLabel && <Text style={[styles.detail, { color: theme.accentStrong }]}>{rightLabel}</Text>}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 24, borderRadius: 28,
    borderWidth: 1, overflow: 'visible', minHeight: 112, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1, shadowRadius: 24, elevation: 3 },
  glassClip: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 28, overflow: 'hidden' },
  icon: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  copy: { flex: 1, gap: 8 },
  title: { ...Type.heading, fontSize: 25, lineHeight: 33 },
  description: Type.body,
  meta: Type.small,
  detail: { ...Type.label, fontSize: 16, lineHeight: 24 },
});
