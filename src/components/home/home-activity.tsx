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
        { backgroundColor: theme.glass, borderColor: hovered ? theme.accentStrong : theme.glassBorder,
          boxShadow: `0 12px 36px ${theme.shadow}`, opacity: pressed ? 0.78 : 1 }]}>
      <GlassFill />
      <View style={[styles.icon, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>{icon}</View>
      <Text style={[styles.title, { color: theme.heading }]}>{title}</Text>
      <View style={[styles.action, { backgroundColor: theme.exerciseButton }]}>
        <Text style={[styles.actionText, { color: theme.exerciseButtonText }]}>Start</Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 34, borderWidth: 1, padding: 26, gap: 22, overflow: 'hidden', minHeight: 220 },
  wide: { flex: 1, minWidth: 0, minHeight: 300 },
  icon: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'InterBold', fontSize: 30, lineHeight: 38, letterSpacing: -0.8, marginTop: 'auto' },
  action: { alignSelf: 'flex-start', minHeight: 46, minWidth: 104, borderRadius: 23,
    paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontFamily: 'InterBold', fontSize: 16, lineHeight: 22 },
});
