import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

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

          <View style={styles.brandCard}>
            <View style={styles.brandCopy}>
              <AppText color="surface" style={styles.brandTitle} variant="displayMedium">
                Tarzın. Randevun. Geçmişin.
              </AppText>
            </View>
            <View style={styles.scissorsBadge}>
              <SymbolView
                name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
                size={27}
                tintColor={colors.onPrimary}
              />
            </View>
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
  brandCard: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: spacing.lg,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  brandCopy: { flex: 1 },
  brandTitle: { maxWidth: 250 },
  scissorsBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 54,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 54,
  },
  title: { marginTop: spacing.xxl },
  description: { marginTop: spacing.sm },
});
