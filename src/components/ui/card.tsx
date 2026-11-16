import { GlassFill } from './glass';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CardVariant = 'surface' | 'sage' | 'tint' | 'inverse';
export type CardPadding = 'none' | 'small' | 'medium' | 'large';

export type CardProps = ViewProps & {
  /** Surface treatment. */
  variant?: CardVariant;
  /** Inner padding. Defaults to `medium`. */
  padding?: CardPadding;
  /** Gap applied between children inside the card. */
  gap?: number;
  /** Draw a hairline border (surface cards only). */
  bordered?: boolean;
};

const PADDING: Record<CardPadding, number | undefined> = {
  none: undefined,
  small: Spacing.three,
  medium: Spacing.four,
  large: Spacing.six,
};

export function Card({
  variant = 'surface',
  padding = 'medium',
  gap,
  bordered = true,
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const isInverse = variant === 'inverse';
  const background = isInverse ? theme.surfaceInverse : theme.glass;

  const paddingValue = PADDING[padding];
  const borderColor = bordered && !isInverse ? theme.glassBorder : 'transparent';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: background,
          borderColor,
          gap,
          shadowColor: theme.shadow,
          shadowOpacity: theme === Colors.dark ? 0 : 1,
        },
        paddingValue != null && { padding: paddingValue },
        style,
      ]}
      {...rest}>
      {!isInverse && <GlassFill />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
});
