import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

type AppTextVariant = keyof typeof typography;

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: AppTextVariant;
    color?: keyof typeof colors;
  }
>;

export function AppText({
  children,
  color = 'text',
  style,
  variant = 'body',
  ...props
}: AppTextProps) {
  return (
    <Text style={[styles.base, typography[variant], { color: colors[color] }, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create<{ base: TextStyle }>({
  base: {
    includeFontPadding: false,
  },
});
