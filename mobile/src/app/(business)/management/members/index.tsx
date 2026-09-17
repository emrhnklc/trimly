import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { BusinessMemberCard } from '@/features/business-members/components/BusinessMemberCard';
import { BusinessMemberState } from '@/features/business-members/components/BusinessMemberState';
import {
  MemberStatusFilters,
  type MemberStatusFilter,
} from '@/features/business-members/components/MemberStatusFilters';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { getBusinessMembers } from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function ManagementMembersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [filter, setFilter] = useState<MemberStatusFilter>('all');
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

  const visibleMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          filter === 'all' ||
          (filter === 'active' && member.isActive) ||
          (filter === 'inactive' && !member.isActive),
      ),
    [filter, members],
  );

  if (!activeMembership) return null;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={!isLoading && !error ? visibleMembers : []}
        keyExtractor={(member) => member.id}
        ListHeaderComponent={
          <>
            <BusinessDetailHeader
              actionIcon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
              actionLabel="Çalışan davet et"
              onAction={() => router.push('/management/members/invite')}
              onBack={() => router.dismissTo('/management')}
              title="Çalışanlar"
            />
            <MemberStatusFilters onChange={setFilter} value={filter} />

            {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

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
                <AppText style={styles.listTitle} variant="sectionTitle">Ekip</AppText>
                <AppText color="textMuted" style={styles.count} variant="bodySmall">
                  {visibleMembers.length} çalışan
                </AppText>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <BusinessMemberState
              actionLabel={filter === 'all' ? 'Çalışan Davet Et' : undefined}
              description={
                filter === 'all'
                  ? 'Davet bağlantısıyla ilk ekip üyesini işletmene ekleyebilirsin.'
                  : 'Bu filtreye uyan bir çalışan bulunmuyor.'
              }
              onAction={filter === 'all' ? () => router.push('/management/members/invite') : undefined}
              title={filter === 'all' ? 'Ekip henüz boş' : 'Sonuç bulunamadı'}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadMembers(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <BusinessMemberCard
            member={item}
            onPress={item.role === 'OWNER'
              ? undefined
              : () =>
                  router.push({
                    pathname: '/management/members/[memberId]',
                    params: { memberId: item.id },
                  })}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  loader: { marginTop: spacing.xxxl },
  listHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: layout.sectionGap,
  },
  listTitle: { fontSize: 22, lineHeight: 28 },
  count: { fontSize: 11, lineHeight: 15 },
});
