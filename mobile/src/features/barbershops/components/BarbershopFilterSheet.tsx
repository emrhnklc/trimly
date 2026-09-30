import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import {
  discoveryFilters,
  type DiscoveryFilter,
} from '@/features/barbershops/components/BarbershopDiscoveryFilters';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export type DetailedDiscoveryFilters = {
  district: string | null;
  service: string | null;
  sort: DiscoveryFilter;
  teamOnly: boolean;
};

export function BarbershopFilterSheet({
  districts,
  onApply,
  onClose,
  services,
  value,
  visible,
}: {
  districts: string[];
  onApply: (filters: DetailedDiscoveryFilters) => void;
  onClose: () => void;
  services: string[];
  value: DetailedDiscoveryFilters;
  visible: boolean;
}) {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  function clear() {
    setDraft({ district: null, service: null, sort: 'featured', teamOnly: false });
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Filtreleri kapat"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: themeColors.border }]} />
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: themeColors.surfaceMuted }]}>
              <SymbolView
                name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
                size={22}
                tintColor={themeColors.primary}
              />
            </View>
            <View style={styles.headerCopy}>
              <AppText style={styles.title} variant="pageTitle">Filtrele</AppText>
              <AppText color="textMuted">Aradığın berberi kolayca bul.</AppText>
            </View>
            <Pressable
              accessibilityLabel="Filtreleri kapat"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={19}
                tintColor={themeColors.text}
              />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <FilterSection icon={{ ios: 'arrow.up.arrow.down', android: 'sort', web: 'sort' }} title="Sıralama">
              <View style={styles.chips}>
                {discoveryFilters.map((filter) => (
                  <FilterChip
                    active={draft.sort === filter.value}
                    icon={filter.icon}
                    key={filter.value}
                    label={filter.label}
                    onPress={() => setDraft((current) => ({ ...current, sort: filter.value }))}
                  />
                ))}
              </View>
            </FilterSection>

            {districts.length ? (
              <FilterSection icon={{ ios: 'mappin', android: 'location_on', web: 'location_on' }} title="Konum">
                <View style={styles.chips}>
                  {districts.map((district) => (
                    <FilterChip
                      active={draft.district === district}
                      key={district}
                      label={district}
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          district: current.district === district ? null : district,
                        }))
                      }
                    />
                  ))}
                </View>
              </FilterSection>
            ) : null}

            {services.length ? (
              <FilterSection icon={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }} title="Hizmet">
                <View style={styles.chips}>
                  {services.map((service) => (
                    <FilterChip
                      active={draft.service === service}
                      key={service}
                      label={service}
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          service: current.service === service ? null : service,
                        }))
                      }
                    />
                  ))}
                </View>
              </FilterSection>
            ) : null}

            <FilterSection icon={{ ios: 'person.2', android: 'group', web: 'group' }} title="Ek seçenekler">
              <View style={styles.switchRow}>
                <View style={[styles.teamIcon, { backgroundColor: themeColors.surfaceMuted }]}>
                  <SymbolView
                    name={{ ios: 'person.2', android: 'group', web: 'group' }}
                    size={20}
                    tintColor={themeColors.primary}
                  />
                </View>
                <View style={styles.switchCopy}>
                  <AppText variant="cardTitle">Ekibi olanlar</AppText>
                  <AppText color="textMuted" variant="bodySmall">
                    Birden fazla randevuya açık çalışanı olan işletmeler
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel="Yalnız ekibi olan işletmeleri göster"
                  onValueChange={(teamOnly) => setDraft((current) => ({ ...current, teamOnly }))}
                  thumbColor={themeColors.onPrimary}
                  trackColor={{ false: themeColors.surfaceMuted, true: themeColors.primary }}
                  value={draft.teamOnly}
                />
              </View>
            </FilterSection>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={clear}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                pressed && styles.pressed,
              ]}>
              <AppText variant="label">Temizle</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onApply(draft)}
              style={({ pressed }) => [
                styles.action,
                styles.applyAction,
                { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                pressed && styles.pressed,
              ]}>
              <AppText color="onPrimary" variant="label">Filtreleri Uygula</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({ children, icon, title }: {
  children: React.ReactNode;
  icon: Parameters<typeof SymbolView>[0]['name'];
  title: string;
}) {
  const themeColors = useThemeColors();
  return (
    <View style={[styles.section, { borderTopColor: themeColors.border }]}>
      <View style={styles.sectionTitleRow}>
        <SymbolView name={icon} size={17} tintColor={themeColors.text} />
        <AppText variant="label">{title}</AppText>
      </View>
      {children}
    </View>
  );
}

function FilterChip({ active, icon, label, onPress }: {
  active: boolean;
  icon?: Parameters<typeof SymbolView>[0]['name'];
  label: string;
  onPress: () => void;
}) {
  const themeColors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? themeColors.primary : themeColors.surface,
          borderColor: active ? themeColors.primary : themeColors.border,
        },
        pressed && styles.pressed,
      ]}>
      {icon ? (
        <SymbolView
          name={icon}
          size={15}
          tintColor={active ? themeColors.onPrimary : themeColors.textMuted}
        />
      ) : null}
      <AppText color={active ? 'onPrimary' : 'text'} variant="bodySmall">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(12, 10, 8, 0.58)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    maxHeight: '91%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: { alignSelf: 'center', borderRadius: radius.pill, height: 5, marginBottom: spacing.md, width: 48 },
  header: { alignItems: 'center', flexDirection: 'row' },
  headerIcon: { alignItems: 'center', borderRadius: radius.md, height: 46, justifyContent: 'center', width: 46 },
  headerCopy: { flex: 1, marginLeft: spacing.sm },
  title: { fontSize: 28, lineHeight: 34 },
  closeButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  content: { paddingBottom: spacing.md },
  section: { borderTopWidth: 1, marginTop: spacing.lg, paddingTop: spacing.md },
  sectionTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  switchRow: { alignItems: 'center', flexDirection: 'row' },
  teamIcon: { alignItems: 'center', borderRadius: radius.pill, height: 42, justifyContent: 'center', width: 42 },
  switchCopy: { flex: 1, marginHorizontal: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  action: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  applyAction: { flex: 1.5 },
  pressed: { opacity: 0.72 },
});
