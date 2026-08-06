import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getClassification, saveClassification, ApiError, type ClassificationValue } from '@/lib/api';
import { canonicalRole } from '@/lib/roleLabel';
import {
  BATTING_POSITIONS,
  BATTING_STYLES,
  bowlingTypesForArm,
  handLabel,
  armLabel,
  styleLabel,
  bowlingTypeLabel,
  positionLabel,
  type BattingHand,
  type BattingPosition,
  type BattingStyle,
  type BowlingArm,
  type BowlingType,
} from '@/lib/classification';
import { Card, GlassAppBar, ScreenBackground, LoadingView, useAppBarHeight } from '@/components/ui';

// Player classification (playing style) — captured once before the skill video.
// Shows only the fields relevant to the player's role. AR fills two steps
// (1/2 batting, 2/2 bowling); everyone else fills a single step.
export default function ClassificationScreen() {
  const c = useColors();
  const router = useRouter();
  const { token, ready } = useAuth();
  const { t, lang } = useLang();
  const appBarHeight = useAppBarHeight();
  const qc = useQueryClient();

  const clsQ = useQuery({
    queryKey: ['classification', token],
    queryFn: () => getClassification(token as string),
    enabled: !!token,
  });

  const role = canonicalRole(clsQ.data?.role);
  const needsBatting = role === 'bat' || role === 'wk' || role === 'ar';
  const needsBowling = role === 'bowl' || role === 'ar';
  const twoStep = needsBatting && needsBowling; // all-rounders only

  const [battingHand, setBattingHand] = useState<BattingHand | null>(null);
  const [battingPosition, setBattingPosition] = useState<BattingPosition | null>(null);
  const [battingStyle, setBattingStyle] = useState<BattingStyle | null>(null);
  const [bowlingArm, setBowlingArm] = useState<BowlingArm | null>(null);
  const [bowlingType, setBowlingType] = useState<BowlingType | null>(null);
  const [stepIndex, setStepIndex] = useState(0); // 0 = first step
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Hydrate from any previously-saved classification once loaded.
  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (hydrated.current || !clsQ.data) return;
    hydrated.current = true;
    const v = clsQ.data.classification;
    if (v) {
      if (v.battingHand) setBattingHand(v.battingHand);
      if (v.battingPosition) setBattingPosition(v.battingPosition);
      if (v.battingStyle) setBattingStyle(v.battingStyle);
      if (v.bowlingArm) setBowlingArm(v.bowlingArm);
      if (v.bowlingType) setBowlingType(v.bowlingType);
    }
  }, [clsQ.data]);

  // Steps: for AR → ['batting','bowling']; batsman/wk → ['batting']; bowler → ['bowling'].
  const steps = useMemo<('batting' | 'bowling')[]>(() => {
    const s: ('batting' | 'bowling')[] = [];
    if (needsBatting) s.push('batting');
    if (needsBowling) s.push('bowling');
    return s;
  }, [needsBatting, needsBowling]);

  const currentStep = steps[stepIndex];

  if (!ready || clsQ.isLoading) return <LoadingView />;

  const battingValid = !needsBatting || (!!battingHand && !!battingPosition);
  const bowlingValid = !needsBowling || (!!bowlingArm && !!bowlingType);

  const buildPayload = (): ClassificationValue => {
    const payload: ClassificationValue = {};
    if (needsBatting) {
      payload.battingHand = battingHand ?? undefined;
      payload.battingPosition = battingPosition ?? undefined;
      if (role === 'wk' && battingStyle) payload.battingStyle = battingStyle;
    }
    if (needsBowling) {
      payload.bowlingArm = bowlingArm ?? undefined;
      payload.bowlingType = bowlingType ?? undefined;
    }
    return payload;
  };

  const onContinue = async () => {
    setError('');
    if (currentStep === 'batting' && !battingValid) {
      setError(t('Select your batting hand and position.', 'अपना बल्लेबाज़ी हाथ और स्थान चुनें।'));
      return;
    }
    if (currentStep === 'bowling' && !bowlingValid) {
      setError(t('Select your bowling arm and type.', 'अपना गेंदबाज़ी हाथ और प्रकार चुनें।'));
      return;
    }
    // Advance to the next step (AR batting → bowling), otherwise save.
    if (twoStep && stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const r = await saveClassification(token, buildPayload());
      qc.setQueryData(['classification', token], { role: r.role, classification: r.classification, complete: r.complete });
      // Refresh dashboard so upload-video / profile reflect completion.
      await qc.invalidateQueries({ queryKey: ['dashboard', token] });
      router.replace('/upload-video');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('Could not save. Please try again.', 'सहेजा नहीं जा सका। कृपया फिर कोशिश करें।'));
    } finally {
      setSaving(false);
    }
  };

  const onBack = () => {
    setError('');
    if (twoStep && stepIndex > 0) setStepIndex(stepIndex - 1);
    else router.back();
  };

  // ── Selectable chip ───────────────────────────────────────────────────
  const Chip = ({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID?: string }) => (
    <Pressable onPress={onPress} testID={testID} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.chip, { borderColor: selected ? 'transparent' : c.line, backgroundColor: selected ? 'transparent' : c.card2 }]}>
        {selected ? (
          <LinearGradient colors={['#5B2BF0', '#9B2FF0', '#FF3DA6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
        ) : null}
        <Text style={{ color: selected ? '#fff' : c.ink, fontFamily: selected ? 'BricolageGrotesque_800ExtraBold' : 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );

  const FieldLabel = ({ text }: { text: string }) => (
    <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.6, marginBottom: 10, marginTop: 4 }}>
      {text}
    </Text>
  );

  const isLastStep = !twoStep || stepIndex === steps.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Playing Style', 'खेल शैली')} back={true} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 16, paddingBottom: 40 }}>
        {/* Step indicator (AR is two steps) */}
        {twoStep ? (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {steps.map((s, i) => (
              <View key={s} style={{ flex: 1, height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: c.card2 }}>
                {i <= stepIndex ? (
                  <LinearGradient colors={['#5B2BF0', '#FF3DA6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginBottom: 6 }}>
          {t('Tell us your playing style', 'हमें अपनी खेल शैली बताएँ')}
        </Text>
        <Text style={{ color: c.sub, fontSize: 14, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 18 }}>
          {twoStep
            ? t(`Step ${stepIndex + 1} of ${steps.length}. This helps assess your video against the right criteria.`, `चरण ${stepIndex + 1}/${steps.length}. यह आपके video को सही मानदंड पर आँकने में मदद करता है।`)
            : t('This helps assess your video against the right criteria.', 'यह आपके video को सही मानदंड पर आँकने में मदद करता है।')}
        </Text>

        {currentStep === 'batting' ? (
          <Card>
            <Text style={{ color: c.getAccentText(c.magenta), fontSize: 13, fontFamily: 'BricolageGrotesque_800ExtraBold', letterSpacing: 0.5, marginBottom: 16 }}>
              {t('BATTING', 'बल्लेबाज़ी')}
            </Text>
            <FieldLabel text={t('BATTING HAND', 'बल्लेबाज़ी हाथ')} />
            <View style={styles.chipRow}>
              {(['right', 'left'] as BattingHand[]).map((h) => (
                <Chip key={h} label={handLabel(h, lang)} selected={battingHand === h} onPress={() => setBattingHand(h)} testID={`cls-hand-${h}`} />
              ))}
            </View>
            <FieldLabel text={t('BATTING POSITION', 'बल्लेबाज़ी स्थान')} />
            <View style={styles.chipRow}>
              {BATTING_POSITIONS.map((p) => (
                <Chip key={p} label={positionLabel(role, p, lang)} selected={battingPosition === p} onPress={() => setBattingPosition(p)} testID={`cls-pos-${p}`} />
              ))}
            </View>
            {role === 'wk' ? (
              <>
                <FieldLabel text={t('BATTING STYLE (OPTIONAL)', 'बल्लेबाज़ी शैली (वैकल्पिक)')} />
                <View style={styles.chipRow}>
                  {BATTING_STYLES.map((s) => (
                    <Chip key={s} label={styleLabel(s, lang)} selected={battingStyle === s} onPress={() => setBattingStyle(battingStyle === s ? null : s)} testID={`cls-style-${s}`} />
                  ))}
                </View>
              </>
            ) : null}
          </Card>
        ) : null}

        {currentStep === 'bowling' ? (
          <Card>
            <Text style={{ color: c.getAccentText(c.cyan), fontSize: 13, fontFamily: 'BricolageGrotesque_800ExtraBold', letterSpacing: 0.5, marginBottom: 16 }}>
              {t('BOWLING', 'गेंदबाज़ी')}
            </Text>
            <FieldLabel text={t('BOWLING ARM', 'गेंदबाज़ी हाथ')} />
            <View style={styles.chipRow}>
              {(['right', 'left'] as BowlingArm[]).map((a) => (
                <Chip
                  key={a}
                  label={armLabel(a, lang)}
                  selected={bowlingArm === a}
                  onPress={() => { setBowlingArm(a); setBowlingType(null); }}
                  testID={`cls-arm-${a}`}
                />
              ))}
            </View>
            {bowlingArm ? (
              <>
                <FieldLabel text={t('BOWLING TYPE', 'गेंदबाज़ी प्रकार')} />
                <View style={styles.chipRow}>
                  {bowlingTypesForArm(bowlingArm).map((bt) => (
                    <Chip key={bt} label={bowlingTypeLabel(bt, lang)} selected={bowlingType === bt} onPress={() => setBowlingType(bt)} testID={`cls-btype-${bt}`} />
                  ))}
                </View>
              </>
            ) : (
              <Text style={{ color: c.sub, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('Select your bowling arm first.', 'पहले अपना गेंदबाज़ी हाथ चुनें।')}
              </Text>
            )}
          </Card>
        ) : null}

        {error ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Feather name="alert-circle" size={16} color={c.magenta} />
            <Text style={{ color: c.magenta, fontSize: 13.5, flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          {twoStep && stepIndex > 0 ? (
            <Pressable onPress={onBack} disabled={saving} style={({ pressed }) => [styles.backBtn, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]} testID="cls-back">
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Back', 'पीछे')}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onContinue}
            disabled={saving}
            style={({ pressed }) => [styles.primaryBtn, { opacity: saving || pressed ? 0.7 : 1 }]}
            testID="cls-continue"
          >
            <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, letterSpacing: 0.5 }}>
                {isLastStep ? t('Save & Continue', 'सहेजें और आगे') : t('Continue', 'आगे बढ़ें')}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
