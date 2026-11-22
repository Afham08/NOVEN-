import { useLocalSearchParams } from 'expo-router';

import { orbSessions } from '@/activities/orb-rhythm';
import { guidedCatalog, findGuidedActivityInKind } from '@/activities/catalog';
import { GuidedActivityScreen } from '@/components/guided/guided-activity-screen';
import { OrbMeditation } from '@/components/guided/orb-meditation';
import { GuidedNotFound } from '@/components/guided/guided-not-found';

export function generateStaticParams() {
  return guidedCatalog('meditation').map(({ id }) => ({ id }));
}

export default function MeditationSessionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const session = orbSessions.find(({ minutes }) => id === `breathing-${minutes}`);
  if (session) return <OrbMeditation key={session.minutes} session={session} />;

  const activity = findGuidedActivityInKind('meditation', id);

  if (!activity) return <GuidedNotFound kind="meditation" />;
  return <GuidedActivityScreen activity={activity} />;
}
