import { check, suite } from './harness';
import type { LandmarkEventPayload, PoseFrameEventPayload, PoseLandmarkName } from '../modules/pose-tracker';
import { asanas, holdCount } from '../src/yoga/asanas';
import { observePosture } from '../src/yoga/posture';
import { completedHolds, isYogaResult, YogaSession } from '../src/yoga/session';
import { createSessionRecord, createSessionStore, parseSessionRecord } from '../src/exercise/session-store';
import { describeSessionOutcome } from '../src/activities/activity-format';

const [mountain, bend, twist] = asanas;
function pose(points: [PoseLandmarkName, number, number][]): PoseFrameEventPayload {
  const landmarks: LandmarkEventPayload[] = points.map(([name, x, y]) => ({ name, x, y, visibility: 1, z: 0, presence: 1 }));
  return { timestampMs: 0, imageWidth: 800, imageHeight: 800, presence: 'tracked', landmarks };
}

export function run() {
  suite('seated yoga: visibility and direction', () => {
    const seated = pose([['LEFT_SHOULDER', .4,.25], ['LEFT_HIP', .4,.55], ['LEFT_KNEE', .65,.55], ['LEFT_ANKLE',.65,.83]]);
    check('seated upright geometry', observePosture(mountain,'center',seated) === 'valid');
    check('standing posture rejected', observePosture(mountain,'center',pose([
      ['LEFT_SHOULDER',.5,.2], ['LEFT_HIP',.5,.44], ['LEFT_KNEE',.5,.65], ['LEFT_ANKLE',.5,.9],
    ])) === 'invalid');
    seated.landmarks[1].visibility = .2;
    check('occluded joint distinguished', observePosture(mountain,'center',seated) === 'insufficient');
    check('lost distinguished', observePosture(mountain,'center',{...seated,presence:'lost'}) === 'absent');
    for (const mirror of [false, true]) {
      for (const side of ['left', 'right'] as const) {
        const offset = side === 'left' ? .08 : -.08;
        const front = pose([['LEFT_SHOULDER',.60+offset,.3],['RIGHT_SHOULDER',.40+offset,.3],
          ['LEFT_HIP',.58,.60],['RIGHT_HIP',.42,.60]]);
        if (mirror) front.landmarks.forEach(p => { p.x = 1 - p.x; });
        check('anatomical ' + side + ' in mirrored=' + mirror, observePosture(bend,side,front) === 'valid');
        check('wrong side rejected', observePosture(bend,side === 'left' ? 'right' : 'left',front) === 'invalid');
        check('side bend alone cannot start a twist', observePosture(twist,side,front) !== 'valid');
      }
    }
  });

  suite('camera orientation and custom yoga timing', () => {
    // Rotate the same anatomical pose toward both camera profiles, including
    // its depth, then project into a widescreen video frame.
    for (const degrees of [-90, -65, 0, 65, 90]) {
      const angle = degrees * Math.PI / 180;
      for (const asana of asanas) {
        for (const side of ['left', 'right'] as const) {
          const frame = pose([]);
          frame.imageWidth = 1280;
          frame.imageHeight = 720;
          const direction = side === 'left' ? 1 : -1;
          for (const sign of [-1, 1]) {
            const prefix = sign === 1 ? 'LEFT' : 'RIGHT';
            const torsoOffset = asana === bend ? direction * .09 : 0;
            const twistDepth = asana === twist ? sign * direction * .04 : 0;
            for (const [name, x, y, z] of [
              ['SHOULDER', sign * .12 + torsoOffset,.3, twistDepth],
              ['HIP', sign * .09,.60,0], ['KNEE',sign * .09,.65,-.20],
              ['ANKLE',sign * .09,.9,-.20],
            ] as const) {
              frame.landmarks.push({ name: (prefix+'_'+name) as PoseLandmarkName,
                x: .5 + (x*Math.cos(angle)-z*Math.sin(angle))*720/1280,
                y, z: (x*Math.sin(angle)+z*Math.cos(angle))*720/1280, visibility:1, presence:1 });
            }
          }
          check(asana.id+' '+side+' at '+degrees, observePosture(asana,side,frame) === 'valid');
          if (asana.bilateral) check('wrong direction at '+degrees, observePosture(asana,side === 'left' ? 'right' : 'left',frame) === 'invalid');
        }
      }
    }
    const s = new YogaSession(mountain,0,5,30);
    s.observe(10000,'valid');
    for (let t=10250;t<=12250;t+=250) s.observe(t,t===11000?'insufficient':'valid');
    check('brief occlusion excludes missing time', s.phase === 'waiting');
    s.observe(12500,'valid');
    check('brief occlusion preserves earlier stable time', s.phase === 'holding');
    for(let t=12750;t<=17500;t+=250) s.observe(t,'valid');
    check('custom hold transitions to custom rest', s.phase === 'resting' && s.remainingMs === 30000);
    s.tick(47500); s.end(47500);
    check('custom duration survives history validation', isYogaResult(s.result(),mountain) && s.result().targetSeconds === 5);
  });

  suite('seated twist: directional camera holds', () => {
    const frame = pose([['LEFT_SHOULDER',.6,.3],['RIGHT_SHOULDER',.4,.3],
      ['LEFT_HIP',.58,.6],['RIGHT_HIP',.42,.6],['LEFT_KNEE',.58,.68],['RIGHT_KNEE',.42,.68]]);
    const [left, , hip, , knee] = frame.landmarks;
    const session = new YogaSession(twist, 0);
    let time = 10000;
    for (let i = 0; i < 6; i++) {
      const side = session.current.side;
      left.z = 0;
      check('neutral torso waits', observePosture(twist,side,frame) === 'invalid');
      left.z = side === 'left' ? .08 : -.08;
      check('opposite turn rejected', observePosture(twist,side === 'left' ? 'right' : 'left',frame) === 'invalid');
      hip.z = left.z * .8;
      check('turning hips with shoulders rejected', observePosture(twist,side,frame) === 'invalid');
      hip.z = 0;
      knee.y = .98;
      check('extended leg rejected', observePosture(twist,side,frame) === 'invalid');
      knee.y = .68;
      left.visibility = .3;
      check('unclear shoulder cannot trigger timing', observePosture(twist,side,frame) === 'insufficient');
      left.visibility = 1;
      frame.landmarks.forEach(p => { p.x = 1 - p.x; });
      const observation = observePosture(twist,side,frame);
      check('turn recognized with either preview orientation', observation === 'valid');
      for (let ms = 0; ms <= 17000; ms += 250) session.observe(time + ms, observation);
      time += 17000;
      if (i < 5) {
        check('rest after automatic twist', session.phase === 'resting');
        session.tick(time += 15000);
      }
    }
    const result = session.result();
    check('all six camera holds saved', isYogaResult(result,twist) &&
      result.holds.every(h => h.autoMs === 15000 && h.manualMs === 0));
    check('old manual twist results still readable', isYogaResult({...result,
      holds: result.holds.map(h => ({ ...h, autoMs: 0, manualMs: 15000 }))},twist));
  });

  suite('seated yoga: every round and rest interval', () => {
    for (const asana of asanas) {
      const s = new YogaSession(asana, 0);
      s.tick(9999);
      check('ten-second preparation', s.phase === 'preparation' && s.remainingMs === 1);
      let time = 10000;
      s.tick(time);
      for (let i = 0; i < holdCount(asana); i++) {
        check('waits before each hold', s.phase === 'waiting');
        check('correct side', s.current.side === (asana.bilateral ? i % 2 ? 'right' : 'left' : 'center'));
        check('correct round', s.round === Math.floor(i / (asana.bilateral ? 2 : 1)) + 1);
        if (asana.manual) {
          s.tick(time += 3000);
          check('manual wait never starts by time alone', s.phase === 'waiting');
          s.confirm(time);
          s.tick(time += asana.targetSeconds * 1000);
        } else {
          s.confirm(time);
          check('manual confirm cannot start automatic hold', s.phase === 'waiting');
          s.observe(time, 'valid');
          for (let n = 0; n < 7; n++) s.observe(time += 250, 'valid');
          check('1750 ms still settling', s.phase === 'waiting');
          s.observe(time += 250,'valid');
          check('2000 ms starts hold', s.phase === 'holding' && s.current.autoMs === 0);
          for (let n = 0; n < asana.targetSeconds * 4; n++) s.observe(time += 250, 'valid');
        }
        if (i < holdCount(asana) - 1) {
          check('rest follows nonfinal hold', s.phase === 'resting');
          s.tick(time += 14999);
          check('full fifteen seconds', s.remainingMs === 1);
          s.tick(++time);
        }
      }
      const result = s.result();
      check('final hold has no rest', result.status === 'completed');
      check('exact elapsed time', result.elapsedMs === time);
      check('all holds recorded', completedHolds(result) === holdCount(asana));
      check('only actual method credited', result.holds.every(h => asana.manual ?
        h.manualMs === 15000 && h.autoMs === 0 : h.autoMs === asana.targetSeconds * 1000 && h.manualMs === 0));
      check('summary survives validation', isYogaResult(result,asana));
    }
  });

  suite('seated yoga: camera loss, stalls and recovery', () => {
    const s = new YogaSession(mountain,0);
    for (let t = 10000; t <= 14000; t += 200) s.observe(t,'valid');
    check('time is elapsed milliseconds', s.current.autoMs === 2000);
    s.observe(14100,'insufficient');
    s.observe(14350,'valid');
    check('brief dropout adds no time across gap', s.phase === 'holding' && s.current.autoMs === 2000);
    s.tick(15000);
    check('silent camera stalls interrupt hold', s.phase === 'waiting' && s.interruptions === 1);
    for (let t=15000;t<=17000;t+=250) s.observe(t,'valid');
    check('requires fresh stability after loss', s.phase === 'holding' && s.current.autoMs === 2000);
    s.observe(17250,'valid');
    s.cameraFailed(17300);
    check('camera failure freezes credited time', s.phase === 'waiting' && s.current.autoMs === 2250 && s.interruptions === 2);
    s.useManual(17400);
    s.tick(19000);
    check('fallback needs explicit confirmation', s.phase === 'waiting');
    s.confirm(19000);
    s.tick(20000);
    s.end(20000);
    check('mixed hold preserves the source of each second', s.result().holds[0].manualMs === 1000 && s.result().holds[0].autoMs === 2250);
  });

  suite('seated yoga: pause, background, denied camera and cancelled history', async () => {
    const s = new YogaSession(bend,0);
    s.pause(4400);
    s.tick(64000);
    check('background pause freezes preparation and elapsed time', s.remainingMs === 5600 && s.elapsedMs === 4400);
    s.resume(65000); s.tick(70600);
    s.cameraFailed(70600); s.useManual(70600);
    s.tick(71600);
    check('denied camera leaves manual hold unstarted', s.phase === 'waiting');
    s.confirm(71600); s.tick(76000); s.pause(76000); s.resume(90000);
    check('manual resume needs confirmation', s.phase === 'waiting' && s.current.manualMs === 4400);
    s.confirm(90000); s.tick(100600);
    check('manual hold finishes exactly at target', s.phase === 'resting');
    s.pause(101600); s.resume(130000);
    check('rest resumes with unused time', s.phase === 'resting' && s.remainingMs === 14000);
    s.skipRest(130000);
    check('skip rest moves to opposite side', s.current.side === 'right' && s.phase === 'waiting');
    s.end(130100); s.confirm(200000);
    const result = s.result();
    check('ended early stays terminal', result.status === 'cancelled' && completedHolds(result) === 1);
    let saved: string | null = null;
    const storage = { getItem: async () => saved, setItem: async (_: string, value: string) => { saved=value; }, removeItem: async () => { saved=null; } };
    const record = createSessionRecord({ id:'yoga-test', exerciseId:bend.id, exerciseName:bend.name,
      completedAt:new Date(0).toISOString(), activityKind:'yoga', yoga:result, stepsCompleted:1,
      metrics:{reps:0, durationSeconds:Math.floor(result.elapsedMs/1000),paceRpm:null,rangeMinDeg:null,rangeMaxDeg:null,consistencyPct:null} });
    await createSessionStore(storage).saveSession(record);
    const reloaded = await createSessionStore(storage).getSessionById(record.id);
    check('persistent partial summary', JSON.stringify(reloaded?.yoga) === JSON.stringify(result));
    check('history describes early end', describeSessionOutcome(record) === 'Ended early · 1 hold');
    check('premature completion rejected', parseSessionRecord({...record,yoga:{...result,status:'completed'}}) === null);
    check('opposite side corruption rejected', !isYogaResult({...result,holds:[{side:'right',autoMs:0,manualMs:99}]},bend));
  });
}
