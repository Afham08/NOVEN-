import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassFill } from '@/components/ui/glass';
import { useTheme } from '@/hooks/use-theme';

export function HomeActivity({ title, icon, wide, onPress }: {
  title: string; icon: ReactNode; wide: boolean; onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
      style={({ pressed, hovered }) => [styles.card, wide && styles.wide,
        { backgroundColor: theme.activityGlass, borderColor: hovered ? theme.accentStrong : theme.activityGlassBorder,
          boxShadow: `0 8px 24px ${theme.activityShadow}`, shadowColor: theme.activityShadow,
          opacity: pressed ? 0.78 : 1 }]}>
      <View pointerEvents="none" style={styles.glassClip}><GlassFill /></View>
      <View style={[styles.icon, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>{icon}</View>
      <Text style={[styles.title, { color: theme.heading }]}>{title}</Text>
      <View style={[styles.action, { backgroundColor: theme.exerciseButton }]}>
        <Text style={[styles.actionText, { color: theme.exerciseButtonText }]}>Start</Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 34, borderWidth: 1, padding: 26, gap: 22, overflow: 'visible', minHeight: 220,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 3 },
  glassClip: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 34, overflow: 'hidden' },
  wide: { flex: 1, minWidth: 0, minHeight: 300 },
  icon: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'InterBold', fontSize: 30, lineHeight: 38, letterSpacing: -0.8, marginTop: 'auto' },
  action: { alignSelf: 'flex-start', minHeight: 46, minWidth: 104, borderRadius: 23,
    paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontFamily: 'InterBold', fontSize: 16, lineHeight: 22 },
});
