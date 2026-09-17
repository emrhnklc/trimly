import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, type StyleProp, type TextStyle, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useThemeColors } from '@/theme/useThemeColors';

export type ProfileMenuItem = {
  badge?: string;
  danger?: boolean;
  icon: SymbolViewProps['name'];
  id: string;
  label: string;
  onPress?: () => void;
};

type ProfileMenuGroupProps = {
  items: ProfileMenuItem[];
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  titleVariant?: keyof typeof typography;
};

export function ProfileMenuGroup({
  items,
  title,
  titleStyle,
  titleVariant = 'label',
}: ProfileMenuGroupProps) {
  return (
    <View style={styles.section}>
      <AppText style={[styles.sectionTitle, titleStyle]} variant={titleVariant}>{title}</AppText>
      <AppCard style={styles.card}>
        {items.map((item, index) => (
          <MenuRow
            isLast={index === items.length - 1}
            item={item}
            key={item.id}
          />
        ))}
      </AppCard>
    </View>
  );
}

function MenuRow({ isLast, item }: { isLast: boolean; item: ProfileMenuItem }) {
  const colors = useThemeColors();
  const content = (
    <>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: item.danger ? colors.dangerSurface : colors.background },
        ]}>
        <SymbolView
          name={item.icon}
          size={18}
          tintColor={item.danger ? colors.danger : colors.textMuted}
        />
      </View>
      <AppText color={item.danger ? 'danger' : 'text'} style={styles.label}>
        {item.label}
      </AppText>
      {item.badge ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}>
          <AppText color="primary" style={styles.badgeText} variant="overline">{item.badge}</AppText>
        </View>
      ) : null}
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={17}
        tintColor={item.onPress ? colors.textMuted : colors.border}
      />
    </>
  );

  if (!item.onPress) {
    return (
      <View
        accessibilityLabel={`${item.label}, ${item.badge ?? 'yakında'}`}
        style={[
          styles.row,
          !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
          styles.disabled,
        ]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="button"
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
        pressed && styles.pressed,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  sectionTitle: { marginBottom: spacing.sm },
  card: { paddingHorizontal: spacing.sm, paddingVertical: 0 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 54, paddingHorizontal: spacing.xs },
  iconBox: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  label: { flex: 1, fontSize: 13, lineHeight: 18, marginLeft: spacing.sm },
  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 8, lineHeight: 10 },
  disabled: { opacity: 0.64 },
  pressed: { opacity: 0.62 },
});
