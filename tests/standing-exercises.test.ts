import type { LandmarkEventPayload, PoseLandmarkName } from '../modules/pose-tracker';
import { exercisesCatalog } from '../src/data/exercises';
import { buildProgress, progressHint } from '../src/exercise/progress';
import { getExerciseSessionConfig } from '../src/exercise/pose-configs';
import { SessionEngine } from '../src/exercise/session-engine';
import type { ExerciseConfig } from '../src/exercise/types';
import { check, suite } from './harness';

function point(name: PoseLandmarkName, x: number, y: number): LandmarkEventPayload {
  return { name, x, y, z: 0, presence: 1, visibility: 1 };
}

function frameStream(engine: SessionEngine) {
  let timestampMs = 0;
  return (landmarks: LandmarkEventPayload[], frames: number) => {
    for (let n = 0; n < frames; n++) {
      timestampMs += 100;
      engine.handlePoseFrame({ nativeEvent: { timestampMs, presence: 'tracked', imageWidth: 1200, imageHeight: 800, landmarks } });
    }
  };
}

function jointPose(config: ExerciseConfig, angle: number) {
  const radians = angle * Math.PI / 180;
  return config.sides.flatMap(side => {
    const { hip, knee, ankle, relativeToVertical } = config.triplets[side];
    const x = side === 'left' ? 0.45 : 0.5;
    const moving = [x + 0.05 * Math.sin(radians), 0.5 - 0.075 * Math.cos(radians)];
    return [
      point(knee, x, 0.5),
      point(hip, relativeToVertical ? moving[0] : x, relativeToVertical ? moving[1] : 0.4),
      point(ankle, relativeToVertical ? x : moving[0], relativeToVertical ? 0.45 : moving[1]),
    ];
  });
}

export function run() {
  const cycles: [string, number, number][] = [
    ['supported-squat', 175, 135], ['wall-push-ups', 175, 115],
    ['standing-heel-raises', 90, 112], ['toe-raises', 90, 65],
    ['standing-hip-abduction', 178, 148], ['standing-march', 175, 116],
  ];
  for (const [id, rest, active] of cycles) {
    suite(id + ' camera repetition', () => {
      const config = getExerciseSessionConfig(id)!;
      const engine = new SessionEngine(config);
      const feed = frameStream(engine);
      feed(jointPose(config, rest), 20);
      check('standing still earns readiness', engine.readinessPhase === 'ready');
      feed(jointPose(config, active), 12);
      check('holding the active position adds nothing', engine.reps === 0);
      feed(jointPose(config, rest), 12);
      check('both limbs completing one cycle count once', engine.reps === 1);
      check('joint range recorded', engine.repRanges.length === 1);
      feed(jointPose(config, active), 8);
      engine.pause();
      feed(jointPose(config, rest), 12);
      check('interrupted cycle discarded', engine.reps === 1);
    });
  }

  suite('continuous squats through the live exercise configuration', () => {
    check('original timed sessions retain their hold', ['seated-knee-extension', 'sit-to-stand', 'seated-arm-raise']
      .every(id => getExerciseSessionConfig(id)?.thresholds.minExtendedHoldMs === 3000));
    for (const [standing, depth, frameMs, view] of [
      [176, 45, 100, 1], [160, 25, 100, 1], [173, 31, 125, 0.8], [168, 38, 66, -0.85],
    ]) {
      const engine = new SessionEngine(getExerciseSessionConfig('supported-squat')!);
      let time = 0;
      function frame(angle: number, visibility = 1) {
        // Planted ankle and two equal limb segments, projected from the side or obliquely.
        const bend = (180 - angle) * Math.PI / 360;
        const jitter = 0.001 * Math.sin(time / 73);
        const landmarks = (['LEFT', 'RIGHT'] as const).flatMap((side, index) => {
          const x = 0.5 + 0.025 * index;
          return [
            point(`${side}_ANKLE`, x, 0.85),
            point(`${side}_KNEE`, x + view * 0.20 * Math.sin(bend) + jitter, 0.85 - 0.20 * Math.cos(bend)),
            point(`${side}_HIP`, x, 0.85 - 0.40 * Math.cos(bend)),
          ].map(p => ({ ...p, visibility: index ? 0.2 : visibility }));
        });
        time += frameMs;
        engine.handlePoseFrame({ nativeEvent: { timestampMs: time, presence: 'tracked', imageWidth: 800, imageHeight: 800, landmarks } });
      }
      for (let i = 0; i < 30; i++) frame(standing);
      for (let rep = 1; rep <= 5; rep++) {
        const frames = Math.round(2400 / frameMs);
        for (let i = 0; i <= frames; i++) frame(standing - depth * Math.sin(Math.PI * i / frames) ** 2);
        check(`one count per complete squat at ${standing}/${depth}/${frameMs}/${view}, rep ${rep}`, engine.reps === rep, engine.reps);
      }
      for (let i = 0; i < 80; i++) frame(standing - 5 * Math.sin(i / 5) ** 2);
      check('standing jitter adds no reps', engine.reps === 5);
      for (let i = 0; i < 8; i++) frame(standing - depth);
      frame(standing, 0.1);
      for (let i = 0; i < 30; i++) frame(standing);
      check('unseen return is discarded', engine.reps === 5);
    }
  });

  for (const [id, rest, active] of cycles.filter(([id]) => id === 'toe-raises' || id === 'standing-heel-raises')) {
    suite(id + ' tilted camera and bilateral movement', () => {
      const config = getExerciseSessionConfig(id)!;
      const engine = new SessionEngine(config);
      const feed = frameStream(engine);
      const tilt = id === 'toe-raises' ? -7 : 7;
      const pose = (left: number, right: number) => [
        ...jointPose(config, left + tilt).filter(p => p.name.startsWith('LEFT')),
        ...jointPose(config, right + tilt).filter(p => p.name.startsWith('RIGHT')),
      ];
      feed(pose(rest, rest), 20);
      check('calibrates from flat feet with camera roll', engine.readinessPhase === 'ready');
      feed(pose(active, rest), 10);
      feed(pose(rest, rest), 10);
      check('a single moving foot earns zero', engine.reps === 0);
      feed(pose(active, active), 10);
      feed(pose(active, rest), 10);
      check('waits until both feet return', engine.reps === 0);
      feed(pose(rest, rest), 10);
      check('a complete bilateral lift earns one', engine.reps === 1);
    });
  }

  suite('hip abduction respects direction for each leg and mirrored frames', () => {
    const config = getExerciseSessionConfig('standing-hip-abduction')!;
    for (const side of ['left', 'right'] as const) {
      for (const mirror of [false, true]) {
        const engine = new SessionEngine(config);
        const feed = frameStream(engine);
        const pose = (offset: number) => jointPose(config, 180).map(p => {
          const x = p.x + (p.name === config.triplets[side].ankle ? offset : 0);
          return { ...p, x: mirror ? 1 - x : x };
        });
        const outward = side === 'left' ? -0.04 : 0.04;
        feed(pose(0), 18);
        feed(pose(-outward), 10);
        feed(pose(0), 10);
        check('inward motion gives no rep', engine.reps === 0);
        feed(pose(outward), 10);
        feed(pose(0), 10);
        check('outward and back counts once', engine.reps === 1);
      }
    }
  });

  suite('translated instructions and walking progress', () => {
    for (const exercise of exercisesCatalog.slice(3)) {
      const kn = exercise.kannada!;
      check(exercise.id + ' has a Kannada translation for every instruction and safety hint',
        kn.instructions.length === exercise.instructions.length &&
        [kn.name, kn.target, kn.description, kn.cameraHint, kn.safetyNote, ...kn.instructions].every(value => value && /[\u0C80-\u0CFF]/u.test(value)));
    }
    const now = new Date();
    const summary = buildProgress([{ id: 'walk', exerciseId: 'heel-to-toe-walking', completedAt: now.toISOString(), consistencyPct: null }], now);
    check('walking-only history explains step tracking', summary.walkingInWindow === 1 && progressHint(summary, 1).includes('records steps'));
  });

  for (const direction of [-1, 1]) {
    suite('walking across frame ' + direction, () => {
      const engine = new SessionEngine(getExerciseSessionConfig('heel-to-toe-walking')!);
      const feed = frameStream(engine);
      const feet = (left: number, right: number) => (['LEFT', 'RIGHT'] as const).flatMap((side, i) => {
        const x = 0.5 + direction * (i === 0 ? left : right);
        return [point(`${side}_HEEL`, x, 0.8), point(`${side}_ANKLE`, x, 0.77),
          point(`${side}_FOOT_INDEX`, x + direction * 0.05, 0.8)];
      });
      feed(feet(0, 0), 20);
      feed(feet(0.05, 0), 12);
      check('first placement counted once', engine.reps === 1);
      feed(feet(0.05, 0.1), 12);
      check('opposite placement counted once', engine.reps === 2);
      check('no joint-angle measurement for walking', engine.observedRange === null);
      feed(feet(0.15, 0.1), 1);
      feed([], 1);
      feed(feet(0.15, 0.1), 18);
      check('losing sight of feet discards partial placement', engine.reps === 2);
      feed(feet(0.15, 0.245), 12);
      check('overlong step stays uncounted', engine.reps === 2);
      feed(feet(0.295, 0.245), 12);
      feed(feet(0.295, 0.345), 12);
      check('the next two correct steps count', engine.reps === 4);
    });
  }
}
