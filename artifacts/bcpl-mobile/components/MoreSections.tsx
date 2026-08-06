import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export function AccordionItem({ title, body }: { title: string; body: string }) {
  const c = useColors();
  const [open, setOpen] = useState(false);

  return (
    <Pressable
      onPress={() => setOpen(!open)}
      style={{
        backgroundColor: c.card2,
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: open ? c.cyan : c.line,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ flex: 1, color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, lineHeight: 22 }}>
          {title}
        </Text>
        <View style={{
          width: 32, height: 32, borderRadius: 16, backgroundColor: open ? c.cyan : c.card,
          alignItems: 'center', justifyContent: 'center', marginLeft: 12
        }}>
          <Feather name={open ? 'minus' : 'plus'} size={18} color={open ? '#000' : c.sub} />
        </View>
      </View>
      {open && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line }}>
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, lineHeight: 22 }}>
            {body}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function LegalGrid() {
  const c = useColors();
  const router = useRouter();
  const items = [
    { title: 'Terms', icon: 'file-text', path: '/pages/terms', colors: ['#5B2BF0', '#9B2FF0'] as const },
    { title: 'Privacy', icon: 'shield', path: '/pages/privacy', colors: ['#FF3DA6', '#FF1A75'] as const },
    { title: 'Refunds', icon: 'refresh-ccw', path: '/pages/refunds', colors: ['#00E5FF', '#00B3FF'] as const },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
      {items.map((item, i) => (
        <Pressable
          key={i}
          onPress={() => router.push(item.path as any)}
          style={{ flex: 1, backgroundColor: c.card2, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: c.line }}
        >
          <LinearGradient colors={item.colors} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Feather name={item.icon as any} size={20} color="#fff" />
          </LinearGradient>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>{item.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function IconRow({ icon, title, subtitle, colors, onPress, destructive = false }: any) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
    >
      <LinearGradient colors={colors} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
        <Feather name={icon} size={20} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ color: destructive ? c.coral : c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>{title}</Text>
        {subtitle && <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color={c.sub} />
    </Pressable>
  );
}