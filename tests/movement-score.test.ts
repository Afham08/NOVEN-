import { check, suite } from './harness';
import { averageScore, MovementScoreTrace, placementScore, scoreSets } from '../src/exercise/movement-score';
import { RepDetector } from '../src/exercise/rep-detector';
import { SEATED_KNEE_EXTENSION } from '../src/exercise/configs';
import { createSessionRecord, createSessionStore, parseSessionRecord } from '../src/exercise/session-store';
import { dashboard, localDay } from '../src/exercise/dashboard';

function score(angles: number[], interval = 100) {
  const trace = new MovementScoreTrace();
  trace.start(angles[0], 0);
  angles.slice(1).forEach((angle, i) => trace.add(angle, (i + 1) * interval));
  return trace.finish(angles[angles.length - 1], 160, 25);
}

export function run() {
  suite('Movement scores use observed movement, not rep count', () => {
    const smooth = score([100, 120, 140, 160, 160, 140, 120, 100]);
    const reversal = score([100, 140, 120, 150, 130, 160, 140, 155, 130, 100]);
    check('smooth complete cycle gets full credit', smooth === 100, smooth);
    check('extra reversals reduce control score', reversal !== null && reversal < smooth!, reversal);
    check('incomplete return reduces score', score([100, 120, 140, 160, 160, 150, 140])! < smooth!);
    check('sparse tracking does not become a low score', score([100, 120, 140, 160, 160, 140, 120, 100], 400) === null);
    check('too few observations are unscored', score([100, 160, 100]) === null);
    check('foot placement uses actual alignment', placementScore(0, 0) === 100 && placementScore(0.3, 0.2)! < 100);
    check('invalid placement is absent', placementScore(NaN, 0) === null);
    const detector = new RepDetector(SEATED_KNEE_EXTENSION.thresholds);
    let time = 1000;
    let measured: number | null | undefined;
    for (const angle of [100, 120, 140, 150, 165, 165, 165, 150, 140, 130, 120]) {
      const outcome = detector.process({ angle, timestampMs: time += 100 });
      if (outcome.repCompleted) measured = outcome.movementScore;
    }
    check('detector attaches a real score only on completion', typeof measured === 'number', measured);
    detector.reset();
    for (const angle of [100, 140, 165, 165]) detector.process({ angle, timestampMs: time += 100 });
    detector.freeze();
    check('lost tracking cannot complete or score partial cycle', !detector.process({ angle: 100, timestampMs: time += 100 }).repCompleted);
  });

  suite('Movement score averages preserve missing data and set boundaries', () => {
    check('missing scores are not zero', averageScore([80, null, 100]) === 90);
    check('all missing stays null', averageScore([null, null]) === null);
    const sets = scoreSets([...Array(10).fill(80), 100, null]);
    check('ten movements form a set; trailing partial set stays separate', sets.length === 2 && sets[0].count === 10 && sets[1].count === 2);
    check('averages use measured reps only', sets[0].average === 80 && sets[1].average === 100 && sets[1].measured === 1);
  });

  suite('Movement scores survive storage and reach progress without backfilling old sessions', async () => {
    const record = createSessionRecord({ id: 'scored', exerciseId: 'seated-knee-extension', exerciseName: 'Knee extension', completedAt: '2026-11-24T10:00:00Z',
      metrics: { reps: 3, durationSeconds: 30, paceRpm: 6, rangeMinDeg: 100, rangeMaxDeg: 160, consistencyPct: 80 },
      movementScores: { version: 1, reps: [70, null, 90] } });
    let data: string | null = null;
    const store = createSessionStore({ getItem: async () => data, setItem: async (_key, value) => { data = value; }, removeItem: async () => { data = null; } });
    await store.saveSession(record);
    const saved = await store.getSessions();
    check('every score and missing rep survives roundtrip', JSON.stringify(saved[0].movementScores?.reps) === '[70,null,90]');
    const older = { ...record, id: 'old', movementScores: undefined };
    check('old history is still valid and unscored', parseSessionRecord(older)?.movementScores === undefined);
    check('reject score outside 100', parseSessionRecord({ ...record, movementScores: { version: 1, reps: [101, null, 90] } }) === null);
    check('reject mismatched score count', parseSessionRecord({ ...record, movementScores: { version: 1, reps: [90] } }) === null);
    const stats = dashboard([...saved, older], 'Weekly', localDay(new Date(record.completedAt)));
    check('progress measures only scored reps', stats.buckets.reduce((n, b) => n + b.scoredReps, 0) === 2);
    check('progress preserves score total for weighted average', stats.buckets.reduce((n, b) => n + b.movementTotal, 0) === 160);
  });
}
