export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type Exercise = {
  id: string;
  name: string;
  category: string;
  target: string;
  difficulty: ExerciseDifficulty;
  /** Suggested duration in seconds. */
  durationSeconds: number;
  /** Elder-friendly plain-language description. */
  description: string;
  instructions: string[];
  safetyNote: string;
  cameraHint?: string;
  kannada?: Pick<Exercise, 'name' | 'target' | 'description' | 'instructions' | 'safetyNote' | 'cameraHint'>;
  countUnit?: 'step';
};

export const exercisesCatalog: readonly Exercise[] = [
  {
    id: 'seated-knee-extension',
    name: 'Seated Knee Extension',
    category: 'Exercise',
    target: 'Legs',
    difficulty: 'beginner',
    durationSeconds: 180,
    description:
      'A gentle seated movement that works the muscles at the front of your thigh. It helps keep your knees strong and your legs moving easily.',
    instructions: [
      'Sit tall in a stable chair with both feet flat on the floor.',
      'Brace yourself by holding the sides of the chair.',
      'Slowly straighten one leg until it is level with your knee.',
      'Pause for a moment, then lower the leg slowly.',
      'Repeat with the other leg. Alternate sides at a calm, steady pace.',
    ],
    safetyNote:
      'Stop immediately if you feel pain, discomfort, or shortness of breath. Keep every movement slow and gentle.',
  },
  {
    id: 'seated-arm-raise',
    name: 'Seated Arm Raise',
    category: 'Exercise',
    target: 'Shoulders',
    difficulty: 'beginner',
    durationSeconds: 180,
    description:
      'A gentle seated movement that lifts both arms up and lowers them again. It gives your shoulders and upper back some easy movement.',
    instructions: [
      'Sit tall in a stable chair with your feet flat on the floor.',
      'Rest your arms down by your sides and relax your shoulders.',
      'Breathe out and raise both arms forward and up, as far as is comfortable.',
      'Pause for a moment, then lower your arms slowly.',
      'Repeat at a calm, steady pace.',
    ],
    safetyNote:
      'Keep the movement within what feels comfortable. Stop immediately if you feel pain, discomfort, or shortness of breath.',
  },
  {
    id: 'sit-to-stand',
    name: 'Sit-to-Stand',
    category: 'Exercise',
    target: 'Legs and hips',
    difficulty: 'beginner',
    durationSeconds: 180,
    description:
      'A supported standing movement from a chair. It works the muscles of your thighs and hips and makes everyday standing and sitting easier.',
    instructions: [
      'Sit towards the front of a stable chair, with your feet a little back and flat on the floor.',
      'Lean your chest forward slightly and place your hands on your thighs.',
      'Stand up slowly, without pushing off hard with your arms.',
      'Pause while standing, then lower yourself back into the chair slowly.',
      'Repeat at a calm, steady pace.',
    ],
    safetyNote:
      'Use a sturdy chair without wheels. Turn your head to the side if you become dizzy, and sit back down straight away.',
  },
  {
    id: "supported-squat",
    name: "Supported Squat",
    category: "Exercise",
    target: "Legs",
    difficulty: "beginner",
    durationSeconds: 180,
    description: "Bend and straighten your knees while holding a steady support.",
    cameraHint: "After pressing Start, stand still with your side to the camera until you see “Ready to squat”. Keep your hip, knee and ankle in view.",
    kannada: {
      name: "ಆಧಾರದೊಂದಿಗೆ ಸ್ಕ್ವಾಟ್", target: "ಕಾಲುಗಳು",
      description: "ಸ್ಥಿರವಾದ ಆಧಾರವನ್ನು ಹಿಡಿದು ಮೊಣಕಾಲುಗಳನ್ನು ಬಗ್ಗಿಸಿ, ಮತ್ತೆ ನೇರವಾಗಿ ನಿಲ್ಲಿ.",
      cameraHint: "ಪ್ರಾರಂಭಿಸಿದ ನಂತರ “Ready to squat” ಕಾಣುವವರೆಗೆ ಕ್ಯಾಮೆರಾಗೆ ಪಕ್ಕವಾಗಿ ಸ್ಥಿರವಾಗಿ ನಿಲ್ಲಿ. ನಿಮ್ಮ ಸೊಂಟ, ಮೊಣಕಾಲು ಮತ್ತು ಕಣಕಾಲು ಕಾಣುವಂತಿರಲಿ.",
      instructions: ["ಸ್ಥಿರವಾದ ಕೌಂಟರ್ ಹಿಡಿದು ಪಾದಗಳನ್ನು ಸೊಂಟದ ಅಗಲಕ್ಕೆ ದೂರವಿಟ್ಟು ನಿಲ್ಲಿ.", "ಹಿಮ್ಮಡಿಗಳನ್ನು ನೆಲದಲ್ಲೇ ಇಟ್ಟು, ಮೊಣಕಾಲುಗಳನ್ನು ಕಾಲ್ಬೆರಳುಗಳ ದಿಕ್ಕಿನಲ್ಲಿ ಸ್ವಲ್ಪ ಬಗ್ಗಿಸಿ.", "ಮತ್ತೆ ನೇರವಾಗಿ ನಿಂತಾಗ ಒಂದು ಸ್ಕ್ವಾಟ್ ಪೂರ್ಣವಾಗುತ್ತದೆ."],
      safetyNote: "ಆಧಾರವು ಕೈಗೆಟುಕುವಂತಿರಲಿ. ನಿಮಗೆ ಆರಾಮವಾಗುವಷ್ಟು ಮಾತ್ರ ಬಗ್ಗಿ.",
    },
    instructions: [
      "Rest your hands on a fixed counter and stand with your feet hip-width apart.",
      "Bend both knees a little, keeping your heels down and knees pointing toward your toes.",
      "Stand tall again to complete one squat.",
    ],
    safetyNote: "Keep the support within reach and use a comfortable depth.",
  },
  {
    id: "wall-push-ups",
    name: "Wall Push-ups",
    category: "Exercise",
    target: "Chest and arms",
    difficulty: "beginner",
    durationSeconds: 180,
    description: "Bend your elbows to move toward a wall, then push back.",
    cameraHint: "Place the camera beside you so it can see your shoulder, elbow and wrist.",
    kannada: {
      name: "ಗೋಡೆಯ ಪುಷ್-ಅಪ್‌ಗಳು", target: "ಎದೆ ಮತ್ತು ತೋಳುಗಳು",
      description: "ಮೊಣಕೈಗಳನ್ನು ಬಗ್ಗಿಸಿ ಗೋಡೆಯ ಕಡೆಗೆ ಬಾಗಿ, ನಂತರ ಕೈಗಳಿಂದ ಒತ್ತಿ ಹಿಂದಕ್ಕೆ ಬನ್ನಿ.",
      cameraHint: "ಭುಜ, ಮೊಣಕೈ ಮತ್ತು ಮಣಿಕಟ್ಟು ಪಕ್ಕದಿಂದ ಕಾಣುವಂತೆ ಕ್ಯಾಮೆರಾ ಇರಿಸಿ.",
      instructions: ["ಗೋಡೆಗೆ ಮುಖ ಮಾಡಿ, ಅಂಗೈಗಳನ್ನು ಭುಜದ ಎತ್ತರದಲ್ಲಿ ಗೋಡೆಯ ಮೇಲೆ ಇರಿಸಿ.", "ಆರಾಮದಷ್ಟು ಹಿಂದಕ್ಕೆ ಹೆಜ್ಜೆ ಇಡಿ. ದೇಹವನ್ನು ನೇರವಾಗಿಟ್ಟುಕೊಂಡು ಮೊಣಕೈಗಳನ್ನು ಬಗ್ಗಿಸಿ.", "ಅಂಗೈಗಳಿಂದ ಗೋಡೆಯನ್ನು ಒತ್ತಿ ಆರಂಭದ ಭಂಗಿಗೆ ಹಿಂದಿರುಗಿ."],
      safetyNote: "ಒಣಗಿದ, ಗಟ್ಟಿಯಾದ ಗೋಡೆಯನ್ನು ಬಳಸಿ. ಪಾದಗಳು ಜಾರಬಾರದು.",
    },
    instructions: [
      "Face a clear wall and place your palms against it at shoulder height.",
      "Step back a comfortable distance. Keep your body in a line as you bend your elbows.",
      "Press through your hands to return to the starting position.",
    ],
    safetyNote: "Use a dry, stable wall and keep your feet from sliding.",
  },
  {
    id: "standing-heel-raises",
    name: "Heel Raises",
    category: "Exercise",
    target: "Calves",
    difficulty: "beginner",
    durationSeconds: 180,
    description: "Rise onto the balls of both feet, then lower your heels.",
    cameraHint: "Start with both feet flat. Set the camera slightly to one side so both heels and toes are visible.",
    kannada: {
      name: "ಹಿಮ್ಮಡಿ ಎತ್ತುವುದು", target: "ಮೀನಖಂಡಗಳು",
      description: "ಎರಡೂ ಹಿಮ್ಮಡಿಗಳನ್ನು ಒಟ್ಟಿಗೆ ಎತ್ತಿ, ನಿಧಾನವಾಗಿ ಕೆಳಗಿಳಿಸಿ.",
      cameraHint: "ಎರಡೂ ಪಾದಗಳ ಹಿಮ್ಮಡಿಗಳು ಮತ್ತು ಕಾಲ್ಬೆರಳುಗಳು ಕಾಣುವಂತೆ ಕ್ಯಾಮೆರಾವನ್ನು ಸ್ವಲ್ಪ ಓರೆಯಾಗಿ ಪಕ್ಕದಲ್ಲಿ ಇರಿಸಿ. ಮೊದಲು ಎರಡೂ ಪಾದಗಳನ್ನು ನೆಲಕ್ಕೆ ಸಮವಾಗಿ ಇಡಿ.",
      instructions: ["ಸ್ಥಿರವಾದ ಕೌಂಟರ್ ಹಿಡಿದು ಎರಡೂ ಪಾದಗಳನ್ನು ನೆಲಕ್ಕೆ ಸಮವಾಗಿ ಇಟ್ಟು ನಿಲ್ಲಿ.", "ಪಾದಗಳ ಮುಂಭಾಗವನ್ನು ನೆಲದಲ್ಲೇ ಇಟ್ಟು ಎರಡೂ ಹಿಮ್ಮಡಿಗಳನ್ನು ಒಟ್ಟಿಗೆ ಎತ್ತಿ.", "ಎರಡೂ ಹಿಮ್ಮಡಿಗಳನ್ನು ನಿಧಾನವಾಗಿ ಕೆಳಗಿಳಿಸಿ."],
      safetyNote: "ಕೌಂಟರ್ ಹಿಡಿದೇ ಇರಿ. ಸಮತೋಲನ ಕಾಪಾಡಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಾಗುವಷ್ಟು ಮಾತ್ರ ಎತ್ತಿ.",
    },
    instructions: [
      "Stand upright with your feet flat and hold a stable counter.",
      "Lift your heels together while the balls of your feet stay down.",
      "Lower both heels gently to complete one raise.",
    ],
    safetyNote: "Keep hold of the counter and move only as high as feels steady.",
  },
  {
    id: "toe-raises",
    name: "Toe Raises",
    category: "Exercise",
    target: "Shins and ankles",
    difficulty: "beginner",
    durationSeconds: 180,
    description: "Lift the fronts of your feet while keeping both heels on the floor.",
    cameraHint: "Start with both feet flat. Set the camera slightly to one side so both heels and toes are visible.",
    kannada: {
      name: "ಕಾಲ್ಬೆರಳುಗಳನ್ನು ಎತ್ತುವುದು", target: "ಮೊಣಕಾಲಿನ ಕೆಳಭಾಗ ಮತ್ತು ಕಣಕಾಲುಗಳು",
      description: "ಎರಡೂ ಹಿಮ್ಮಡಿಗಳನ್ನು ನೆಲದಲ್ಲೇ ಇಟ್ಟು ಪಾದಗಳ ಮುಂಭಾಗವನ್ನು ಎತ್ತಿ.",
      cameraHint: "ಎರಡೂ ಪಾದಗಳ ಹಿಮ್ಮಡಿಗಳು ಮತ್ತು ಕಾಲ್ಬೆರಳುಗಳು ಕಾಣುವಂತೆ ಕ್ಯಾಮೆರಾವನ್ನು ಸ್ವಲ್ಪ ಓರೆಯಾಗಿ ಪಕ್ಕದಲ್ಲಿ ಇರಿಸಿ. ಮೊದಲು ಎರಡೂ ಪಾದಗಳನ್ನು ನೆಲಕ್ಕೆ ಸಮವಾಗಿ ಇಡಿ.",
      instructions: ["ಎರಡೂ ಕೈಗಳಿಂದ ಸ್ಥಿರವಾದ ಕೌಂಟರ್ ಹಿಡಿದು ಪಾದಗಳನ್ನು ನೆಲಕ್ಕೆ ಸಮವಾಗಿ ಇಡಿ.", "ಹಿಮ್ಮಡಿಗಳನ್ನು ನೆಲದಲ್ಲೇ ಇಟ್ಟು ಎರಡೂ ಪಾದಗಳ ಮುಂಭಾಗವನ್ನು ನಿಧಾನವಾಗಿ ಎತ್ತಿ.", "ಕಾಲ್ಬೆರಳುಗಳನ್ನು ಮತ್ತೆ ನೆಲಕ್ಕೆ ಇಳಿಸಿ."],
      safetyNote: "ಆಧಾರವನ್ನು ಹಿಡಿದೇ ಇರಿ. ಹಿಂದಕ್ಕೆ ವಾಲಬೇಡಿ.",
    },
    instructions: [
      "Stand with your feet flat and hold a fixed counter with both hands.",
      "Keep your heels planted and gently lift the fronts of both feet.",
      "Lower your toes to finish one raise.",
    ],
    safetyNote: "Keep your weight supported and avoid leaning backward.",
  },
  {
    id: "standing-hip-abduction",
    name: "Standing Hip Abduction",
    category: "Exercise",
    target: "Outer hips",
    difficulty: "beginner",
    durationSeconds: 180,
    description: "Move one straight leg out to the side while standing with support.",
    cameraHint: "Face the camera and keep your shoulders, hips and ankles in view.",
    kannada: {
      name: "ನಿಂತು ಕಾಲನ್ನು ಬದಿಗೆ ಎತ್ತುವುದು", target: "ಸೊಂಟದ ಹೊರಭಾಗ",
      description: "ಆಧಾರವನ್ನು ಹಿಡಿದು ನಿಂತು ಒಂದು ಕಾಲನ್ನು ನೇರವಾಗಿ ಬದಿಗೆ ಎತ್ತಿ.",
      cameraHint: "ಕ್ಯಾಮೆರಾಗೆ ಮುಖ ಮಾಡಿ. ಎರಡೂ ಸೊಂಟದ ಬದಿಗಳು, ಭುಜಗಳು ಮತ್ತು ಕಣಕಾಲುಗಳು ಕಾಣುವಂತಿರಲಿ.",
      instructions: ["ಸ್ಥಿರವಾದ ಆಧಾರ ಹಿಡಿದು ಪಾದಗಳನ್ನು ಹತ್ತಿರ ಇಟ್ಟು ನಿಲ್ಲಿ.", "ದೇಹವನ್ನು ನೇರವಾಗಿ ಮತ್ತು ಕಾಲ್ಬೆರಳುಗಳನ್ನು ಮುಂದಕ್ಕೆ ಇಟ್ಟು ಒಂದು ಕಾಲನ್ನು ಬದಿಗೆ ಎತ್ತಿ.", "ಕಾಲನ್ನು ಮತ್ತೆ ಸೊಂಟದ ಕೆಳಗೆ ತಂದು ಇನ್ನೊಂದು ಕಾಲಿನಿಂದ ಪುನರಾವರ್ತಿಸಿ."],
      safetyNote: "ದೇಹ ವಾಲದಂತೆ ಅಥವಾ ತಿರುಗದಂತೆ ಸ್ವಲ್ಪ ದೂರ ಮಾತ್ರ ಕಾಲನ್ನು ಎತ್ತಿ.",
    },
    instructions: [
      "Hold a stable support and begin with your feet close together.",
      "Keep your torso upright and toes forward as you lift one leg to the side.",
      "Bring it back under your hip, then repeat on the other side.",
    ],
    safetyNote: "Keep the movement small enough to avoid leaning or twisting.",
  },
  {
    id: "standing-march",
    name: "Standing March",
    category: "Exercise",
    target: "Hips and legs",
    difficulty: "beginner",
    durationSeconds: 180,
    description: "March in place, lifting one knee at a time.",
    cameraHint: "Stand sideways to the camera with your shoulders, hips and knees visible.",
    kannada: {
      name: "ನಿಂತಲ್ಲೇ ಹೆಜ್ಜೆ ಹಾಕುವುದು", target: "ಸೊಂಟ ಮತ್ತು ಕಾಲುಗಳು",
      description: "ನಿಂತಲ್ಲೇ ಒಂದೊಂದು ಮೊಣಕಾಲನ್ನು ಸರದಿಯಾಗಿ ಎತ್ತಿ.",
      cameraHint: "ಭುಜಗಳು, ಸೊಂಟ ಮತ್ತು ಮೊಣಕಾಲುಗಳು ಕಾಣುವಂತೆ ಕ್ಯಾಮೆರಾಗೆ ಪಕ್ಕವಾಗಿ ನಿಲ್ಲಿ.",
      instructions: ["ಸ್ಥಿರವಾದ ಕೌಂಟರ್ ಪಕ್ಕದಲ್ಲಿ ನಿಂತು ಒಂದು ಕೈಯಿಂದ ಅದನ್ನು ಹಿಡಿಯಿರಿ.", "ದೇಹವನ್ನು ನೇರವಾಗಿಟ್ಟುಕೊಂಡು ಒಂದು ಮೊಣಕಾಲನ್ನು ಆರಾಮವಾಗುವಷ್ಟು ಮುಂದಕ್ಕೆ ಎತ್ತಿ.", "ಪಾದವನ್ನು ನೆಲಕ್ಕೆ ಇಟ್ಟು ಇನ್ನೊಂದು ಮೊಣಕಾಲನ್ನು ಎತ್ತಿ. ಒಮ್ಮೆ ಎತ್ತಿ ಇಳಿಸಿದಾಗ ಒಂದು ಪುನರಾವರ್ತನೆ ಪೂರ್ಣವಾಗುತ್ತದೆ."],
      safetyNote: "ಆಧಾರವನ್ನು ಹಿಡಿದೇ ಇರಿ ಮತ್ತು ಆರಾಮದ ವೇಗದಲ್ಲಿ ಮಾಡಿ.",
    },
    instructions: [
      "Stand beside a fixed counter with a hand on it.",
      "Lift one knee forward to a comfortable height while keeping your trunk upright.",
      "Put that foot back down, then switch legs. Each lift and return counts once.",
    ],
    safetyNote: "Use the support throughout and keep your pace comfortable.",
  },
  {
    id: "heel-to-toe-walking",
    name: "Heel-to-Toe Walking",
    category: "Exercise",
    target: "Balance and coordination",
    difficulty: "beginner",
    durationSeconds: 180,
    description: "Walk along a line, placing each heel just ahead of the opposite toes.",
    cameraHint: "Set the camera side-on to a clear path. Keep both feet in frame as you walk across it.",
    kannada: {
      name: "ಹಿಮ್ಮಡಿ–ಕಾಲ್ಬೆರಳ ನಡಿಗೆ", target: "ಸಮತೋಲನ ಮತ್ತು ಹೊಂದಾಣಿಕೆ",
      description: "ಒಂದು ಪಾದದ ಬೆರಳುಗಳ ಮುಂದೆ ಇನ್ನೊಂದು ಪಾದದ ಹಿಮ್ಮಡಿಯನ್ನು ಇಡುತ್ತಾ ನೇರ ಸಾಲಿನಲ್ಲಿ ನಡೆಯಿರಿ.",
      cameraHint: "ಅಡೆತಡೆಯಿಲ್ಲದ ದಾರಿಗೆ ಪಕ್ಕದಲ್ಲಿ ಕ್ಯಾಮೆರಾ ಇರಿಸಿ. ನಡೆಯುವಾಗ ಎರಡೂ ಪಾದಗಳು ಕಾಣುವಂತಿರಲಿ.",
      instructions: ["ಸ್ಥಿರವಾದ ಕೌಂಟರ್ ಅಥವಾ ಕೈಪಿಡಿಯ ಪಕ್ಕದಲ್ಲಿ ಎರಡೂ ಪಾದಗಳನ್ನು ಅಕ್ಕಪಕ್ಕ ಇಟ್ಟು ನಿಲ್ಲಿ.", "ಮುಂದೆ ನೋಡುತ್ತಾ ಒಂದು ಹೆಜ್ಜೆ ಇಡಿ. ಹಿಮ್ಮಡಿಯನ್ನು ಇನ್ನೊಂದು ಪಾದದ ಬೆರಳುಗಳ ಮುಂದೆ ಹತ್ತಿರ ಇರಿಸಿ.", "ಪಾದಗಳನ್ನು ಬದಲಿಸುತ್ತಾ ನಡೆಯಿರಿ. ತಿರುಗುವ ಅಥವಾ ಕ್ಯಾಮೆರಾದ ನೋಟದಿಂದ ಹೊರಹೋಗುವ ಮೊದಲು ವಿರಾಮ ನೀಡಿ. ಸ್ಥಿರವಾಗಿ ನಿಂತ ಬಳಿಕ ಮುಂದುವರಿಸಿ."],
      safetyNote: "ಕೈಗೆಟುಕುವಂತೆ ಆಧಾರ ಇರಲಿ. ಸಮತೋಲನ ತಪ್ಪಿದಂತೆ ಅನಿಸಿದರೆ ನಿಲ್ಲಿಸಿ.",
    },
    instructions: [
      "Start with your feet next to each other beside a stable counter or rail.",
      "Look ahead and step forward, placing one heel close to the toes of your other foot.",
      "Alternate feet. Pause before turning or leaving the camera view; resume from a steady stance.",
    ],
    safetyNote: "Keep support within reach. Stop if you feel unsteady.",
    countUnit: 'step',
  },
];

export function getExerciseById(id?: string | string[] | null): Exercise | undefined {
  const key = Array.isArray(id) ? id[0] : id;
  if (!key) return undefined;
  return exercisesCatalog.find((exercise) => exercise.id === key);
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  return `${totalMinutes} min`;
}
