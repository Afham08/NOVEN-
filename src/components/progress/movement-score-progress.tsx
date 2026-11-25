import { Text, View } from 'react-native';
import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { averageScore } from '@/exercise/movement-score';
import type { SessionRecord } from '@/exercise/session-store';
import { Note, Panel } from './analytics-charts';

export function MovementScoreProgress({ records }: { records: SessionRecord[] }) {
  const theme = useTheme();
  const groups = new Map<string, { name: string; scores: (number | null)[] }>();
  for (const record of records) {
    if ((record.activityKind ?? 'exercise') !== 'exercise' || !record.movementScores) continue;
    const group = groups.get(record.exerciseId) ?? { name: record.exerciseName, scores: [] };
    group.scores.push(...record.movementScores.reps);
    groups.set(record.exerciseId, group);
  }
  return <Panel title="Movement scores">
    <Note>Average scores for each exercise in the selected period. Open a session below to see its set averages.</Note>
    {[...groups].map(([id, group]) => {
      const average = averageScore(group.scores);
      return <View key={id} style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
          <Text style={[Type.label, { color: theme.text, flexShrink: 1 }]}>{group.name}</Text>
          <Text style={[Type.subheading, { color: theme.accentStrong }]}>{average === null ? '—' : `${average} / 100`}</Text>
        </View>
        <View style={{ height: 5, borderRadius: 3, backgroundColor: theme.backgroundSelected }}>
          <View style={{ height: 5, borderRadius: 3, width: `${average ?? 0}%`, backgroundColor: theme.accentSecondary }} />
        </View>
        <Note>{group.scores.filter(n => n !== null).length} of {group.scores.length} movements scored</Note>
      </View>;
    })}
    {!groups.size && <Note>Complete and save an exercise to start tracking scores. Earlier sessions have no movement score.</Note>}
  </Panel>;
}
