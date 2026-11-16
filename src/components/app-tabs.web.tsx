import { useTheme } from '@/hooks/use-theme';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing, Type } from '@/constants/theme';

/**
 * The web tab bar, matching the native one exactly: the same four primary
 * destinations in the same order.
 *
 * On mobile browsers, it renders cleanly at the bottom of the screen just like
 * a native mobile app. On desktop, it renders the floating top header.
 */
export default function AppTabs() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <Tabs>
      <TabSlot style={{ flex: 1, paddingBottom: isMobile ? 88 : 0 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="activities" href="/activities" asChild style={{ display: 'none' }}>
            <TabButton>Activities</TabButton>
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton>Progress</TabButton>
          </TabTrigger>
          <TabTrigger name="family" href="/family" asChild>
            <TabButton>Family</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

/**
 * A single tab. The label is 16px rather than the 14px `Type.small` it used to
 * be, and the row keeps a 48px minimum height, so the bar meets the same touch
 * target and legibility bar as the rest of the app instead of being the one
 * place with small text on it.
 */
export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();
  if (children === 'Activities') {
    return null;
  }
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.tabButtonView, { backgroundColor: isFocused ? theme.backgroundElement : 'transparent' }]}>
        {/*
          The active tab is marked by the filled background above and by the
          darker, bolder text here, so the current page is obvious without
          relying on colour alone.
        */}
        <ThemedText type="default" themeColor={isFocused ? 'text' : 'textSecondary'} style={[styles.tabLabel, { color: isFocused ? theme.text : theme.textSecondary }]}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View {...props} style={[styles.tabListContainer, isMobile && styles.tabListContainerMobile]}>
      <ThemedView type="backgroundElement" style={[styles.innerContainer, isMobile && styles.innerContainerMobile, { backgroundColor: theme.glass, borderColor: theme.glassBorder, backdropFilter: 'blur(24px)' }]}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  tabListContainerMobile: {
    top: undefined,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    zIndex: 100,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(140,120,100,0.15)',
    boxShadow: '0 8px 32px rgba(40,25,15,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: 440,
    justifyContent: 'center',
  },
  innerContainerMobile: {
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: Spacing.two,
    borderRadius: 24,
    boxShadow: '0 4px 24px rgba(40,25,15,0.08)',
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  tabLabel: {
    // The emphasis of the active tab, over the 16px body size `default` already
    // sets. Written after the spread so it wins, and left as a plain value
    // rather than a token so the browser's own text-size setting still scales it.
    ...Type.bodyEmphasis,
    fontSize: 16,
    lineHeight: 22,
  },
});
