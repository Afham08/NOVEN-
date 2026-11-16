import { GlassFill } from './glass';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
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
          boxShadow: `0 8px 24px ${theme.activityShadow}`,
          shadowColor: theme.activityShadow,
          shadowOpacity: 1,
        },
        paddingValue != null && { padding: paddingValue },
        style,
      ]}
      {...rest}>
      {!isInverse && (
        <View pointerEvents="none" style={styles.glassClip}>
          <GlassFill />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.card,
    overflow: 'visible',
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  glassClip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
});
