import type { SessionRecord } from './session-store';

export const periods = ['Weekly', 'Monthly', 'Yearly', 'All time'] as const;
export type Period = typeof periods[number];
const dayMs = 86400000;
export function localDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / dayMs;
}
export function dateLabel(day: number, year = false) {
  return new Date(day * dayMs).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric', ...(year && { year: 'numeric' }) });
}
export function quantity(value: number, unit: string) {
  return value + ' ' + unit + (Math.abs(value) === 1 ? '' : 's');
}
export function duration(seconds: number) {
  if (seconds < 60) return seconds + 's';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
  return Math.floor(seconds / 3600) + 'h ' + Math.floor(seconds % 3600 / 60) + 'm';
}
export type Bucket = { start: number; end: number; sessions: number; reps: number; seconds: number; scoreTotal: number; measured: number; movementTotal: number; scoredReps: number };
export function dashboard(records: SessionRecord[], period: Period, today: number) {
  const dated = records.map(record => ({ record, day: localDay(new Date(record.completedAt)) })).filter(row => row.day <= today);
  const earliest = dated.reduce((min, row) => Math.min(min, row.day), today);
  const days = period === 'Weekly' ? 7 : period === 'Monthly' ? 30 : period === 'Yearly' ? 365 : today - earliest + 1;
  const start = today - days + 1;
  const span = Math.ceil(days / (days <= 30 ? days : 12));
  const buckets: Bucket[] = Array.from({ length: Math.ceil(days / span) }, (_, i) => ({
    start: start + i * span, end: Math.min(today, start + (i + 1) * span - 1), sessions: 0, reps: 0, seconds: 0, scoreTotal: 0, measured: 0, movementTotal: 0, scoredReps: 0,
  }));
  const daily = new Map<number, number>();
  const kinds = new Map<string, number>();
  const exercises = new Map<string, { name: string; sessions: number; reps: number }>();
  const filtered: SessionRecord[] = [];
  let seconds = 0, exerciseSeconds = 0, reps = 0, recordReps = 0, thisWeek = 0, lastWeek = 0;
  for (const { record, day } of dated) {
    if (day >= today - 6) thisWeek++;
    else if (day >= today - 13) lastWeek++;
    if (day < start) continue;
    filtered.push(record);
    const kind = record.activityKind ?? 'exercise';
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    daily.set(day, (daily.get(day) ?? 0) + 1);
    const bucket = buckets[Math.floor((day - start) / span)];
    bucket.sessions++;
    bucket.seconds += record.durationSeconds;
    seconds += record.durationSeconds;
    if (kind !== 'exercise') continue;
    exerciseSeconds += record.durationSeconds;
    reps += record.reps;
    bucket.reps += record.reps;
    recordReps = Math.max(recordReps, record.reps);
    for (const score of record.movementScores?.reps ?? []) {
      if (score === null) continue;
      bucket.movementTotal += score;
      bucket.scoredReps++;
    }
    if (record.consistencyPct !== null) {
      bucket.scoreTotal += record.consistencyPct;
      bucket.measured++;
    }
    const exercise = exercises.get(record.exerciseId) ?? { name: record.exerciseName, sessions: 0, reps: 0 };
    exercise.sessions++;
    exercise.reps += record.reps;
    exercises.set(record.exerciseId, exercise);
  }
  const activeDays = new Set(dated.map(row => row.day));
  let streak = 0;
  for (let d = activeDays.has(today) ? today : today - 1; activeDays.has(d); d--) streak++;
  const weekdays = Array<number>(7).fill(0);
  for (const [day, count] of daily) weekdays[((day + 3) % 7 + 7) % 7] += count;
  return { filtered, buckets, daily, kinds, exercises: [...exercises.values()], weekdays, today, start, days,
    seconds, exerciseSeconds, reps, recordReps, thisWeek, lastWeek, streak, consistency: Math.round(daily.size / days * 100) };
}
export type DashboardData = ReturnType<typeof dashboard>;
