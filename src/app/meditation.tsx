import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { describeLength } from '@/activities/activity-format';
import { guidedCatalog } from '@/activities/catalog';
import { ActivityCard } from '@/components/cards/activity-card';
import { Screen } from '@/components/layout/screen';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The meditation sessions, reached from the Activities tab.
 *
 * Offers gentle seated meditation practices for seniors, followed by additional
 * practices of varying lengths.
 */
export default function MeditationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const allSessions = guidedCatalog('meditation');

  const seniorIds = [
    'seated-gentle-breathing',
    'seated-peaceful-mind',
    'open-eyes-sound-awareness',
  ];
  const seniorSessions = allSessions.filter((s) => seniorIds.includes(s.id));
  const otherSessions = allSessions.filter((s) => !seniorIds.includes(s.id));

  return (
    <Screen contentStyle={styles.content}>
      <Card variant="tint" style={styles.introCard}>
        <Text style={[styles.introTitle, { color: theme.heading }]}>
          A moment of calm
        </Text>
        <Text style={[styles.introBody, { color: theme.text }]}>
          Choose a short guided session. Sit comfortably, listen, and breathe at your own pace. Camera guidance is optional.
        </Text>
      </Card>

      <SectionHeader accent title="Seated meditation" />
      {seniorSessions.map((session) => (
        <ActivityCard
          key={session.id}
          title={session.name}
          description={session.summary}
          rightLabel={describeLength(session.durationSeconds)}
          onPress={() => router.push(`/meditation/${session.id}`)}
        />
      ))}

      <SectionHeader accent title="More sessions" />
      {otherSessions.map((session) => (
        <ActivityCard
          key={session.id}
          title={session.name}
          description={session.summary}
          rightLabel={describeLength(session.durationSeconds)}
          onPress={() => router.push(`/meditation/${session.id}`)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  introCard: {
    gap: Spacing.two,
  },
  introTitle: {
    ...Type.bodyEmphasis,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
  },
  introBody: {
    ...Type.body,
    fontSize: 16,
    lineHeight: 24,
  },
});
