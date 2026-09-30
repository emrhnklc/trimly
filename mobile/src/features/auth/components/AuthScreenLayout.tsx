import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type AuthScreenLayoutProps = PropsWithChildren<{
  description: string;
  onBackPress?: () => void;
  title: string;
  titleVariant?: keyof typeof typography;
}>;

export function AuthScreenLayout({ children, description, onBackPress, title, titleVariant = 'displayLarge' }: AuthScreenLayoutProps) {
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
            <TrimlyLogo size="small" />
            <View style={styles.topBarSpacer} />
          </View>

          <AppText style={styles.title} variant={titleVariant}>{title}</AppText>
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
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, minHeight: 48 },
  topBarSpacer: { height: 44, width: 44 },
  title: { marginTop: spacing.xxl },
  description: { marginTop: spacing.sm },
});
