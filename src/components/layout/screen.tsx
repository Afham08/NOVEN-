import { BlurTargetView } from 'expo-blur';
import { usePathname } from 'expo-router';
import { useRef, type PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeBackground } from '@/components/home/home-background';
import { GlassTarget } from '@/components/ui/glass';

export type ScreenProps = PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle> }>;
export function Screen({ children, contentStyle }: ScreenProps) {
  const { bottom, top } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const path = usePathname();
  const isTab = ['/activities', '/progress', '/family'].includes(path);
  const target = useRef<View | null>(null);
  return (
    <GlassTarget.Provider value={target}>
      <View style={styles.screen}>
        <BlurTargetView ref={target} pointerEvents="none" style={StyleSheet.absoluteFill}><HomeBackground /></BlurTargetView>
        <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content,
            { paddingBottom: 32 + bottom, paddingTop: isTab ? (Platform.OS === 'web' && width >= 768 ? 112 : top + 28) : 28 }, contentStyle]}>
          {children}
        </ScrollView>
      </View>
    </GlassTarget.Provider>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22, gap: 24, maxWidth: 840, width: '100%', alignSelf: 'center' },
});
