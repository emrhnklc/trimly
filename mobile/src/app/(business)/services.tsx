import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { getPublicBarbershop } from '@/features/barbershops/api';
import type { PublicService } from '@/features/barbershops/types';
import { BusinessServiceCatalogCard } from '@/features/business-services/components/BusinessServiceCatalogCard';
import { BusinessServiceState } from '@/features/business-services/components/BusinessServiceState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessScreenHeader } from '@/features/business/components/BusinessScreenHeader';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BusinessServiceCatalogScreen() {
  const { activeMembership } = useBusiness();
  const [services, setServices] = useState<PublicService[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(
    async (refreshing = false) => {
      if (!activeMembership) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const business = await getPublicBarbershop(activeMembership.barbershop.slug);
        setServices(business.services);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Hizmetler yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership],
  );

  useFocusEffect(
    useCallback(() => {
      void loadServices();
    }, [loadServices]),
  );

  if (!activeMembership) return null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadServices(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <BusinessScreenHeader
          subtitle={activeMembership.barbershop.name}
          title="Hizmetler"
        />
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          İşletmede sunulan aktif hizmetleri, sürelerini ve fiyatlarını görüntüle.
        </AppText>

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

        {!isLoading && !error && !services.length ? (
          <BusinessServiceState
            description="İşletmede görüntülenecek aktif bir hizmet bulunmuyor."
            title="Hizmet listesi boş"
          />
        ) : null}

        {!isLoading && !error && services.length ? (
          <View style={styles.list}>
            {services.map((service) => (
              <BusinessServiceCatalogCard key={service.id} service={service} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg },
  description: { fontSize: 11, lineHeight: 16, marginTop: spacing.xs, textAlign: 'center' },
  loader: { marginTop: spacing.xxxl },
  list: { marginTop: spacing.xl },
});
