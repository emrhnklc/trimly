import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { getMyDependents } from '@/features/dependents/api';
import { DependentAvatar } from '@/features/dependents/components/DependentAvatar';
import {
  dependentRelationshipLabels,
  getDependentAge,
  type DependentProfile,
} from '@/features/dependents/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export default function DependentsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuth();
  const [dependents, setDependents] = useState<DependentProfile[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!token) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setDependents(await getMyDependents(token));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Yakınların yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={dependents}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <SettingsPageHeader title="Yakınlarım" />
            <AppText color="textMuted" style={styles.subtitle}>
              Çocuğun veya yakınların için kendi hesabından kolayca randevu al.
            </AppText>
            <View style={styles.addButton}>
              <AppButton onPress={() => router.push('/dependents/new')} variant="secondary">
                + Yakın Ekle
              </AppButton>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <SymbolView
                name={{ ios: 'person.2', android: 'group', web: 'group' }}
                size={30}
                tintColor={colors.primary}
              />
              <AppText style={styles.emptyTitle} variant="heading">
                {error ? 'Yakınlar yüklenemedi' : 'Henüz yakın eklemedin'}
              </AppText>
              <AppText color={error ? 'danger' : 'textMuted'} style={styles.emptyText}>
                {error ?? 'Bir yakın eklediğinde randevu sırasında hizmeti kimin alacağını seçebilirsin.'}
              </AppText>
              {error ? <AppButton onPress={() => void load()}>Tekrar Dene</AppButton> : null}
            </View>
          )
        }
        refreshControl={<RefreshControl onRefresh={() => void load(true)} refreshing={isRefreshing} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const age = getDependentAge(item.birthDate);
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/dependents/[dependentId]', params: { dependentId: item.id } })}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <DependentAvatar firstName={item.firstName} lastName={item.lastName} />
              <View style={styles.cardCopy}>
                <View style={styles.nameRow}>
                  <AppText numberOfLines={1} style={styles.name} variant="cardTitle">
                    {item.firstName} {item.lastName}
                  </AppText>
                  <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
                    <AppText color="primary" style={styles.badgeText} variant="label">
                      {dependentRelationshipLabels[item.relationship]}
                    </AppText>
                  </View>
                </View>
                <AppText color="textMuted" variant="bodySmall">
                  {age === null ? 'Yaş bilgisi yok' : `${age} yaş`}
                  {item.notes ? ' · Özel notu var' : ''}
                </AppText>
              </View>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={19} tintColor={colors.textMuted} />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  subtitle: { lineHeight: 21, marginTop: -spacing.xs },
  addButton: { marginBottom: spacing.md, marginTop: spacing.md },
  loader: { marginTop: spacing.xxxl },
  empty: { alignItems: 'center', borderRadius: radius.card, borderWidth: 1, gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { textAlign: 'center' },
  emptyText: { lineHeight: 21, textAlign: 'center' },
  card: { alignItems: 'center', borderRadius: radius.card, borderWidth: 1, flexDirection: 'row', padding: spacing.sm },
  cardCopy: { flex: 1, marginHorizontal: spacing.sm },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  name: { flexShrink: 1 },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.xs, paddingVertical: 3 },
  badgeText: { fontSize: 10, lineHeight: 13 },
  pressed: { opacity: 0.7 },
});
