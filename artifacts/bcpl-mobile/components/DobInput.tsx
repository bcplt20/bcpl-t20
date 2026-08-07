import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';

export function parseDateString(dob: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_HI = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

function formatFriendlyDate(date: Date, lang: 'en' | 'hi') {
  const d = date.getDate();
  const y = date.getFullYear();
  const m = lang === 'hi' ? MONTHS_HI[date.getMonth()] : MONTHS_EN[date.getMonth()];
  return `${d} ${m} ${y}`;
}

export function DobInput({ 
  value, 
  onChange, 
  error 
}: { 
  value: string; 
  onChange: (val: string) => void;
  error?: string | null;
}) {
  const c = useColors();
  const { t, lang } = useLang();
  
  const handleTextChange = (text: string) => {
    // Only keep digits
    const digits = text.replace(/\D/g, '');
    let formatted = digits;
    
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    if (digits.length > 6) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    }
    
    // Check if the user is backspacing across a dash
    if (value.endsWith('-') && text.length < value.length) {
      // Removing the dash, also remove the preceding digit
      formatted = formatted.slice(0, -1);
      // Wait, if text is "1995-04", digits is "199504", formatted is "1995-04"
      // If we just stripped dash, digits is the same. The logic above rebuilds it.
      // Better way:
    }
    onChange(formatted);
  };

  const parsedDate = useMemo(() => parseDateString(value), [value]);

  return (
    <View style={{ marginBottom: 4 }}>
      <TextInput
        value={value}
        onChangeText={(text) => {
          if (value.endsWith('-') && text.length === value.length - 1 && text === value.slice(0, -1)) {
            // User hit backspace on a dash. Remove the dash and the digit before it.
            onChange(value.slice(0, -2));
          } else {
            const digits = text.replace(/\D/g, '');
            let formatted = digits;
            if (digits.length > 4) formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
            if (digits.length > 6) formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
            onChange(formatted);
          }
        }}
        placeholder="YYYY-MM-DD (जैसे 1995-04-23)"
        placeholderTextColor={c.sub}
        keyboardType="number-pad"
        maxLength={10}
        style={{
          backgroundColor: c.card2,
          color: c.ink,
          fontFamily: 'PlusJakartaSans_600SemiBold',
          fontSize: 15,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? c.magenta : c.line,
        }}
      />
      {parsedDate ? (
        <Text style={{ color: c.cyan, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12.5, marginTop: 8, paddingHorizontal: 4 }}>
          {formatFriendlyDate(parsedDate, lang)}
        </Text>
      ) : null}
      {error && !parsedDate ? (
        <Text style={{ color: c.magenta, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5, marginTop: 8, paddingHorizontal: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
