import { asanas } from '@/yoga/asanas';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { ActivityCard } from '@/components/cards/activity-card';
import { Screen } from '@/components/layout/screen';
import { Header } from '@/components/ui/header';
import { SectionHeader } from '@/components/ui/section-header';
import { useTheme } from '@/hooks/use-theme';
import { exercisesCatalog } from '@/data/exercises';

/**
 * The activities a person can do in NOVEN, on one screen.
 *
 * DESIGN INTENT
 * These used to be four separate bottom tabs, side by side with Home and
 * Settings. That made six items in a bar across the bottom of the screen, and it
 * would have kept growing: more exercises, more practices, more sections. The
 * bar is the worst possible place to add a feature in an app used by people who
 * want one obvious choice, not a menu.
 *
 * So the bar now holds four destinations that never move, and everything a
 * person can *do* lives here instead. Adding a new kind of activity later adds a
 * card to this page and leaves the bar alone.
 *
 * The cards are ordered the way a day goes: move, stretch, and settle.
 * Each one leads to the screen that already existed, so nothing about Exercise,
 * Yoga or Meditation changes here — the only honest thing to say about
 * a section is what it actually offers, which is now counted from the real
 * catalogues at the bottom of this page rather than promised in a subtitle.
 */
const ACTIVITIES = [
  {
    name: 'exercise',
    title: 'Exercise',
    description: 'Guided movement sessions with your camera',
    rightLabel: 'Open',
    tint: 'accent' as const,
    icon: {
      ios: 'figure.run',
      android: 'directions_run',
      web: 'directions_run',
    } as const,
  },
  {
    name: 'yoga',
    title: 'Yoga',
    description: 'Gentle seated routines, step by step',
    rightLabel: 'Open',
    tint: 'sage' as const,
    icon: {
      ios: 'figure.yoga',
      android: 'self_improvement',
      web: 'self_improvement',
    } as const,
  },
  {
    name: 'meditation',
    title: 'Meditation',
    description: 'Guided breathing for 1, 3 or 5 minutes',
    rightLabel: 'Open',
    tint: 'sage' as const,
    icon: {
      ios: 'brain.head.profile',
      android: 'spa',
      web: 'spa',
    } as const,
  },
] as const;

export default function ActivitiesScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
      {/*
        The "Choose what you would like to do today" subtitle and the "What you
        can do" section heading were both removed. The page title already says
        Activities, and three cards titled Exercise, Yoga and Meditation
        need no introduction before they are understandable. The card titles and
        descriptions are kept: those are the labels the user is choosing between,
        not commentary about them.
      */}
      <Header title="Activities" />

      {ACTIVITIES.map((activity) => (
        <ActivityCard
          key={activity.name}
          tint={activity.tint}
          icon={
            <SymbolView
              name={activity.icon}
              size={26}
              tintColor={activity.tint === 'accent' ? theme.accentStrong : theme.accentSecondary}
            />
          }
          title={activity.title}
          description={activity.description}
          rightLabel={activity.rightLabel}
          onPress={() => router.push(`/${activity.name}`)}
        />
      ))}

      {/*
        An honest count, read from the real catalogues rather than typed in, so it
        cannot drift away from what is actually available to start. The guided
        activities are listed by their own lengths too, because "how long is
        this" is the first question about a routine and the answer belongs next
        to it.
      */}
      <SectionHeader accent title="Ready to start" />
      <ActivityCard
        title="Exercises with your camera"
        description={
          exercisesCatalog.length === 1
            ? 'One guided movement session is ready now.'
            : `${exercisesCatalog.length} guided movement sessions are ready now.`
        }
        rightLabel="See all"
        onPress={() => router.push('/exercise')}
      />
      <ActivityCard
        title="Yoga routines"
        description={`${asanas.length} seated routines, timed for you.`}
        rightLabel="Open"
        onPress={() => router.push('/yoga')}
      />
      <ActivityCard
        title="Meditation sessions"
        description="Guided breathing for 1, 3 or 5 minutes"
        rightLabel="Open"
        onPress={() => router.push('/meditation')}
      />
    </Screen>
  );
}
