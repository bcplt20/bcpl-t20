import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import {
  getRegistrationStatus, getMe, getUploadUrl, confirmVideoUpload, getSiteSetting,
  getVideoInstructions, getVideoStatus, type VideoConstraints,
  type SampleVideos, type SampleVideoEntry, type SampleVideoRole,
} from '../lib/api';
import { useLang } from '@/lib/i18n';

// ── Role metadata ────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; req: string; tips: string[] }> = {
  bat:  { label:'Batsman',       color:'#3B82F6', req:'Show 3+ strokes: drives, pulls & sweeps',       tips:['Cover drive off front foot','Pull shot to leg side','Reverse or conventional sweep'] },
  bowl: { label:'Bowler',        color:'#8B5CF6', req:'5+ deliveries — mix pace & swing',              tips:['Outswinger & inswinger pair','Yorker delivery','Change of pace ball'] },
  wk:   { label:'Wicket-Keeper', color:'#06B6D4', req:'3+ takes & stumpings, glove work',              tips:['Caught behind the stumps','Quick stumping drill','Wide ball diving take'] },
  ar:   { label:'All-Rounder',   color:'#E8B23D', req:'2 min split — 1 min bat + 1 min bowl',          tips:['Batting first half','Bowling second half','Clear scene transitions'] },
};

const SAMPLE_VIDEOS = [
  { role:'Batsman',       color:'#3B82F6', gradient:'linear-gradient(135deg,#0a1f44 0%,#1a3a6e 50%,#0d2a52 100%)', duration:'1:52', description:'Cover drive · Pull shot · Sweep shot · Footwork', what:'Watch how to demonstrate 3+ strokes clearly on camera — stance, backlift, and follow-through all visible.', ytSearch:'cricket batting trial video technique showcase', badge:'Most Selected', badgeColor:'#3B82F6' },
  { role:'Bowler',        color:'#8B5CF6', gradient:'linear-gradient(135deg,#1a0a44 0%,#3a1a6e 50%,#2a0d52 100%)', duration:'1:48', description:'Outswinger · Yorker · Change of pace · Run-up', what:'Full run-up visible, delivery stride, ball release — your action, seam position, and variation are assessed against the criteria.', ytSearch:'cricket bowling trial video technique fast medium spin', badge:'High Demand', badgeColor:'#8B5CF6' },
  { role:'Wicket-Keeper', color:'#06B6D4', gradient:'linear-gradient(135deg,#041f2e 0%,#0a3d4f 50%,#062a3a 100%)', duration:'1:55', description:'Standing up · Stumpings · Catches · Wide takes', what:'Film at chest height from mid-off angle — glove positioning, quick release, and agility are key scoring factors.', ytSearch:'cricket wicket keeper trial video stumping catch technique', badge:'Rare Role', badgeColor:'#06B6D4' },
  { role:'All-Rounder',   color:'#E8B23D', gradient:'linear-gradient(135deg,#2e1f04 0%,#4f3a0a 50%,#3a2a06 100%)', duration:'2:00', description:'1 min batting · 1 min bowling · Clear transitions', what:'Split exactly 50-50. Use a visible title card between segments. The criteria look for equal competence in both skills.', ytSearch:'cricket all rounder trial video batting bowling showcase', badge:'Top Auction', badgeColor:'#E8B23D' },
];

type UploadState = 'loading' | 'not_registered' | 'deadline_passed' | 'already_uploaded' | 'idle' | 'file_selected' | 'uploading' | 'confirming' | 'success' | 'error';

// Friendly copy for server-side validation failure reasons (GET /video/status → reuploadReason)
const REUPLOAD_COPY: Record<string, { en: string; hi: string }> = {
  VIDEO_TOO_SHORT:   { en: 'Your video was too short. Please upload at least 30 seconds of cricket footage.', hi: 'आपका वीडियो बहुत छोटा था। कृपया कम से कम 30 सेकंड की क्रिकेट फुटेज अपलोड करें।' },
  VIDEO_TOO_LONG:    { en: 'Your video was longer than the 60-second limit. Please upload a shorter video.', hi: 'आपका वीडियो 60 सेकंड की सीमा से लंबा था। कृपया छोटा वीडियो अपलोड करें।' },
  CORRUPTED_VIDEO:   { en: 'We could not read your video file. Please record again in MP4 or MOV format.', hi: 'हम आपकी वीडियो फ़ाइल नहीं पढ़ सके। कृपया MP4 या MOV फॉर्मेट में दोबारा रिकॉर्ड करें।' },
  REUPLOAD_REQUIRED: { en: 'We could not process your last upload. Please upload a new video.', hi: 'हम आपका पिछला अपलोड प्रोसेस नहीं कर सके। कृपया नया वीडियो अपलोड करें।' },
  // AI validity (pass zero) reasons — §17 approved copy
  NOT_CRICKET_VIDEO:       { en: 'The footage does not clearly show cricket play. Please upload a genuine cricket video.', hi: 'फुटेज में क्रिकेट खेलते हुए साफ़ नहीं दिख रहा। कृपया असली क्रिकेट वीडियो अपलोड करें।' },
  PLAYER_NOT_VISIBLE:      { en: 'You are not clearly visible in the video. Keep your full body in frame.', hi: 'वीडियो में आप साफ़ नहीं दिख रहे। पूरा शरीर फ्रेम में रखें।' },
  INSUFFICIENT_ACTIONS:    { en: 'Not enough cricket actions to assess. Show more shots or deliveries.', hi: 'आकलन के लिए पर्याप्त क्रिकेट एक्शन नहीं। और शॉट या डिलीवरी दिखाएं।' },
  VIDEO_TOO_DARK:          { en: 'The video is too dark to assess clearly. Please record in better light.', hi: 'वीडियो बहुत अंधेरा है। कृपया बेहतर रोशनी में रिकॉर्ड करें।' },
  EXCESSIVE_EDITING:       { en: 'Too many edits or filters. Upload normal-speed, unedited footage.', hi: 'बहुत ज़्यादा एडिटिंग या फ़िल्टर। नॉर्मल स्पीड का बिना एडिट वीडियो अपलोड करें।' },
  WRONG_ROLE_EVIDENCE:     { en: 'The footage does not match your registered playing role.', hi: 'फुटेज आपके रजिस्टर्ड रोल से मेल नहीं खाती।' },
  ASSESSMENT_NOT_RELIABLE: { en: 'We could not reliably complete your assessment from this upload. Please record a clearer video.', hi: 'इस अपलोड से आपका आकलन विश्वसनीय रूप से पूरा नहीं हो सका। कृपया साफ़ वीडियो रिकॉर्ड करें।' },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDaysLeft(deadline: string | null | undefined): number {
  if (!deadline) return 0;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Live countdown to the upload deadline — ticks every second. */
function useCountdown(deadline: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - now;
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true, urgent: true };
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
    expired: false,
    urgent: ms < 24 * 3600000,
  };
}

const ALLOWED_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/webm': 'webm',
};

export function Phase1VideoUpload() {
  const { t } = useLang();
  const [dragging, setDragging]     = useState(false);
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [samples, setSamples]         = useState<SampleVideos | null>(null);
  const [samplesErr, setSamplesErr]   = useState(false);

  // Data from API
  const [uploadState, setUploadState] = useState<UploadState>('loading');
  const [errMsg, setErrMsg]           = useState('');
  const [regId, setRegId]             = useState('');
  const [regNumber, setRegNumber]     = useState<string | null>(null);
  const [constraints, setConstraints] = useState<VideoConstraints | null>(null);
  const [instr, setInstr]             = useState<{ en: string[]; hi: string[] } | null>(null);
  const [declAccepted, setDeclAccepted] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [canReupload, setCanReupload] = useState(false);
  const [reuploadsLeft, setReuploadsLeft] = useState(0);
  const [reuploadReason, setReuploadReason] = useState<string | null>(null);
  const [role, setRole]               = useState('bat');
  const [city, setCity]               = useState('');
  const [userName, setUserName]       = useState('');
  const [deadline, setDeadline]       = useState<string | null>(null);
  const [phase1Fee, setPhase1Fee]     = useState(299);

  // File & upload
  const [file, setFile]             = useState<File | null>(null);
  const [fileErr, setFileErr]       = useState('');
  const [progress, setProgress]     = useState(0);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // Live deadline countdown; flips the page to deadline_passed mid-session.
  const cd = useCountdown(deadline);
  useEffect(() => {
    if (cd?.expired && (uploadState === 'idle' || uploadState === 'file_selected')) {
      setUploadState('deadline_passed');
    }
  }, [cd?.expired, uploadState]);

  /** Admin-uploaded sample video for a role card (null = none uploaded yet). */
  const sampleFor = (roleName: string): SampleVideoEntry | null =>
    (samples?.[roleName.toLowerCase() as SampleVideoRole] ?? null);

  // ── Load registration data on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [regData, meData, vidData] = await Promise.allSettled([
          getRegistrationStatus(),
          getMe(),
          getVideoStatus(),
        ]);

        if (meData.status === 'fulfilled') setUserName(meData.value.user.name);
        if (vidData.status === 'fulfilled') {
          setCanReupload(!!vidData.value.canReupload);
          setReuploadsLeft(Math.max(0, (vidData.value.maxAttempts ?? 1) - (vidData.value.attemptsUsed ?? 0)));
          setReuploadReason(vidData.value.reuploadReason ?? null);
        }

        if (regData.status === 'rejected') {
          setUploadState('not_registered'); return;
        }
        const reg = regData.value;

        if (!reg.registered) { setUploadState('not_registered'); return; }

        // Must have paid before uploading
        if (reg.phase1Status === 'pending') { setUploadState('not_registered'); return; }

        setRegId(reg.registrationId ?? '');
        setRegNumber((reg as any).regNumber ?? null);
        setRole(reg.role ?? 'bat');
        setCity(reg.trialCity ?? '');
        setDeadline(reg.videoDeadline ?? null);
        setPhase1Fee(reg.fees?.phase1 ?? 299);

        if (reg.phase1Status === 'video_submitted' || reg.phase1Status === 'selected' || reg.phase1Status === 'rejected' || reg.phase1Status === 'p1_selected' || reg.phase1Status === 'p1_rejected') {
          // Redirect to result page if selected/rejected, otherwise show already-uploaded
          if (reg.phase1Status === 'selected' || reg.phase1Status === 'rejected') {
            window.location.replace(import.meta.env.BASE_URL + 'register/result');
            return;
          }
          setUploadState('already_uploaded'); return;
        }

        const daysLeft = getDaysLeft(reg.videoDeadline);
        if (daysLeft === 0 && reg.videoDeadline) {
          setUploadState('deadline_passed'); return;
        }

        setUploadState('idle');
      } catch {
        setUploadState('not_registered');
      }
    })();
  }, []);

  // ── Admin-managed sample videos (site settings) ────────────────────────────
  useEffect(() => {
    getSiteSetting<SampleVideos>('sample_videos')
      .then(r => setSamples(r.value ?? {}))
      .catch(() => { setSamples({}); setSamplesErr(true); });
  }, []);

  // Role-specific filming instructions + upload constraints (admin-configurable)
  useEffect(() => {
    getVideoInstructions()
      .then(r => { setConstraints(r.constraints); setInstr(r.instructions); })
      .catch(() => {}); // fall back to built-in defaults
  }, []);

  // ── File validation ────────────────────────────────────────────────────────
  const handleFile = useCallback((f: File | null) => {
    setFileErr('');
    setVideoDuration(null);
    setDeclAccepted(false);
    if (!f) return;
    if (!ALLOWED_TYPES[f.type]) {
      setFileErr(t('Invalid format. Please upload MP4, MOV, AVI, or WebM.', 'अमान्य प्रारूप। कृपया MP4, MOV, AVI, या WebM अपलोड करें।')); return;
    }
    const capMb = constraints?.maxVideoFileSizeMb ?? 200;
    if (f.size > capMb * 1024 * 1024) {
      setFileErr(t('File too large (' + formatFileSize(f.size) + '). Max ' + capMb + ' MB.', 'फ़ाइल बहुत बड़ी है (' + formatFileSize(f.size) + ')। अधिकतम ' + capMb + ' MB.')); return;
    }
    // Measure duration from video metadata before accepting the file
    const minS = constraints?.videoMinSeconds ?? 30;
    const maxS = constraints?.videoMaxSeconds ?? 60;
    const url = URL.createObjectURL(f);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const dur = probe.duration;
      if (Number.isFinite(dur)) {
        const rounded = Math.round(dur);
        setVideoDuration(rounded);
        if (rounded < minS - 1 || rounded > maxS + 1) {
          setFileErr(t(
            'Video must be ' + minS + '-' + maxS + ' seconds. Yours is ' + rounded + 's — please trim or re-record.',
            'वीडियो ' + minS + '-' + maxS + ' सेकंड का होना चाहिए। आपका ' + rounded + ' सेकंड का है — कृपया छोटा करें या दोबारा रिकॉर्ड करें।',
          ));
          return;
        }
      }
      setFile(f);
      setUploadState('file_selected');
    };
    probe.onerror = () => {
      // Metadata unreadable in this browser — accept and let the server validate
      URL.revokeObjectURL(url);
      setFile(f);
      setUploadState('file_selected');
    };
    probe.src = url;
  }, [t, constraints]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  // ── Upload to S3 + confirm ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!file || !regId) return;
    setErrMsg('');
    setUploadState('uploading');
    setProgress(0);

    try {
      // Step 1: Get presigned URL
      const { presignedUrl, s3Key } = await getUploadUrl(regId, file.type, file.size);

      // Step 2: Upload directly to S3 via XHR (for progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`S3 upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
      setProgress(92);

      // Step 3: Confirm with our API
      setUploadState('confirming');
      await confirmVideoUpload(regId, s3Key, true, videoDuration ?? undefined);
      setProgress(100);
      setUploadState('success');
    } catch (e: any) {
      setErrMsg(e?.message ?? t('Upload failed. Please try again.', 'अपलोड विफल रहा। कृपया पुनः प्रयास करें।'));
      setUploadState('file_selected');
    }
  }, [file, regId, t, videoDuration]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const roleMeta    = ROLE_META[role] ?? ROLE_META.bat;
  const daysLeft    = getDaysLeft(deadline);
  const shortRegId  = regId ? regId.slice(0, 8).toUpperCase() : '—';
  const minSec      = constraints?.videoMinSeconds ?? 30;
  const maxSec      = constraints?.videoMaxSeconds ?? 60;
  const maxMb       = constraints?.maxVideoFileSizeMb ?? 200;

  // ── Full-page states ───────────────────────────────────────────────────────
  if (uploadState === 'loading') {
    return (
      <div style={{ background:'var(--bg)', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, fontFamily:'var(--font-body)' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(232,178,61,0.2)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
        <div style={{ color:'var(--ink-3)', fontSize:14 }}>{t('Loading your registration…', 'आपका रजिस्ट्रेशन लोड हो रहा है…')}</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (uploadState === 'not_registered') {
    return (
      <div style={{ background:'var(--bg)', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'var(--font-body)' }}>
        <div style={{ maxWidth:420, textAlign:'center' }}>
          <div style={{ width:80, height:80, margin:'0 auto 20px', background:'rgba(255,122,41,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 style={{ color:'var(--ink)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, marginBottom:12, textTransform:'uppercase' }}>{t('Registration Required', 'रजिस्ट्रेशन आवश्यक है')}</h2>
          <p style={{ color:'var(--ink-3)', fontSize:14, marginBottom:24, lineHeight:1.7 }}>{t('Please complete Phase 1 registration and payment before uploading your trial video.', 'अपना ट्रायल वीडियो अपलोड करने से पहले कृपया Phase 1 रजिस्ट्रेशन और भुगतान पूरा करें।')}</p>
          <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,var(--orange),var(--orange-2))', color:'#fff', textDecoration:'none', padding:'14px 32px', borderRadius:'var(--r)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, letterSpacing:'.08em', textTransform:'uppercase' }}>
            {t('REGISTER NOW', 'अभी रजिस्टर करें')} →
          </Link>
        </div>
      </div>
    );
  }

  if (uploadState === 'deadline_passed') {
    return (
      <div style={{ background:'var(--bg)', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'var(--font-body)' }}>
        <div style={{ maxWidth:440, textAlign:'center' }}>
          <div style={{ width:80, height:80, margin:'0 auto 20px', background:'rgba(239,68,68,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 style={{ color:'var(--red)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, marginBottom:12, textTransform:'uppercase' }}>{t('Upload Deadline Passed', 'अपलोड की समय सीमा समाप्त')}</h2>
          <p style={{ color:'var(--ink-3)', fontSize:14, marginBottom:24, lineHeight:1.7 }}>{t('Your video upload window has expired. Unfortunately, late submissions cannot be accepted for Phase 1 review.', 'आपकी वीडियो अपलोड विंडो समाप्त हो गई है। दुर्भाग्य से, Phase 1 समीक्षा के लिए देर से सबमिशन स्वीकार नहीं किए जा सकते।')}</p>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)', borderRadius:'var(--r)', padding:16, marginBottom:24 }}>
            <p style={{ color:'var(--ink-3)', fontSize:13 }}>{t('Season 6 registrations will open soon. Follow us on ', 'Season 6 के रजिस्ट्रेशन जल्द ही खुलेंगे। अपडेट के लिए ')}<strong style={{ color:'var(--orange)' }}>@bcpl.t20</strong>{t(' for updates.', ' को फॉलो करें।')}</p>
          </div>
          <a href="https://www.instagram.com/bcpl.t20" target="_blank" rel="noreferrer" style={{ display:'inline-block', background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.4)', color:'var(--orange)', textDecoration:'none', padding:'12px 28px', borderRadius:'var(--r)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'.06em', textTransform:'uppercase' }}>
            {t('FOLLOW @bcpl.t20', '@bcpl.t20 को फॉलो करें')}
          </a>
        </div>
      </div>
    );
  }

  if (uploadState === 'already_uploaded') {
    const failed = !!reuploadReason;
    const reasonCopy = REUPLOAD_COPY[reuploadReason ?? ''] ?? REUPLOAD_COPY.REUPLOAD_REQUIRED;
    return (
      <div style={{ background:'var(--bg)', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'var(--font-body)' }}>
        <div style={{ maxWidth:440, textAlign:'center' }}>
          {failed ? (
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(245,158,11,0.12)', border:'2px solid #F59E0B', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          ) : (
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(34,197,94,0.15)', border:'2px solid var(--green)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
          {failed ? (
            <>
              <h2 style={{ color:'#F59E0B', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, marginBottom:12, textTransform:'uppercase' }}>{t('We Need a New Upload', 'हमें नया अपलोड चाहिए')}</h2>
              <p style={{ color:'var(--ink-2)', fontSize:14, marginBottom:8, lineHeight:1.7 }}>
                {userName ? userName + ', ' : ''}{t('we could not accept your trial video.', 'हम आपका ट्रायल वीडियो स्वीकार नहीं कर सके।')}
              </p>
              <p style={{ color:'#F59E0B', fontSize:13, marginBottom:28, lineHeight:1.7, background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'var(--r)', padding:'12px 16px' }}>
                {t(reasonCopy.en, reasonCopy.hi)}
              </p>
              {!canReupload && (
                <p style={{ color:'var(--ink-3)', fontSize:13, marginBottom:24, lineHeight:1.7 }}>
                  {t('No upload attempts remaining. Please write to ', 'कोई अपलोड प्रयास शेष नहीं है। कृपया ')}<strong style={{ color:'var(--ink)' }}>support@bcplt20.com</strong>{t(' for help.', ' पर लिखें।')}
                </p>
              )}
            </>
          ) : (
            <>
              <h2 style={{ color:'var(--green)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, marginBottom:12, textTransform:'uppercase' }}>{t('Video Already Submitted!', 'वीडियो पहले ही सबमिट किया जा चुका है!')}</h2>
              <p style={{ color:'var(--ink-2)', fontSize:14, marginBottom:8, lineHeight:1.7 }}>
                {userName ? userName + ', ' : ''}{t('your Phase 1 submission is going through BCPL\'s evaluation process.', 'आपका Phase 1 सबमिशन BCPL की evaluation process से गुज़र रहा है।')}
              </p>
              <p style={{ color:'var(--ink-3)', fontSize:13, marginBottom:28 }}>{t('Result will be sent via Email, SMS and WhatsApp ', 'परिणाम ईमेल, SMS और WhatsApp के माध्यम से ')}<strong style={{ color:'var(--ink)' }}>{t('within 48 hours', '48 घंटों')}</strong>{t('.', ' के भीतर भेजा जाएगा।')}</p>
            </>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
            <Link href="/register/result" style={{ display:'inline-block', background:'var(--green)', color:'#fff', textDecoration:'none', padding:'14px 32px', borderRadius:'var(--r)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, letterSpacing:'.06em', textTransform:'uppercase' }}>
              {t('CHECK MY STATUS', 'मेरा स्टेटस देखें')} →
            </Link>
            {canReupload && reuploadsLeft > 0 && (
              <>
                <button onClick={() => { setFile(null); setDeclAccepted(false); setVideoDuration(null); setUploadState('idle'); }}
                  style={{ background:'rgba(255,122,41,0.1)', border:'1px solid rgba(255,122,41,0.4)', color:'var(--orange)', padding:'12px 28px', borderRadius:'var(--r)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'.06em', textTransform:'uppercase', cursor:'pointer' }}>
                  {t('RE-UPLOAD A BETTER VIDEO', 'बेहतर वीडियो दोबारा अपलोड करें')} · {reuploadsLeft} {t('LEFT', 'बचे')}
                </button>
                <div style={{ fontSize:12, color:'var(--ink-3)', maxWidth:360, lineHeight:1.6 }}>
                  {t('A new upload replaces your earlier video before review begins.', 'समीक्षा शुरू होने से पहले नया अपलोड आपके पुराने वीडियो की जगह लेगा।')}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (uploadState === 'success') {
    return (
      <div style={{ background:'var(--bg)', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'var(--font-body)' }}>
        <style>{`
          @keyframes popIn{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        `}</style>
        <div style={{ maxWidth:480, textAlign:'center' }}>
          <div style={{ width:100, height:100, borderRadius:'50%', background:'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05))', border:'3px solid var(--green)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', animation:'popIn .5s cubic-bezier(.34,1.56,.64,1)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ color:'var(--green)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, letterSpacing:'-.01em', marginBottom:8, textTransform:'uppercase' }}>{t('VIDEO SUBMITTED!', 'वीडियो सबमिट हो गया!')}</h2>
          <p style={{ color:'var(--ink-2)', fontSize:15, marginBottom:6, lineHeight:1.6 }}>
            {userName ? t(`Well done, ${userName}! `, `शाबाश, ${userName}! `) : ''}{t('Your trial video has been received successfully.', 'आपका ट्रायल वीडियो सफलतापूर्वक प्राप्त हो गया है।')}
          </p>
          <p style={{ color:'var(--ink-3)', fontSize:13, marginBottom:28, lineHeight:1.7 }}>
            {t('Your video is evaluated against BCPL\'s Phase 1 assessment criteria ', 'आपका वीडियो BCPL के Phase 1 assessment criteria के अनुसार ')}<strong style={{ color:'var(--ink)' }}>{t('within 48 hours', '48 घंटों')}</strong>{t('.', ' के भीतर evaluate किया जाता है।')}<br />
            {t('Result will arrive on ', 'परिणाम ')}<strong style={{ color:'var(--orange)' }}>{t('Email + SMS + WhatsApp', 'ईमेल + SMS + WhatsApp')}</strong>{t('.', ' पर आएगा।')}
          </p>
          <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'var(--r)', padding:16, marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color:'var(--ink-3)', fontSize:13, fontWeight:600 }}>{t('Status', 'स्थिति')}</span>
              <span style={{ color:'var(--green)', fontWeight:800, fontSize:13 }}>✓ {t('Under Review', 'समीक्षा के अधीन')}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}>
              <span style={{ color:'var(--ink-3)', fontSize:13, fontWeight:600 }}>{t('Expected Result', 'अपेक्षित परिणाम')}</span>
              <span style={{ color:'var(--orange)', fontWeight:800, fontSize:13 }}>{t('Within 48 Hours', '48 घंटों के भीतर')}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
            <Link href="/register/result" style={{ flex:1, minWidth:160, display:'block', background:'var(--green)', color:'#fff', textDecoration:'none', padding:'14px 24px', borderRadius:'var(--r)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, letterSpacing:'.06em', textTransform:'uppercase' }}>
              {t('CHECK MY STATUS', 'मेरा स्टेटस देखें')} →
            </Link>
            <Link href="/" style={{ flex:1, minWidth:160, display:'block', background:'rgba(255,255,255,0.06)', border:'1px solid var(--line)', color:'var(--ink-2)', textDecoration:'none', padding:'14px 24px', borderRadius:'var(--r)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'.06em', textTransform:'uppercase' }}>
              {t('GO HOME', 'होम पर जाएं')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main upload page ───────────────────────────────────────────────────────
  const isUploading  = uploadState === 'uploading' || uploadState === 'confirming';
  const isFileReady  = uploadState === 'file_selected';

  return (
    <div style={{ background:'var(--bg)', minHeight:'100dvh', color:'var(--ink)', fontFamily:"var(--font-body)", overflowX:'hidden', paddingBottom:'calc(120px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes pulseDanger{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}50%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes uploadBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes progressPulse{0%,100%{opacity:1}50%{opacity:0.7}}
        
        .W{max-width:var(--container);margin:0 auto;padding:0 20px}
        @media(min-width:768px){.W{padding:0 32px}}
        @media(min-width:1280px){.W{padding:0 48px}}
        
        .btn-primary{background:linear-gradient(135deg,var(--orange),var(--orange-2));border:none;border-radius:var(--r);color:#fff;font-family:'Barlow Condensed',sans-serif;font-weight:900;fontSize:15px;letter-spacing:0.06em;cursor:pointer;transition:transform .15s,filter .2s;text-transform:uppercase;padding:16px 32px;}
        .btn-primary:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-2px)}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed}
        
        .upload-zone{border:2px dashed rgba(255,122,41,0.35);background:var(--panel);border-radius:var(--r);padding:48px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;transition:all .2s;min-height:260px;width:100%;}
        .upload-zone:hover,.upload-zone.drag{border-color:var(--orange);background:rgba(255,122,41,0.06)}
        
        .guideline-card{background:var(--panel);border-left:3px solid var(--orange);padding:18px 20px;border-radius:0 var(--r) var(--r) 0;margin-bottom:12px;border-top:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line);}
        .guideline-card:last-child{margin-bottom:0}
        .tip-check{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px;color:var(--ink-2);line-height:1.5;font-weight:500;}
        .tip-check:last-child{border-bottom:none}
        
        .info-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;}
        
        .two-col{display:flex;flex-direction:column;gap:32px}
        @media(min-width:900px){.two-col{flex-direction:row;gap:40px}}
        .col-left{flex:1;min-width:0}
        .col-right{flex:1;min-width:0}
        
        .progress-bar{height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;margin-top:12px;}
        .progress-fill{height:100%;background:linear-gradient(90deg,var(--orange),var(--gold));border-radius:4px;transition:width .3s ease;animation:progressPulse 1.5s ease infinite;}
      `}</style>

      <SiteHeader />

      {/* ── PAGE HEADER ── */}
      <div style={{ background:'linear-gradient(180deg,#030A16 0%,var(--bg) 100%)', borderBottom:'1px solid rgba(255,255,255,0.06)', paddingTop:40, paddingBottom:36 }}>
        <div className="W">
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:12, letterSpacing:'.18em', color:'var(--ink-3)', marginBottom:10, textTransform:'uppercase' }}>{t('Phase 1 · Step 2 of 3', 'Phase 1 · चरण 2 / 3')}</div>
              <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'clamp(32px,6vw,48px)', color:'var(--ink)', letterSpacing:'-.01em', textTransform:'uppercase', lineHeight:.95, marginBottom:10 }}>
                {userName ? t(`${userName.split(' ')[0]}, upload your`, `${userName.split(' ')[0]}, अपना`) : t('UPLOAD YOUR', 'अपना')}<br /><span style={{ color:'var(--orange)' }}>{t('TRIAL VIDEO', 'ट्रायल वीडियो अपलोड करें')}</span>
              </h1>
              <p style={{ color:'var(--ink-3)', fontSize:14, lineHeight:1.6, maxWidth:480 }}>{t('Your video is your ticket to the ground trials. Make every second count.', 'आपका वीडियो ग्राउंड ट्रायल्स के लिए आपका टिकट है। हर सेकंड का महत्व है।')}</p>
            </div>
            {/* Live deadline countdown (DD:HH:MM:SS) */}
            {cd && !cd.expired && (
              <div style={{ flexShrink:0, background: cd.urgent ? 'rgba(239,68,68,0.08)' : 'rgba(255,122,41,0.07)', border: '1px solid ' + (cd.urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,122,41,0.35)'), borderRadius:'var(--r)', padding:'12px 16px', animation: cd.urgent ? 'pulseDanger 2s ease-in-out infinite' : 'none' }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:11, letterSpacing:'.16em', color: cd.urgent ? 'var(--red)' : 'var(--orange)', textTransform:'uppercase', textAlign:'center', marginBottom:8 }}>
                  {t('UPLOAD WINDOW CLOSES IN', 'अपलोड विंडो बंद होने में')}
                </div>
                <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                  {([[cd.d, t('DAYS','दिन')], [cd.h, t('HRS','घंटे')], [cd.m, t('MIN','मिनट')], [cd.s, t('SEC','सेकंड')]] as [number, string][]).map(([v, lbl], i) => (
                    <div key={i} style={{ textAlign:'center', minWidth:46 }}>
                      <div style={{ background:'rgba(0,0,0,0.35)', border:'1px solid ' + (cd.urgent ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'), borderRadius:8, padding:'8px 6px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, lineHeight:1, color: cd.urgent ? 'var(--red)' : 'var(--ink)', fontVariantNumeric:'tabular-nums' }}>
                        {String(v).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize:9, fontWeight:800, letterSpacing:'.12em', color:'var(--ink-3)', marginTop:4, textTransform:'uppercase' }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── DIGITAL PLAYER CARD ── */}
          <div style={{ marginTop:28, maxWidth:520, background:'linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))', border:'1px solid var(--line)', borderRadius:'var(--r)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,var(--orange),var(--orange-2))', padding:'10px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:11, letterSpacing:'.2em', color:'rgba(255,255,255,0.85)' }}>BCPL · {t('SEASON 5', 'सीज़न 5')}</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:11, letterSpacing:'.14em', color:'#fff', background:'rgba(0,0,0,0.25)', padding:'3px 10px', borderRadius:12 }}>{t('OFFICIAL PLAYER CARD', 'आधिकारिक प्लेयर कार्ड')}</span>
            </div>
            <div style={{ padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap', marginBottom:14 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--ink)', textTransform:'uppercase', letterSpacing:'.02em', lineHeight:1.1 }}>{userName || t('BCPL PLAYER', 'BCPL खिलाड़ी')}</div>
                  <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:600, marginTop:3 }}>{t('Phase 1 · Video Trial', 'Phase 1 · वीडियो ट्रायल')}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:9, fontWeight:800, letterSpacing:'.16em', color:'var(--ink-3)', marginBottom:3 }}>{t('PLAYER ID', 'प्लेयर ID')}</div>
                  <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:16, color:'var(--gold)', letterSpacing:'.04em' }}>{regNumber ?? shortRegId}</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
                <div>
                  <div style={{ fontSize:9, fontWeight:800, letterSpacing:'.14em', color:'var(--ink-3)', marginBottom:3 }}>{t('ROLE', 'भूमिका')}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#60A5FA' }}>{roleMeta.label}</div>
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:800, letterSpacing:'.14em', color:'var(--ink-3)', marginBottom:3 }}>{t('TRIAL CITY', 'ट्रायल शहर')}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--orange)' }}>{city || 'TBD'}</div>
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:800, letterSpacing:'.14em', color:'var(--ink-3)', marginBottom:3 }}>{t('STATUS', 'स्थिति')}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>✓ {t('PAID', 'भुगतान')} ₹{phase1Fee}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="W" style={{ marginTop:40 }}>
        <div className="two-col">

          {/* ── LEFT: Upload zone ── */}
          <div className="col-left">
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, letterSpacing:'.16em', color:'var(--ink-3)', marginBottom:16, textTransform:'uppercase' }}>{t('Upload Zone', 'अपलोड ज़ोन')}</div>

            {/* Uploading progress */}
            {isUploading && (
              <div style={{ background:'var(--panel)', border:'1px solid rgba(255,122,41,0.4)', borderRadius:'var(--r)', padding:32, marginBottom:16, textAlign:'center' }}>
                <div style={{ margin:'0 auto 16px', animation:'uploadBounce 1.5s ease-in-out infinite', width:48, height:48, background:'rgba(255,122,41,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg>
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'var(--orange)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>
                  {uploadState === 'confirming' ? t('FINALISING…', 'अंतिम रूप दिया जा रहा है…') : t(`UPLOADING… ${progress}%`, `अपलोड हो रहा है… ${progress}%`)}
                </div>
                <div style={{ fontSize:13, color:'var(--ink-3)', marginBottom:16, fontWeight:500 }}>
                  {file?.name} &nbsp;·&nbsp; {file ? formatFileSize(file.size) : ''}
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${progress}%` }} />
                </div>
                <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:12, fontWeight:600 }}>{t('Please do not close this page', 'कृपया इस पेज को बंद न करें')}</div>
              </div>
            )}

            {/* Dropzone — shown when idle or file selected */}
            {!isUploading && (
              <>
                <div
                  className={`upload-zone${dragging ? ' drag' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    style={{ display:'none' }}
                    onChange={e => handleFile(e.target.files?.[0] ?? null)}
                  />
                  <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,var(--orange),var(--orange-2))', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, boxShadow:'0 8px 24px rgba(255,122,41,0.3)', color:'#fff' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
                  </div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:'var(--ink)', letterSpacing:'.04em', marginBottom:12, textTransform:'uppercase' }}>{t('Select Trial Video', 'ट्रायल वीडियो चुनें')}</div>
                  <div style={{ fontSize:14, color:'var(--ink-2)', marginBottom:24, lineHeight:1.6, fontWeight:500 }}>
                    {t('Tap to choose from ', 'चुनने के लिए टैप करें ')}<strong style={{ color:'var(--ink)' }}>{t('Camera, Gallery, or Files', 'कैमरा, गैलरी, या फ़ाइलें')}</strong>
                  </div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', marginBottom:28 }}>
                    <span style={{ fontSize:12, color:'var(--ink-3)', background:'rgba(255,255,255,0.04)', padding:'6px 12px', borderRadius:16, border:'1px solid var(--line)' }}>MP4 / MOV / AVI</span>
                    <span style={{ fontSize:12, color:'var(--ink-3)', background:'rgba(255,255,255,0.04)', padding:'6px 12px', borderRadius:16, border:'1px solid var(--line)' }}>{t('Max ' + maxMb + 'MB', 'अधिकतम ' + maxMb + 'MB')}</span>
                    <span style={{ fontSize:12, color:'var(--orange)', background:'rgba(255,122,41,0.08)', padding:'6px 12px', borderRadius:16, border:'1px solid rgba(255,122,41,0.35)', fontWeight:700 }}>{t(minSec + '–' + maxSec + ' seconds', minSec + '–' + maxSec + ' सेकंड')}</span>
                  </div>
                  <span style={{ display:'inline-block', background:'rgba(255,122,41,0.1)', border:'1px solid rgba(255,122,41,0.4)', color:'var(--orange)', padding:'12px 28px', borderRadius:'var(--r)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'.08em', cursor:'pointer', textTransform:'uppercase' }}>
                    {t('+ BROWSE FILES', '+ फ़ाइलें ब्राउज़ करें')}
                  </span>
                </div>

                {/* File error */}
                {fileErr && (
                  <div style={{ marginTop:16, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--r)', padding:'14px 18px', fontSize:14, color:'var(--red)', fontWeight:600 }}>
                    ⚠ {fileErr}
                  </div>
                )}

                {/* Upload error */}
                {errMsg && (
                  <div style={{ marginTop:16, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--r)', padding:'14px 18px', fontSize:14, color:'var(--red)', fontWeight:600 }}>
                    ⚠ {errMsg}
                  </div>
                )}

                {/* Selected file confirmation */}
                {isFileReady && file && !fileErr && (
                  <div style={{ marginTop:24, background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--r)', padding:20 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:16, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:40, height:40, background:'rgba(34,197,94,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--green)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', wordBreak:'break-all' }}>{file.name}</div>
                          <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>{formatFileSize(file.size)} • {t('Ready to upload', 'अपलोड के लिए तैयार')}</div>
                        </div>
                      </div>
                      <button onClick={() => setFile(null)} style={{ background:'none', border:'none', color:'var(--red)', fontSize:13, fontWeight:600, cursor:'pointer', padding:'8px 12px' }}>
                        {t('Remove', 'हटाएं')}
                      </button>
                    </div>
                    {videoDuration != null && (
                      <div style={{ fontSize:12, color:'var(--ink-3)', fontWeight:600, marginBottom:12 }}>
                        ⏱ {t('Detected length: ' + videoDuration + 's', 'वीडियो लंबाई: ' + videoDuration + ' सेकंड')}
                      </div>
                    )}
                    <label style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:14, cursor:'pointer' }}>
                      <input type="checkbox" checked={declAccepted} onChange={e => setDeclAccepted(e.target.checked)} style={{ marginTop:3, width:16, height:16, accentColor:'var(--orange)', flexShrink:0, cursor:'pointer' }} />
                      <span style={{ fontSize:12.5, color:'var(--ink-2)', lineHeight:1.6, fontWeight:500 }}>
                        {t('I confirm this is my own recent gameplay video, unedited except basic trimming, and I understand fake or tampered videos lead to disqualification.',
                           'मैं पुष्टि करता/करती हूं कि यह मेरा अपना हालिया गेमप्ले वीडियो है, बेसिक ट्रिमिंग के अलावा बिना एडिट किया हुआ, और मैं समझता/समझती हूं कि नकली या छेड़छाड़ किए गए वीडियो से अयोग्यता हो सकती है।')}
                      </span>
                    </label>
                    <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={handleSubmit} disabled={!declAccepted}>
                      {t('SUBMIT FOR EVALUATION', 'EVALUATION के लिए सबमिट करें')} →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT: Guidelines ── */}
          <div className="col-right">
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, letterSpacing:'.16em', color:'var(--ink-3)', marginBottom:16, textTransform:'uppercase' }}>{t('Filming Guidelines', 'फिल्मांकन दिशानिर्देश')}</div>
            
            <div className="guideline-card">
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--ink)', marginBottom:12, textTransform:'uppercase', letterSpacing:'.04em' }}>
                {t('For', 'के लिए')} {t(roleMeta.label, roleMeta.label)}
              </div>
              <p style={{ fontSize:14, color:'var(--orange)', fontWeight:600, marginBottom:16, lineHeight:1.5 }}>
                {t(roleMeta.req, roleMeta.req)}
              </p>
              <div>
                {(instr
                  ? instr.en.map((en, i) => ({ en, hi: instr.hi[i] ?? en }))
                  : roleMeta.tips.map(tip => ({ en: tip, hi: tip }))
                ).map((item, i) => (
                  <div key={i} className="tip-check">
                    <div style={{ color:'var(--green)', flexShrink:0 }}>✓</div>
                    <div>{t(item.en, item.hi)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--r)', padding:'20px', marginTop:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--ink)', textTransform:'uppercase', letterSpacing:'.04em' }}>{t('Important Rules', 'महत्वपूर्ण नियम')}</div>
              </div>
              <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                <li style={{ fontSize:13, color:'var(--ink-2)', marginBottom:10, paddingLeft:20, position:'relative', lineHeight:1.6 }}>
                  <span style={{ position:'absolute', left:0, color:'var(--orange)' }}>•</span>
                  {t('Shoot horizontally (landscape mode).', 'हॉरिजॉन्टल (लैंडस्केप मोड) में शूट करें।')}
                </li>
                <li style={{ fontSize:13, color:'var(--ink-2)', marginBottom:10, paddingLeft:20, position:'relative', lineHeight:1.6 }}>
                  <span style={{ position:'absolute', left:0, color:'var(--orange)' }}>•</span>
                  {t('Ensure good lighting and stable camera.', 'सुनिश्चित करें कि अच्छी रोशनी हो और कैमरा स्थिर हो।')}
                </li>
                <li style={{ fontSize:13, color:'var(--ink-2)', marginBottom:10, paddingLeft:20, position:'relative', lineHeight:1.6 }}>
                  <span style={{ position:'absolute', left:0, color:'var(--orange)' }}>•</span>
                  {t('No editing or background music. Raw footage only.', 'कोई एडिटिंग या बैकग्राउंड म्यूजिक नहीं। केवल मूल फुटेज।')}
                </li>
                <li style={{ fontSize:13, color:'var(--ink-2)', marginBottom:10, paddingLeft:20, position:'relative', lineHeight:1.6 }}>
                  <span style={{ position:'absolute', left:0, color:'var(--orange)' }}>•</span>
                  {t('The video must show your OWN current cricket performance, ' + minSec + '–' + maxSec + ' seconds, uploaded within the deadline shown above.', 'वीडियो में आपका अपना मौजूदा क्रिकेट प्रदर्शन ' + minSec + '–' + maxSec + ' सेकंड का हो, और ऊपर दी गई समय-सीमा के भीतर अपलोड किया जाए।')}
                </li>
                <li style={{ fontSize:13, color:'var(--ink-2)', marginBottom:10, paddingLeft:20, position:'relative', lineHeight:1.6 }}>
                  <span style={{ position:'absolute', left:0, color:'var(--orange)' }}>•</span>
                  {t('Invalid or unclear footage may require re-upload according to BCPL rules.', 'अमान्य या अस्पष्ट फुटेज के लिए BCPL नियमों के अनुसार दोबारा अपलोड की ज़रूरत हो सकती है।')}
                </li>
                <li style={{ fontSize:13, color:'var(--ink-2)', marginBottom:10, paddingLeft:20, position:'relative', lineHeight:1.6 }}>
                  <span style={{ position:'absolute', left:0, color:'var(--orange)' }}>•</span>
                  {t('BCPL may use automated, digital and technology-assisted assessment systems and third-party technology providers to validate and assess your video.', 'BCPL आपके वीडियो को जाँचने और आंकने के लिए automated, digital और technology-assisted assessment systems तथा third-party technology providers का उपयोग कर सकता है।')}
                </li>
                <li style={{ fontSize:13, color:'var(--ink-2)', paddingLeft:20, position:'relative', lineHeight:1.6 }}>
                  <span style={{ position:'absolute', left:0, color:'var(--orange)' }}>•</span>
                  {t('Manipulation or impersonation leads to disqualification.', 'वीडियो में छेड़छाड़ या किसी और की जगह वीडियो देने पर अयोग्यता होगी।')}
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      <BCPLFooter />
    </div>
  );
}
