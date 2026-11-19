import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

const evenFrames = require('../../../assets/meditation/fluid-inhale.webp');
const oddFrames = require('../../../assets/meditation/fluid-exhale.webp');
const grid = 8;
const frames = grid * grid;

// Each tile is a shaded sphere with the same light and a different internal
// flow field. Keeping both sheets mounted avoids loading an image at each cue.
function FluidLayer({ size, cycle, odd, still }: {
  size: number; cycle: SharedValue<number>; odd: boolean; still: boolean;
}) {
  const animation = useAnimatedStyle(() => {
    const position = still ? 0.5 : cycle.value % 1;
    // Crossfade the two neighboring tiles. Each sheet can advance its tile
    // while the other is fully visible, including across the loop seam.
    const pair = position * frames;
    const index = Math.floor(pair + (odd ? 0 : 0.5)) % frames;
    const blend = 1 - Math.abs(2 * (pair % 1) - 1);
    return {
      opacity: odd ? blend : 1,
      transform: [
        { translateX: -(index % grid) * size },
        { translateY: -Math.floor(index / grid) * size },
      ],
    };
  });
  return (
    <Animated.View style={[styles.layer, { width: size * grid, height: size * grid }, animation]}>
      <Image source={odd ? oddFrames : evenFrames} contentFit="fill" transition={0} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

export function FluidOrb({ size, cycle, fullness }: { size: number; cycle: SharedValue<number>; fullness: SharedValue<number> }) {
  const still = useReducedMotion();
  const shape = useAnimatedStyle(() => ({
    transform: [{ scale: still ? 0.82 : 0.62 + 0.38 * fullness.value }],
  }));
  return (
    <Animated.View accessible={false} pointerEvents="none" style={[{ width: size, height: size }, shape]}>
      <View style={styles.shadow} />
      <View style={styles.clip}>
        <FluidLayer size={size} cycle={cycle} odd={false} still={still} />
        <FluidLayer size={size} cycle={cycle} odd still={still} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute', top: '12%', bottom: '12%', left: '12%', right: '12%',
    borderRadius: '50%', boxShadow: '0 10px 32px rgba(44, 33, 47, 0.12)',
  },
  clip: { flex: 1, overflow: 'hidden' },
  layer: { position: 'absolute', top: 0, left: 0 },
});
