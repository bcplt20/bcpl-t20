import { useColorScheme } from 'react-native';

const palette = {
  text: '#FFFFFF',
  tint: '#FF1A75', // Hot Pink
  background: '#0B0813', // Midnight Violet/Black
  foreground: '#FFFFFF',
  card: '#161124',
  cardForeground: '#FFFFFF',
  primary: '#FF1A75',
  primaryForeground: '#FFFFFF',
  secondary: '#241838',
  secondaryForeground: '#E1D9F0',
  muted: '#1E1530',
  mutedForeground: '#9E93B3',
  accent: '#00E5FF', // Cyan
  accentForeground: '#000000',
  destructive: '#FF3333',
  destructiveForeground: '#FFFFFF',
  success: '#00E676',
  border: '#2C2244',
  input: '#2C2244',
  radius: 16,
};

export function useColors() {
  return palette;
}
