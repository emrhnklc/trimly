import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { BusinessMemberCard } from '@/features/business-members/components/BusinessMemberCard';
import { BusinessMemberState } from '@/features/business-members/components/BusinessMemberState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { getBusinessMembers } from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export default function EmployeeSchedulesScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(
    async (refreshing = false) => {
      if (!activeMembership || !token) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        setMembers(await getBusinessMembers(activeMembership.barbershop.id, token));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Çalışanlar yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadMembers();
    }, [loadMembers]),
  );

  const orderedMembers = useMemo(
    () => [...members].sort((first, second) => Number(second.isActive) - Number(first.isActive)),
    [members],
  );

  if (!activeMembership) return null;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={!isLoading && !error ? orderedMembers : []}
        keyExtractor={(member) => member.id}
        ListHeaderComponent={
          <>
            <BusinessDetailHeader
              onBack={() => goBackOrReplace(router, '/(business)/management/hours')}
              title="Çalışan Vardiyaları"
            />
            <View style={[styles.infoCard, { backgroundColor: themeColors.surfaceMuted }]}>
              <AppText variant="label">İşletme saatleri üst sınırdır</AppText>
              <AppText color="textMuted" style={styles.infoDescription} variant="bodySmall">
                Çalışan vardiyası yalnızca işletmenin açık olduğu gün ve saatlerde randevu üretir.
              </AppText>
            </View>

            {isLoading ? <ActivityIndicator color={themeColors.primary} style={styles.loader} /> : null}

            {!isLoading && error ? (
              <BusinessMemberState
                actionLabel="Tekrar Dene"
                description={error}
                error
                onAction={() => void loadMembers()}
                title="Çalışanlar yüklenemedi"
              />
            ) : null}

            {!isLoading && !error ? (
              <View style={styles.listHeading}>
                <AppText style={styles.sectionTitle} variant="heading">Ekip</AppText>
                <AppText color="textMuted" variant="bodySmall">{orderedMembers.length} çalışan</AppText>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <BusinessMemberState
              description="Vardiya düzenlemek için önce işletmene çalışan eklemelisin."
              title="Çalışan bulunamadı"
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            colors={[themeColors.primary]}
            onRefresh={() => void loadMembers(true)}
            refreshing={isRefreshing}
            tintColor={themeColors.primary}
          />
        }
        renderItem={({ item }) => (
          <BusinessMemberCard
            member={item}
            onPress={() =>
              router.push({
                pathname: '/management/hours/members/[memberId]',
                params: { memberId: item.id },
              })
            }
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  infoCard: {
    borderRadius: radius.card,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  infoDescription: { marginTop: 2 },
  loader: { marginTop: spacing.xxxl },
  listHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
});
