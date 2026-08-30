import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { EmployeeScheduleIdentityCard } from '@/features/business-hours/components/EmployeeScheduleIdentityCard';
import { ScheduleBlockCard } from '@/features/business-hours/components/ScheduleBlockCard';
import { BusinessManagementState } from '@/features/business-management/components/BusinessManagementState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { getBusinessMember } from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import {
  deleteMemberScheduleBlock,
  getUpcomingScheduleBlocks,
} from '@/features/schedules/api';
import type { MemberScheduleBlock } from '@/features/schedules/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function EmployeeScheduleBlocksScreen() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [member, setMember] = useState<BusinessMember | null>(null);
  const [blocks, setBlocks] = useState<MemberScheduleBlock[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBlocks = useCallback(
    async (refreshing = false) => {
      if (!activeMembership || !memberId || !token) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const barbershopId = activeMembership.barbershop.id;
        const [nextMember, nextBlocks] = await Promise.all([
          getBusinessMember(barbershopId, memberId, token),
          getUpcomingScheduleBlocks(barbershopId, memberId, token),
        ]);
        setMember(nextMember);
        setBlocks(nextBlocks);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Mola ve izinler yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, memberId, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadBlocks();
    }, [loadBlocks]),
  );

  const summary = useMemo(
    () => ({
      breaks: blocks.filter((block) => block.type === 'BREAK').length,
      timeOff: blocks.filter((block) => block.type === 'TIME_OFF').length,
    }),
    [blocks],
  );

  if (!activeMembership) return null;

  function confirmDelete(block: MemberScheduleBlock) {
    const typeLabel = block.type === 'BREAK' ? 'mola' : 'izin';

    Alert.alert(
      `${typeLabel === 'mola' ? 'Mola' : 'İzin'} kaldırılsın mı?`,
      `Bu ${typeLabel} kaldırıldığında zaman aralığı yeniden randevuya açılabilir.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => void removeBlock(block.id),
        },
      ],
    );
  }

  async function removeBlock(blockId: string) {
    if (!activeMembership || !memberId || !token) return;

    setDeletingId(blockId);
    try {
      await deleteMemberScheduleBlock(
        activeMembership.barbershop.id,
        memberId,
        blockId,
        token,
      );
      setBlocks((current) => current.filter((block) => block.id !== blockId));
    } catch (reason) {
      Alert.alert(
        'Kayıt kaldırılamadı',
        reason instanceof Error ? reason.message : 'Lütfen tekrar dene.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadBlocks(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader
          actionIcon={{ ios: 'plus', android: 'add', web: 'add' }}
          actionLabel="Mola veya izin ekle"
          onAction={() =>
            router.push({
              pathname: '/management/hours/blocks/[memberId]/new',
              params: { memberId },
            })
          }
          onBack={() =>
            router.dismissTo({
              pathname: '/management/hours/members/[memberId]',
              params: { memberId },
            })
          }
          title="Mola ve İzinler"
        />
        <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
          Tekrarlanmayan mola, izin ve tatil zamanlarını buradan yönet.
        </AppText>

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && error ? (
          <BusinessManagementState
            description={error}
            onRetry={() => void loadBlocks()}
            title="Mola ve izinler yüklenemedi"
          />
        ) : null}

        {!isLoading && !error && member ? (
          <>
            <EmployeeScheduleIdentityCard member={member} />

            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <AppText color="primary" style={styles.summaryValue} variant="heading">
                  {summary.breaks}
                </AppText>
                <AppText color="textMuted" variant="bodySmall">Yaklaşan mola</AppText>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <AppText color="primary" style={styles.summaryValue} variant="heading">
                  {summary.timeOff}
                </AppText>
                <AppText color="textMuted" variant="bodySmall">Yaklaşan izin</AppText>
              </View>
            </View>

            <View style={styles.infoCard}>
              <SymbolView
                name={{ ios: 'info.circle', android: 'info_outline', web: 'info_outline' }}
                size={20}
                tintColor={colors.primary}
              />
              <AppText color="textMuted" style={styles.infoCopy} variant="bodySmall">
                Onaylı randevuyla çakışan zaman eklenemez. Önce randevuyu başka saate taşımalı veya iptal etmelisin.
              </AppText>
            </View>

            <View style={styles.listHeading}>
              <AppText style={styles.sectionTitle} variant="heading">Yaklaşan kayıtlar</AppText>
              <AppText color="textMuted" variant="bodySmall">{blocks.length} kayıt</AppText>
            </View>

            {blocks.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <SymbolView
                    name={{ ios: 'calendar.badge.plus', android: 'event_available', web: 'event_available' }}
                    size={25}
                    tintColor={colors.primary}
                  />
                </View>
                <AppText style={styles.emptyTitle} variant="label">Yaklaşan mola veya izin yok</AppText>
                <AppText color="textMuted" style={styles.emptyDescription} variant="bodySmall">
                  Sağ üstteki artı butonuyla yeni bir zaman aralığı ekleyebilirsin.
                </AppText>
              </View>
            ) : (
              blocks.map((block) => (
                <View key={block.id} style={deletingId === block.id && styles.deleting}>
                  <ScheduleBlockCard
                    block={block}
                    onDelete={() => confirmDelete(block)}
                    timeZone={activeMembership.barbershop.timezone}
                  />
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: spacing.lg },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
  loader: { marginTop: spacing.xxxl },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 22, lineHeight: 28 },
  divider: { backgroundColor: colors.border, width: 1 },
  infoCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  infoCopy: { flex: 1, marginLeft: spacing.sm },
  listHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  sectionTitle: { fontSize: 18, lineHeight: 24 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emptyTitle: { marginTop: spacing.sm },
  emptyDescription: { marginTop: spacing.xs, maxWidth: 280, textAlign: 'center' },
  deleting: { opacity: 0.42 },
});
