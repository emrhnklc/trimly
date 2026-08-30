import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getBusinessCustomers } from '@/features/business-customers/api';
import { BusinessCustomerCard } from '@/features/business-customers/components/BusinessCustomerCard';
import {
  BusinessCustomerFilters,
  type BusinessCustomerFilter,
} from '@/features/business-customers/components/BusinessCustomerFilters';
import { BusinessCustomerSearch } from '@/features/business-customers/components/BusinessCustomerSearch';
import { BusinessCustomerState } from '@/features/business-customers/components/BusinessCustomerState';
import type { BusinessCustomer } from '@/features/business-customers/types';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessScreenHeader } from '@/features/business/components/BusinessScreenHeader';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

function normalizeSearchValue(value: string) {
  return value.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export default function BusinessCustomersScreen() {
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [customers, setCustomers] = useState<BusinessCustomer[]>([]);
  const [filter, setFilter] = useState<BusinessCustomerFilter>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(
    async (refreshing = false) => {
      if (!activeMembership || !token) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        setCustomers(
          await getBusinessCustomers(activeMembership.barbershop.id, token),
        );
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Müşteriler yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadCustomers();
    }, [loadCustomers]),
  );

  const visibleCustomers = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(search);

    return customers.filter((customer) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'regular' && customer.completedVisitCount >= 3) ||
        (filter === 'new' && customer.completedVisitCount <= 1);
      const searchableValue = normalizeSearchValue(
        `${customer.firstName} ${customer.lastName} ${customer.phone ?? ''}`,
      );

      return matchesFilter && (!normalizedSearch || searchableValue.includes(normalizedSearch));
    });
  }, [customers, filter, search]);

  if (!activeMembership) return null;

  const hasActiveFilter = filter !== 'all' || normalizeSearchValue(search).length > 0;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={!isLoading && !error ? visibleCustomers : []}
        keyExtractor={(customer) => customer.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <BusinessScreenHeader
              subtitle={activeMembership.barbershop.name}
              title="Müşteriler"
            />
            <BusinessCustomerSearch onChangeText={setSearch} value={search} />
            <BusinessCustomerFilters onChange={setFilter} value={filter} />

            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : null}

            {!isLoading && error ? (
              <BusinessCustomerState
                description={error}
                error
                onRetry={() => void loadCustomers()}
                title="Müşteriler yüklenemedi"
              />
            ) : null}

            {!isLoading && !error ? (
              <View style={styles.listHeading}>
                <AppText variant="label">Müşteri listesi</AppText>
                <AppText color="textMuted" style={styles.count} variant="bodySmall">
                  {visibleCustomers.length} müşteri
                </AppText>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <BusinessCustomerState
              description={
                hasActiveFilter
                  ? 'Arama veya filtre seçimine uyan bir müşteri bulunamadı.'
                  : 'İlk randevu oluşturulduğunda müşteri burada otomatik olarak görünecek.'
              }
              title={hasActiveFilter ? 'Sonuç bulunamadı' : 'Müşteri listen henüz boş'}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadCustomers(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <BusinessCustomerCard
            customer={item}
            timeZone={activeMembership.barbershop.timezone}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: 116,
    paddingHorizontal: spacing.lg,
  },
  loader: { marginTop: spacing.xxxl },
  listHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  count: { fontSize: 11, lineHeight: 15 },
});
