import { useRouter } from 'expo-router';
import { Image, StyleSheet } from 'react-native';

import { meditationSessions } from '@/activities/meditation';
import { describeRoutineMeta } from '@/activities/activity-format';
import { orbSessions } from '@/activities/orb-rhythm';
import { ActivityCard } from '@/components/cards/activity-card';
import { Screen } from '@/components/layout/screen';
import { SectionHeader } from '@/components/ui/section-header';

export default function MeditationScreen() {
  const router = useRouter();

  return (
    <Screen>
      <SectionHeader title="Choose your session" subtitle="Follow your own pace. You can breathe normally during either hold." />
      {orbSessions.map(({ minutes, fullHold, emptyHold }) => (
        <ActivityCard
          key={minutes}
          title={minutes === 1 ? '1 minute' : `${minutes} minutes`}
          description={`Hold ${fullHold}s after breathing in · ${emptyHold}s after breathing out`}
          icon={<Image accessible={false} source={require('../../assets/meditation/ember.png')} style={styles.orb} />}
          onPress={() => router.push({ pathname: '/meditation/[id]', params: { id: `breathing-${minutes}` } })}
        />
      ))}
      <SectionHeader title="Guided sessions" />
      {meditationSessions.map((activity) => (
        <ActivityCard key={activity.id} title={activity.name} description={describeRoutineMeta(activity)}
          onPress={() => router.push(`/meditation/${activity.id}`)} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({ orb: { width: 52, height: 52 } });
