import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import { formatCampaignDiscount, type Campaign } from '../types';

export function CampaignCard({
  campaign,
  management = false,
  onPress,
}: {
  campaign: Campaign;
  management?: boolean;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const status = campaign.isActive ? 'Aktif' : 'Kapalı';
  const imageUrl = campaign.imageUrl || campaign.barbershop.coverImageUrl || campaign.barbershop.profileImageUrl;
  const loyaltyProgress = campaign.campaignType === 'LOYALTY' ? campaign.customerProgress : null;
  const benefit = formatCampaignDiscount(campaign);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.visual, { backgroundColor: colors.darkSurface }]}> 
        {imageUrl ? <Image contentFit="cover" source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} /> : null}
        <View style={styles.visualOverlay} />
        <SymbolView
          name={{ ios: campaign.rewardType === 'GIFT' ? 'gift.fill' : 'tag.fill', android: campaign.rewardType === 'GIFT' ? 'redeem' : 'local_offer', web: campaign.rewardType === 'GIFT' ? 'redeem' : 'local_offer' }}
          size={18}
          tintColor="#FFFFFF"
        />
        <AppText style={styles.benefitText} variant="label">{benefit}</AppText>
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText numberOfLines={1} style={styles.title} variant="cardTitle">
            {campaign.title}
          </AppText>
          {management ? (
            <AppText color={campaign.isActive ? 'success' : 'textMuted'} variant="label">
              {status}
            </AppText>
          ) : null}
        </View>
        {!management ? (
          <AppText color="textMuted" numberOfLines={1} variant="bodySmall">
            {campaign.barbershop.name}
          </AppText>
        ) : null}
        <AppText color="textMuted" numberOfLines={1} style={styles.detail} variant="bodySmall">
          {campaign.services.map(({ service }) => service.name).join(' · ')}
        </AppText>
        {loyaltyProgress ? (
          <AppText color={loyaltyProgress.isEligible ? 'success' : 'primary'} style={styles.detail} variant="label">
            {loyaltyProgress.isEligible
              ? 'Ödülün hazır'
              : loyaltyProgress.redeemedCount > 0
                ? 'Bu dönem kullanıldı'
                : `${loyaltyProgress.completedVisits}/${loyaltyProgress.requiredVisits} ziyaret · ${loyaltyProgress.remainingVisits} kaldı`}
          </AppText>
        ) : null}
        <AppText color="textMuted" style={styles.detail} variant="label">
          {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(campaign.endsAt))} tarihine kadar
          {campaign.usageLimit ? ` · ${Math.max(0, campaign.usageLimit - campaign._count.appointments)} kullanım kaldı` : ''}
        </AppText>
      </View>
      {onPress ? <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={17}
        tintColor={colors.textMuted}
      /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 112,
    padding: spacing.md,
  },
  visual: {
    alignItems: 'center',
    borderRadius: radius.md,
    gap: spacing.xxs,
    justifyContent: 'center',
    minHeight: 72,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    width: 82,
  },
  visualOverlay: {
    backgroundColor: 'rgba(20, 14, 8, 0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  benefitText: { color: '#FFFFFF', textAlign: 'center' },
  copy: { flex: 1 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  title: { flex: 1 },
  detail: { marginTop: spacing.xxs },
  pressed: { opacity: 0.82 },
});
