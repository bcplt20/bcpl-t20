import type { Feather } from '@expo/vector-icons';

// Fixed preset avatars — colored icon circles. Owner explicitly allowed
// predefined icons for avatars. Keep ids in sync with the server
// (api-server src/routes/user.ts AVATAR_PRESETS).
export type AvatarPreset = {
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  colors: readonly [string, string];
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'bat', icon: 'award', colors: ['#5B2BF0', '#9B2FF0'] },
  { id: 'ball', icon: 'circle', colors: ['#FF3DA6', '#FF1A75'] },
  { id: 'helmet', icon: 'shield', colors: ['#00DCF5', '#4B6BFF'] },
  { id: 'trophy', icon: 'award', colors: ['#FFC53D', '#FF7A3D'] },
  { id: 'star', icon: 'star', colors: ['#9B2FF0', '#FF3DA6'] },
  { id: 'shield', icon: 'shield', colors: ['#16E0A3', '#00B8D9'] },
  { id: 'flame', icon: 'zap', colors: ['#FF7A3D', '#FF1A75'] },
  { id: 'target', icon: 'target', colors: ['#00E5FF', '#5B2BF0'] },
];

export function findPreset(id?: string | null): AvatarPreset | undefined {
  if (!id) return undefined;
  return AVATAR_PRESETS.find((p) => p.id === id);
}
