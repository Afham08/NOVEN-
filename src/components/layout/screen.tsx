import { BlurTargetView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, type PropsWithChildren } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeBackground } from '@/components/home/home-background';
import { GlassTarget } from '@/components/ui/glass';
import { useTheme } from '@/hooks/use-theme';

function activityNavigationTitle(path: string): string | null {
  if (path === '/activity-result') return 'Result';
  if (path === '/exercise/session') return 'Session';
  if (path === '/exercise/result') return 'Result';
  if (path === '/exercise' || path.startsWith('/exercise/')) return 'Exercise';
  if (path === '/yoga' || path.startsWith('/yoga/')) return 'Yoga';
  if (path === '/meditation' || path.startsWith('/meditation/')) return 'Meditation';
  if (path === '/wellness' || path.startsWith('/wellness/')) return 'Wellness';
  return null;
}

export type ScreenProps = PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle>; onBack?: () => void }>;
export function Screen({ children, contentStyle, onBack }: ScreenProps) {
  const { bottom, top } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const path = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isTab = ['/activities', '/progress', '/family'].includes(path);
  const navigationTitle = activityNavigationTitle(path);
  const target = useRef<View | null>(null);
  return (
    <GlassTarget.Provider value={target}>
      <View style={styles.screen}>
        <BlurTargetView ref={target} pointerEvents="none" style={StyleSheet.absoluteFill}><HomeBackground /></BlurTargetView>
        <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content,
            { paddingBottom: 32 + bottom, paddingTop: isTab ? (Platform.OS === 'web' && width >= 768 ? 112 : top + 28) : navigationTitle ? top + 14 : 28 }, contentStyle]}>
          {navigationTitle ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Back from ${navigationTitle}`}
              hitSlop={8}
              onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/'))}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.backButton,
                {
                  backgroundColor: theme.secondaryButton,
                  borderColor: hovered ? theme.glassBorder : 'transparent',
                  opacity: pressed ? 0.78 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                size={20}
                tintColor={theme.secondaryButtonText}
              />
              <Text style={[styles.backLabel, { color: theme.secondaryButtonText }]}>{navigationTitle}</Text>
            </Pressable>
          ) : null}
          {children}
        </ScrollView>
      </View>
    </GlassTarget.Provider>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22, gap: 24, maxWidth: 840, width: '100%', alignSelf: 'center' },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
});
