import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { findPreset } from '@/lib/avatars';
import type { Avatar } from '@/lib/api';

// Renders a player's avatar: an uploaded photo, a preset icon-circle, or a
// default user icon fallback. Used in profile.tsx and the More tab header.
export function AvatarCircle({ avatar, size = 88 }: { avatar?: Avatar | null; size?: number }) {
  const c = useColors();
  const radius = size / 2;
  const iconSize = Math.round(size * 0.45);

  if (avatar?.kind === 'photo' && avatar.viewUrl) {
    return (
      <Image
        source={{ uri: avatar.viewUrl }}
        style={{ width: size, height: size, borderRadius: radius, borderWidth: 2, borderColor: c.line }}
        contentFit="cover"
      />
    );
  }

  const preset = findPreset(avatar?.preset);
  if (avatar?.kind === 'preset' && preset) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient
          colors={preset.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Feather name={preset.icon} size={iconSize} color="#fff" />
      </View>
    );
  }

  // Default fallback — neutral icon circle.
  return (
    <View style={{ width: size, height: size, borderRadius: radius, borderWidth: 2, borderColor: c.line, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name="user" size={iconSize} color={c.magenta} />
    </View>
  );
}
