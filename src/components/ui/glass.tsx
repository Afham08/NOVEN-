import { BlurView } from 'expo-blur';
import { createContext, useContext, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const GlassTarget = createContext<RefObject<View | null> | undefined>(undefined);
export function GlassFill() {
  const target = useContext(GlassTarget);
  const theme = useTheme();
  return <BlurView pointerEvents="none" blurTarget={target} intensity={52}
    blurMethod={target ? 'dimezisBlurViewSdk31Plus' : 'none'}
    tint={theme === Colors.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />;
}
