import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { ExerciseClip, ExerciseClipSink } from './recorded-voice';

const clips: Record<ExerciseClip, number> = {
  getReady: require('../../assets/voices/get ready.mp3'),
  begin: require('../../assets/voices/Let’s begin..mp3'),
  position: require('../../assets/voices/Move into position.mp3'),
  view: require('../../assets/voices/Step into view..mp3'),
  still: require('../../assets/voices/Hold still for a moment.mp3'),
  ready: require('../../assets/voices/“That’s it. You’re ready.mp3'),
  up: require('../../assets/voices/up.mp3'),
  down: require('../../assets/voices/down.mp3'),
  release: require('../../assets/voices/Release.mp3'),
  hold: require('../../assets/voices/hold main.mp3'),
  good: require('../../assets/voices/good.mp3'),
  perfect: require('../../assets/voices/perfect.mp3'),
  thatsTheWay: require('../../assets/voices/thats the way.mp3'),
  correct: require('../../assets/voices/correct.mp3'),
  rest: require('../../assets/voices/Take a short rest..mp3'),
  time: require('../../assets/voices/Take your time.mp3'),
  complete: require('../../assets/voices/Well done. You’re finished.mp3'),
};

/** One player at a time. Busy clips are skipped, never queued behind stale instructions. */
export function createExerciseClipSink(): ExerciseClipSink {
  let player: AudioPlayer | null = null;
  let current: ExerciseClip | null = null;
  let subscription: { remove(): void } | null = null;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    const old = player;
    player = null; current = null;
    subscription?.remove(); subscription = null;
    clearTimeout(timeout);
    try { old?.pause(); old?.remove(); } catch { /* Audio failure must not stop tracking. */ }
  };
  void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
  return {
    stop,
    cancelMovement() { if (current === 'up' || current === 'down' || current === 'hold' || current === 'release') stop(); },
    play(clip, interrupt = false) {
      if (player && !interrupt) return;
      stop();
      try {
        const next = createAudioPlayer(clips[clip]);
        player = next; current = clip;
        next.loop = false;
        next.volume = 1;
        subscription = next.addListener('playbackStatusUpdate', status => {
          if (player === next && status.didJustFinish) stop();
        });
        // Release even if loading fails or autoplay is blocked on the web.
        timeout = setTimeout(() => { if (player === next) stop(); }, 6000);
        next.play();
      } catch { stop(); }
    },
  };
}
