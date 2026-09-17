import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getManagementServices } from '@/features/business-management/api';
import type { ManagementService } from '@/features/business-management/types';
import { BusinessServiceState } from '@/features/business-services/components/BusinessServiceState';
import { ManagementServiceCard } from '@/features/business-services/components/ManagementServiceCard';
import {
  ServiceStatusFilters,
  type ServiceStatusFilter,
} from '@/features/business-services/components/ServiceStatusFilters';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function ManagementServicesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [services, setServices] = useState<ManagementService[]>([]);
  const [filter, setFilter] = useState<ServiceStatusFilter>('all');
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(
    async (refreshing = false) => {
      if (!activeMembership || !token) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        setServices(await getManagementServices(activeMembership.barbershop.id, token));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Hizmetler yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadServices();
    }, [loadServices]),
  );

  const visibleServices = useMemo(
    () =>
      services.filter(
        (service) =>
          filter === 'all' ||
          (filter === 'active' && service.isActive) ||
          (filter === 'inactive' && !service.isActive),
      ),
    [filter, services],
  );

  if (!activeMembership) return null;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={!isLoading && !error ? visibleServices : []}
        keyExtractor={(service) => service.id}
        ListHeaderComponent={
          <>
            <BusinessDetailHeader
              actionIcon={{ ios: 'plus', android: 'add', web: 'add' }}
              actionLabel="Yeni hizmet ekle"
              onAction={() => router.push('/management/services/new')}
              onBack={() => router.dismissTo('/management')}
              title="Hizmetler"
            />
            <ServiceStatusFilters onChange={setFilter} value={filter} />

            {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

            {!isLoading && error ? (
              <BusinessServiceState
                actionLabel="Tekrar Dene"
                description={error}
                error
                onAction={() => void loadServices()}
                title="Hizmetler yüklenemedi"
              />
            ) : null}

            {!isLoading && !error ? (
              <View style={styles.listHeading}>
                <AppText style={styles.listTitle} variant="sectionTitle">Hizmetler</AppText>
                <AppText color="textMuted" style={styles.count} variant="bodySmall">
                  {visibleServices.length} hizmet
                </AppText>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <BusinessServiceState
              actionLabel={filter === 'all' ? 'İlk Hizmeti Ekle' : undefined}
              description={
                filter === 'all'
                  ? 'Müşterilerin seçebileceği ilk hizmeti oluşturabilirsin.'
                  : 'Bu filtreye uyan bir hizmet bulunmuyor.'
              }
              onAction={filter === 'all' ? () => router.push('/management/services/new') : undefined}
              title={filter === 'all' ? 'Henüz hizmet yok' : 'Sonuç bulunamadı'}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadServices(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ManagementServiceCard
            onPress={() =>
              router.push({
                pathname: '/management/services/[serviceId]',
                params: { serviceId: item.id },
              })
            }
            service={item}
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
