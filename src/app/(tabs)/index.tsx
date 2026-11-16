import { GlassTarget } from '@/components/ui/glass';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { Colors, Fonts } from '@/constants/theme';
import { BlurTargetView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeActivity } from '@/components/home/home-activity';
import { HomeBackground } from '@/components/home/home-background';
import { useLanguage } from '@/hooks/use-language';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setPreference } = useThemePreference();
  const dark = theme === Colors.dark;
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 850 && fontScale < 1.5;
  const insets = useSafeAreaInsets();
  const target = useRef<View | null>(null);
  const { t, language } = useLanguage();
  const kn = language === 'kn';
  const activityFont = kn ? Fonts.sans : 'InterBold';
  return (
    <GlassTarget.Provider value={target}>
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <BlurTargetView ref={target} pointerEvents="none" style={StyleSheet.absoluteFill}>
        <HomeBackground />
      </BlurTargetView>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content,
        { paddingTop: Platform.OS === 'web' && width >= 768 ? 72 : insets.top + 10,
          paddingBottom: 32 + insets.bottom }]}>
        <View style={styles.tools}>
          <Pressable accessibilityRole="button" accessibilityLabel={dark ? 'Switch to light mode' : 'Switch to dark mode'} onPress={() => setPreference(dark ? 'light' : 'dark')}
            style={[styles.settings, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
            <SymbolView name={{ ios: dark ? 'sun.max' : 'moon', android: dark ? 'light_mode' : 'dark_mode', web: dark ? 'light_mode' : 'dark_mode' }} size={24} tintColor={theme.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('settings')} onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.settings, { backgroundColor: theme.glass, borderColor: theme.glassBorder, opacity: pressed ? 0.6 : 1 }]}>
            <SymbolView name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} size={24} tintColor={theme.text} />
          </Pressable>
        </View>
        <View style={[styles.wordmarkShell, { shadowColor: '#000000' }]}>
          <Text accessibilityRole="header" style={[styles.wordmark,
            { color: theme.heading, fontFamily: kn ? Fonts.sans : 'InterExtraBold',
              fontWeight: '900',
              fontSize: wide ? 108 : 66, lineHeight: wide ? 116 : 76,
              letterSpacing: kn ? 0 : wide ? -7.5 : -4.2 }]}>{t('appName')}</Text>
        </View>
        <View style={[styles.sectionHeading, wide && { marginTop: 22 }]}>
          <Text style={[styles.sectionLabel, { fontFamily: activityFont, color: theme.text }]}>{kn ? 'ಚಟುವಟಿಕೆಗಳು' : 'Activities'}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/activities')} style={styles.allActivities}>
            <Text style={[styles.footerLink, { color: theme.text }]}>{kn ? 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ' : 'View all'}</Text>
          </Pressable>
        </View>
        <View style={[styles.panel, wide && { flexDirection: 'row' }]}>
          <HomeActivity title={t('exercise')} wide={wide} onPress={() => router.push('/exercise')}
            icon={<SymbolView name={{ ios: 'figure.walk', android: 'fitness_center', web: 'fitness_center' }} size={28} tintColor={theme.accentStrong} />} />
          <HomeActivity title={t('yoga')} wide={wide} onPress={() => router.push('/yoga')}
            icon={<SymbolView name={{ ios: 'figure.mind.and.body', android: 'self_improvement', web: 'self_improvement' }} size={28} tintColor={theme.accentStrong} />} />
          <HomeActivity title={t('meditation')} wide={wide} onPress={() => router.push('/meditation')}
            icon={<SymbolView name={{ ios: 'sparkles', android: 'spa', web: 'spa' }} size={28} tintColor={theme.accentStrong} />} />
        </View>
      </ScrollView>
    </View>
    </GlassTarget.Provider>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 20 },
  tools: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  wordmarkShell: { marginTop: -2, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18 },
  wordmark: { textAlign: 'center', textShadowColor: 'rgba(255,255,255,0.52)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
  settings: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#FFFFFFAA',
    backgroundColor: '#FFFFFF80', justifyContent: 'center', alignItems: 'center' },
  sectionHeading: { marginTop: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  sectionLabel: { color: '#38312B', fontFamily: 'InterBody', fontSize: 20, lineHeight: 28 },
  allActivities: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 },
  footerLink: { fontFamily: Fonts.sans, color: '#4D443B', fontSize: 16, lineHeight: 24, fontWeight: '600' },
  panel: { gap: 20 },
});
