/**
 * BCPL brand tokens — mirrors the website's V3 "lightened dark navy" palette
 * (bg #1B2E52 / card #24396B, orange #FF6B00, gold #E8B23D).
 * The app is dark-navy in both schemes to match league branding.
 */

const navy = {
  text: '#FFFFFF',
  tint: '#FF6B00',

  background: '#16264A',
  foreground: '#FFFFFF',

  card: '#24396B',
  cardForeground: '#FFFFFF',

  primary: '#FF6B00',
  primaryForeground: '#FFFFFF',

  secondary: '#1B2E52',
  secondaryForeground: '#E9EDF7',

  muted: '#1F3260',
  mutedForeground: '#9FAFD2',

  accent: '#E8B23D',
  accentForeground: '#0D1E44',

  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',

  success: '#31C56B',

  border: '#33487A',
  input: '#33487A',
};

const colors = {
  light: navy,
  dark: navy,
  radius: 12,
};

export default colors;
