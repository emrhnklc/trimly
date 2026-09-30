import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import type { ManagementService } from '@/features/business-management/types';
import type { BusinessMember } from '@/features/members/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import { MemberRoleSelector, type AssignableBusinessRole } from './MemberRoleSelector';

export type BusinessMemberFormValues = {
  isActive: boolean;
  isBookable: boolean;
  role: AssignableBusinessRole;
  serviceIds: string[];
};

export function BusinessMemberForm({
  canEditRoleAndStatus,
  error,
  isSubmitting,
  member,
  onSubmit,
  services,
}: {
  canEditRoleAndStatus: boolean;
  error?: string | null;
  isSubmitting: boolean;
  member: BusinessMember;
  onSubmit: (values: BusinessMemberFormValues) => Promise<void>;
  services: ManagementService[];
}) {
  const themeColors = useThemeColors();
  const initialRole = member.role === 'OWNER' ? 'BARBER' : member.role;
  const [role, setRole] = useState<AssignableBusinessRole>(initialRole);
  const [isActive, setActive] = useState(member.isActive);
  const [isBookable, setBookable] = useState(member.isBookable);
  const [serviceIds, setServiceIds] = useState(
    () => new Set(member.serviceAssignments.map((assignment) => assignment.service.id)),
  );

  function handleRoleChange(nextRole: AssignableBusinessRole) {
    setRole(nextRole);
    if (nextRole === 'APPRENTICE') setBookable(false);
  }

  function handleActiveChange(nextActive: boolean) {
    setActive(nextActive);
    if (!nextActive) setBookable(false);
  }

  function toggleService(serviceId: string) {
    setServiceIds((current) => {
      const next = new Set(current);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  }

  return (
    <View>
      <View style={[styles.identityCard, { backgroundColor: themeColors.darkSurface }]}>
        <AppText color="onPrimary" variant="label">{member.user.firstName} {member.user.lastName}</AppText>
        <AppText color="textMuted" style={styles.email} variant="bodySmall">{member.user.email}</AppText>
      </View>

      {member.role !== 'OWNER' ? (
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <AppText style={styles.sectionTitle} variant="label">Rol</AppText>
          <AppText color="textMuted" style={styles.sectionDescription} variant="bodySmall">
            {canEditRoleAndStatus
              ? 'Çalışanın işletme içinde hangi işlemleri yapabileceğini belirler.'
              : 'Çalışan rolünü ve aktiflik durumunu yalnız işletme sahibi değiştirebilir.'}
          </AppText>
          <View style={styles.roleSelector}>
            <MemberRoleSelector
              disabled={isSubmitting || !canEditRoleAndStatus}
              onChange={handleRoleChange}
              value={role}
            />
          </View>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        {member.role !== 'OWNER' ? (
          <>
            <SettingRow
              description="Pasif çalışan sisteme bağlı kalır ancak işletme işlemlerine katılamaz."
              disabled={isSubmitting || !canEditRoleAndStatus}
              label="Aktif çalışan"
              onChange={handleActiveChange}
              value={isActive}
            />
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          </>
        ) : null}
        <SettingRow
          description={
            member.role === 'OWNER'
              ? 'Kendini randevu sırasında seçilebilir bir berber olarak göster.'
              : role === 'APPRENTICE'
              ? 'Çırak rolü randevuya açılamaz.'
              : 'Müşteriler bu çalışanı randevu sırasında seçebilir.'
          }
          disabled={isSubmitting || !isActive || role === 'APPRENTICE'}
          label="Randevuya açık"
          onChange={setBookable}
          value={isBookable}
        />
      </View>

      <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <AppText style={styles.sectionTitle} variant="label">Yapabildiği hizmetler</AppText>
        <AppText color="textMuted" style={styles.sectionDescription} variant="bodySmall">
          Randevu alınırken yalnızca seçili hizmetlerle eşleşir.
        </AppText>
        <View style={styles.serviceList}>
          {services.map((service) => {
            const selected = serviceIds.has(service.id);
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: isSubmitting || !service.isActive }}
                disabled={isSubmitting || (!service.isActive && !selected)}
                key={service.id}
                onPress={() => toggleService(service.id)}
                style={({ pressed }) => [
                  styles.serviceRow,
                  { borderBottomColor: themeColors.border },
                  pressed && styles.pressed,
                ]}>
                <View style={[
                  styles.checkbox,
                  { borderColor: selected ? themeColors.primary : themeColors.border },
                  selected && { backgroundColor: themeColors.primary },
                ]}>
                  {selected ? <AppText color="onPrimary" style={styles.checkmark} variant="label">✓</AppText> : null}
                </View>
                <View style={styles.serviceContent}>
                  <AppText numberOfLines={1} style={styles.serviceName} variant="label">{service.name}</AppText>
                  <AppText color="textMuted" style={styles.serviceMeta} variant="bodySmall">
                    {service.durationMinutes} dk{service.isActive ? '' : ' · Pasif hizmet'}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
          {!services.length ? (
            <AppText color="textMuted" style={styles.noServices} variant="bodySmall">
              Önce işletme için bir hizmet oluşturmalısın.
            </AppText>
          ) : null}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <AppText color="danger" style={styles.errorText} variant="bodySmall">{error}</AppText>
        </View>
      ) : null}

      <View style={styles.submit}>
        <AppButton
          disabled={isSubmitting}
          onPress={() => void onSubmit({ isActive, isBookable, role, serviceIds: [...serviceIds] })}>
          {isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </AppButton>
      </View>
    </View>
  );
}

function SettingRow({
  description,
  disabled,
  label,
  onChange,
  value,
}: {
  description: string;
  disabled: boolean;
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  const themeColors = useThemeColors();

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingContent}>
        <AppText variant="label">{label}</AppText>
        <AppText color="textMuted" style={styles.settingDescription} variant="bodySmall">
          {description}
        </AppText>
      </View>
      <Switch
        disabled={disabled}
        onValueChange={onChange}
        thumbColor={value ? themeColors.primary : themeColors.surface}
        trackColor={{ false: themeColors.border, true: themeColors.primaryPressed }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  email: { color: '#D8CDC3', fontSize: 10, lineHeight: 14, marginTop: 2 },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: { fontSize: 13, lineHeight: 18 },
  sectionDescription: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  roleSelector: { marginTop: spacing.sm },
  settingRow: { alignItems: 'center', flexDirection: 'row', minHeight: 72 },
  settingContent: { flex: 1, marginRight: spacing.md },
  settingDescription: { fontSize: 9, lineHeight: 13, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth },
  serviceList: { marginTop: spacing.sm },
  serviceRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 56,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkmark: { fontSize: 12, lineHeight: 15 },
  serviceContent: { flex: 1, marginLeft: spacing.sm },
  serviceName: { fontSize: 11, lineHeight: 15 },
  serviceMeta: { fontSize: 9, lineHeight: 12, marginTop: 2 },
  noServices: { paddingVertical: spacing.md, textAlign: 'center' },
  errorBox: { backgroundColor: '#F8E8E5', borderRadius: radius.sm, padding: spacing.sm },
  errorText: { textAlign: 'center' },
  submit: { marginTop: spacing.md },
  pressed: { opacity: 0.68 },
});
