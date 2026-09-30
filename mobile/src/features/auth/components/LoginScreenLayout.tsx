import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/theme/spacing';

type LoginScreenLayoutProps = PropsWithChildren<{
  topRightAccessory?: ReactNode;
}>;

export function LoginScreenLayout({ children, topRightAccessory }: LoginScreenLayoutProps) {
  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {topRightAccessory ? (
        <View style={styles.topRightAccessory}>{topRightAccessory}</View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  topRightAccessory: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.sm,
    zIndex: 10,
  },
});
