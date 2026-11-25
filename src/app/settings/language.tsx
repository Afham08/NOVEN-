import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { InfoRow } from '@/components/ui/info-row';
import { Spacing } from '@/constants/theme';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';

const LANGUAGE_OPTIONS = [
  { value: 'en' as const, label: 'English' },
  { value: 'kn' as const, label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'hi' as const, label: 'हिन्दी (Hindi)' },
  { value: 'ta' as const, label: 'தமிழ் (Tamil)' },
];

export default function LanguageSettingsScreen() {
  const theme = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <Screen>
      <Header title={t('language')} />
      <Text style={{ color: theme.textSecondary }}>{({
        en: 'Applies to Home and the exercise list. Session coaching is in English.',
        kn: 'ಮುಖಪುಟ ಮತ್ತು ವ್ಯಾಯಾಮ ಪಟ್ಟಿಗೆ ಕನ್ನಡ ಲಭ್ಯವಿದೆ. ಮಾರ್ಗದರ್ಶನ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿದೆ.',
        hi: 'होम और व्यायाम सूची में हिन्दी उपलब्ध है। सत्र मार्गदर्शन अंग्रेज़ी में है।',
        ta: 'முகப்பு மற்றும் உடற்பயிற்சிப் பட்டியல் தமிழில் கிடைக்கும். பயிற்சி வழிகாட்டுதல் ஆங்கிலத்தில் உள்ளது.',
      })[language]}</Text>

      <InfoRow label={t('currentLanguage')} value={LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? 'English'} emphasize stacked />

      <Card variant="surface" gap={Spacing.two}>
        {LANGUAGE_OPTIONS.map((option, index) => (
          <View key={option.value}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
            <Button
              variant="ghost"
              fullWidth
              title={option.label}
              onPress={() => setLanguage(option.value)}
              style={styles.row}
              right={
                language === option.value ? (
                  <Text style={{ color: theme.text }}>{t('selected')}</Text>
                ) : null
              }
            />
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'flex-start',
    gap: Spacing.three,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
});
