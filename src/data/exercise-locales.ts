import type { Exercise } from './exercises';
import type { Language } from '../hooks/use-language';

type ExerciseCopy = Pick<Exercise, 'name' | 'target'>;

export const exerciseListCopy: Record<'hi' | 'ta', Record<string, ExerciseCopy>> = {
  hi: {
    'seated-knee-extension': { name: 'बैठकर घुटना सीधा करना', target: 'पैर' },
    'seated-arm-raise': { name: 'बैठकर हाथ उठाना', target: 'कंधे और हाथ' },
    'sit-to-stand': { name: 'बैठकर खड़े होना', target: 'पैर और संतुलन' },
    'supported-squat': { name: 'सहारे से उठक-बैठक', target: 'पैर' },
    'wall-push-ups': { name: 'दीवार पर पुश-अप', target: 'छाती और हाथ' },
    'standing-heel-raises': { name: 'एड़ियाँ उठाना', target: 'पिंडलियाँ' },
    'toe-raises': { name: 'पंजे उठाना', target: 'पिंडलियाँ और टखने' },
    'standing-hip-abduction': { name: 'खड़े होकर पैर बगल में उठाना', target: 'कूल्हे का बाहरी भाग' },
    'standing-march': { name: 'खड़े होकर जगह पर कदमताल', target: 'कूल्हे और पैर' },
    'heel-to-toe-walking': { name: 'एड़ी से पंजे तक चलना', target: 'संतुलन और तालमेल' },
  },
  ta: {
    'seated-knee-extension': { name: 'அமர்ந்து முழங்காலை நீட்டுதல்', target: 'கால்கள்' },
    'seated-arm-raise': { name: 'அமர்ந்து கைகளை உயர்த்துதல்', target: 'தோள்கள் மற்றும் கைகள்' },
    'sit-to-stand': { name: 'அமர்ந்து எழுதல்', target: 'கால்கள் மற்றும் சமநிலை' },
    'supported-squat': { name: 'ஆதரவுடன் குந்துதல்', target: 'கால்கள்' },
    'wall-push-ups': { name: 'சுவரில் புஷ்-அப்', target: 'மார்பு மற்றும் கைகள்' },
    'standing-heel-raises': { name: 'குதிகால்களை உயர்த்துதல்', target: 'கெண்டைக்கால்கள்' },
    'toe-raises': { name: 'கால் விரல்களை உயர்த்துதல்', target: 'கணுக்கால்கள்' },
    'standing-hip-abduction': { name: 'நின்று காலை பக்கமாக உயர்த்துதல்', target: 'இடுப்பின் வெளிப்பகுதி' },
    'standing-march': { name: 'நின்ற இடத்தில் அணிவகுப்பு நடை', target: 'இடுப்பு மற்றும் கால்கள்' },
    'heel-to-toe-walking': { name: 'குதிகால் முதல் விரல் வரை நடை', target: 'சமநிலை மற்றும் ஒருங்கிணைப்பு' },
  },
};

export function localizedExerciseListCopy(exercise: Exercise, language: Language): ExerciseCopy {
  if (language === 'kn') return exercise.kannada ?? exercise;
  if (language === 'hi' || language === 'ta') return exerciseListCopy[language][exercise.id] ?? exercise;
  return exercise;
}
