/**
 * ============================================================================
 * Ambient sound for the meditation session.
 * ============================================================================
 *
 * WHAT THIS IS, AND WHAT IT IS NOT
 * A meditation is five minutes of being quiet. Some people want something to
 * listen to while they do it, and some want silence; both are legitimate and
 * neither is the app's business to decide. So ambient sound here is OPTIONAL,
 * OFF BY ABSENCE, and never a condition of doing the session: no source, no
 * controller, no player, no permission prompt, and nothing on screen at all.
 *
 * WHAT IT IS DELIBERATELY NOT
 * It is not guided audio. It is not a soundtrack matched to the breathing
 * technique, it does not count anything, and it never advances or ends a step.
 * The breath is still paced by BreathCycleEngine and narrated by the existing
 * VoiceFeedbackController, and this sits beside both rather than replacing
 * either. A person who turns ambient sound off loses a background layer and
 * nothing else.
 *
 * WHY IT IS SPLIT IN TWO
 * Exactly like voice-feedback.ts, the module is a pure decision layer over a
 * tiny injected native boundary:
 *
 *     GuidedSession phase  ->  MeditationAudioController  ->  MeditationAudioDriver
 *                                     |                              |
 *                                     v                              v
 *                             MeditationAudioPhase              expo-audio
 *
 * Everything above the driver is React-free, clock-free and testable in Node,
 * with no Android and no real audio file. That is not tidiness for its own sake:
 * the hard part of this feature is not making a noise, it is the RACE between
 * an asynchronous load and a session that pauses, ends or unmounts underneath
 * it. Those races are only provable if they can be driven by hand, so they live
 * in code with no clock and no native runtime in it.
 *
 * THE TWO IDEAS THAT MAKE THE RACES SAFE
 *
 *  1. INTENT, NOT HISTORY. The controller keeps one `intent` field saying what
 *     the session currently wants ('playing' | 'paused' | 'stopped'). When an
 *     asynchronous load finally produces a player, the controller applies the
 *     intent that is current AT THAT MOMENT, not the one that was current when
 *     the load began. Pausing while the sound is still loading therefore does
 *     not need to "undo" anything: the player arrives, is told to be paused, and
 *     never makes a sound. There is no timer and no polling anywhere in here.
 *
 *     The volume is reconciled on exactly the same terms, and for the same
 *     reason. `load` reads the volume to hand to `driver.create`, so a volume
 *     changed while the load is in flight describes a player that has not been
 *     born yet; `setVolume` cannot reach it, because there is no handle. Applying
 *     the current volume when the player arrives is what keeps
 *     `snapshot().volume` true of the player rather than only of the controller.
 *     One rule, two pieces of state: nothing that happened before the player
 *     existed is allowed to survive into it.
 *
 *  2. A GENERATION COUNTER FOR DISPOSAL. Every operation that invalidates work
 *     in flight bumps `generation`. A load captures the number it started with
 *     and, on resolving, compares it: if it has moved on, the player it just
 *     created is released immediately and no state is touched. That single
 *     comparison is what stops a player created for a screen the user has
 *     already left from surviving on the device, and it is why `dispose()`
 *     cannot leak even when it is called mid-load.
 */

import type { GuidedActivity } from './types';

// In Node test runner, hook module resolution for static audio assets
if (typeof require !== 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Module = require('module') as {
      _resolveFilename?: (request: string, ...args: unknown[]) => string;
      __audioHooked?: boolean;
    };
    if (Module && Module._resolveFilename && !Module.__audioHooked) {
      Module.__audioHooked = true;
      const origResolve = Module._resolveFilename;
      Module._resolveFilename = function (request: string, ...args: unknown[]) {
        if (
          typeof request === 'string' &&
          (request.endsWith('.ogg') || request.endsWith('.mp3'))
        ) {
          return request;
        }
        return origResolve.call(this, request, ...args);
      };
      const reqWithExt = require as {
        extensions?: Record<string, (module: { exports: unknown }) => void>;
      };
      if (reqWithExt.extensions) {
        if (!reqWithExt.extensions['.ogg']) {
          reqWithExt.extensions['.ogg'] = (module) => {
            module.exports = 1;
          };
        }
        if (!reqWithExt.extensions['.mp3']) {
          reqWithExt.extensions['.mp3'] = (module) => {
            module.exports = 1;
          };
        }
      }
    }
  } catch {
    // Intentionally swallowed in React Native / Metro
  }
}

// Static audio requires for ElevenLabs meditation voice clips
const INHALE_VOICE = require('../../assets/Audiomusics/voice/inhale.mp3') as number;
const HOLD_VOICE = require('../../assets/Audiomusics/voice/hold.mp3') as number;
const EXHALE_VOICE = require('../../assets/Audiomusics/voice/exhale.mp3') as number;
const COMPLETE_VOICE = require('../../assets/Audiomusics/voice/complete.mp3') as number;
const SETTLE_CHAIR_VOICE = require('../../assets/Audiomusics/voice/settle-chair.mp3') as number;
const GENTLE_BREATH_VOICE = require('../../assets/Audiomusics/voice/gentle-breath.mp3') as number;
const QUIET_REST_VOICE = require('../../assets/Audiomusics/voice/quiet-rest.mp3') as number;
const PEACEFUL_MIND_START_VOICE = require('../../assets/Audiomusics/voice/peaceful-mind-start.mp3') as number;
const PEACEFUL_MIND_MID_VOICE = require('../../assets/Audiomusics/voice/peaceful-mind-mid.mp3') as number;
const OPEN_EYES_START_VOICE = require('../../assets/Audiomusics/voice/open-eyes-start.mp3') as number;
const OPEN_EYES_LISTEN_VOICE = require('../../assets/Audiomusics/voice/open-eyes-listen.mp3') as number;

/** Default prominent volume for meditation voice clips (0.92). */
export const DEFAULT_MEDITATION_VOICE_VOLUME = 0.92;

export const MEDITATION_VOICE_CLIPS = {
  inhale: INHALE_VOICE,
  hold: HOLD_VOICE,
  exhale: EXHALE_VOICE,
  complete: COMPLETE_VOICE,
  settleChair: SETTLE_CHAIR_VOICE,
  gentleBreath: GENTLE_BREATH_VOICE,
  quietRest: QUIET_REST_VOICE,
  peacefulMindStart: PEACEFUL_MIND_START_VOICE,
  peacefulMindMid: PEACEFUL_MIND_MID_VOICE,
  openEyesStart: OPEN_EYES_START_VOICE,
  openEyesListen: OPEN_EYES_LISTEN_VOICE,
} as const;

export const MEDITATION_CLIP_DURATIONS_MS: Record<number | string, number> = {
  [INHALE_VOICE]: 1100,
  [HOLD_VOICE]: 1100,
  [EXHALE_VOICE]: 1300,
  [COMPLETE_VOICE]: 9561,
  [SETTLE_CHAIR_VOICE]: 6000,
  [GENTLE_BREATH_VOICE]: 6600,
  [QUIET_REST_VOICE]: 4800,
  [PEACEFUL_MIND_START_VOICE]: 6400,
  [PEACEFUL_MIND_MID_VOICE]: 8000,
  [OPEN_EYES_START_VOICE]: 5900,
  [OPEN_EYES_LISTEN_VOICE]: 7400,
};

export const MEDITATION_VOICE_CLIP_DURATIONS_MS = {
  inhale: 1100,
  hold: 1100,
  exhale: 1300,
  complete: 9561,
  settleChair: 6000,
  gentleBreath: 6600,
  quietRest: 4800,
  peacefulMindStart: 6400,
  peacefulMindMid: 8000,
  openEyesStart: 5900,
  openEyesListen: 7400,
} as const;

/**
 * How quiet the ambient bed is by default.
 *
 * A quarter of full volume. It exists to sit under the breathing voice, and the
 * breathing voice is the thing carrying the instruction, so anything louder
 * competes with it rather than supporting it.
 */
export const DEFAULT_AMBIENT_VOLUME = 0.25;

/**
 * The states the audio layer can be in.
 *
 * Deliberately NOT a copy of the guided session's phases, and smaller than it:
 * the session has `ready`/`running`/`paused`/`finished` and this has seven
 * values that mean something different. The two are related but not the same
 * question, because this layer also has states the session knows nothing about
 * - a load that has not come back yet, and a device with no working audio at
 * all - and it has no state for "the session is 40% through", which is not
 * audio's business.
 */
export type MeditationAudioPhase =
  /** No source, or ambient sound switched off. Nothing is loaded. */
  | 'disabled'
  /** A source is configured and the player is being created. */
  | 'loading'
  /** The player exists and is not playing. */
  | 'ready'
  /** Playing. */
  | 'playing'
  /** Was playing, has been paused. */
  | 'paused'
  /** The session is over (or audio was switched off): stopped, player still held. */
  | 'stopped'
  /** The driver could not provide audio at all. Meditation continues in silence. */
  | 'error';

/**
 * What the session currently wants the audio to be doing.
 *
 * Separate from `phase` because they answer different questions: `phase` is
 * what has happened, `intent` is what has been asked for. They disagree exactly
 * during a load, which is the window every race in this file lives in.
 */
export type MeditationAudioIntent = 'stopped' | 'paused' | 'playing';

/**
 * A local asset from `require()`, or a URL / file path.
 *
 * The same shapes expo-audio's `AudioSource` accepts, narrowed to the two that
 * make sense for a bed that ships with the app. There is no `null` member: a
 * controller with no source is a `disabled` controller, and saying that with a
 * separate state is clearer than saying it with a magic value.
 */
export type MeditationAudioSource = number | string;

/**
 * One loaded player, behind four verbs.
 *
 * This is the entire native surface the controller is allowed to see, and it is
 * smaller than expo-audio's `AudioPlayer` on purpose. In particular there is no
 * `seekTo` and no `replace`: the only reason this layer ever needs to move the
 * playhead is to rewind on stop, and that belongs inside the adapter's `stop()`.
 * Keeping it here means the pure layer cannot accidentally start depending on
 * playback position, which is not a thing it should know about.
 */
export type MeditationAudioHandle = {
  play(): Promise<void> | void;
  pause(): Promise<void> | void;
  /** Stop and rewind to the beginning, so a restart starts from the top. */
  stop(): Promise<void> | void;
  setVolume(volume: number): void;
  /** Free the native player. The handle is unusable afterwards. */
  release(): Promise<void> | void;
};

/** The native boundary. Everything above this line is pure and testable. */
export type MeditationAudioDriver = {
  create(
    source: MeditationAudioSource,
    options: { volume: number; loop: boolean },
  ): Promise<MeditationAudioHandle>;
};

/** What the screen reads. A fresh object each time, so it cannot be aliased. */
export type MeditationAudioSnapshot = {
  readonly phase: MeditationAudioPhase;
  readonly intent: MeditationAudioIntent;
  /** Current volume, always 0..1. */
  readonly volume: number;
  /** Whether a source has ever been handed to this controller. */
  readonly hasSource: boolean;
};

type Listener = () => void;

/** Keeps a bad number from becoming a bad volume, without throwing. */
function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return DEFAULT_AMBIENT_VOLUME;
  if (volume < 0) return 0;
  if (volume > 1) return 1;
  return volume;
}

export class MeditationAudioController {
  /**
   * What the session has asked for. Written by every transition, read by
   * `reconcile` when a load resolves. Never derived from `phase`, because the
   * two are allowed to disagree while loading.
   */
  private intent: MeditationAudioIntent = 'stopped';
  private phase: MeditationAudioPhase = 'disabled';
  private handle: MeditationAudioHandle | null = null;
  private source: MeditationAudioSource | null = null;
  private volume: number;
  private configured = false;
  private disposed = false;

  /**
   * Bumped by anything that makes outstanding work irrelevant: a new load, an
   * unload, a dispose. A load compares the value it captured against the current
   * one and throws its player away if they differ.
   */
  private generation = 0;

  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly driver: MeditationAudioDriver,
    options?: { volume?: number },
  ) {
    this.volume = clampVolume(options?.volume ?? DEFAULT_AMBIENT_VOLUME);
  }

  snapshot(): MeditationAudioSnapshot {
    return {
      phase: this.phase,
      intent: this.intent,
      volume: this.volume,
      hasSource: this.configured,
    };
  }

  /**
   * Notifies on every state change so a screen can re-render, and nothing else.
   *
   * Not a React subscription and deliberately not aware of one: the controller
   * has no idea what is rendering it. A listener that throws is absorbed,
   * because one bad subscriber must not be able to stop the others being told,
   * and must certainly not leave the controller half-transitioned.
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Asks for the source to be loaded, without asking for it to play.
   *
   * Loading on mount rather than on the first Start is deliberate: by the time
   * the person taps Start the player already exists, so the session does not
   * begin in silence and then start making a noise half a second later. The
   * screen never awaits this - `play()` is recorded as the intent immediately
   * and applied when the load lands - so there is no unhandled rejection and no
   * need for the caller to catch anything.
   *
   * Idempotent for a source that is already loading or loaded, so a re-render,
   * a remount, or a double tap cannot produce a second player. Retrying after a
   * failure IS allowed, and is how a device that had no working audio gets
   * another chance when the screen is entered again.
   */
  async load(source: MeditationAudioSource): Promise<void> {
    if (this.disposed) return;

    const alreadySettled =
      this.source === source &&
      (this.phase === 'loading' ||
        this.phase === 'ready' ||
        this.phase === 'playing' ||
        this.phase === 'paused' ||
        // A loaded player that has merely been stopped is still the right player
        // for this source. Reloading it would build a second one for no reason,
        // which is how a "Start again" ends up with two beds fighting.
        this.phase === 'stopped');
    if (alreadySettled) return;

    // Anything already loaded belongs to the old source and has to go now, not
    // when its replacement arrives.
    this.generation++;
    this.discardHandle();
    this.source = source;
    this.configured = true;
    this.setPhase('loading');

    const ticket = this.generation;
    let handle: MeditationAudioHandle;
    try {
      handle = await this.driver.create(source, { volume: this.volume, loop: true });
    } catch {
      // No audio on this device, a file that would not load, a revoked
      // permission. None of it is the person's problem: the session carries on
      // in silence and nothing is shown about it.
      if (this.disposed || ticket !== this.generation) return;
      this.setPhase('error');
      return;
    }

    if (this.disposed || ticket !== this.generation) {
      // Unmounted, or a newer load has taken over. The player exists and nobody
      // wants it, so it is released here rather than left for the collector -
      // this is the branch that makes dispose-during-load leak-free.
      safeRelease(handle);
      return;
    }

    this.handle = handle;
    this.reconcile();
  }

  /** The session started. Plays now if loaded, or as soon as the load lands. */
  play(): void {
    if (this.disposed || !this.configured) return;
    if (this.intent === 'playing' && this.phase === 'playing') return;
    this.intent = 'playing';
    // Nothing loaded yet: the intent alone is the request. `reconcile` will
    // honour it, which is what makes Start-then-Pause-during-load safe.
    if (!this.handle || this.phase === 'playing') return;
    if (safePlay(this.handle)) this.setPhase('playing');
  }

  /**
   * The session was paused. Idempotent, and safe before the sound has loaded -
   * the player arrives already told to be paused, so it never speaks.
   */
  pause(): void {
    if (this.disposed || !this.configured) return;
    if (this.phase === 'paused') return;
    this.intent = 'paused';
    if (!this.handle) return;
    if (safePause(this.handle)) this.setPhase('paused');
  }

  /**
   * The session ended, or ambient sound was switched off.
   *
   * Stops without releasing, so "Start again" on a finished session can reuse
   * the same player. The adapter rewinds on stop, so the bed starts at the top
   * rather than resuming from wherever the last session left it.
   */
  stop(): void {
    if (this.disposed || !this.configured) return;
    if (this.phase === 'stopped') return;
    this.intent = 'stopped';
    if (!this.handle) return;
    safeStop(this.handle);
    this.setPhase('stopped');
  }

  /**
   * Frees the native player and forgets the source.
   *
   * Separate from `dispose()` because these are different events: this is
   * "this session is finished with sound", whereas dispose is "this screen is
   * gone". Only dispose makes the controller permanently inert.
   */
  unload(): void {
    if (this.disposed) return;
    this.generation++;
    this.discardHandle();
    this.source = null;
    this.configured = false;
    this.intent = 'stopped';
    this.setPhase('stopped');
  }

  /**
   * Volume in 0..1. Applied to a loaded player immediately, so changing it
   * mid-session does not need a reload and cannot restart the bed.
   *
   * Stays synchronous on purpose: it records the volume and does whatever it can
   * right now. If no player exists yet the value is still recorded, and the load
   * applies it to the player it produces - so a volume change made during a load
   * takes effect rather than being silently dropped, without `setVolume` ever
   * having to wait for a load it does not own.
   */
  setVolume(volume: number): void {
    if (this.disposed) return;
    this.volume = clampVolume(volume);
    if (this.handle) safeSetVolume(this.handle, this.volume);
  }

  /**
   * Unmount cleanup, and terminal. After this the controller ignores everything:
   * a load resolving late cannot play, cannot touch state, and cannot notify a
   * React tree that has already gone.
   */
  dispose(): void {
    if (this.disposed) return;
    // Bumping the generation is what stops an in-flight load from installing its
    // player after this point.
    this.generation++;
    this.disposed = true;
    this.intent = 'stopped';
    this.discardHandle();
    this.setPhase('stopped');
  }

  /**
   * Applies the CURRENT intent AND VOLUME to a player that has just become
   * available.
   *
   * This is the whole race story in one method: it is called exactly once per
   * successful load, and it does not care what the intent or the volume were when
   * the load started, only what they are now.
   *
   * WHY VOLUME IS RECONCILED HERE AND NOT ONLY AT `setVolume`
   * -------------------------------------------------------
   * `setVolume` can only reach a player that exists. During a load `handle` is
   * still null, so a volume change made in that window could only record itself
   * and hope. Meanwhile `load` had already read `this.volume` to hand to
   * `driver.create`, so the player being built was configured with the volume
   * from BEFORE the change. Reconciling volume here closes that window, and it is
   * the same mechanism intent already used rather than a second idea: the
   * controller's state is authoritative, and a player adopts it on arrival.
   *
   * Applied unconditionally rather than only when it differs, so the guarantee
   * holds even for a driver that ignored or clamped the volume it was created
   * with. `snapshot().volume` then describes the player rather than merely
   * describing the controller.
   */
  private reconcile(): void {
    const handle = this.handle;
    if (!handle) return;
    safeSetVolume(handle, this.volume);
    if (this.intent === 'playing') {
      if (safePlay(handle)) this.setPhase('playing');
      return;
    }
    if (this.intent === 'paused') {
      if (safePause(handle)) this.setPhase('paused');
      return;
    }
    /*
     * A player that was created a moment ago is not playing and is at the start,
     * so a "stopped" intent needs no native call at all. Telling it to stop would
     * be a wasted seek on a sound that has not begun, and would make the call log
     * claim work that did not need doing. The phase is still recorded, because the
     * intent genuinely is stopped and the next play() starts the bed for real.
     */
    this.setPhase('stopped');
  }

  /** Stops and releases whatever is loaded, leaving `handle` null. */
  private discardHandle(): void {
    const handle = this.handle;
    this.handle = null;
    if (!handle) return;
    safeStop(handle);
    safeRelease(handle);
  }

  /**
   * `disposed` is checked before notifying rather than after: the phase is still
   * recorded so the object is self-consistent, but a controller that has been
   * disposed must not call back into a screen that is no longer on the stack.
   */
  private setPhase(phase: MeditationAudioPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    if (this.disposed) return;
    for (const listener of [...this.listeners]) {
      try {
        listener();
      } catch {
        // One bad subscriber must not stop the others being told.
      }
    }
  }
}

/*
 * Every native call is wrapped for the same reason voice-feedback.ts wraps its
 * own: a released player THROWS on any further native call (this is documented
 * behaviour of expo's SharedObject, not a hypothetical), and a driver that throws
 * must never be able to take down a session that is otherwise fine. Each of
 * these reports whether the call happened, so the controller can leave the phase
 * alone rather than claiming a state the driver did not reach.
 */

function safePlay(handle: MeditationAudioHandle): boolean {
  try {
    const res = handle.play() as unknown;
    if (res && typeof (res as Promise<void>).catch === 'function') {
      (res as Promise<void>).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

function safePause(handle: MeditationAudioHandle): boolean {
  try {
    const res = handle.pause() as unknown;
    if (res && typeof (res as Promise<void>).catch === 'function') {
      (res as Promise<void>).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

function safeStop(handle: MeditationAudioHandle): void {
  try {
    const res = handle.stop() as unknown;
    if (res && typeof (res as Promise<void>).catch === 'function') {
      (res as Promise<void>).catch(() => {});
    }
  } catch {
    // Intentionally swallowed.
  }
}

function safeSetVolume(handle: MeditationAudioHandle, volume: number): void {
  try {
    handle.setVolume(volume);
  } catch {
    // Intentionally swallowed.
  }
}

function safeRelease(handle: MeditationAudioHandle): void {
  try {
    const res = handle.release() as unknown;
    if (res && typeof (res as Promise<void>).catch === 'function') {
      (res as Promise<void>).catch(() => {});
    }
  } catch {
    // Intentionally swallowed.
  }
}

/**
 * Maps a meditation step to its assigned ElevenLabs female voice clip.
 */
export function meditationStepVoiceClip(
  activityId: string,
  stepIndex: number,
  stepTitle?: string,
): MeditationAudioSource | undefined {
  if (activityId === 'seated-gentle-breathing') {
    if (stepIndex === 0) return MEDITATION_VOICE_CLIPS.settleChair;
    if (stepIndex === 1) return MEDITATION_VOICE_CLIPS.gentleBreath;
    if (stepIndex === 2) return MEDITATION_VOICE_CLIPS.quietRest;
  } else if (activityId === 'seated-peaceful-mind') {
    if (stepIndex === 0) return MEDITATION_VOICE_CLIPS.peacefulMindStart;
    if (stepIndex === 1) return MEDITATION_VOICE_CLIPS.gentleBreath;
    if (stepIndex === 2) return MEDITATION_VOICE_CLIPS.peacefulMindMid;
    if (stepIndex === 3) return MEDITATION_VOICE_CLIPS.quietRest;
  } else if (activityId === 'open-eyes-sound-awareness') {
    if (stepIndex === 0) return MEDITATION_VOICE_CLIPS.openEyesStart;
    if (stepIndex === 1) return MEDITATION_VOICE_CLIPS.openEyesListen;
    if (stepIndex === 2) return MEDITATION_VOICE_CLIPS.openEyesListen;
    if (stepIndex === 3) return MEDITATION_VOICE_CLIPS.quietRest;
  } else if (activityId === 'one-minute-calm') {
    if (stepIndex === 0) return MEDITATION_VOICE_CLIPS.settleChair;
    if (stepIndex === 1) return MEDITATION_VOICE_CLIPS.gentleBreath;
    if (stepIndex === 2) return MEDITATION_VOICE_CLIPS.quietRest;
  } else if (activityId === 'five-minute-breathing') {
    if (stepIndex === 0) return MEDITATION_VOICE_CLIPS.settleChair;
    if (stepIndex === 1) return MEDITATION_VOICE_CLIPS.settleChair;
    if (stepIndex === 2) return MEDITATION_VOICE_CLIPS.gentleBreath;
    if (stepIndex === 3) return MEDITATION_VOICE_CLIPS.openEyesListen;
    if (stepIndex === 4) return MEDITATION_VOICE_CLIPS.quietRest;
  }

  const title = (stepTitle ?? '').toLowerCase();
  if (title.includes('settle') || title.includes('sit')) return MEDITATION_VOICE_CLIPS.settleChair;
  if (title.includes('breath')) return MEDITATION_VOICE_CLIPS.gentleBreath;
  if (title.includes('rest') || title.includes('return')) return MEDITATION_VOICE_CLIPS.quietRest;
  if (title.includes('sound') || title.includes('listen') || title.includes('widen')) {
    return MEDITATION_VOICE_CLIPS.openEyesListen;
  }
  if (title.includes('gratitude') || title.includes('mind')) {
    return MEDITATION_VOICE_CLIPS.peacefulMindMid;
  }
  if (title.includes('gaze') || title.includes('eyes')) {
    return MEDITATION_VOICE_CLIPS.openEyesStart;
  }

  return undefined;
}

/**
 * Maps a breathing cycle phase ('inhale' | 'hold' | 'exhale') to its matching voice clip.
 */
export function meditationBreathPhaseVoiceClip(
  phaseId: string,
): MeditationAudioSource | undefined {
  if (phaseId === 'inhale') return MEDITATION_VOICE_CLIPS.inhale;
  if (phaseId === 'hold' || phaseId === 'hold-after-inhale' || phaseId === 'hold-after-exhale') {
    return MEDITATION_VOICE_CLIPS.hold;
  }
  if (phaseId === 'exhale') return MEDITATION_VOICE_CLIPS.exhale;
  return undefined;
}

/**
 * Dedicated non-looping voice clip player for meditation sessions.
 *
 * Plays each spoken guidance clip or breath cue once (loop: false).
 * Automatically interrupts preceding clips without overlapping or stuttering.
 * Provides `isPlayingIntro()` guard so breath cycle cues do not cut off introductory guidance.
 */
export class MeditationVoiceClipController {
  private handle: MeditationAudioHandle | null = null;
  private volume: number;
  private muted = false;
  private paused = false;
  private disposed = false;
  private introUntilMs = 0;
  private generation = 0;
  private readonly now: () => number;

  constructor(
    private readonly driver: MeditationAudioDriver,
    options?: { volume?: number; muted?: boolean; now?: () => number },
  ) {
    this.volume = clampVolume(options?.volume ?? DEFAULT_MEDITATION_VOICE_VOLUME);
    this.muted = options?.muted ?? false;
    this.now = options?.now ?? Date.now;
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(volume: number): void {
    if (this.disposed) return;
    this.volume = clampVolume(volume);
    if (this.handle) safeSetVolume(this.handle, this.volume);
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    if (this.disposed) return;
    this.muted = muted;
    if (muted) {
      this.introUntilMs = 0;
      this.discardHandle();
    }
  }

  isPlayingIntro(): boolean {
    return !this.disposed && !this.muted && this.now() < this.introUntilMs;
  }

  async playClip(
    source: MeditationAudioSource,
    isIntro = false,
    durationMs?: number,
  ): Promise<void> {
    if (this.disposed || this.muted) return;

    this.generation++;
    this.discardHandle();

    if (isIntro) {
      const duration = durationMs ?? MEDITATION_CLIP_DURATIONS_MS[source] ?? 6000;
      this.introUntilMs = this.now() + duration;
    } else {
      this.introUntilMs = 0;
    }

    const ticket = this.generation;
    let handle: MeditationAudioHandle;
    try {
      handle = await this.driver.create(source, { volume: this.volume, loop: false });
    } catch {
      return;
    }

    if (this.disposed || ticket !== this.generation || this.muted) {
      safeRelease(handle);
      return;
    }

    this.handle = handle;
    if (!this.paused) {
      safePlay(handle);
    }
  }

  pause(): void {
    if (this.disposed) return;
    this.paused = true;
    if (this.handle) safePause(this.handle);
  }

  resume(): void {
    if (this.disposed) return;
    this.paused = false;
    if (this.handle && !this.muted) {
      safePlay(this.handle);
    }
  }

  stop(): void {
    if (this.disposed) return;
    this.introUntilMs = 0;
    this.discardHandle();
  }

  dispose(): void {
    if (this.disposed) return;
    this.generation++;
    this.disposed = true;
    this.introUntilMs = 0;
    this.discardHandle();
  }

  private discardHandle(): void {
    const handle = this.handle;
    this.handle = null;
    if (!handle) return;
    safePause(handle);
    safeStop(handle);
    safeRelease(handle);
  }
}

/**
 * The ambient sound an activity should use, or undefined.
 *
 * MEDITATION ONLY, and the rule lives here rather than at the call site so
 * there is exactly one place that can say "this kind of activity gets sound".
 * Yoga and Wellness return undefined whatever they carry on the activity, so
 * adding an ambientAudio field to one of them cannot start making noise.
 */
export function ambientAudioFor(
  activity: GuidedActivity,
): GuidedActivity['ambientAudio'] | undefined {
  return activity.kind === 'meditation' ? activity.ambientAudio : undefined;
}

/* ---------------------------------------------------------------- expo-audio -- */

/**
 * expo-audio is loaded lazily and defensively, for the same two reasons
 * expo-speech is: a missing native module should degrade to a silent session
 * rather than crash at import time, and the decision layer above must be
 * testable on a machine with no native runtime at all.
 */
type ExpoAudioPlayer = {
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void> | void;
  loop: boolean;
  volume: number;
  release(): void;
};

type ExpoAudioModule = {
  createAudioPlayer: (source: MeditationAudioSource, options?: unknown) => ExpoAudioPlayer;
  setAudioModeAsync?: (mode: Record<string, unknown>) => Promise<void>;
};

let audioModule: ExpoAudioModule | null | undefined;

function loadExpoAudio(): ExpoAudioModule | null {
  if (audioModule !== undefined) return audioModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audioModule = require('expo-audio') as ExpoAudioModule;
  } catch {
    audioModule = null;
  }
  return audioModule;
}

export function setExpoAudioForTest(module: ExpoAudioModule | null | undefined): void {
  audioModule = module;
}

declare const Platform: { OS?: string } | undefined;
declare const window: unknown;
declare const document: unknown;

let platformModule: { OS?: string } | null | undefined;

export function isWebPlatform(): boolean {
  if (typeof Platform !== 'undefined' && Platform?.OS === 'web') {
    return true;
  }
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return true;
  }
  if (platformModule === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      platformModule = (require('react-native') as { Platform?: { OS?: string } }).Platform ?? null;
    } catch {
      platformModule = null;
    }
  }
  return platformModule?.OS === 'web';
}

/**
 * The real driver.
 *
 * Every field it passes to expo-audio matches a policy decision already made in
 * app.json rather than a library default:
 *
 *  - `loop` is on because a meditation runs for minutes and the bed is not
 *    authored to be exactly that long. A bed that quietly ends at 2:10 would
 *    make the rest of the session feel broken.
 *  - `shouldPlayInBackground` is off and `allowsRecording` is off, matching the
 *    config plugin's foreground-only, no-microphone setup. The audio stops when
 *    the app is not in front, which is the same rule the session already
 *    follows.
 *  - `interruptionMode: 'mixWithOthers'` means NOVEN does not take exclusive
 *    audio focus, so it cannot silence somebody's own music by starting a
 *    meditation. This is also the library default; it is written out because
 *    taking another app's audio away is exactly the kind of default that should
 *    be a decision on the page rather than an assumption.
 *
 * `setAudioModeAsync` is fired and forgotten rather than awaited: it configures
 * a global session, it does not produce the sound, and awaiting it would let a
 * slow audio subsystem delay the first note of a session. A rejection is
 * absorbed, because an unhandled one surfaces as a red box over a meditation.
 */
export function createExpoAudioDriver(): MeditationAudioDriver {
  return {
    async create(source, { volume, loop }) {
      const audio = loadExpoAudio();
      if (!audio) throw new Error('expo-audio is not available');

      try {
        void audio
          .setAudioModeAsync?.({
            playsInSilentMode: true,
            shouldPlayInBackground: false,
            allowsRecording: false,
            allowsBackgroundRecording: false,
            interruptionMode: 'mixWithOthers',
          })
          .catch(() => {});
      } catch {
        // A synchronous throw from a session call must not stop the playback.
      }

      const player = audio.createAudioPlayer(source);

      try {
        player.loop = loop;
        player.volume = volume;
      } catch {
        // Released below rather than returned half-configured.
        try {
          const res = player.release() as unknown;
          if (res && typeof (res as Promise<void>).catch === 'function') {
            (res as Promise<void>).catch(() => {});
          }
        } catch {
          // Intentionally swallowed.
        }
        throw new Error('expo-audio player could not be configured');
      }

      return {
        play() {
          try {
            const res = player.play() as unknown;
            if (res && typeof (res as Promise<void>).catch === 'function') {
              (res as Promise<void>).catch(() => {});
            }
          } catch {
            // Intentionally swallowed.
          }
        },
        pause() {
          try {
            const res = player.pause() as unknown;
            if (res && typeof (res as Promise<void>).catch === 'function') {
              (res as Promise<void>).catch(() => {});
            }
          } catch {
            // Intentionally swallowed.
          }
        },
        stop() {
          /*
           * expo-audio has no stop(): pausing and seeking home is what stopping
           * IS for a looping bed, and the rewind is what lets "Start again"
           * begin at the top instead of resuming mid-loop.
           */
          try {
            const res = player.pause() as unknown;
            if (res && typeof (res as Promise<void>).catch === 'function') {
              (res as Promise<void>).catch(() => {});
            }
          } catch {
            // Intentionally swallowed.
          }
          try {
            const seeked = player.seekTo(0) as unknown;
            if (seeked && typeof (seeked as Promise<void>).catch === 'function') {
              (seeked as Promise<void>).catch(() => {});
            }
          } catch {
            // Intentionally swallowed.
          }
        },
        setVolume(next) {
          try {
            player.volume = next;
          } catch {
            // Intentionally swallowed.
          }
        },
        release() {
          try {
            // First safely pause and mute the player
            try {
              const res = player.pause() as unknown;
              if (res && typeof (res as Promise<void>).catch === 'function') {
                (res as Promise<void>).catch(() => {});
              }
            } catch {
              // Intentionally swallowed.
            }

            try {
              player.volume = 0;
            } catch {
              // Intentionally swallowed.
            }

            // On Expo Web, calling player.release() clears HTML5 <audio> src and calls load(),
            // which triggers an unhandled browser AbortError. Pausing and muting is sufficient.
            if (isWebPlatform()) {
              return;
            }

            // On native platforms, release the native player
            const res = player.release() as unknown;
            if (res && typeof (res as Promise<void>).catch === 'function') {
              (res as Promise<void>).catch(() => {});
            }
          } catch {
            // Intentionally swallowed.
          }
        },
      };
    },
  };
}

/**
 * Checks whether a browser window error event represents a benign media abort
 * (e.g. HTMLMediaElement MEDIA_ERR_ABORTED / DOMException AbortError from an
 * interrupted audio resource fetch when navigating away or unmounting).
 */
export function isMediaAbortError(event: unknown): boolean {
  if (!event || typeof event !== 'object') return false;
  const evt = event as {
    target?: unknown;
    message?: unknown;
    error?: unknown;
    name?: unknown;
  };

  // 1. Check if the event target is an HTMLAudioElement / HTMLMediaElement with error?.code === 1 (MEDIA_ERR_ABORTED)
  const target = evt.target as { error?: { code?: unknown } } | undefined;
  if (target && typeof target === 'object' && target.error && typeof target.error === 'object') {
    if (target.error.code === 1) {
      return true;
    }
  }

  // 2. Check if event itself indicates AbortError
  const name = typeof evt.name === 'string' ? evt.name : '';
  if (name === 'AbortError') {
    return true;
  }

  // 3. Check event.message indicates AbortError or "fetching process for the media resource was aborted"
  const message = typeof evt.message === 'string' ? evt.message : '';
  if (
    message.includes('fetching process for the media resource was aborted') ||
    message.includes('AbortError')
  ) {
    return true;
  }

  // 4. Check event.error?.name or event.error?.message
  if (evt.error && typeof evt.error === 'object') {
    const err = evt.error as { name?: unknown; message?: unknown };
    const errName = typeof err.name === 'string' ? err.name : '';
    const errMessage = typeof err.message === 'string' ? err.message : '';
    if (
      errName === 'AbortError' ||
      errMessage.includes('fetching process for the media resource was aborted') ||
      errMessage.includes('AbortError')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether an unhandled promise rejection represents a benign media abort.
 */
export function isMediaAbortRejection(eventOrReason: unknown): boolean {
  if (!eventOrReason) return false;
  const reason = (
    typeof eventOrReason === 'object' && 'reason' in (eventOrReason as Record<string, unknown>)
      ? (eventOrReason as { reason: unknown }).reason
      : eventOrReason
  ) as { name?: unknown; message?: unknown } | undefined;

  if (!reason) return false;

  const name = typeof reason === 'object' && reason !== null && typeof reason.name === 'string' ? reason.name : '';
  if (name === 'AbortError') {
    return true;
  }

  const msg =
    typeof reason === 'object' && reason !== null && typeof reason.message === 'string'
      ? reason.message
      : String(reason);

  return msg.includes('fetching process for the media resource was aborted');
}

/**
 * Convenience predicate that recognizes any benign browser media abort event
 * or unhandled rejection.
 */
export function isMediaAbortEvent(eventOrReason: unknown): boolean {
  return isMediaAbortError(eventOrReason) || isMediaAbortRejection(eventOrReason);
}

/**
 * Safely pauses, stops, and releases an audio player, controller, or handle,
 * guarding against DOMException AbortErrors and unhandled promise rejections on web.
 */
export function safeDisposeAudio(
  target:
    | { dispose: () => void }
    | { release: () => void; pause?: () => unknown; stop?: () => unknown }
    | null
    | undefined,
): void {
  if (!target) return;
  try {
    if ('dispose' in target && typeof target.dispose === 'function') {
      target.dispose();
      return;
    }
    if ('pause' in target && typeof target.pause === 'function') {
      try {
        const res = target.pause() as unknown;
        if (res && typeof (res as Promise<void>).catch === 'function') {
          (res as Promise<void>).catch(() => {});
        }
      } catch {
        // Intentionally swallowed
      }
    }
    if ('stop' in target && typeof target.stop === 'function') {
      try {
        const res = target.stop() as unknown;
        if (res && typeof (res as Promise<void>).catch === 'function') {
          (res as Promise<void>).catch(() => {});
        }
      } catch {
        // Intentionally swallowed
      }
    }
    if ('release' in target && typeof target.release === 'function') {
      const res = target.release() as unknown;
      if (res && typeof (res as Promise<void>).catch === 'function') {
        (res as Promise<void>).catch(() => {});
      }
    }
  } catch {
    // Intentionally swallowed
  }
}

