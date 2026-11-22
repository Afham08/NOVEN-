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
];

export default function LanguageSettingsScreen() {
  const theme = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <Screen>
      <Header title="Language" />
      <Text style={{ color: theme.textSecondary }}>{language === 'kn' ? 'ಮುಖಪುಟ ಮತ್ತು ವ್ಯಾಯಾಮ ಪಟ್ಟಿಗೆ ಕನ್ನಡ ಲಭ್ಯವಿದೆ. ಮಾರ್ಗದರ್ಶನ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿದೆ.' : 'Applies to Home and the exercise list. Session coaching is in English.'}</Text>

      <InfoRow label="Current language" value={LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? 'English'} emphasize stacked />

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
                  <Text style={{ color: theme.text }}>{language === 'kn' ? 'ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ' : 'Selected'}</Text>
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
