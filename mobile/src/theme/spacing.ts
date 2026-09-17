export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  smallCard: 14,
  card: 18,
  pill: 999,
} as const;

/**
 * Ekranlar arası görsel ritmi koruyan ortak ölçüler.
 * Yeni müşteri ekranlarında önce bunlar tercih edilmeli; özel ölçüler yalnız
 * bileşenin yapısı gerçekten gerektiriyorsa eklenmeli.
 */
export const layout = {
  screenHorizontalPadding: spacing.lg,
  sectionGap: 28,
  cardGap: spacing.sm,
  primaryButtonHeight: 52,
  bottomNavIconSize: 24,
} as const;
