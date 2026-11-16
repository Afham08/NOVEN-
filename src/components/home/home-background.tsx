import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function HomeBackground({ subtle = false }: { subtle?: boolean }) {
  const theme = useTheme();
  const dark = theme === Colors.dark;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
      <View style={{ height: subtle ? 460 : dark ? '100%' : '76%', width: '100%', opacity: subtle ? 0.28 : 1 }}>
        <LinearGradient colors={[theme.glowTop, theme.glowMid, theme.background]}
          locations={dark ? [0, 0.28, 0.88] : [0, 0.38, 1]} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[theme.glowClear, theme.glowHot, theme.glowClear]}
          locations={[0, 0.53, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.22 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[theme.glowClear, theme.glowClear, theme.background]}
          locations={dark ? [0, 0.08, 0.86] : [0, 0.12, 1]} style={StyleSheet.absoluteFill} />
      </View>
    </View>
  );
}
