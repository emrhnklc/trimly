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

const minimumReadableFontSize = 12;
const minimumReadableLineHeight = 16;

export function AppText({
  children,
  color = 'text',
  style,
  variant = 'body',
  ...props
}: AppTextProps) {
  const resolvedStyle = StyleSheet.flatten([typography[variant], style]);
  const readableSize = {
    fontSize: Math.max(resolvedStyle.fontSize ?? minimumReadableFontSize, minimumReadableFontSize),
    lineHeight: Math.max(
      resolvedStyle.lineHeight ?? minimumReadableLineHeight,
      minimumReadableLineHeight,
    ),
  };

  return (
    <Text
      style={[styles.base, typography[variant], { color: colors[color] }, style, readableSize]}
      {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create<{ base: TextStyle }>({
  base: {
    includeFontPadding: false,
  },
});
