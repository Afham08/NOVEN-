import { defineGuidedActivity, type GuidedActivity } from './types';

// In Node test runner, hook module resolution for static audio assets
if (typeof require !== 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Module = require('module') as {
      _resolveFilename?: (request: string, ...args: unknown[]) => string;
      __oggHooked?: boolean;
    };
    if (Module && Module._resolveFilename && !Module.__oggHooked) {
      Module.__oggHooked = true;
      const origResolve = Module._resolveFilename;
      Module._resolveFilename = function (request: string, ...args: unknown[]) {
        if (typeof request === 'string' && request.endsWith('.ogg')) {
          return request;
        }
        return origResolve.call(this, request, ...args);
      };
      const reqWithExt = require as {
        extensions?: Record<string, (module: { exports: unknown }) => void>;
      };
      if (reqWithExt.extensions && !reqWithExt.extensions['.ogg']) {
        reqWithExt.extensions['.ogg'] = (module) => {
          module.exports = 1;
        };
      }
    }
  } catch {
    // Intentionally swallowed in React Native / Metro
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const WAVES_AUDIO = require('../../assets/Audiomusics/waves.ogg') as number;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RAIN_AUDIO = require('../../assets/Audiomusics/rain.ogg') as number;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BIRDS_AUDIO = require('../../assets/Audiomusics/birds.ogg') as number;

/**
 * Meditation sessions: a timer, a few stages, and nothing else.
 *
 * There is no audio, because NOVEN has none, and there is no breathing COUNTER,
 * because NOVEN cannot see the user and would be guessing - a camera sees a torso,
 * and a torso is not breathing. What the breathing stage does have is a PACER: a
 * repeating sequence of phases with lengths attached, telling the person when to
 * breathe in, when to hold and when to breathe out. See `breath-cycle.ts`. It says
 * when, never whether: it has no input that could tell it what anybody actually
 * did, and nothing it produces may be worded as though it had.
 *
 * On top of that, each session has a clock, a sequence of stages that move at a
 * sensible rate, and words telling the person where their attention is supposed to
 * be. That is enough for a session to be worth starting and worth recording.
 *
 * A few opening stages also carry `cameraConfigId`, which turns the camera on for
 * that stage alone so the settling-in can be helped along. What the camera is
 * allowed to say there is set by `postureExpectation` and nothing more: it can
 * tell somebody they are not in frame, and on the stages that ask to be seated it
 * can tell them their back is not upright. It says nothing about calm, focus,
 * breathing, or whether they are meditating, because nothing in the frame
 * supports any of those. See `meditation-guidance.ts`.
 *
 * Every session is a multiple of a short first stage, so "one minute" really is
 * one minute and not a one-minute session with a long sit in the middle. The
 * longest is ten minutes, because the audience is older and a beginner's first
 * attempt at anything should be easy to finish.
 */
export const meditationSessions: readonly GuidedActivity[] = [
  defineGuidedActivity({
    id: 'one-minute-calm',
    kind: 'meditation',
    name: 'One Minute of Calm',
    summary: 'A single minute, for a first try or a short break',
    progressNoun: 'stages',
    steps: [
      {
        seconds: 10,
        title: 'Settle',
        guidance: 'Sit comfortably. Let your hands rest, and let your shoulders drop.',
        cameraConfigId: 'meditation-posture',
        postureExpectation: 'seated-upright',
      },
      {
        seconds: 30,
        title: 'Breathe',
        guidance: 'Breathe in slowly through your nose, and out slowly through your mouth.',
      },
      {
        seconds: 20,
        title: 'Rest',
        guidance: 'Stop trying to do anything in particular. Just sit until this ends.',
      },
    ],
    safetyNote:
      'Open your eyes and sit normally at any point. If you feel unwell, stop and take a break.',
  }),

  defineGuidedActivity({
    id: 'five-minute-breathing',
    kind: 'meditation',
    name: 'Five Minute Breathing',
    summary: 'Five minutes focused on the breath',
    progressNoun: 'stages',
    steps: [
      {
        seconds: 20,
        title: 'Settle',
        guidance: 'Sit comfortably and close your eyes, or soften your gaze.',
        cameraConfigId: 'meditation-posture',
        postureExpectation: 'seated-upright',
      },
      {
        seconds: 20,
        title: 'Notice',
        guidance: 'Notice the weight of your body in the chair, and your feet on the floor.',
      },
      {
        /*
         * The one step in the catalogue that paces a breath rather than only
         * describing one. `breathingTechniqueId` names the pattern; the phases and
         * their lengths live with the technique in `breath-cycle.ts`, so this file
         * cannot promise a pattern the engine is not actually running.
         *
         * Note what is NOT here: no camera. Nothing about a breath can be seen from
         * a torso, and turning the camera on for this step would mount a preview
         * whose posture verdict ("Straighten your back") has nothing to do with
         * breathing and would be read as though it did. The camera stays on the
         * Settle step above, where posture guidance is honest and useful.
         */
        seconds: 120,
        title: 'Breathe',
        guidance:
          'Breathe in slowly, and out slowly. If your mind wanders, that is fine, and noticing it is the practice.',
        breathingTechniqueId: 'box-breathing',
      },
      {
        seconds: 60,
        title: 'Widen Out',
        guidance: 'Bring your attention back to the whole room, including the sounds around you.',
      },
      {
        seconds: 80,
        title: 'Rest',
        guidance: 'Stay still. Let the last moments pass without trying to hold onto them.',
      },
    ],
    safetyNote:
      'Keep this seated and somewhere safe. Stop if you feel light-headed, and return to normal breathing straight away.',
  }),

  defineGuidedActivity({
    id: 'ten-minute-body-scan',
    kind: 'meditation',
    name: 'Ten Minute Body Scan',
    summary: 'Ten minutes of attention, from your feet upwards',
    progressNoun: 'stages',
    steps: [
      {
        seconds: 30,
        title: 'Settle',
        guidance: 'Lie down or sit back, whichever is more comfortable. Loosen anything tight.',
        cameraConfigId: 'meditation-posture',
        // This step invites the person to lie down, so the camera may confirm
        // they are in frame and must not comment on how upright they are. See
        // `MeditationPostureExpectation`.
        postureExpectation: 'in-frame',
      },
      {
        seconds: 150,
        title: 'Feet and Legs',
        guidance: 'Feel your feet against the floor, then move your attention slowly up your legs.',
      },
      {
        seconds: 150,
        title: 'Body and Stomach',
        guidance: 'Notice your back, your stomach, and your breathing, without changing any of them.',
      },
      {
        seconds: 150,
        title: 'Hands and Arms',
        guidance: 'Feel your hands, then your arms and shoulders. Let them be heavy.',
      },
      {
        seconds: 120,
        title: 'Head and Face',
        guidance: 'Relax your jaw and your forehead. Unclench your teeth.',
      },
    ],
    safetyNote:
      'Lying down on your back is fine, but not on a bed if you would be unable to turn over. Stop at any point.',
  }),

  defineGuidedActivity({
    id: 'seated-gentle-breathing',
    kind: 'meditation',
    name: '2-Minute Gentle Breathing',
    summary: 'A short seated breathing break designed for easy relaxation',
    progressNoun: 'stages',
    ambientAudio: { source: WAVES_AUDIO, volume: 0.28 },
    steps: [
      {
        seconds: 20,
        title: 'Settle',
        guidance:
          'Sit back comfortably in your chair with your feet flat on the floor. Rest your hands in your lap.',
        cameraConfigId: 'meditation-posture',
        postureExpectation: 'seated-upright',
      },
      {
        seconds: 80,
        title: 'Gentle Breath',
        guidance:
          'Breathe in slowly through your nose and breathe out gently. Follow the circle on screen.',
        breathingTechniqueId: 'gentle-breathing',
      },
      {
        seconds: 20,
        title: 'Quiet Rest',
        guidance: 'Let your breathing return to its own natural rhythm and sit quietly.',
      },
    ],
    safetyNote:
      'Keep this seated in a sturdy chair. Stop if you feel dizzy or lightheaded, and return to your natural breathing.',
  }),

  defineGuidedActivity({
    id: 'seated-body-relaxation',
    kind: 'meditation',
    name: '3-Minute Seated Body Relaxation',
    summary: 'A soothing seated body relaxation to ease tension from head to toe',
    progressNoun: 'stages',
    ambientAudio: { source: RAIN_AUDIO, volume: 0.28 },
    steps: [
      {
        seconds: 20,
        title: 'Settle',
        guidance:
          'Sit comfortably against the back of your chair. Let your eyes close or look softly downward.',
        cameraConfigId: 'meditation-posture',
        postureExpectation: 'seated-upright',
      },
      {
        seconds: 50,
        title: 'Shoulders and Hands',
        guidance: 'Let your shoulders drop away from your ears. Soften your hands and fingers.',
      },
      {
        seconds: 60,
        title: 'Back and Legs',
        guidance:
          'Feel the chair supporting your back and thighs. Let your legs feel heavy and supported.',
      },
      {
        seconds: 50,
        title: 'Peaceful Rest',
        guidance:
          'Notice your jaw and forehead softening. Rest here quietly until the timer ends.',
      },
    ],
    safetyNote:
      'Stay comfortably seated throughout. Open your eyes or take a pause whenever you wish.',
  }),

  defineGuidedActivity({
    id: 'seated-peaceful-mind',
    kind: 'meditation',
    name: '5-Minute Peaceful Mind',
    summary: 'Five unhurried minutes of gentle breath and peaceful reflection',
    progressNoun: 'stages',
    ambientAudio: { source: BIRDS_AUDIO, volume: 0.28 },
    steps: [
      {
        seconds: 25,
        title: 'Settle',
        guidance:
          'Find a comfortable seated position. Rest your hands gently on your knees or lap.',
        cameraConfigId: 'meditation-posture',
        postureExpectation: 'seated-upright',
      },
      {
        seconds: 80,
        title: 'Easy Breathing',
        guidance: 'Follow the gentle breathing rhythm at your own comfortable pace.',
        breathingTechniqueId: 'easy-rhythm',
      },
      {
        seconds: 135,
        title: 'Quiet Gratitude',
        guidance:
          'Bring to mind one simple thing, person, or moment you feel grateful for today.',
      },
      {
        seconds: 60,
        title: 'Gentle Return',
        guidance:
          'Slowly notice the room around you and wiggle your fingers and toes before opening your eyes.',
      },
    ],
    safetyNote:
      'Sit in a supportive chair with feet flat. Take a break at any point if you feel uneasy.',
  }),

  defineGuidedActivity({
    id: 'bedtime-wind-down',
    kind: 'meditation',
    name: '3-Minute Bedtime Wind-Down',
    summary: 'A gentle lying-down rest with soft rain sounds to help you unwind before sleep',
    progressNoun: 'stages',
    ambientAudio: { source: RAIN_AUDIO, volume: 0.25 },
    steps: [
      {
        seconds: 20,
        title: 'Get Comfortable',
        guidance:
          'Lie down comfortably on your bed or recliner. Let your arms rest loosely by your sides.',
        cameraConfigId: 'meditation-posture',
        postureExpectation: 'in-frame',
      },
      {
        seconds: 80,
        title: 'Slow Nighttime Breath',
        guidance: 'Breathe in slowly and let each breath out feel longer and softer.',
        breathingTechniqueId: 'gentle-breathing',
      },
      {
        seconds: 80,
        title: 'Heavy Restful Body',
        guidance:
          'Let the bed support your entire body. Allow your shoulders, legs, and face to feel heavy and still.',
      },
    ],
    safetyNote:
      'Practice lying down in a safe, comfortable place where you will not roll off. Stop anytime if you feel uncomfortable.',
  }),

  defineGuidedActivity({
    id: 'open-eyes-sound-awareness',
    kind: 'meditation',
    name: '3-Minute Open-Eyes Sound Awareness',
    summary: 'Eyes-open listening meditation with gentle nature sounds for daytime calm',
    progressNoun: 'stages',
    ambientAudio: { source: BIRDS_AUDIO, volume: 0.32 },
    steps: [
      {
        seconds: 20,
        title: 'Soft Gaze',
        guidance:
          'Keep your eyes gently open and let your gaze rest on one comfortable spot in the room.',
      },
      {
        seconds: 60,
        title: 'Nearby Sounds',
        guidance:
          'Listen to the gentle nature sounds and any soft sounds close to you, without needing to label them.',
      },
      {
        seconds: 60,
        title: 'Distant Sounds',
        guidance:
          'Widen your listening to notice sounds further away in your home or outside.',
      },
      {
        seconds: 40,
        title: 'Easy Return',
        guidance:
          'Take one easy breath, notice the room around you, and move gently when you are ready.',
      },
    ],
    safetyNote:
      'Keep your eyes comfortably open throughout. Lower the sound volume or stop at any point if you wish.',
  }),
];
