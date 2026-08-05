import { useColorScheme } from 'react-native';

const palette = {
  text: '#FFFFFF',
  tint: '#FF6B00',
  background: '#070C1A',
  foreground: '#FFFFFF',
  card: '#121F3D',
  cardForeground: '#FFFFFF',
  primary: '#FF6B00',
  primaryForeground: '#FFFFFF',
  secondary: '#1A2950',
  secondaryForeground: '#E9EDF7',
  muted: '#1F3260',
  mutedForeground: '#9BA9C8',
  accent: '#E8B23D',
  accentForeground: '#0D1E44',
  destructive: '#FF3B30',
  destructiveForeground: '#FFFFFF',
  success: '#31C56B',
  border: '#273A66',
  input: '#273A66',
  radius: 16,
};

export function useColors() {
  return palette;
}
