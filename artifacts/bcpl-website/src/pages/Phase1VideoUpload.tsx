import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import {
  getRegistrationStatus, getMe, getUploadUrl, confirmVideoUpload,
} from '../lib/api';

// ── Role metadata ────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; icon: string; color: string; req: string; tips: string[] }> = {
  bat:  { label:'Batsman',       icon:'🏏', color:'#3B82F6', req:'Show 3+ strokes: drives, pulls & sweeps',       tips:['Cover drive off front foot','Pull shot to leg side','Reverse or conventional sweep'] },
  bowl: { label:'Bowler',        icon:'🎳', color:'#8B5CF6', req:'5+ deliveries — mix pace & swing',              tips:['Outswinger & inswinger pair','Yorker delivery','Change of pace ball'] },
  wk:   { label:'Wicket-Keeper', icon:'🧤', color:'#06B6D4', req:'3+ takes & stumpings, glove work',              tips:['Caught behind the stumps','Quick stumping drill','Wide ball diving take'] },
  ar:   { label:'All-Rounder',   icon:'⭐', color:'#E8B23D', req:'2 min split — 1 min bat + 1 min bowl',          tips:['Batting first half','Bowling second half','Clear scene transitions'] },
};

const SAMPLE_VIDEOS = [
  { role:'Batsman',       icon:'🏏', color:'#3B82F6', gradient:'linear-gradient(135deg,#0a1f44 0%,#1a3a6e 50%,#0d2a52 100%)', duration:'1:52', description:'Cover drive · Pull shot · Sweep shot · Footwork', what:'Watch how to demonstrate 3+ strokes clearly on camera — stance, backlift, and follow-through all visible.', ytSearch:'cricket batting trial video technique showcase', badge:'Most Selected', badgeColor:'#3B82F6' },
  { role:'Bowler',        icon:'🎳', color:'#8B5CF6', gradient:'linear-gradient(135deg,#1a0a44 0%,#3a1a6e 50%,#2a0d52 100%)', duration:'1:48', description:'Outswinger · Yorker · Change of pace · Run-up', what:'Full run-up visible, delivery stride, ball release — scouts check your action, seam position, and variation.', ytSearch:'cricket bowling trial video technique fast medium spin', badge:'High Demand', badgeColor:'#8B5CF6' },
  { role:'Wicket-Keeper', icon:'🧤', color:'#06B6D4', gradient:'linear-gradient(135deg,#041f2e 0%,#0a3d4f 50%,#062a3a 100%)', duration:'1:55', description:'Standing up · Stumpings · Catches · Wide takes', what:'Film at chest height from mid-off angle — glove positioning, quick release, and agility are key scoring factors.', ytSearch:'cricket wicket keeper trial video stumping catch technique', badge:'Rare Role', badgeColor:'#06B6D4' },
  { role:'All-Rounder',   icon:'⭐', color:'#E8B23D', gradient:'linear-gradient(135deg,#2e1f04 0%,#4f3a0a 50%,#3a2a06 100%)', duration:'2:00', description:'1 min batting · 1 min bowling · Clear transitions', what:'Split exactly 50-50. Use a visible title card between segments. Scouts look for equal competence in both skills.', ytSearch:'cricket all rounder trial video batting bowling showcase', badge:'Top Auction', badgeColor:'#E8B23D' },
];

type UploadState = 'loading' | 'not_registered' | 'deadline_passed' | 'already_uploaded' | 'idle' | 'file_selected' | 'uploading' | 'confirming' | 'success' | 'error';

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDaysLeft(deadline: string | null | undefined): number {
  if (!deadline) return 0;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const ALLOWED_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/webm': 'webm',
};
const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

export function Phase1VideoUpload() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [dragging, setDragging]     = useState(false);
  const [activeVideo, setActiveVideo] = useState<number | null>(null);

  // Data from API
  const [uploadState, setUploadState] = useState<UploadState>('loading');
  const [errMsg, setErrMsg]           = useState('');
  const [regId, setRegId]             = useState('');
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

  const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
  const NAV_ROUTES: Record<string,string> = { Home:'', 'Match Center':'match-center', Teams:'teams', Sponsors:'sponsors', Photos:'photos', Videos:'videos', About:'about', FAQ:'faq', Contact:'contact' };

  // ── Load registration data on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [regData, meData] = await Promise.allSettled([
          getRegistrationStatus(),
          getMe(),
        ]);

        if (meData.status === 'fulfilled') setUserName(meData.value.user.name);

        if (regData.status === 'rejected') {
          setUploadState('not_registered'); return;
        }
        const reg = regData.value;

        if (!reg.registered) { setUploadState('not_registered'); return; }

        // Must have paid before uploading
        if (reg.phase1Status === 'pending') { setUploadState('not_registered'); return; }

        setRegId(reg.registrationId ?? '');
        setRole(reg.role ?? 'bat');
        setCity(reg.trialCity ?? '');
        setDeadline(reg.videoDeadline ?? null);
        setPhase1Fee(reg.fees?.phase1 ?? 299);

        if (reg.phase1Status === 'video_submitted' || reg.phase1Status === 'selected' || reg.phase1Status === 'rejected' || reg.phase1Status === 'p1_selected' || reg.phase1Status === 'p1_rejected') {
          // Redirect to result page if selected/rejected, otherwise show already-uploaded
          if (reg.phase1Status === 'selected' || reg.phase1Status === 'rejected') {
            window.location.replace('/register/result');
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

  // ── File validation ────────────────────────────────────────────────────────
  const handleFile = useCallback((f: File | null) => {
    setFileErr('');
    if (!f) return;
    if (!ALLOWED_TYPES[f.type]) {
      setFileErr('Invalid format. Please upload MP4, MOV, AVI, or WebM.'); return;
    }
    if (f.size > MAX_SIZE) {
      setFileErr(`File too large (${formatFileSize(f.size)}). Max 500 MB.`); return;
    }
    setFile(f);
    setUploadState('file_selected');
  }, []);

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
      const { presignedUrl, s3Key } = await getUploadUrl(regId, file.type);

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
      await confirmVideoUpload(regId, s3Key);
      setProgress(100);
      setUploadState('success');
    } catch (e: any) {
      setErrMsg(e?.message ?? 'Upload failed. Please try again.');
      setUploadState('file_selected');
    }
  }, [file, regId]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const roleMeta    = ROLE_META[role] ?? ROLE_META.bat;
  const daysLeft    = getDaysLeft(deadline);
  const shortRegId  = regId ? regId.slice(0, 8).toUpperCase() : '—';

  // ── Full-page states ───────────────────────────────────────────────────────
  if (uploadState === 'loading') {
    return (
      <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:36, animation:'spin 1s linear infinite' }}>⚡</div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:14 }}>Loading your registration…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (uploadState === 'not_registered') {
    return (
      <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ maxWidth:420, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏏</div>
          <h2 style={{ color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, marginBottom:12 }}>Registration Required</h2>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:24, lineHeight:1.7 }}>Please complete Phase 1 registration and payment before uploading your trial video.</p>
          <a href={import.meta.env.BASE_URL + 'register'} style={{ display:'inline-block', background:'#FF7A29', color:'#fff', textDecoration:'none', padding:'13px 32px', borderRadius:10, fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14 }}>
            REGISTER NOW →
          </a>
        </div>
      </div>
    );
  }

  if (uploadState === 'deadline_passed') {
    return (
      <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ maxWidth:440, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⏰</div>
          <h2 style={{ color:'#EF4444', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, marginBottom:12 }}>Upload Deadline Passed</h2>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:24, lineHeight:1.7 }}>Your 15-day video upload window has expired. Unfortunately, late submissions cannot be accepted for Phase 1 review.</p>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:16, marginBottom:24 }}>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Season 6 registrations will open soon. Follow us on <strong style={{ color:'#FF7A29' }}>@bcpl.t20</strong> for updates.</p>
          </div>
          <a href="https://www.instagram.com/bcpl.t20" target="_blank" rel="noreferrer" style={{ display:'inline-block', background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.4)', color:'#FF7A29', textDecoration:'none', padding:'12px 28px', borderRadius:10, fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13 }}>
            📸 FOLLOW @bcpl.t20
          </a>
        </div>
      </div>
    );
  }

  if (uploadState === 'already_uploaded') {
    return (
      <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ maxWidth:440, textAlign:'center' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(34,197,94,0.15)', border:'2px solid #22C55E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 20px' }}>✅</div>
          <h2 style={{ color:'#22C55E', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, marginBottom:12 }}>Video Already Submitted!</h2>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:14, marginBottom:8, lineHeight:1.7 }}>
            {userName ? `${userName}, your` : 'Your'} trial video is with our BCCI-certified scouts.
          </p>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:28 }}>Result will be sent via Email, SMS and WhatsApp within <strong style={{ color:'#fff' }}>15 working days</strong>.</p>
          <a href={import.meta.env.BASE_URL + 'register/result'} style={{ display:'inline-block', background:'#22C55E', color:'#fff', textDecoration:'none', padding:'13px 32px', borderRadius:10, fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14 }}>
            CHECK MY STATUS →
          </a>
        </div>
      </div>
    );
  }

  if (uploadState === 'success') {
    return (
      <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <style>{`
          @keyframes popIn{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
          @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(120px) rotate(720deg);opacity:0}}
        `}</style>
        <div style={{ maxWidth:480, textAlign:'center' }}>
          <div style={{ width:100, height:100, borderRadius:'50%', background:'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05))', border:'3px solid #22C55E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, margin:'0 auto 24px', animation:'popIn .5s cubic-bezier(.34,1.56,.64,1)' }}>🎉</div>
          <h2 style={{ color:'#22C55E', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:28, letterSpacing:'-.01em', marginBottom:8 }}>VIDEO SUBMITTED!</h2>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:15, marginBottom:6, lineHeight:1.6 }}>
            {userName ? `Well done, ${userName}! ` : ''}Your trial video has been received successfully.
          </p>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:28, lineHeight:1.7 }}>
            Our BCCI-certified scouts will review it within <strong style={{ color:'#fff' }}>15 working days</strong>.<br />
            Result will arrive on <strong style={{ color:'#FF7A29' }}>Email + SMS + WhatsApp</strong>.
          </p>
          <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:12, padding:16, marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>Status</span>
              <span style={{ color:'#22C55E', fontWeight:700, fontSize:12 }}>✅ Under Review</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
              <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>Expected Result</span>
              <span style={{ color:'#FF7A29', fontWeight:700, fontSize:12 }}>Within 15 Working Days</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
            <a href={import.meta.env.BASE_URL + 'register/result'} style={{ flex:1, minWidth:160, display:'block', background:'#22C55E', color:'#fff', textDecoration:'none', padding:'13px 24px', borderRadius:10, fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14 }}>
              CHECK MY STATUS →
            </a>
            <a href={import.meta.env.BASE_URL} style={{ flex:1, minWidth:160, display:'block', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.6)', textDecoration:'none', padding:'13px 24px', borderRadius:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14 }}>
              GO HOME
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Main upload page ───────────────────────────────────────────────────────
  const isUploading  = uploadState === 'uploading' || uploadState === 'confirming';
  const isFileReady  = uploadState === 'file_selected';

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:'calc(120px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulseDanger{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}50%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes uploadBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes progressPulse{0%,100%{opacity:1}50%{opacity:0.7}}
        .wrap{max-width:1140px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .btn-primary{background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:0.06em;cursor:pointer;transition:transform .15s,filter .2s;}
        .btn-primary:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-2px)}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed}
        .upload-zone{border:2px dashed rgba(255,122,41,0.35);background:#060C18;border-radius:12px;padding:40px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;min-height:200px;width:100%;}
        .upload-zone:hover,.upload-zone.drag{border-color:#FF7A29;background:rgba(255,122,41,0.04)}
        .guideline-card{background:#060C18;border-left:3px solid #FF7A29;padding:14px 16px;border-radius:0;margin-bottom:10px;}
        .guideline-card:last-child{margin-bottom:0}
        .tip-check{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:rgba(255,255,255,0.65);line-height:1.5;}
        .tip-check:last-child{border-bottom:none}
        .info-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:12px;font-family:Montserrat,sans-serif;font-weight:700;font-size:11px;letter-spacing:.06em;}
        .two-col{display:flex;flex-direction:column;gap:24px}
        @media(min-width:900px){.two-col{flex-direction:row;gap:32px}}
        .col-left{flex:1;min-width:0}
        .col-right{flex:1;min-width:0}
        .format-chips{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
        .format-chip{flex:1;min-width:80px;background:#060C18;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:10px 14px}
        .filming-grid{display:grid;grid-template-columns:1fr;gap:0}
        @media(min-width:600px){.filming-grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}}
        .sample-grid{display:grid;grid-template-columns:1fr;gap:16px}
        @media(min-width:600px){.sample-grid{grid-template-columns:1fr 1fr}}
        @media(min-width:1000px){.sample-grid{grid-template-columns:repeat(4,1fr)}}
        .sample-card{position:relative;border-radius:14px;overflow:hidden;cursor:pointer;border:1px solid rgba(255,255,255,0.07);transition:transform .2s,box-shadow .2s;}
        .sample-card:hover{transform:translateY(-4px)}
        .sample-card:hover .play-btn{transform:translate(-50%,-50%) scale(1.12)}
        .play-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:50%;background:rgba(255,122,41,0.9);display:flex;align-items:center;justify-content:center;font-size:18px;transition:transform .2s;box-shadow:0 4px 24px rgba(255,122,41,0.5);border:2px solid rgba(255,255,255,0.3);}
        .video-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:800;padding:16px;}
        .video-modal{background:#060C18;border-radius:16px;border:1px solid rgba(255,255,255,0.12);width:100%;max-width:640px;overflow:hidden;}
        .progress-bar{height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;margin-top:10px;}
        .progress-fill{height:100%;background:linear-gradient(90deg,#FF7A29,#E8B23D);border-radius:3px;transition:width .3s ease;animation:progressPulse 1.5s ease infinite;}
      `}</style>

      {/* ── STICKY TOP ── */}
      <div style={{ position:'sticky', top:0, zIndex:300 }}>
        <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
          <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 30s linear infinite' }}>
            {[...Array(4)].map((_,i) => (
              <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
                &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 50+ CITIES &nbsp;·&nbsp; BACKED BY SOURAV GANGULY &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>
        <nav style={{ background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
          <div className="wrap" style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <a href={import.meta.env.BASE_URL} style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
              <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:42, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
            </a>
            <div className="desk-nav">
              {NAV.map(l => <a key={l} href={import.meta.env.BASE_URL + NAV_ROUTES[l]} style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, textDecoration:'none', letterSpacing:'.04em' }}>{l}</a>)}
              <button className="btn-primary" style={{ padding:'10px 24px', fontSize:12 }} onClick={() => window.location.href = import.meta.env.BASE_URL + 'register'}>REGISTER NOW →</button>
            </div>
            <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
              {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:1, transition:'all .25s', transform: i===0&&menuOpen?'rotate(45deg) translate(5px,5px)':i===1&&menuOpen?'scaleX(0)':i===2&&menuOpen?'rotate(-45deg) translate(5px,-5px)':'' }} />)}
            </button>
          </div>
        </nav>
      </div>

      {menuOpen && (
        <div style={{ position:'fixed', inset:0, background:'#040C18', zIndex:400, display:'flex', flexDirection:'column', padding:'72px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:38, height:38, borderRadius:4, cursor:'pointer', fontSize:18 }}>✕</button>
          {NAV.map(l => <a key={l} href={import.meta.env.BASE_URL + NAV_ROUTES[l]} onClick={()=>setMenuOpen(false)} style={{ color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>)}
          <button className="btn-primary" style={{ marginTop:24, padding:'16px', fontSize:15 }} onClick={() => window.location.href = import.meta.env.BASE_URL + 'register'}>REGISTER NOW →</button>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div style={{ background:'linear-gradient(180deg,#060C18 0%,#06101E 100%)', borderBottom:'1px solid rgba(255,255,255,0.06)', paddingTop:36, paddingBottom:32 }}>
        <div className="wrap">
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.2em', color:'rgba(255,255,255,0.3)', marginBottom:10, textTransform:'uppercase' }}>Phase 1 · Step 2 of 3</div>
              <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,5vw,44px)', color:'#fff', letterSpacing:'-.01em', textTransform:'uppercase', lineHeight:.95, marginBottom:8 }}>
                {userName ? `${userName.split(' ')[0]}, upload your` : 'UPLOAD YOUR'}<br /><span style={{ color:'#FF7A29' }}>TRIAL VIDEO</span>
              </h1>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, lineHeight:1.6, maxWidth:460 }}>Your video is your ticket to the ground trials. Make every second count.</p>
            </div>
            {/* Deadline badge */}
            {daysLeft > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background: daysLeft <= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(255,122,41,0.1)', border:`1px solid ${daysLeft <= 5 ? 'rgba(239,68,68,0.4)' : 'rgba(255,122,41,0.4)'}`, padding:'10px 16px', borderRadius:12, animation:'pulseDanger 2s ease-in-out infinite', flexShrink:0 }}>
                <span style={{ fontSize:14 }}>{daysLeft <= 5 ? '🚨' : '⚠️'}</span>
                <div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color: daysLeft <= 5 ? '#EF4444' : '#FF7A29', letterSpacing:'.1em' }}>{daysLeft} DAY{daysLeft !== 1 ? 'S' : ''} REMAINING</div>
                  <div style={{ fontSize:10, color: daysLeft <= 5 ? 'rgba(239,68,68,0.7)' : 'rgba(255,122,41,0.7)', fontWeight:600 }}>Upload before deadline</div>
                </div>
              </div>
            )}
          </div>

          {/* Player summary bar */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:24 }}>
            {[
              { icon: roleMeta.icon, label: roleMeta.label,  bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.35)', color:'#60A5FA' },
              { icon:'📍',           label: city || 'TBD',    bg:'rgba(255,122,41,0.1)', border:'rgba(255,122,41,0.35)', color:'#FF7A29' },
              { icon:'🎫',           label: shortRegId,        bg:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.55)' },
              { icon:'✅',           label:`PAID ₹${phase1Fee}`, bg:'rgba(34,197,94,0.1)', border:'rgba(34,197,94,0.35)', color:'#22C55E' },
            ].map(c => (
              <span key={c.label} className="info-chip" style={{ background:c.bg, border:`1px solid ${c.border}`, color:c.color }}>
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="wrap" style={{ marginTop:36 }}>
        <div className="two-col">

          {/* ── LEFT: Upload zone ── */}
          <div className="col-left">
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:10, letterSpacing:'.18em', color:'rgba(255,255,255,0.3)', marginBottom:14, textTransform:'uppercase' }}>Upload Zone</div>

            {/* Uploading progress */}
            {isUploading && (
              <div style={{ background:'#0A1727', border:'1px solid rgba(255,122,41,0.3)', borderRadius:12, padding:24, marginBottom:16, textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:12, animation:'uploadBounce 1s ease-in-out infinite' }}>
                  {uploadState === 'confirming' ? '⚡' : '📤'}
                </div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#FF7A29', marginBottom:8 }}>
                  {uploadState === 'confirming' ? 'FINALISING…' : `UPLOADING… ${progress}%`}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:10 }}>
                  {file?.name} &nbsp;·&nbsp; {file ? formatFileSize(file.size) : ''}
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${progress}%` }} />
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:8 }}>Do not close this page</div>
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
                  <div style={{ fontSize:44, marginBottom:16, animation:'uploadBounce 2s ease-in-out infinite' }}>🎬</div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', letterSpacing:'.04em', marginBottom:8 }}>DRAG &amp; DROP YOUR VIDEO</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:24, lineHeight:1.6 }}>
                    MP4 &nbsp;·&nbsp; MOV &nbsp;·&nbsp; AVI &nbsp;·&nbsp; WebM &nbsp;·&nbsp; Max 500MB &nbsp;·&nbsp; Max 2 minutes
                  </div>
                  <span style={{ display:'inline-block', background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.4)', color:'#FF7A29', padding:'10px 24px', borderRadius:12, fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, letterSpacing:'.08em', cursor:'pointer' }}>
                    + Browse Files
                  </span>
                </div>

                {/* File error */}
                {fileErr && (
                  <div style={{ marginTop:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#EF4444' }}>
                    ❌ {fileErr}
                  </div>
                )}

                {/* Upload error */}
                {errMsg && (
                  <div style={{ marginTop:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#EF4444' }}>
                    ⚠️ {errMsg} — <button onClick={() => setErrMsg('')} style={{ background:'none', border:'none', color:'#FF7A29', cursor:'pointer', fontSize:13, fontWeight:700, textDecoration:'underline' }}>Try again</button>
                  </div>
                )}

                {/* Selected file info */}
                {file && isFileReady && (
                  <div style={{ marginTop:16, background:'#0A1727', border:'1px solid #22C55E', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                    <div style={{ width:40, height:40, background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.4)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🎥</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#22C55E', letterSpacing:'.02em', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>✅ {file.name}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', display:'flex', gap:8, flexWrap:'wrap' }}>
                        <span>{formatFileSize(file.size)}</span>
                        <span>·</span>
                        <span>{file.type.split('/')[1].toUpperCase()}</span>
                        <span>·</span>
                        <span style={{ color:'#22C55E', fontWeight:700 }}>Ready to submit</span>
                      </div>
                    </div>
                    <button onClick={() => { setFile(null); setUploadState('idle'); setFileErr(''); }} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', borderRadius:8, padding:'6px 12px', fontSize:12, cursor:'pointer', fontWeight:700, flexShrink:0 }}>
                      ✕ Remove
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Format info */}
            <div className="format-chips">
              {[
                { label:'Max Size', val:'500 MB' },
                { label:'Max Duration', val:'2 min' },
                { label:'Formats', val:'MP4, MOV, AVI, WebM' },
              ].map(f => (
                <div key={f.label} className="format-chip">
                  <div style={{ fontSize:9, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.3)', marginBottom:3 }}>{f.label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#FF7A29' }}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Guidelines ── */}
          <div className="col-right">
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:10, letterSpacing:'.18em', color:'rgba(255,255,255,0.3)', marginBottom:14, textTransform:'uppercase' }}>What Scouts Look For</div>
            <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'0 0 4px' }}>
              <div style={{ borderLeft:`4px solid ${roleMeta.color}`, padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:roleMeta.color, letterSpacing:'.06em', textTransform:'uppercase' }}>
                  {roleMeta.icon} {roleMeta.label} Guidelines
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>
                  {roleMeta.req}
                </div>
              </div>
              <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                {Object.entries(ROLE_META).map(([key, r]) => (
                  <div className="guideline-card" key={key} style={{ borderLeftColor: r.color, opacity: key === role ? 1 : 0.55 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>{r.icon}</span>
                      <div>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, color: key === role ? '#fff' : 'rgba(255,255,255,0.6)', letterSpacing:'.03em', display:'flex', alignItems:'center', gap:6 }}>
                          {r.label}
                          {key === role && <span style={{ fontSize:9, fontWeight:900, background:r.color, color:'#fff', borderRadius:4, padding:'2px 6px', letterSpacing:'.08em' }}>YOUR ROLE</span>}
                        </div>
                        <div style={{ fontSize:11, color:r.color, fontWeight:700 }}>{r.req}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {r.tips.map(t => (
                        <span key={t} style={{ fontSize:10, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', padding:'3px 9px', borderRadius:12, fontWeight:600 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SAMPLE VIDEOS ── */}
        <div style={{ marginTop:36, background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'24px 20px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.16em', color:'rgba(255,255,255,0.4)', marginBottom:6, textTransform:'uppercase' }}>🎬 Sample Trial Videos</div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.5, maxWidth:520 }}>Watch before filming your own trial video.</div>
            </div>
            <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:10, padding:'7px 14px', fontSize:11, color:'#22C55E', fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em', flexShrink:0 }}>✓ Season 4 Best Entries</div>
          </div>
          <div className="sample-grid">
            {SAMPLE_VIDEOS.map((v, idx) => (
              <div key={v.role} className="sample-card" onClick={() => setActiveVideo(idx)} style={{ boxShadow:`0 4px 24px ${v.color}18` }}>
                <div style={{ background:v.gradient, height:160, position:'relative', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'12px 14px' }}>
                  <div style={{ position:'absolute', inset:0, opacity:.06, backgroundImage:'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 20px)', pointerEvents:'none' }} />
                  <div style={{ position:'absolute', top:10, right:10, background:`${v.color}33`, border:`1px solid ${v.color}66`, borderRadius:6, padding:'3px 8px', fontSize:9, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.08em', color:v.color }}>{v.badge}</div>
                  <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.6)', borderRadius:6, padding:'3px 8px', fontSize:10, fontWeight:700, color:'#fff' }}>⏱ {v.duration}</div>
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-60%)', fontSize:42, opacity:.4 }}>{v.icon}</div>
                  <div className="play-btn">▶</div>
                  <div style={{ position:'relative', zIndex:1 }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, color:'#fff', letterSpacing:'.06em' }}>{v.icon} {v.role}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{v.description}</div>
                  </div>
                </div>
                <div style={{ background:'#060C18', padding:'12px 14px', borderTop:`2px solid ${v.color}44` }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.55 }}>{v.what}</div>
                  <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:v.color, flexShrink:0 }} />
                    <span style={{ fontSize:10, color:v.color, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}>WATCH SAMPLE ▶</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FILMING TIPS ── */}
        <div style={{ marginTop:36, background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'24px 20px' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.16em', color:'rgba(255,255,255,0.4)', marginBottom:16, textTransform:'uppercase' }}>📹 Filming Tips</div>
          <div className="filming-grid">
            {[
              { ok:true,  tip:'Good natural light or indoor stadium lighting' },
              { ok:true,  tip:'Camera at stumps height, side-on angle for batting/bowling' },
              { ok:true,  tip:'Wear proper cricket gear: whites or team kit' },
              { ok:false, tip:'No watermarks, brand logos, or social media handles' },
              { ok:false, tip:'No selfie-style or front-facing camera clips' },
            ].map(t => (
              <div key={t.tip} className="tip-check">
                <span style={{ fontSize:15, flexShrink:0, color: t.ok ? '#22C55E' : '#EF4444' }}>{t.ok ? '✓' : '✗'}</span>
                <span style={{ color: t.ok ? 'rgba(255,255,255,0.65)' : 'rgba(239,68,68,0.75)' }}>{t.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── VIDEO MODAL ── */}
      {activeVideo !== null && (
        <div className="video-modal-overlay" onClick={() => setActiveVideo(null)}>
          <div className="video-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#fff' }}>
                  {SAMPLE_VIDEOS[activeVideo].icon} {SAMPLE_VIDEOS[activeVideo].role} — Sample Trial Video
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:3 }}>Season 4 best entry · {SAMPLE_VIDEOS[activeVideo].duration}</div>
              </div>
              <button onClick={() => setActiveVideo(null)} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', width:34, height:34, borderRadius:8, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ background:SAMPLE_VIDEOS[activeVideo].gradient, height:240, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, opacity:.05, backgroundImage:'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 20px)' }} />
              <div style={{ fontSize:56, opacity:.3 }}>{SAMPLE_VIDEOS[activeVideo].icon}</div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, textAlign:'center', padding:'0 24px', lineHeight:1.6, position:'relative' }}>
                Sample videos available after Season 4 entries are approved.<br />
                <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>Use the YouTube guide below ↓</span>
              </div>
            </div>
            <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'rgba(255,255,255,0.3)', marginBottom:8, textTransform:'uppercase' }}>What Scouts Look For</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{SAMPLE_VIDEOS[activeVideo].what}</div>
              <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
                {SAMPLE_VIDEOS[activeVideo].description.split(' · ').map(tag => (
                  <span key={tag} style={{ fontSize:10, color:SAMPLE_VIDEOS[activeVideo].color, background:`${SAMPLE_VIDEOS[activeVideo].color}15`, border:`1px solid ${SAMPLE_VIDEOS[activeVideo].color}33`, padding:'3px 10px', borderRadius:12, fontWeight:700 }}>{tag}</span>
                ))}
              </div>
            </div>
            <div style={{ padding:'14px 20px', display:'flex', gap:10, flexWrap:'wrap' }}>
              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(SAMPLE_VIDEOS[activeVideo].ytSearch)}`} target="_blank" rel="noreferrer" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 16px', background:'rgba(255,0,0,0.12)', border:'1px solid rgba(255,0,0,0.35)', borderRadius:10, color:'#FF4444', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.06em', textDecoration:'none' }}>
                ▶ Watch Reference on YouTube
              </a>
              <button onClick={() => setActiveVideo(null)} style={{ padding:'11px 16px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'rgba(255,255,255,0.5)', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY BOTTOM BANNER ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:500, background:'rgba(4,10,20,0.98)', backdropFilter:'blur(20px)', borderTop:'2px solid #FF7A29', padding:`10px 16px calc(10px + env(safe-area-inset-bottom))` }}>
        <div style={{ maxWidth:1140, margin:'0 auto', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <span style={{ fontSize:14, flexShrink:0, lineHeight:1.4 }}>{daysLeft <= 5 ? '🚨' : '⚠️'}</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:1.4 }}>
              <strong style={{ color: daysLeft <= 5 ? '#EF4444' : '#FF7A29', fontFamily:'Montserrat,sans-serif', letterSpacing:'.04em' }}>
                {isUploading
                  ? (uploadState === 'confirming' ? 'FINALISING YOUR UPLOAD…' : `UPLOADING — ${progress}% COMPLETE`)
                  : isFileReady
                    ? `${file?.name} — READY TO SUBMIT`
                    : `UPLOAD WITHIN ${daysLeft} DAY${daysLeft !== 1 ? 'S' : ''}.`
                }
              </strong>
              {!isUploading && !isFileReady && ' Late submissions will not be reviewed.'}
            </span>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button
              className="btn-primary"
              style={{ flex:1, padding:'11px 16px', fontSize:13, whiteSpace:'nowrap' }}
              disabled={!isFileReady || isUploading}
              onClick={isFileReady ? handleSubmit : () => fileInputRef.current?.click()}
            >
              {isUploading
                ? (uploadState === 'confirming' ? 'FINALISING…' : `UPLOADING ${progress}%…`)
                : isFileReady
                  ? 'SUBMIT VIDEO →'
                  : 'SELECT VIDEO →'}
            </button>
          </div>
        </div>
      </div>

      <BCPLFooter />
    </div>
  );
}
