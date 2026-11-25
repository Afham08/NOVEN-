import { check, suite } from './harness';
import { RecordedExerciseVoice, type ExerciseClip, type ExerciseClipSink } from '../src/exercise/recorded-voice';
import type { FeedbackKind } from '../src/exercise/feedback';

export function run() {
  suite('Random praise for the first four completed reps in each set', () => {
    const clips: ExerciseClip[] = [];
    const sink: ExerciseClipSink = { play: clip => clips.push(clip), stop() {}, cancelMovement() {} };
    const voice = new RecordedExerciseVoice(sink, 'wall-push-ups', 0, () => 0.25);
    const frame = (reps: number, completed = true) => voice.onFrame({ feedback: { kind: 'good', text: '', tone: 'accent' }, reps, repCompletedThisFrame: completed });
    for (let set = 0; set < 3; set++) {
      const start = clips.length;
      for (let rep = 1; rep <= 10; rep++) {
        frame(set * 10 + rep - 1, false);
        frame(set * 10 + rep);
        frame(set * 10 + rep);
        check(`set ${set + 1}, rep ${rep}: praise only once in first four`, clips.length - start === Math.min(rep, 4));
      }
      check(`set ${set + 1}: all four phrases without repeats`, new Set(clips.slice(start)).size === 4);
      if (set) check('no repeated phrase across set boundary', clips[start] !== clips[start - 1]);
    }
    voice.reset(); clips.length = 0;
    voice.setMuted(true); frame(1); voice.setMuted(false); frame(1);
    check('muted praise is not replayed on unmute', clips.length === 0);
    frame(2); check('remaining early reps still receive praise', clips.length === 1);
    voice.announcePause(); const paused = clips.length; frame(3);
    check('paused completion cannot earn praise', clips.length === paused);
    voice.announceResume(); frame(3); frame(4);
    voice.reset(); clips.length = 0; frame(1);
    check('restart resets praise schedule', clips.length === 1);
  });
  suite('Recorded exercise guidance', () => {
    const clips: ExerciseClip[] = [];
    let stops = 0;
    const sink: ExerciseClipSink = { play: clip => clips.push(clip), stop: () => { stops++; }, cancelMovement: () => {} };
    const voice = new RecordedExerciseVoice(sink, 'seated-arm-raise', 3);
    const frame = (kind: FeedbackKind, reps = 0, completed = false, held = 0) => voice.onFrame({ feedback: { kind, text: '', tone: 'accent' }, reps, repCompletedThisFrame: completed }, held);
    frame('extend'); frame('extend'); frame('hold', 0, false, 0);
    frame('hold', 0, false, 2); frame('hold', 0, false, 3); frame('hold', 0, false, 4);
    check('phase cues once, release after required hold', clips.join(',') === 'up,hold,release');
    frame('return');
    check('return does not repeat an already spoken release cue', clips.join(',') === 'up,hold,release,down');
    frame('good', 1, true); frame('extend', 1);
    frame('good', 3, true); const before = clips.length;
    frame('extend', 3); frame('hold', 3); frame('return', 3);
    check('movement guidance stops after three completed reps', clips.length === before);
    frame('hold', 3, false, 3); frame('hold', 3, false, 4);
    check('timed hold still releases after the early coaching reps', clips[clips.length - 1] === 'release' && clips.length === before + 1);
    frame('return', 3);
    frame('good', 5, true); frame('good', 5, true); frame('good', 6, true); frame('good', 10, true);
    const nextSet = clips.length;
    voice.announcePause(); voice.announceResume(); frame('extend', 10); frame('hold', 10, false, 3);
    check('later sets release holds without restarting up/down coaching', clips.slice(nextSet).join(',') === 'rest,begin,release');
    check('praise only early completions without duplicates', clips.filter(c => ['good', 'perfect', 'correct', 'thatsTheWay'].includes(c)).length === 2);
    frame('positioning', 10); frame('stabilizing', 10); frame('position', 10); frame('position', 10);
    check('setup family stays quiet but loss of view interrupts', clips.slice(-2).join(',') === 'position,view');
    voice.announcePause(); const pausedCount = clips.length;
    frame('extend', 10); check('paused frames are silent', clips.length === pausedCount);
    voice.announceResume(); voice.setMuted(true); frame('good', 15, true);
    const mutedCount = clips.length; voice.setMuted(false); frame('good', 15, true);
    check('unmuting does not replay old rep praise', clips.length === mutedCount);
    voice.setActive(false); frame('position', 15); check('background or unfocused screen is silent', clips.length === mutedCount);
    voice.setActive(true); voice.reset(); frame('extend');
    check('new session restores early guidance', clips[clips.length - 1] === 'up');
    voice.announceCompletion(); const doneCount = clips.length; frame('extend');
    voice.dispose(); frame('position');
    check('completion and disposal suppress later frames', clips.length === doneCount && stops > 0);

    clips.length = 0;
    const squat = new RecordedExerciseVoice(sink, 'supported-squat', 0);
    squat.onFrame({ feedback: { kind: 'extend', text: '', tone: 'accent' }, reps: 0, repCompletedThisFrame: false });
    squat.onFrame({ feedback: { kind: 'hold', text: '', tone: 'accent' }, reps: 0, repCompletedThisFrame: false });
    check('squat starts downward and releases upward without hold', clips.join(',') === 'down,up');
    for (const id of ['wall-push-ups', 'heel-to-toe-walking']) {
      clips.length = 0;
      new RecordedExerciseVoice(sink, id, 3).onFrame({ feedback: { kind: 'extend', text: '', tone: 'accent' }, reps: 0, repCompletedThisFrame: false });
      check(`${id} gets no misleading up/down cue`, clips.length === 0);
    }
  });
}
