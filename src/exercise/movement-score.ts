/** Versioned camera-derived estimates, not a clinical or whole-body form assessment. */
export type MovementScores = { version: 1; reps: (number | null)[] };
export const SCORE_VERSION = 1;
const clamp = (v: number) => Math.max(0, Math.min(1, v));

export function averageScore(values: readonly (number | null)[]): number | null {
  const measured = values.filter((n): n is number => n !== null && Number.isFinite(n));
  return measured.length ? Math.round(measured.reduce((a, b) => a + b, 0) / measured.length) : null;
}

export function scoreSets(values: readonly (number | null)[]) {
  return Array.from({ length: Math.ceil(values.length / 10) }, (_, i) => {
    const reps = values.slice(i * 10, (i + 1) * 10);
    return { set: i + 1, average: averageScore(reps), count: reps.length, measured: reps.filter(n => n !== null).length };
  });
}

export function parseMovementScores(value: unknown, reps: number): MovementScores | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || !Array.isArray(raw.reps) || raw.reps.length !== reps || reps > 10000) return null;
  if (!raw.reps.every(n => n === null || (Number.isInteger(n) && n >= 0 && n <= 100))) return null;
  return { version: 1, reps: [...raw.reps] };
}

/** Bounded summary of an observed angle cycle; no camera frames are retained. */
export class MovementScoreTrace {
  private first = 0;
  private last = 0;
  private low = 0;
  private high = 0;
  private path = 0;
  private time = 0;
  private samples = 0;
  private reliable = true;
  start(angle: number, time: number) {
    this.first = this.last = this.low = this.high = angle;
    this.path = 0; this.time = time; this.samples = 1; this.reliable = true;
  }
  add(angle: number, time: number) {
    if (time <= this.time || time - this.time > 350) this.reliable = false;
    this.time = time; this.samples++;
    this.low = Math.min(this.low, angle); this.high = Math.max(this.high, angle);
    // A two-degree dead band avoids turning small landmark jitter into poor control.
    if (Math.abs(angle - this.last) >= 2) {
      this.path += Math.abs(angle - this.last); this.last = angle;
    }
  }
  finish(angle: number, targetAngle: number, minimumRange: number): number | null {
    if (!this.reliable || this.samples < 6) return null;
    const range = this.high - this.low;
    const target = Math.max(minimumRange, Math.abs(targetAngle - this.first));
    if (!(target > 0) || !Number.isFinite(range)) return null;
    const coverage = clamp(range / target);
    const idealPath = Math.max(0, 2 * range - Math.abs(angle - this.first));
    const control = this.path > 0 ? clamp(idealPath / this.path) : 0;
    const returned = clamp(1 - Math.abs(angle - this.first) / Math.max(range, minimumRange));
    return Math.round(100 * (0.4 * coverage + 0.4 * control + 0.2 * returned));
  }
}

/** Walking uses measured landing alignment in foot lengths, never joint-angle scoring. */
export function placementScore(gap: number, verticalGap: number): number | null {
  if (!Number.isFinite(gap) || !Number.isFinite(verticalGap)) return null;
  return Math.round(100 * (0.7 * clamp(1 - Math.abs(gap) / 0.5) + 0.3 * clamp(1 - Math.abs(verticalGap) / 0.4)));
}
