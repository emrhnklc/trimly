import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { createDependent } from '@/features/dependents/api';
import { DependentProfileForm } from '@/features/dependents/components/DependentProfileForm';
import type { DependentProfileInput } from '@/features/dependents/types';
import { spacing } from '@/theme/spacing';

const initialInput: DependentProfileInput = {
  firstName: '', lastName: '', relationship: 'CHILD', birthDate: '', notes: '',
};

export default function NewDependentScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [input, setInput] = useState(initialInput);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await createDependent(input, token);
      router.back();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Yakın eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}><SettingsPageHeader title="Yeni Yakın" /></View>
      <DependentProfileForm error={error} input={input} isSubmitting={isSubmitting} onChange={setInput} onSubmit={() => void submit()} submitLabel="Yakını Kaydet" />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { paddingHorizontal: spacing.lg } });
