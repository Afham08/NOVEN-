/**
 * NOVEN design tokens.
 *
 * Direction: premium, warm, calm, human-first, elder-friendly, wellness-oriented.
 * Deliberately not clinical, not neon, not cyberpunk. No purple identity.
 *
 * Colors follow the brand palette:
 * - Warm white  #FAF9F6 (app background)
 * - Charcoal    #202522 (primary text / inverse surfaces)
 * - Black ink   #111111 (headings)
 * - Orange      #F15A24 (brand accent)
 * - Teal/sage   #527568 (secondary accent)
 * - Gray        #68716D (secondary text)
 * - Pale sage   #E7EFEB (soft surfaces)
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FAFAF8',
    exerciseButton: '#141414',
    exerciseButtonText: '#FFFFFF',
    secondaryButton: 'rgba(255,255,255,0.56)',
    secondaryButtonText: '#302A25',
    glass: 'rgba(255,255,255,0.78)',
    glassBorder: 'rgba(255,255,255,0.92)',
    activityGlass: 'rgba(255,248,242,0.46)',
    activityGlassBorder: 'rgba(255,255,255,0.66)',
    exerciseGlass: 'rgba(255,248,240,0.48)',
    glowTop: '#FF7900',
    glowMid: '#FFD4AA',
    glowHot: '#E63900',
    glowClear: '#FFFFFF00',
    shadow: 'rgba(25,25,25,0.07)',
    activityShadow: 'rgba(0,0,0,0.08)',
    backgroundElement: 'rgba(255,255,255,0.84)',
    backgroundSelected: '#F1EFEA',
    text: '#202522',
    heading: '#111111',
    textSecondary: '#68716D',
    textDisabled: '#9AA39E',
    accent: '#F15A24',
    accentStrong: '#B94215',
    accentOnInverse: '#F15A24',
    accentSoft: '#FDE9E2',
    accentSecondary: '#675A4D',
    accentSecondarySoft: '#E4ECE7',
    sageSoft: '#F0EEE9',
    onAccent: '#FFFFFF',
    onInverse: '#FAF9F6',
    onInverseSecondary: 'rgba(250, 249, 246, 0.72)',
    inverseTrack: 'rgba(250, 249, 246, 0.16)',
    scoreAccentOnInverse: '#F58A5F',
    scoreSageOnInverse: '#86AC9D',
    success: '#2F6A4F',
    successSoft: '#E4F2EA',
    warning: '#855600',
    warningSoft: '#FFF1D6',
    danger: '#B42318',
    dangerSoft: '#FCE9E7',
    onDanger: '#FFFFFF',
    cameraSurface: '#202522',
    cameraOverlay: 'rgba(18, 20, 19, 0.74)',
    cameraOverlayStrong: 'rgba(18, 20, 19, 0.80)',
    cameraOnOverlay: '#FAF9F6',
    cameraOnOverlaySecondary: '#E7EFEB',
    cameraOnOverlayMuted: 'rgba(250, 249, 246, 0.72)',
    border: '#D7D3CE',
    surfaceInverse: '#202522',
  },
  dark: {
    background: '#050507',
    exerciseButton: '#FFF4EA',
    exerciseButtonText: '#241B15',
    secondaryButton: 'rgba(255,255,255,0.16)',
    secondaryButtonText: '#FFF4EA',
    glass: 'rgba(255,255,255,0.12)',
    glassBorder: 'rgba(255,255,255,0.24)',
    activityGlass: 'rgba(255,255,255,0.12)',
    activityGlassBorder: 'rgba(255,255,255,0.24)',
    exerciseGlass: 'rgba(27,25,25,0.68)',
    glowTop: '#FF7100',
    glowMid: '#CE2605',
    glowHot: '#F33400',
    glowClear: '#05050700',
    shadow: 'rgba(0,0,0,0.25)',
    activityShadow: 'rgba(255,100,30,0.10)',
    backgroundElement: 'rgba(36,36,36,0.90)',
    backgroundSelected: '#2A2F2C',
    text: '#ECEAE4',
    heading: '#FAF9F6',
    textSecondary: '#A4ACA7',
    textDisabled: '#6F7772',
    accent: '#F15A24',
    accentStrong: '#FFAA75',
    accentOnInverse: '#F15A24',
    accentSoft: '#3A2118',
    accentSecondary: '#E4B99D',
    accentSecondarySoft: '#223630',
    sageSoft: '#292623',
    onAccent: '#202522',
    onInverse: '#FAF9F6',
    onInverseSecondary: 'rgba(250, 249, 246, 0.72)',
    inverseTrack: 'rgba(250, 249, 246, 0.16)',
    scoreAccentOnInverse: '#F58A5F',
    scoreSageOnInverse: '#86AC9D',
    success: '#7FC99A',
    successSoft: '#1E3227',
    warning: '#F1C56B',
    warningSoft: '#342C1C',
    danger: '#FF8178',
    dangerSoft: '#392221',
    onDanger: '#202522',
    cameraSurface: '#202522',
    cameraOverlay: 'rgba(18, 20, 19, 0.74)',
    cameraOverlayStrong: 'rgba(18, 20, 19, 0.80)',
    cameraOnOverlay: '#FAF9F6',
    cameraOnOverlaySecondary: '#E7EFEB',
    cameraOnOverlayMuted: 'rgba(250, 249, 246, 0.72)',
    border: '#49443F',
    surfaceInverse: '#202522',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Platform font choices. Uses the system font stacks exposed by the Expo font
 * system per platform (see web font variables in `src/global.css`).
 */
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'InterBody',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'InterBody',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'InterBody',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * Typography scale. Body copy is sized for comfortable reading (16–17px),
 * headings are strong but intentionally not oversized.
 */
export const Type = {
  headingLarge: { fontFamily: 'InterBold', fontSize: 38, lineHeight: 46, fontWeight: '700', letterSpacing: -1.2 },
  heading: { fontFamily: 'InterBold', fontSize: 27, lineHeight: 35, fontWeight: '700', letterSpacing: -0.5 },
  subheading: { fontFamily: 'InterSemiBold', fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontFamily: Fonts.sans, fontSize: 18, lineHeight: 28, fontWeight: '400' },
  bodyEmphasis: { fontFamily: 'InterSemiBold', fontSize: 18, lineHeight: 28, fontWeight: '600' },
  label: { fontFamily: 'InterSemiBold', fontSize: 15, lineHeight: 22, fontWeight: '600' },
  small: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, fontWeight: '500' },
} as const;

export type TypeToken = keyof typeof Type;

/**
 * Consistent 4/8-based spacing scale.
 */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 48,
} as const;

/**
 * Corner radius scale. Privileges rounded-but-not-pill shapes.
 */
export const Radius = {
  small: 8,
  control: 12,
  chip: 12,
  button: 999,
  card: 28,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
