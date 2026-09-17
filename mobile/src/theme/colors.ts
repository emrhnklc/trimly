export const colors = {
  background: '#F7F3EA',
  surface: '#FFFCF7',
  surfaceMuted: '#EADFCB',
  text: '#1E1E1E',
  textMuted: '#6B625A',
  border: '#E6DED2',
  primary: '#B8860B',
  primaryPressed: '#966B08',
  onPrimary: '#FFFFFF',
  success: '#2E6B4E',
  successSurface: '#E6F1EA',
  info: '#246B84',
  infoSurface: '#E4F1F5',
  dangerSurface: '#F8E8E5',
  darkSurface: '#3A2F28',
  danger: '#B63A30',
} as const;

export type ThemeColors = { [Key in keyof typeof colors]: string };

export const darkColors: ThemeColors = {
  background: '#151310',
  surface: '#211E1A',
  surfaceMuted: '#352F28',
  text: '#F7F1E7',
  textMuted: '#BDB3A6',
  border: '#403A32',
  primary: '#D3A62C',
  primaryPressed: '#B8860B',
  onPrimary: '#FFFFFF',
  success: '#72B895',
  successSurface: '#20372C',
  info: '#72B7CE',
  infoSurface: '#1D343D',
  dangerSurface: '#422723',
  darkSurface: '#0E0C0A',
  danger: '#EF7C70',
};
