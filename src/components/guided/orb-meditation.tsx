import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { cancelAnimation, Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BreathCycleEngine, type BreathPhaseId } from '@/activities/breath-cycle';
import { createExpoAudioDriver, meditationBreathPhaseVoiceClip, MeditationVoiceClipController, MEDITATION_VOICE_CLIPS } from '@/activities/meditation-audio';
import { orbRhythm, type OrbSession } from '@/activities/orb-rhythm';
import { FluidOrb } from './fluid-orb';
import { buildSessionMetrics } from '@/exercise/metrics';
import { createSessionId, createSessionRecord } from '@/exercise/session-store';
import { sessionStore } from '@/exercise/session-storage';

// Keep the fluid moving through its warmest frames during the full hold.
const textureRange: Record<BreathPhaseId, readonly [number, number]> = {
  inhale: [0, 0.25],
  'hold-after-inhale': [0.25, 0.75],
  exhale: [0.75, 1],
  'hold-after-exhale': [1, 1],
};

export function OrbMeditation({ session }: { session: OrbSession }) {
  const { minutes } = session;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width * 0.78, height * 0.48, 380);
  const [prompt, setPrompt] = useState('Breathe in');
  const [clock] = useState(() => new BreathCycleEngine(orbRhythm(session)));
  const finished = useRef(false);
  const cycle = useSharedValue(0);
  const fullness = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    if (finished.current) return;
    const voice = new MeditationVoiceClipController(createExpoAudioDriver());
    let current = true;
    let lastPhase = '';
    clock.start();
    clock.resume();

    function tick() {
      const snap = clock.snapshot();
      if (finished.current || snap.phase !== 'running' || !snap.phaseId) return;
      if (snap.elapsedMs >= minutes * 60000) {
        finished.current = true;
        clock.complete();
        cancelAnimation(cycle);
        cycle.value = 0;
        fullness.value = 0;
        setPrompt('Session complete');
        void voice.playClip(MEDITATION_VOICE_CLIPS.complete);
        const metrics = buildSessionMetrics({ reps: 0, durationSeconds: minutes * 60, repRanges: [], rangeMinDeg: null, rangeMaxDeg: null });
        void sessionStore.saveSession(createSessionRecord({
          id: createSessionId(), activityKind: 'meditation', exerciseId: `breathing-${minutes}`,
          exerciseName: `${minutes}-minute breathing`, completedAt: new Date().toISOString(),
          stepsCompleted: 1, metrics,
        })).catch(() => { if (current) setPrompt('Session complete · Couldn’t save'); });
        return;
      }

      if (snap.phaseId === lastPhase) return;
      lastPhase = snap.phaseId;
      setPrompt(snap.label);
      const clip = meditationBreathPhaseVoiceClip(snap.phaseId);
      if (clip !== undefined) void voice.playClip(clip);
      const duration = snap.phaseDurationMs - snap.phaseElapsedMs;
      const [start, end] = textureRange[snap.phaseId];
      cycle.value = start + (end - start) * snap.phaseProgress;
      cycle.value = withTiming(end, { duration, easing: Easing.linear });

      const expanding = snap.phaseId === 'inhale';
      if (expanding || snap.phaseId === 'exhale') {
        const remaining = 1 - snap.phaseProgress;
        fullness.value = expanding ? 1 - remaining * remaining : remaining;
        fullness.value = withTiming(expanding ? 1 : 0, {
          duration,
          easing: expanding ? Easing.out(Easing.quad) : Easing.linear,
        });
      } else {
        fullness.value = snap.phaseId === 'hold-after-inhale' ? 1 : 0;
      }
    }

    function freeze() {
      clock.pause();
      voice.setMuted(true);
      lastPhase = '';
      cancelAnimation(cycle);
      cancelAnimation(fullness);
    }

    const syncActivity = () => {
      if (AppState.currentState === 'background' || AppState.currentState === 'inactive' ||
          (typeof document !== 'undefined' && document.hidden)) {
        freeze();
      } else {
        voice.setMuted(false);
        clock.resume();
        tick();
      }
    };
    syncActivity();
    const interval = setInterval(tick, 80);
    const subscription = AppState.addEventListener('change', syncActivity);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', syncActivity);
    return () => {
      current = false;
      clearInterval(interval);
      subscription.remove();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', syncActivity);
      freeze();
      voice.dispose();
    };
  }, [clock, minutes, cycle, fullness]));

  return (
    <View style={styles.canvas}>
      <Image
        accessible={false}
        pointerEvents="none"
        source={require('../../../assets/design/Pastel Mist Gradient Glow.png')}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.center, { width: size, height: size }]}>
        <FluidOrb size={size} cycle={cycle} fullness={fullness} />
        <Text accessibilityLiveRegion="polite" style={[styles.prompt, { top: size + 8, width }]}>{prompt}</Text>
      </View>
      <Pressable accessibilityLabel="Back to meditation sessions" accessibilityRole="button"
        onPress={() => router.canGoBack() ? router.back() : router.replace('/meditation')}
        style={({ pressed }) => [styles.back, { top: insets.top + 14, left: insets.left + 18, opacity: pressed ? 0.6 : 1 }]}>
        <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={21} tintColor="#403938" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: '#f6f4f9', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  prompt: { position: 'absolute', textAlign: 'center', paddingHorizontal: 18, fontFamily: 'InterSemiBold', fontSize: 32, letterSpacing: -0.8, color: '#342d2c' },
  back: { position: 'absolute', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3efed' },
});
