import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import PoseTrackerModule, { PoseTrackerView, type PoseFrameEventPayload, type PoseTrackerViewProps } from '../../../modules/pose-tracker';
import { isTrustedLandmark } from '@/exercise/landmark-trust';

const bones = [
  ['LEFT_SHOULDER', 'RIGHT_SHOULDER'], ['LEFT_HIP', 'RIGHT_HIP'],
  ...['LEFT', 'RIGHT'].flatMap(side => [
    ['SHOULDER', 'ELBOW'], ['ELBOW', 'WRIST'], ['SHOULDER', 'HIP'], ['HIP', 'KNEE'], ['KNEE', 'ANKLE'],
  ].map(([a, b]) => [side + '_' + a, side + '_' + b])),
];
const nativeOverlay = Platform.OS === 'android' && !!PoseTrackerModule;

// The WebView and browser preview already draw their own skeletons.
export function YogaCamera({ onPoseFrame, ...props }: PoseTrackerViewProps) {
  const [frame, setFrame] = useState<PoseFrameEventPayload | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observe = useCallback((event: { nativeEvent: PoseFrameEventPayload }) => {
    if (nativeOverlay) setFrame(event.nativeEvent.presence === 'tracked' ? event.nativeEvent : null);
    onPoseFrame?.(event);
  }, [onPoseFrame]);
  const scale = frame && frame.imageWidth > 0 && frame.imageHeight > 0
    ? Math.max(size.width / frame.imageWidth, size.height / frame.imageHeight) : 0;
  return <View style={StyleSheet.absoluteFill} onLayout={e => setSize(e.nativeEvent.layout)}>
    <PoseTrackerView {...props} onPoseFrame={observe} style={StyleSheet.absoluteFill} />
    {frame && scale > 0 && <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
      {bones.map(([a, b]) => {
        const p = frame.landmarks.find(j => j.name === a), q = frame.landmarks.find(j => j.name === b);
        if (!isTrustedLandmark(p, 0.55) || !isTrustedLandmark(q, 0.55)) return null;
        const w = frame.imageWidth * scale, h = frame.imageHeight * scale;
        // CameraX uses a mirrored, center-cropped front preview.
        const dx = (p.x - q.x) * w, dy = (q.y - p.y) * h;
        const length = Math.hypot(dx, dy);
        const cx = size.width / 2 + (1 - p.x - q.x) * w / 2;
        const cy = size.height / 2 + (p.y + q.y - 1) * h / 2;
        return <View key={a+b} style={[styles.bone, { left: cx - length / 2, top: cy - 1.5,
          width: length, transform: [{ rotate: Math.atan2(dy, dx) + 'rad' }] }]} />;
      })}
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  bone: { position: 'absolute', height: 3, backgroundColor: '#38BDF8' },
});
