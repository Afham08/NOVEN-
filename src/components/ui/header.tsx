import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type HeaderProps = {
  title: string;
  /** Small uppercase label rendered above the title. */
  eyebrow?: string;
  subtitle?: string;
  /** Element rendered on the right side of the header row. */
  trailing?: ReactNode;
};

export function Header({ title, subtitle, trailing }: HeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.heading }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  copy: {
    flexShrink: 1,
    gap: Spacing.one,
  },
  title: Type.headingLarge,
  subtitle: Type.body,
});
