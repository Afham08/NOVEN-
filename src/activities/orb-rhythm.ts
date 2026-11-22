import { defineGuidedActivity } from './types';
import type { BreathingTechnique } from './breath-cycle';

export const orbSessions = [
  { minutes: 1, fullHold: 5, emptyHold: 3 },
  { minutes: 3, fullHold: 7, emptyHold: 4 },
  { minutes: 5, fullHold: 9, emptyHold: 4 },
] as const;

export type OrbSession = (typeof orbSessions)[number];

export function orbRhythm(session: OrbSession): BreathingTechnique {
  return {
    id: 'orb-breathing', name: 'Guided breathing',
    phases: [
      { id: 'inhale', label: 'Breathe in', seconds: 4 },
      { id: 'hold-after-inhale', label: 'Hold', seconds: session.fullHold },
      { id: 'exhale', label: 'Breathe out', seconds: 3 },
      { id: 'hold-after-exhale', label: 'Hold', seconds: session.emptyHold },
    ],
  };
}

export const orbActivities = orbSessions.map(({ minutes }) => defineGuidedActivity({
  id: `breathing-${minutes}`,
  kind: 'meditation',
  name: `${minutes}-minute breathing`,
  summary: 'Follow the breathing orb at your own pace.',
  progressNoun: 'steps',
  steps: [{ seconds: minutes * 60, title: 'Guided breathing', guidance: 'Follow the breathing orb.' }],
  safetyNote: 'You can breathe normally during either hold.',
}));
