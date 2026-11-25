import type { FeedbackKind } from './feedback';
import type { VoiceFrameInput } from './voice-feedback';

export type ExerciseClip = 'getReady' | 'begin' | 'position' | 'view' | 'still' | 'ready' | 'up' | 'down' | 'hold' | 'release' | 'good' | 'perfect' | 'correct' | 'thatsTheWay' | 'rest' | 'time' | 'complete';
export interface ExerciseClipSink {
  play(clip: ExerciseClip, interrupt?: boolean): void;
  stop(): void;
  cancelMovement(): void;
}
const praiseClips: ExerciseClip[] = ['good', 'perfect', 'thatsTheWay', 'correct'];
const movement = new Set<FeedbackKind>(['extend', 'hold', 'return']);
const setup = new Set<FeedbackKind>(['position', 'positioning', 'stabilizing']);
const vertical = new Set(['seated-knee-extension', 'seated-arm-raise', 'sit-to-stand', 'standing-heel-raises', 'toe-raises', 'standing-march', 'standing-hip-abduction', 'supported-squat']);

/** Exercise-only recordings. No queued phase cues, synthetic counts or guessed form corrections. */
export class RecordedExerciseVoice {
  private last: FeedbackKind | null = null;
  private reps = 0;
  private paused = false;
  private finished = false;
  private disposed = false;
  private muted = false;
  private active = true;
  private readyAnnounced = false;
  private releaseAnnounced = false;
  private praiseSet = -1;
  private praiseBag: ExerciseClip[] = [];
  private lastPraise: ExerciseClip | null = null;
  constructor(private sink: ExerciseClipSink, private exerciseId: string, private holdSeconds: number, private random = Math.random) {}

  private praise(set: number) {
    if (set !== this.praiseSet) {
      this.praiseSet = set;
      this.praiseBag = [...praiseClips];
      for (let i = this.praiseBag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.praiseBag[i], this.praiseBag[j]] = [this.praiseBag[j], this.praiseBag[i]];
      }
      if (this.praiseBag[0] === this.lastPraise) {
        [this.praiseBag[0], this.praiseBag[1]] = [this.praiseBag[1], this.praiseBag[0]];
      }
    }
    const clip = this.praiseBag.shift();
    if (clip) { this.lastPraise = clip; this.play(clip); }
  }

  onFrame(frame: VoiceFrameInput, heldSeconds = 0) {
    if (this.disposed || this.finished || this.paused || !this.active) return;
    const kind = frame.feedback.kind;
    const previous = this.last;
    this.last = kind;
    // The release cue already asked for this return; let it finish rather than restart it.
    const releasing = kind === 'return' && previous === 'hold' && this.releaseAnnounced;
    if (releasing && this.holdSeconds === 0) {
      this.releaseAnnounced = false;
      return;
    }
    if (kind !== previous && !releasing) this.sink.cancelMovement();
    if (kind !== 'hold') this.releaseAnnounced = false;
    if (frame.repCompletedThisFrame && frame.reps > this.reps) {
      this.reps = frame.reps;
      // Praise only confirmed completions, for the first four reps of each set.
      if ((this.reps - 1) % 10 < 4) this.praise(Math.floor((this.reps - 1) / 10));
      return;
    }
    this.reps = Math.max(this.reps, frame.reps);
    if (setup.has(kind)) {
      if (!setup.has(previous as FeedbackKind) || (kind === 'position' && previous !== 'position')) {
        this.play(kind === 'position' ? 'view' : kind === 'stabilizing' ? 'still' : 'position', true);
      }
      return;
    }
    if (kind === 'ready' && !this.readyAnnounced) {
      this.readyAnnounced = true;
      this.play('ready');
      return;
    }
    if (kind === 'short-hold' && previous !== kind) this.play('time');
    // Timed holds need a release cue throughout the session, including later sets.
    if (kind === 'hold' && this.holdSeconds > 0 && heldSeconds >= this.holdSeconds) {
      if (!this.releaseAnnounced) {
        this.releaseAnnounced = true;
        this.play('release', true);
      }
      return;
    }
    // Direction coaching is only for the first three reps of the first set.
    if (this.reps >= 3 || !vertical.has(this.exerciseId)) return;
    const outward: ExerciseClip = this.exerciseId === 'supported-squat' ? 'down' : 'up';
    const inward: ExerciseClip = outward === 'up' ? 'down' : 'up';
    if (kind === 'hold' && this.holdSeconds === 0) {
      if (!this.releaseAnnounced) {
        this.releaseAnnounced = true;
        this.sink.cancelMovement();
        this.play(inward);
      }
    } else if (kind !== previous && movement.has(kind)) {
      this.play(kind === 'extend' ? outward : kind === 'return' ? inward : 'hold');
    }
  }
  private play(clip: ExerciseClip, interrupt = false) {
    if (!this.muted && !this.disposed && this.active) this.sink.play(clip, interrupt);
  }
  announceSetup() { this.play('getReady'); }
  announceStart() { if (this.finished || this.disposed) return; this.paused = false; this.play('begin', true); }
  announcePause() { if (this.finished || this.disposed) return; this.paused = true; this.sink.stop(); this.play('rest', true); }
  announceResume() { if (this.finished || this.disposed) return; this.paused = false; this.last = null; this.play('begin', true); }
  announceCompletion() { if (this.finished || this.disposed) return; this.finished = true; this.sink.stop(); this.play('complete', true); }
  setMuted(muted: boolean) { this.muted = muted; if (muted) this.sink.stop(); }
  setActive(active: boolean) { this.active = active; if (!active) this.sink.stop(); }
  stop() { this.sink.stop(); }
  reset() {
    this.sink.stop(); this.last = null; this.reps = 0; this.paused = false;
    this.finished = false; this.readyAnnounced = false; this.releaseAnnounced = false;
    this.praiseSet = -1; this.praiseBag = []; this.lastPraise = null;
  }
  dispose() { this.disposed = true; this.sink.stop(); }
}
