import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/theme/spacing';

type AuthScreenLayoutProps = PropsWithChildren<{
  description: string;
  onBackPress?: () => void;
  title: string;
}>;

export function AuthScreenLayout({ children, description, onBackPress, title }: AuthScreenLayoutProps) {
  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            {onBackPress ? (
              <AppIconButton
                accessibilityLabel="Geri dön"
                icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                onPress={onBackPress}
                variant="transparent"
              />
            ) : (
              <View style={styles.topBarSpacer} />
            )}
            <AppText color="primary" variant="overline">TRIMLY</AppText>
            <View style={styles.topBarSpacer} />
          </View>

          <AppText style={styles.title} variant="displayLarge">{title}</AppText>
          <AppText color="textMuted" style={styles.description}>{description}</AppText>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  topBarSpacer: { height: 44, width: 44 },
  title: { marginTop: spacing.xxl },
  description: { marginTop: spacing.sm },
});
