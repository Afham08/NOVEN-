import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { averageScore, scoreSets } from '@/exercise/movement-score';

export function MovementScoreCard({ scores, summary = false, walking = false, setNumber }: {
  scores: readonly (number | null)[]; summary?: boolean; walking?: boolean; setNumber?: number;
}) {
  const theme = useTheme();
  const value = summary ? averageScore(scores) : scores.length ? scores[scores.length - 1] : null;
  const unit = walking ? 'Step' : 'Rep';
  const sets = scoreSets(scores);
  const current = setNumber ? sets.find(set => set.set === setNumber) : sets[sets.length - 1];
  const start = ((setNumber ?? current?.set ?? 1) - 1) * 10;
  return <Card variant="surface" gap={12}>
    <Text style={[Type.label, { color: theme.textSecondary }]}>{summary ? 'Average movement score' : 'Movement score'}</Text>
    <View accessibilityLiveRegion="polite" accessibilityLabel={value === null ? scores.length ? `${unit} ${scores.length}: could not score` : 'Complete a movement to see your score' : `${summary ? 'Average' : `${unit} ${scores.length}`}: ${value} out of 100`}>
      <Text style={[styles.score, { color: theme.accentStrong }]}>{value ?? '—'}<Text style={[Type.body, { color: theme.textSecondary }]}> / 100</Text></Text>
      <Text style={[Type.small, { color: theme.textSecondary }]}>{summary
        ? `${scores.filter(n => n !== null).length} of ${scores.length} ${walking ? 'steps' : 'reps'} scored`
        : scores.length ? value === null ? `${unit} ${scores.length} · Couldn’t score this movement` : `${unit} ${scores.length} completed` : 'Your score appears after each movement'}</Text>
    </View>
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.fill, { width: `${value ?? 0}%`, backgroundColor: theme.accentSecondary }]} />
    </View>
    {!summary && <View style={styles.reps}>{Array.from({ length: 10 }, (_, i) => {
      const done = start + i < scores.length;
      const score = scores[start + i];
      return <View key={i} accessible accessibilityLabel={`${unit} ${start + i + 1}: ${done ? score === null ? 'not scored' : `${score} out of 100` : 'not completed'}`}
        style={[styles.rep, { backgroundColor: done ? theme.sageSoft : theme.backgroundSelected }]}>
        <Text style={[Type.caption, { color: theme.textSecondary }]}>{i + 1}</Text>
        <Text style={[Type.label, { color: theme.heading }]}>{done ? score ?? '—' : '·'}</Text>
      </View>;
    })}</View>}
    {(summary ? sets : current ? [current] : []).map(set => <View key={set.set} style={styles.set}>
      <Text style={[Type.small, { color: theme.textSecondary }]}>Set {set.set}{set.count < 10 ? summary ? ' · partial' : ' · in progress' : ' average'}</Text>
      <Text style={[Type.label, { color: theme.heading }]}>{set.average === null ? 'Not scored' : `${set.average} / 100`}</Text>
      {set.measured !== set.count && <Text style={[Type.caption, { color: theme.textSecondary }]}>{set.measured} of {set.count} scored</Text>}
    </View>)}
    {summary && <Text style={[Type.caption, { color: theme.textSecondary }]}>{walking
      ? 'Based on heel-to-toe placement seen by the camera.'
      : 'Based on movement range, control, and return to the starting position. Holds are required where the exercise calls for them.'} Unclear movements are left unscored. This is a camera estimate, not a medical assessment.</Text>}
  </Card>;
}

const styles = StyleSheet.create({
  score: { ...Type.headingLarge, fontSize: 48, lineHeight: 60, fontVariant: ['tabular-nums'] },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
  reps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rep: { flexGrow: 1, flexBasis: '16%', minWidth: 30, alignItems: 'center', paddingVertical: 6, borderRadius: 10 },
  set: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
});
