import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';

export type Language = 'en' | 'kn' | 'hi' | 'ta';

export const TRANSLATIONS = {
  en: {
    appName: 'OSMIUM',
    welcomeHome: 'Welcome Home',
    exercise: 'Exercise',
    yoga: 'Yoga',
    meditation: 'Meditation',
    start: 'Start',
    preview: 'Preview',
    home: 'Home',
    progress: 'Progress',
    family: 'Family',
    settings: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    currentLanguage: 'Current language',
    english: 'English',
    kannada: 'ಕನ್ನಡ',
    hindi: 'हिन्दी',
    tamil: 'தமிழ்',
    activities: 'Activities',
    watchDemo: 'Watch demo',
    setsOfTen: '3 sets of 10',
    repsUnit: 'reps',
    stepsUnit: 'steps',
    light: 'Light',
    dark: 'Dark',
    system: 'Same as my phone',
    selected: 'Selected',
    todaysExercises: "Today's Exercises",
    exerciseSubtitle: 'Choose a movement to see instructions and start a session.',
    seatedKneeExtension: 'Seated Knee Extension',
    seatedArmRaise: 'Seated Arm Raise',
    sitToStand: 'Sit-to-Stand',
    startExercise: 'Start Exercise',
    close: 'Close',
    ready: 'Ready',
    steadyPace: 'STEADY PACE',
    hold: 'HOLD',
    release: 'RELEASE',
    greatJob: 'GREAT JOB!',
    repCelebration: '+1 REP!',
    set: 'SET',
    reps: 'REPS',
  },
  kn: {
    appName: 'OSMIUM',
    welcomeHome: 'ಸುಸ್ವಾಗತ',
    exercise: 'ವ್ಯಾಯಾಮ',
    yoga: 'ಯೋಗ',
    meditation: 'ಧ್ಯಾನ',
    start: 'ಪ್ರಾರಂಭಿಸಿ',
    preview: 'ಮುನ್ನೋಟ',
    home: 'ಮುಖಪುಟ',
    progress: 'ಪ್ರಗತಿ',
    family: 'ಕುಟುಂಬ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    appearance: 'ಗೋಚರತೆ',
    language: 'ಭಾಷೆ',
    currentLanguage: 'ಪ್ರಸ್ತುತ ಭಾಷೆ',
    english: 'English',
    kannada: 'ಕನ್ನಡ',
    hindi: 'हिन्दी',
    tamil: 'தமிழ்',
    activities: 'ಚಟುವಟಿಕೆಗಳು',
    watchDemo: 'ಮುನ್ನೋಟ',
    setsOfTen: '3 ಸೆಟ್‌ಗಳು (ತಲಾ 10)',
    repsUnit: 'ಪುನರಾವರ್ತನೆಗಳು',
    stepsUnit: 'ಹೆಜ್ಜೆಗಳು',
    light: 'ತಿಳಿ ಬಣ್ಣ',
    dark: 'ಗಾಢ ಬಣ್ಣ',
    system: 'ಫೋನ್ ಸೆಟ್ಟಿಂಗ್‌ನಂತೆ',
    selected: 'ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ',
    todaysExercises: 'ಇಂದಿನ ವ್ಯಾಯಾಮಗಳು',
    exerciseSubtitle: 'ಸೂಚನೆಗಳನ್ನು ನೋಡಲು ಮತ್ತು ಪ್ರಾರಂಭಿಸಲು ವ್ಯಾಯಾಮವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    seatedKneeExtension: 'ಕುಳಿತು ಮೊಣಕಾಲು ಚಾಚುವುದು',
    seatedArmRaise: 'ಕುಳಿತು ಕೈ ಎತ್ತುವುದು',
    sitToStand: 'ಕುಳಿತು ಏಳುವುದು',
    startExercise: 'ವ್ಯಾಯಾಮ ಪ್ರಾರಂಭಿಸಿ',
    close: 'ಮುಚ್ಚಿ',
    ready: 'ಸಿದ್ಧ',
    steadyPace: 'ಸ್ಥಿರ ವೇಗ',
    hold: 'ಹಿಡಿದುಕೊಳ್ಳಿ',
    release: 'ಬಿಡಿ',
    greatJob: 'ಉತ್ತಮ ಕೆಲಸ!',
    repCelebration: '+1 ಪುನರಾವರ್ತನೆ!',
    set: 'ಸೆಟ್',
    reps: 'ಪುನರಾವರ್ತನೆಗಳು',
  },
  hi: {
    appName: 'OSMIUM', welcomeHome: 'स्वागत है', exercise: 'व्यायाम', yoga: 'योग', meditation: 'ध्यान',
    start: 'शुरू करें', preview: 'पूर्वावलोकन', home: 'होम', progress: 'प्रगति', family: 'परिवार',
    settings: 'सेटिंग्स', appearance: 'दिखावट', language: 'भाषा', currentLanguage: 'वर्तमान भाषा',
    english: 'English', kannada: 'ಕನ್ನಡ', hindi: 'हिन्दी', tamil: 'தமிழ்',
    activities: 'गतिविधियाँ', watchDemo: 'डेमो देखें', setsOfTen: '3 सेट (प्रत्येक में 10)',
    repsUnit: 'दोहराव', stepsUnit: 'कदम', light: 'हल्का', dark: 'गहरा', system: 'फ़ोन जैसा', selected: 'चयनित',
    todaysExercises: 'आज के व्यायाम', exerciseSubtitle: 'निर्देश देखने और शुरू करने के लिए व्यायाम चुनें।',
    seatedKneeExtension: 'बैठकर घुटना सीधा करना', seatedArmRaise: 'बैठकर हाथ उठाना', sitToStand: 'बैठकर खड़े होना',
    startExercise: 'व्यायाम शुरू करें', close: 'बंद करें', ready: 'तैयार', steadyPace: 'स्थिर गति',
    hold: 'रोकें', release: 'छोड़ें', greatJob: 'बहुत अच्छा!', repCelebration: '+1 दोहराव!', set: 'सेट', reps: 'दोहराव',
  },
  ta: {
    appName: 'OSMIUM', welcomeHome: 'வரவேற்கிறோம்', exercise: 'உடற்பயிற்சி', yoga: 'யோகா', meditation: 'தியானம்',
    start: 'தொடங்கு', preview: 'முன்னோட்டம்', home: 'முகப்பு', progress: 'முன்னேற்றம்', family: 'குடும்பம்',
    settings: 'அமைப்புகள்', appearance: 'தோற்றம்', language: 'மொழி', currentLanguage: 'தற்போதைய மொழி',
    english: 'English', kannada: 'ಕನ್ನಡ', hindi: 'हिन्दी', tamil: 'தமிழ்',
    activities: 'செயல்பாடுகள்', watchDemo: 'செய்முறை காணொளி', setsOfTen: '3 செட்கள் (தலா 10)',
    repsUnit: 'முறை', stepsUnit: 'அடிகள்', light: 'வெளிர்', dark: 'இருள்', system: 'தொலைபேசி அமைப்புப்படி', selected: 'தேர்ந்தெடுக்கப்பட்டது',
    todaysExercises: 'இன்றைய உடற்பயிற்சிகள்', exerciseSubtitle: 'வழிமுறைகளைப் பார்த்துத் தொடங்க ஒரு பயிற்சியைத் தேர்ந்தெடுக்கவும்.',
    seatedKneeExtension: 'அமர்ந்து முழங்காலை நீட்டுதல்', seatedArmRaise: 'அமர்ந்து கைகளை உயர்த்துதல்', sitToStand: 'அமர்ந்து எழுதல்',
    startExercise: 'பயிற்சியைத் தொடங்கு', close: 'மூடு', ready: 'தயார்', steadyPace: 'சீரான வேகம்',
    hold: 'நிறுத்திப் பிடி', release: 'விடு', greatJob: 'நன்றாகச் செய்தீர்கள்!', repCelebration: '+1 முறை!', set: 'செட்', reps: 'முறைகள்',
  },
} as const;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => TRANSLATIONS.en[key] || String(key),
});

const STORAGE_KEY = '@noven_language_preference';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  const userSelected = useRef(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (active && !userSelected.current && (saved === 'en' || saved === 'kn' || saved === 'hi' || saved === 'ta')) {
        setLanguageState(saved);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const setLanguage = (lang: Language) => {
    userSelected.current = true;
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  };

  const t = useMemo(() => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return (key: keyof typeof TRANSLATIONS.en): string => {
      return (dict as Record<string, string>)[key] || TRANSLATIONS.en[key] || String(key);
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
