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
