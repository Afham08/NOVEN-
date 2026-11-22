import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  LandmarkEventPayload,
  PoseLandmarkName,
  POSE_LANDMARK_NAMES,
  PoseTrackerViewProps,
} from './PoseTracker.types';

// MediaPipe 33-landmark skeleton connection pairs
const SKELETON_PAIRS: [number, number][] = [
  // Head / Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Shoulders & Arms
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  // Torso
  [11, 23], [12, 24], [23, 24],
  // Legs
  [23, 25], [25, 27], [27, 29], [27, 31],
  [24, 26], [26, 28], [28, 30], [28, 32],
];

const pendingScripts = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  if (typeof window !== 'undefined' && (window as unknown as { Pose?: unknown }).Pose) return Promise.resolve();
  const pending = pendingScripts.get(src);
  if (pending) return pending;
  const loading = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('Browser document is unavailable'));
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    const timeout = window.setTimeout(() => {
      script.remove();
      pendingScripts.delete(src);
      reject(new Error('Pose model download timed out'));
    }, 15000);
    script.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      pendingScripts.delete(src);
      reject(new Error('Pose model could not download'));
    };
    document.head.appendChild(script);
  });
  pendingScripts.set(src, loading);
  return loading;
}

function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  aspect: number,
): number {
  const rad = Math.atan2(p3.y - p2.y, (p3.x - p2.x) * aspect) - Math.atan2(p1.y - p2.y, (p1.x - p2.x) * aspect);
  let deg = Math.abs((rad * 180.0) / Math.PI);
  if (deg > 180.0) deg = 360 - deg;
  return Math.round(deg);
}

type MPPoint = { x: number; y: number; z?: number; visibility?: number };

export default function PoseTrackerView({
  exerciseId = 'seated-knee-extension',
  onFrame,
  onPoseFrame,
  onError,
  style,
}: PoseTrackerViewProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [aiStatus, setAiStatus] = React.useState<'loading' | 'active' | 'error'>('loading');
  const [personInFrame, setPersonInFrame] = React.useState(false);


  const [isGoalReached, setIsGoalReached] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);

  const onPoseFrameRef = React.useRef(onPoseFrame);

  const onFrameRef = React.useRef(onFrame);

  const onErrorRef = React.useRef(onError);

  React.useLayoutEffect(() => {
    onFrameRef.current = onFrame;
    onPoseFrameRef.current = onPoseFrame;
    onErrorRef.current = onError;
  }, [onFrame, onPoseFrame, onError]);

  const frameIndexRef = React.useRef(0);
  const isBusyRef = React.useRef(false);

  // 1. Initialize Webcam
  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    async function initCamera() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        if (isMounted) setCameraError('Camera API not available');
        return;
      }

      try {
        let s: MediaStream;
        try {
          s = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          });
        } catch (error: unknown) {
          if (!(error instanceof DOMException) || error.name !== 'OverconstrainedError') throw error;
          // Fallback for mobile phone browsers that reject resolution constraints
          s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
          });
        }

        if (!isMounted) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
          videoRef.current.muted = true;
          videoRef.current.srcObject = s;
          try {
            await videoRef.current.play();
            if (!isMounted) return;
            const now = performance.now();
            onFrameRef.current?.({ nativeEvent: {
              frameIndex: 0,
              timestampNs: Math.round(now * 1_000_000),
              elapsedRealtimeMs: now,
              width: videoRef.current.videoWidth || 640,
              height: videoRef.current.videoHeight || 480,
            } });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Camera preview could not start';
            setCameraError(message);
            onErrorRef.current?.({ nativeEvent: { category: 'camera-startup', message } });
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Camera access denied';
          setCameraError(message);
          onErrorRef.current?.({
            nativeEvent: { category: err instanceof DOMException && err.name === 'NotAllowedError' ? 'camera-permission' : 'camera-startup', message },
          });
        }
      }
    }

    void initCamera();

    return () => {
      isMounted = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // 3. Process Pose Results & Render Clean Visual Feedback
  const processResults = React.useCallback(
    (results: { poseLandmarks?: MPPoint[] }) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas || !video) return;

      const width = canvas.clientWidth || 640;
      const height = canvas.clientHeight || 480;
      const sourceWidth = video.videoWidth || 640;
      const sourceHeight = video.videoHeight || 480;
      const scale = Math.max(width / sourceWidth, height / sourceHeight);
      const drawnWidth = sourceWidth * scale;
      const drawnHeight = sourceHeight * scale;
      const xPixel = (x: number) => (width - drawnWidth) / 2 + (1 - x) * drawnWidth;
      const yPixel = (y: number) => (height - drawnHeight) / 2 + y * drawnHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      const raw = results.poseLandmarks;
      const now = performance.now();
      frameIndexRef.current += 1;

      if (!raw || raw.length === 0) {
        setPersonInFrame(false);
        setAiStatus('active');

        onPoseFrameRef.current?.({
          nativeEvent: {
            timestampMs: now,
            imageWidth: video.videoWidth || 640,
            imageHeight: video.videoHeight || 480,
            presence: 'lost',
            landmarks: [],
          },
        });
        return;
      }

      setPersonInFrame(true);
      setAiStatus('active');

      const arm = exerciseId === 'seated-arm-raise';
      const leg = exerciseId === 'seated-knee-extension' || exerciseId === 'sit-to-stand';
      let goalHit = false;
      let focalPoint: { x: number; y: number } | null = null;
      if (arm || leg) {
        for (const side of [0, 1]) {
          const first = raw[23 + side];
          const joint = raw[(arm ? 11 : 25) + side];
          const last = raw[(arm ? 13 : 27) + side];
          if (![first, joint, last].every(p => p && (p.visibility ?? 0) >= 0.4)) continue;
          const angle = calculateAngle(first, joint, last, sourceWidth / sourceHeight);
          goalHit = angle >= (arm ? 120 : exerciseId === 'sit-to-stand' ? 165 : 160);
          focalPoint = { x: xPixel(joint.x), y: yPixel(joint.y) };
          if (goalHit) break;
        }
      }
      setIsGoalReached(goalHit);

      // --- CLEAN MINIMAL SKELETON DRAWING ---
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = goalHit ? '#10B981' : '#38BDF8';
      ctx.shadowColor = goalHit ? '#10B981' : '#38BDF8';
      ctx.shadowBlur = 6;

      for (const [i, j] of SKELETON_PAIRS) {
        const p1 = raw[i];
        const p2 = raw[j];
        if (!p1 || !p2) continue;
        if ((p1.visibility ?? 0) < 0.3 || (p2.visibility ?? 0) < 0.3) continue;

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

        const isFocal = idx === 11 || idx === 12 || idx === 25 || idx === 26 || idx === 13 || idx === 14;
        ctx.fillStyle = isFocal ? (goalHit ? '#10B981' : '#F97316') : '#E2E8F0';
        ctx.beginPath();
        ctx.arc(px, py, isFocal ? 5 : 2.5, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw Joint Target Halo at Focal Joint (Clean subtle ring, no degrees or text)
      if (focalPoint) {
        ctx.strokeStyle = goalHit ? '#10B981' : '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(focalPoint.x, focalPoint.y, 14, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // --- CONSTRUCT COMPLIANT NOVEN LANDMARKS ---
      const landmarks: LandmarkEventPayload[] = raw.map((lm, idx) => ({
        name: POSE_LANDMARK_NAMES[idx] || (`UNKNOWN_${idx}` as PoseLandmarkName),
        x: lm.x,
        y: lm.y,
        z: lm.z ?? 0,
        visibility: typeof lm.visibility === 'number' ? lm.visibility : 0,
        presence: typeof lm.visibility === 'number' ? lm.visibility : 0,
      }));

      onPoseFrameRef.current?.({
        nativeEvent: {
          timestampMs: now,
          imageWidth: video.videoWidth || 640,
          imageHeight: video.videoHeight || 480,
          presence: 'tracked',
          landmarks,
        },
      });

      onFrameRef.current?.({
        nativeEvent: {
          frameIndex: frameIndexRef.current,
          timestampNs: Math.round(now * 1_000_000),
          elapsedRealtimeMs: now,
          width: video.videoWidth || 640,
          height: video.videoHeight || 480,
        },
      });
    },
    [exerciseId]
  );

  // 2. Initialize MediaPipe Pose Model
  React.useEffect(() => {
    let active = true;
    let poseInstance: any = null;
    let animId: number;

    async function initAI() {
      try {
        setAiStatus('loading');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js');

        if (!active) return;
        const MPPose = (window as unknown as { Pose?: any }).Pose;
        if (!MPPose) throw new Error('MediaPipe Pose failed to load');

        const pose = new MPPose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(processResults);
        poseInstance = pose;
        if (active) setAiStatus('loading');

        function loop() {
          if (!active) return;
          const video = videoRef.current;
          if (
            video &&
            video.readyState >= 2 &&
            !video.paused &&
            !isBusyRef.current &&
            poseInstance
          ) {
            isBusyRef.current = true;
            poseInstance
              .send({ image: video })
              .catch((error: unknown) => {
                if (active) {
                  setAiStatus('error');
                  onErrorRef.current?.({ nativeEvent: { category: 'pose-runtime', message: error instanceof Error ? error.message : 'Pose tracking stopped' } });
                  active = false;
                }
              })
              .finally(() => {
                isBusyRef.current = false;
              });
          }
          animId = requestAnimationFrame(loop);
        }

        animId = requestAnimationFrame(loop);
      } catch (error: unknown) {
        if (active) {
          setAiStatus('error');
          onErrorRef.current?.({ nativeEvent: { category: 'pose-initialization', message: error instanceof Error ? error.message : 'Pose tracking could not start' } });
        }
      }
    }

    void initAI();

    return () => {
      active = false;
      cancelAnimationFrame(animId);
      if (poseInstance?.close) {
        try {
          poseInstance.close();
        } catch {}
      }
    };
  }, [processResults]);

  if (cameraError) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.errorText}>Camera Error: {cameraError}</Text>
        <Text style={styles.helperText}>Please grant camera permission in your browser.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Live Webcam Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
        }}
      />

      {/* Real-Time Joint Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Clean Subtle Status Indicator (No degrees, no debug buttons, no clutter) */}
      <View style={styles.statusBar}>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.dot,
              { backgroundColor: isGoalReached ? '#10B981' : personInFrame ? '#38BDF8' : '#F59E0B' },
            ]}
          />
          <Text style={styles.statusText}>
            {aiStatus === 'loading' ? 'PREPARING CAMERA' : personInFrame ? 'TRACKING ACTIVE' : 'STEP INTO FRAME'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  placeholder: {
    backgroundColor: '#0A0F1D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  helperText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  statusBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    pointerEvents: 'none',
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
