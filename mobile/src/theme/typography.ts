export const fontFamily = {
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  display: 'PlayfairDisplay_500Medium',
  displayBold: 'PlayfairDisplay_600SemiBold',
} as const;

export const typography = {
  displayLarge: { fontFamily: fontFamily.displayBold, fontSize: 36, lineHeight: 43 },
  displayMedium: { fontFamily: fontFamily.displayBold, fontSize: 32, lineHeight: 39 },
  pageTitle: { fontFamily: fontFamily.bodyBold, fontSize: 28, lineHeight: 34 },
  sectionTitle: { fontFamily: fontFamily.bodyBold, fontSize: 22, lineHeight: 28 },
  cardTitle: { fontFamily: fontFamily.bodySemiBold, fontSize: 16, lineHeight: 21 },
  heading: { fontFamily: fontFamily.bodySemiBold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, lineHeight: 18 },
  overline: { fontFamily: fontFamily.bodyBold, fontSize: 11, letterSpacing: 1.6, lineHeight: 16 },
} as const;
