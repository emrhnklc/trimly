import { useEffect, useMemo, useState, type ComponentProps, type PropsWithChildren } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getManagementServices } from '@/features/business-management/api';
import type { ManagementService } from '@/features/business-management/types';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { createCampaign, uploadCampaignImage } from '@/features/campaigns/api';
import type {
  CampaignDiscountType,
  CampaignLoyaltyPeriod,
  CampaignRewardType,
  CampaignType,
} from '@/features/campaigns/types';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { radius, layout, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export default function NewCampaignScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [services, setServices] = useState<ManagementService[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('PRICE_DISCOUNT');
  const [rewardType, setRewardType] = useState<CampaignRewardType>('DISCOUNT');
  const [discountType, setDiscountType] = useState<CampaignDiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [giftDescription, setGiftDescription] = useState('');
  const [requiredCompletedVisits, setRequiredCompletedVisits] = useState('2');
  const [loyaltyPeriod, setLoyaltyPeriod] = useState<CampaignLoyaltyPeriod>('CALENDAR_MONTH');
  const [durationDays, setDurationDays] = useState(7);
  const [usageLimit, setUsageLimit] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; mimeType?: string | null } | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMembership || !token) return;
    void getManagementServices(activeMembership.barbershop.id, token)
      .then((items) => setServices(items.filter((item) => item.isActive)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Hizmetler yüklenemedi.'));
  }, [activeMembership, token]);

  const canSubmit = useMemo(() => {
    const discount = Number(discountValue.replace(',', '.'));
    const effectiveReward = campaignType === 'GIFT' ? 'GIFT' : rewardType;
    const rewardIsValid = effectiveReward === 'GIFT'
      ? giftDescription.trim().length >= 2
      : discount > 0 && (discountType !== 'PERCENTAGE' || discount <= 100);
    const loyaltyIsValid = campaignType !== 'LOYALTY' || Number(requiredCompletedVisits) > 0;
    return title.trim().length >= 3 && selected.length > 0 && rewardIsValid && loyaltyIsValid;
  }, [campaignType, discountType, discountValue, giftDescription, requiredCompletedVisits, rewardType, selected.length, title]);

  async function selectPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled) return;
    const selectedPhoto = result.assets[0];
    setPhoto({ mimeType: selectedPhoto.mimeType, uri: selectedPhoto.uri });
  }

  async function submit() {
    if (!activeMembership || !token || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
    try {
      const effectiveReward = campaignType === 'GIFT' ? 'GIFT' : rewardType;
      const campaign = await createCampaign(activeMembership.barbershop.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        campaignType,
        rewardType: effectiveReward,
        ...(effectiveReward === 'DISCOUNT' ? {
          discountType,
          discountValue: discountValue.replace(',', '.'),
        } : { giftDescription: giftDescription.trim() }),
        ...(campaignType === 'LOYALTY' ? {
          loyaltyPeriod,
          requiredCompletedVisits: Number(requiredCompletedVisits),
          ...(loyaltyPeriod === 'ROLLING_DAYS' ? { rollingPeriodDays: 30 } : {}),
        } : {}),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        serviceIds: selected,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        perCustomerLimit: 1,
      }, token);
      if (photo) {
        await uploadCampaignImage(activeMembership.barbershop.id, campaign.id, photo, token);
      }
      router.dismissTo('/management/campaigns');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Kampanya oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!activeMembership) return null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BusinessDetailHeader
            onBack={() => goBackOrReplace(router, '/(business)/management/campaigns')}
            title="Yeni Kampanya"
          />

          <Section title="Kampanya bilgileri">
            <Field label="Başlık" value={title} onChangeText={setTitle} placeholder="Örn. Hafta İçi Fırsatı" />
            <Field label="Kısa açıklama (isteğe bağlı)" value={description} onChangeText={setDescription} placeholder="Müşterinin göreceği kısa açıklama" multiline />
          </Section>

          <Section title="Kampanya türü">
            <View style={styles.options}>
              <Option selected={campaignType === 'PRICE_DISCOUNT'} label="Fiyat indirimi" onPress={() => setCampaignType('PRICE_DISCOUNT')} />
              <Option selected={campaignType === 'GIFT'} label="Hediye hizmet" onPress={() => setCampaignType('GIFT')} />
              <Option selected={campaignType === 'LOYALTY'} label="Sadakat" onPress={() => setCampaignType('LOYALTY')} />
            </View>
          </Section>

          {campaignType === 'LOYALTY' ? (
            <Section title="Sadakat koşulu">
              <Field keyboardType="number-pad" label="Ödülden önce gereken tamamlanmış ziyaret" value={requiredCompletedVisits} onChangeText={setRequiredCompletedVisits} placeholder="2" />
              <View style={styles.options}>
                <Option selected={loyaltyPeriod === 'CALENDAR_MONTH'} label="Takvim ayı" onPress={() => setLoyaltyPeriod('CALENDAR_MONTH')} />
                <Option selected={loyaltyPeriod === 'ROLLING_DAYS'} label="Son 30 gün" onPress={() => setLoyaltyPeriod('ROLLING_DAYS')} />
              </View>
              <AppText color="textMuted" variant="bodySmall">Yalnız tamamlanan randevular sayılır; iptal ve gelinmedi kayıtları sayılmaz.</AppText>
              <AppText variant="label">Kazanılacak ödül</AppText>
              <View style={styles.options}>
                <Option selected={rewardType === 'DISCOUNT'} label="Fiyat indirimi" onPress={() => setRewardType('DISCOUNT')} />
                <Option selected={rewardType === 'GIFT'} label="Hediye" onPress={() => setRewardType('GIFT')} />
              </View>
            </Section>
          ) : null}

          {(campaignType === 'PRICE_DISCOUNT' || (campaignType === 'LOYALTY' && rewardType === 'DISCOUNT')) ? (
          <Section title="İndirim">
            <View style={styles.options}>
              <Option selected={discountType === 'PERCENTAGE'} label="Yüzde" onPress={() => setDiscountType('PERCENTAGE')} />
              <Option selected={discountType === 'FIXED_AMOUNT'} label="Sabit tutar" onPress={() => setDiscountType('FIXED_AMOUNT')} />
            </View>
            <Field
              keyboardType="decimal-pad"
              label={discountType === 'PERCENTAGE' ? 'İndirim oranı (%)' : 'İndirim tutarı (₺)'}
              value={discountValue}
              onChangeText={setDiscountValue}
              placeholder={discountType === 'PERCENTAGE' ? '20' : '100'}
            />
          </Section>
          ) : null}

          {(campaignType === 'GIFT' || (campaignType === 'LOYALTY' && rewardType === 'GIFT')) ? (
            <Section title="Hediye">
              <Field label="Hediye içeriği" value={giftDescription} onChangeText={setGiftDescription} placeholder="Örn. Peeling hediye" />
              <AppText color="textMuted" variant="bodySmall">Randevu fiyatı değişmez; hediye çalışan ve müşteri randevu detayında görünür.</AppText>
            </Section>
          ) : null}

          <Section title="Geçerli hizmetler">
            <View style={styles.serviceList}>
              {services.map((service) => {
                const isSelected = selected.includes(service.id);
                return <Option key={service.id} selected={isSelected} label={service.name} onPress={() => setSelected((current) => isSelected ? current.filter((id) => id !== service.id) : [...current, service.id])} />;
              })}
            </View>
          </Section>

          <Section title="Süre ve limit">
            <View style={styles.options}>
              {[7, 14, 30].map((days) => <Option key={days} selected={durationDays === days} label={`${days} gün`} onPress={() => setDurationDays(days)} />)}
            </View>
            <Field keyboardType="number-pad" label="Toplam kullanım limiti (isteğe bağlı)" value={usageLimit} onChangeText={setUsageLimit} placeholder="Limitsiz" />
            <AppText color="textMuted" variant="bodySmall">
              {campaignType === 'LOYALTY'
                ? 'Müşteri ödülü seçilen dönem içinde bir kez kullanabilir.'
                : 'Her müşteri kampanyayı bir kez kullanabilir.'}
            </AppText>
          </Section>

          <Section title="Kampanya görseli (isteğe bağlı)">
            <Pressable onPress={() => void selectPhoto()} style={[styles.photoPicker, { borderColor: colors.border, backgroundColor: colors.background }]}>
              {photo ? <Image contentFit="cover" source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} /> : (
                <View style={styles.photoPlaceholder}>
                  <SymbolView name={{ ios: 'photo.badge.plus', android: 'add_photo_alternate', web: 'add_photo_alternate' }} size={28} tintColor={colors.primary} />
                  <AppText color="primary" variant="label">Kapak Fotoğrafı Seç</AppText>
                </View>
              )}
            </Pressable>
            {photo ? <AppButton onPress={() => setPhoto(null)} variant="ghost">Fotoğrafı Kaldır</AppButton> : (
              <AppText color="textMuted" variant="bodySmall">Eklenmezse işletmenin kapak fotoğrafı kullanılır.</AppText>
            )}
          </Section>

          {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
          <AppButton disabled={!canSubmit || isSubmitting} onPress={() => void submit()}>
            {isSubmitting ? 'Oluşturuluyor…' : 'Kampanyayı Yayınla'}
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Section({ children, title }: PropsWithChildren<{ title: string }>) {
  const colors = useThemeColors();

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText style={styles.sectionTitle} variant="sectionTitle">{title}</AppText>
      {children}
    </View>
  );
}

function Option({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: selected ? colors.surfaceMuted : colors.background,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}>
      <AppText color={selected ? 'primary' : 'text'} variant="label">{label}</AppText>
    </Pressable>
  );
}

function Field({ label, ...props }: ComponentProps<typeof TextInput> & { label: string }) {
  const colors = useThemeColors();

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
          props.multiline && styles.multiline,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.md, paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  section: { borderRadius: radius.card, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  sectionTitle: { fontSize: 19, lineHeight: 25 },
  field: { gap: spacing.xs },
  input: { borderRadius: radius.smallCard, borderWidth: 1, minHeight: 50, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  multiline: { minHeight: 82, textAlignVertical: 'top' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  serviceList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  option: { borderRadius: radius.pill, borderWidth: 1, minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.md },
  photoPicker: { borderRadius: radius.md, borderWidth: 1, height: 150, overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center', flex: 1, gap: spacing.xs, justifyContent: 'center' },
  error: { marginVertical: spacing.xs },
});
