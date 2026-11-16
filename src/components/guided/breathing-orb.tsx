import { LinearGradient } from 'expo-linear-gradient';
import type { BreathPhaseId } from '@/activities/breath-cycle';
import { useTheme } from '@/hooks/use-theme';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type BreathingOrbProps = {
  phaseId: BreathPhaseId | null;
  phaseProgress: number;
  label: string;
  remainingSeconds: number;
  paused: boolean;
};

const MIN_SCALE = 0.72;
const MAX_SCALE = 1.08;

function computeTargetScale(phaseId: BreathPhaseId | null, progress: number): number {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  switch (phaseId) {
    case 'inhale':
      return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * clampedProgress;
    case 'hold-after-inhale':
      return MAX_SCALE;
    case 'exhale':
      return MAX_SCALE - (MAX_SCALE - MIN_SCALE) * clampedProgress;
    case 'hold-after-exhale':
      return MIN_SCALE;
    default:
      return 0.85;
  }
}

export function BreathingOrb({
  phaseId,
  phaseProgress,
  label,
  remainingSeconds,
  paused,
}: BreathingOrbProps) {
  const theme = useTheme();
  const scale = useSharedValue(computeTargetScale(phaseId, phaseProgress));

  useEffect(() => {
    if (paused) return;
    const target = computeTargetScale(phaseId, phaseProgress);
    scale.value = withTiming(target, {
      duration: 250,
      easing: Easing.linear,
    });
  }, [phaseId, phaseProgress, paused, scale]);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedHaloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 1.15 }],
    opacity: 0.28 + (scale.value - MIN_SCALE) * 0.2,
  }));

  return (
    <View style={styles.container}>
      {/* Soft outer halo ring */}
      <Animated.View
        style={[
          styles.halo,
          {
            backgroundColor: theme.accentSecondarySoft,
            borderColor: theme.accentSecondary,
          },
          animatedHaloStyle,
        ]}
      />

      {/* Main soothing circular orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            backgroundColor: theme.accentSecondarySoft,
            borderColor: theme.accentSecondary,
          },
          animatedOrbStyle,
        ]}>
        <LinearGradient pointerEvents="none" colors={[theme.accentSoft, theme.backgroundElement]} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
        <View style={styles.content}>
          <Text style={[styles.phaseText, { color: theme.heading }]}>
            {label}
          </Text>
          <Text
            accessibilityLabel={`${label}, ${remainingSeconds} ${
              remainingSeconds === 1 ? 'second' : 'seconds'
            } remaining`}
            style={[styles.secondsText, { color: theme.textSecondary }]}>
            {remainingSeconds}s
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 230,
    width: '100%',
    marginVertical: 12,
  },
  halo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  orb: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  phaseText: {
    fontFamily: 'InterBold', fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondsText: {
    fontFamily: 'InterBold', fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});

