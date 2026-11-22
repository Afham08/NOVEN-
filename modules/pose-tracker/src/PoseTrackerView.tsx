import { requireNativeView } from 'expo';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import {
  PoseTrackerViewProps,
} from './PoseTracker.types';
import PoseTrackerModule from './PoseTrackerModule';

let NativeView: React.ComponentType<PoseTrackerViewProps> | null = null;
if (PoseTrackerModule) {
  try {
    NativeView = requireNativeView('PoseTracker');
  } catch {
    NativeView = null;
  }
}

function getMediaPipeHtml(exerciseId: string = 'seated-arm-raise'): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; }
    video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
    canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
  </style>
  <script src="https://unpkg.com/@mediapipe/pose@0.5.1675469404/pose.js" crossorigin="anonymous"></script>
</head>
<body>
  <video id="v" autoplay playsinline webkit-playsinline muted></video>
  <canvas id="c"></canvas>
  <script>
    const SKELETON_PAIRS = [
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      [9, 10],
      [11, 12],
      [11, 13], [13, 15],
      [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24],
      [23, 25], [25, 27], [27, 29], [27, 31],
      [24, 26], [26, 28], [28, 30], [28, 32]
    ];
    const NAMES = [
      'NOSE','LEFT_EYE_INNER','LEFT_EYE','LEFT_EYE_OUTER','RIGHT_EYE_INNER',
      'RIGHT_EYE','RIGHT_EYE_OUTER','LEFT_EAR','RIGHT_EAR','MOUTH_LEFT','MOUTH_RIGHT',
      'LEFT_SHOULDER','RIGHT_SHOULDER','LEFT_ELBOW','RIGHT_ELBOW','LEFT_WRIST','RIGHT_WRIST',
      'LEFT_PINKY','RIGHT_PINKY','LEFT_INDEX','RIGHT_INDEX','LEFT_THUMB','RIGHT_THUMB',
      'LEFT_HIP','RIGHT_HIP','LEFT_KNEE','RIGHT_KNEE','LEFT_ANKLE','RIGHT_ANKLE',
      'LEFT_HEEL','RIGHT_HEEL','LEFT_FOOT_INDEX','RIGHT_FOOT_INDEX'
    ];

    const exerciseId = ${JSON.stringify(exerciseId).replace(/</g, '\\u003c')};
    const video = document.getElementById('v');
    const canvas = document.getElementById('c');
    let poseInstance = null;
    let stopped = false;
    function fail(category, message) {
      if (stopped) return;
      stopped = true;
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', category, message }));
    }

    function calcAngle(p1, p2, p3) {
      const aspect = video.videoWidth / video.videoHeight;
      const rad = Math.atan2(p3.y - p2.y, (p3.x - p2.x) * aspect) - Math.atan2(p1.y - p2.y, (p1.x - p2.x) * aspect);
      let deg = Math.abs((rad * 180.0) / Math.PI);
      if (deg > 180.0) deg = 360 - deg;
      return Math.round(deg);
    }

    async function init() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          fail('unsupported-build', 'Camera API is unavailable in this build');
          return;
        }
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
          });
        } catch(e) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        }
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        await video.play();
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'camera-ready' }));

        setupPose();
      } catch(err) {
        const category = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'camera-permission' : 'camera-startup';
        fail(category, err?.message || 'Camera could not start');
      }
    }

    let poseAttempts = 0;
    function setupPose() {
      if (!window.Pose) {
        if (++poseAttempts >= 50) {
          fail('pose-initialization', 'Pose model could not load');
          return;
        }
        setTimeout(setupPose, 200);
        return;
      }
      try {
        poseInstance = new window.Pose({
          locateFile: (f) => 'https://unpkg.com/@mediapipe/pose@0.5.1675469404/' + f
        });
        poseInstance.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        poseInstance.onResults(onResults);

        let busy = false;
        function loop() {
          if (stopped) return;
          if (video.videoWidth > 0 && !busy && poseInstance) {
            busy = true;
            poseInstance.send({ image: video })
              .catch((error) => fail('pose-runtime', error?.message || 'Pose tracking stopped'))
              .finally(() => { busy = false; });
          }
          requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
      } catch(e) {
        fail('pose-initialization', e?.message || 'Pose tracking could not start');
      }
    }

    function onResults(results) {
      const width = canvas.clientWidth || 640;
      const height = canvas.clientHeight || 480;
      const sourceWidth = video.videoWidth || 640;
      const sourceHeight = video.videoHeight || 480;
      const scale = Math.max(width / sourceWidth, height / sourceHeight);
      const drawnWidth = sourceWidth * scale;
      const drawnHeight = sourceHeight * scale;
      const xPixel = (x) => (width - drawnWidth) / 2 + (1 - x) * drawnWidth;
      const yPixel = (y) => (height - drawnHeight) / 2 + y * drawnHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);

      const raw = results.poseLandmarks;
      if (!raw || raw.length === 0) {
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'lost' }));
        return;
      }

      // Calculate joint angles for current exercise
      const arm = exerciseId === 'seated-arm-raise';
      const leg = exerciseId === 'seated-knee-extension' || exerciseId === 'sit-to-stand';
      let goalHit = false;
      let focalPoint = null;
      if (arm || leg) {
        for (const side of [0, 1]) {
          const first = raw[23 + side];
          const joint = raw[(arm ? 11 : 25) + side];
          const last = raw[(arm ? 13 : 27) + side];
          if (![first, joint, last].every(p => p && (p.visibility ?? 0) >= 0.4)) continue;
          const angle = calcAngle(first, joint, last);
          goalHit = angle >= (arm ? 120 : exerciseId === 'sit-to-stand' ? 165 : 160);
          focalPoint = { x: xPixel(joint.x), y: yPixel(joint.y) };
          if (goalHit) break;
        }
      }
      // Draw Glowing Skeleton over user's body
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = goalHit ? '#10B981' : '#38BDF8';
      ctx.shadowColor = goalHit ? '#10B981' : '#38BDF8';
      ctx.shadowBlur = 6;

      for (const [i, j] of SKELETON_PAIRS) {
        const p1 = raw[i], p2 = raw[j];
        if (!p1 || !p2 || (p1.visibility ?? 0) < 0.3 || (p2.visibility ?? 0) < 0.3) continue;
        ctx.beginPath();
        ctx.moveTo(xPixel(p1.x), yPixel(p1.y));
        ctx.lineTo(xPixel(p2.x), yPixel(p2.y));
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      raw.forEach((lm, idx) => {
        if ((lm.visibility ?? 0) < 0.3) return;
        const px = xPixel(lm.x);
        const py = yPixel(lm.y);
        const isFocal = idx === 11 || idx === 12 || idx === 13 || idx === 14 || idx === 25 || idx === 26;
        ctx.fillStyle = isFocal ? (goalHit ? '#10B981' : '#F97316') : '#E2E8F0';
        ctx.beginPath();
        ctx.arc(px, py, isFocal ? 5 : 2.5, 0, 2 * Math.PI);
        ctx.fill();
      });

      if (focalPoint) {
        ctx.strokeStyle = goalHit ? '#10B981' : '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(focalPoint.x, focalPoint.y, 14, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Send REAL live landmarks to React Native SessionEngine
      const payload = raw.map((lm, idx) => ({
        name: NAMES[idx] || ('UNKNOWN_' + idx),
        x: lm.x,
        y: lm.y,
        z: lm.z || 0,
        visibility: typeof lm.visibility === 'number' ? lm.visibility : 0,
        presence: typeof lm.visibility === 'number' ? lm.visibility : 0
      }));

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'landmarks', landmarks: payload, width: sourceWidth, height: sourceHeight }));
      }
    }

    init();
  </script>
</body>
</html>
`;
}

export default function PoseTrackerView({ exerciseId = 'seated-arm-raise', onFrame, onPoseFrame, onError, style, ...rest }: PoseTrackerViewProps) {
  const [tracking, setTracking] = React.useState(false);
  const [cameraReady, setCameraReady] = React.useState(false);
  const onPoseFrameRef = React.useRef(onPoseFrame);
  const onFrameRef = React.useRef(onFrame);
  const onErrorRef = React.useRef(onError);
  React.useLayoutEffect(() => {
    onFrameRef.current = onFrame;
    onPoseFrameRef.current = onPoseFrame;
    onErrorRef.current = onError;
  }, [onFrame, onPoseFrame, onError]);

  const frameIndexRef = React.useRef(0);
  const webViewSource = React.useMemo(
    () => ({ html: getMediaPipeHtml(exerciseId), baseUrl: 'https://localhost/' }),
    [exerciseId],
  );

  const onWebViewMessage = React.useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'landmarks' && Array.isArray(data.landmarks)) {
          setTracking(true);
          const now = Date.now();
          frameIndexRef.current += 1;
          onPoseFrameRef.current?.({
            nativeEvent: {
              timestampMs: now,
              imageWidth: data.width,
              imageHeight: data.height,
              presence: 'tracked',
              landmarks: data.landmarks,
            },
          });
          onFrameRef.current?.({
            nativeEvent: {
              frameIndex: frameIndexRef.current,
              timestampNs: Math.round(now * 1_000_000),
              elapsedRealtimeMs: now,
              width: 640,
              height: 480,
            },
          });
        } else if (data.type === 'camera-ready') {
          setCameraReady(true);
          const now = Date.now();
          onFrameRef.current?.({ nativeEvent: { frameIndex: 0, timestampNs: now * 1_000_000, elapsedRealtimeMs: now, width: 640, height: 480 } });
        } else if (data.type === 'lost') {
          setTracking(false);
          onPoseFrameRef.current?.({ nativeEvent: { timestampMs: Date.now(), imageWidth: 640, imageHeight: 480, presence: 'lost', landmarks: [] } });
        } else if (data.type === 'error') {
          setTracking(false);
          onErrorRef.current?.({ nativeEvent: { category: data.category === 'unsupported-build' || data.category === 'camera-permission' || data.category === 'pose-initialization' || data.category === 'pose-runtime' ? data.category : 'camera-startup', message: String(data.message || 'Camera could not start') } });
        }
      } catch {}
    },
    []
  );

  React.useEffect(() => {
    if (NativeView || cameraReady) return;
    const timeout = setTimeout(() => {
      onErrorRef.current?.({ nativeEvent: { category: 'camera-startup', message: 'Camera startup timed out' } });
    }, 15000);
    return () => clearTimeout(timeout);
  }, [cameraReady]);

  if (!NativeView) {
    return (
      <View style={[styles.container, style]}>
        {/* Real MediaPipe Pose Tracking inside Hardware Accelerated WebView */}
        <WebView
          originWhitelist={['*']}
          source={webViewSource}
          style={StyleSheet.absoluteFill}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          javaScriptEnabled
          domStorageEnabled
          androidLayerType="hardware"
          onMessage={onWebViewMessage}
          onError={() => onErrorRef.current?.({ nativeEvent: { category: 'camera-startup', message: 'Camera page could not load' } })}
        />

        {/* Clean Subtle Status Indicator */}
        <View style={styles.statusBar} pointerEvents="none">
          <View style={styles.statusPill}>
            <View style={[styles.dot, { backgroundColor: '#38BDF8' }]} />
            <Text style={styles.statusText}>{tracking ? 'TRACKING ACTIVE' : 'POSITION YOURSELF'}</Text>
          </View>
        </View>
      </View>
    );
  }

  return <NativeView {...rest} style={style} onFrame={onFrame} onPoseFrame={onPoseFrame} onError={onError} />;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  statusBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
