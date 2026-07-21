import React, { useState, useEffect, useCallback } from 'react';
import { saveSession, getJourneyPath } from '../lib/auth';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as T;
}

async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as T;
}

type Step = 'phone' | 'otp' | 'loading' | 'error_account';

export function LoginModal() {
  const [open,    setOpen]    = useState(false);
  const [step,    setStep]    = useState<Step>('phone');
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errMsg,  setErrMsg]  = useState('');
  const [devOtp,  setDevOtp]  = useState('');   // shown in dev when SMS isn't wired
  const [resendTimer, setResendTimer] = useState(0);

  const reset = useCallback(() => {
    setStep('phone'); setPhone(''); setOtp(''); setErrMsg(''); setDevOtp('');
  }, []);

  const close = useCallback(() => { setOpen(false); reset(); }, [reset]);

  useEffect(() => {
    const handler = () => { setOpen(true); reset(); };
    window.addEventListener('bcpl:openLogin', handler);
    return () => window.removeEventListener('bcpl:openLogin', handler);
  }, [reset]);

  // Close on backdrop click
  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) close();
  };

  function startResendTimer() {
    setResendTimer(30);
    const iv = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  }

  async function handleSendOtp() {
    setSending(true); setErrMsg('');
    try {
      const res: any = await apiPost('/auth/send-otp', { phone, purpose: 'login' });
      if (res.devOtp) setDevOtp(res.devOtp);
      setStep('otp');
      startResendTimer();
    } catch (e: any) {
      setErrMsg(e.message ?? 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  }

  async function handleResendOtp() {
    setSending(true); setErrMsg('');
    try {
      const res: any = await apiPost('/auth/send-otp', { phone, purpose: 'login' });
      if (res.devOtp) setDevOtp(res.devOtp);
      startResendTimer();
    } catch (e: any) {
      setErrMsg(e.message ?? 'Failed to resend OTP');
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp() {
    setVerifying(true); setErrMsg('');
    try {
      const res: any = await apiPost('/auth/verify-otp', { phone, otp, purpose: 'login' });
      saveSession(res.token, res.user);

      // Get journey state and redirect
      let journeyPath = `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/profile`;
      try {
        const status: any = await apiGet('/register/status', res.token);
        journeyPath = getJourneyPath(status);
      } catch { /* no registration yet */ }

      close();
      window.location.href = journeyPath;
    } catch (e: any) {
      setErrMsg(e.message ?? 'Invalid OTP');
      setVerifying(false);
    }
  }

  if (!open) return null;

  return (
    <div onClick={onBackdrop} style={{
      position:'fixed', inset:0, zIndex:2000,
      background:'rgba(0,0,0,0.78)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }}>
      <div style={{
        background:'#0A1727', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:20, padding:'32px 28px', width:'100%', maxWidth:380,
        boxShadow:'0 24px 80px rgba(0,0,0,0.65)', position:'relative',
        animation:'fadeUp .25s ease both',
      }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Close */}
        <button onClick={close} style={{
          position:'absolute', top:16, right:16, background:'none', border:'none',
          color:'rgba(255,255,255,0.4)', fontSize:22, cursor:'pointer', lineHeight:1,
        }}>✕</button>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:22 }}>
          <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL"
            style={{ height:30, width:'auto', objectFit:'contain', filter:'brightness(1.3)' }}/>
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'2px 8px' }}>
            <span style={{ fontSize:8 }}>🏆</span>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:8, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
          </div>
        </div>

        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'#fff', marginBottom:6 }}>
          Player Login
        </div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:24, lineHeight:1.5 }}>
          {step === 'phone'
            ? 'Enter your registered mobile number'
            : `OTP sent to +91 ${phone}`}
        </div>

        {step === 'phone' && (
          <>
            <label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'.1em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Mobile Number</label>
            <div style={{ display:'flex', gap:10, marginBottom:18 }}>
              <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'12px 14px', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:14, color:'rgba(255,255,255,0.5)', flexShrink:0 }}>+91</div>
              <input
                type="tel" maxLength={10} value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && phone.length === 10 && handleSendOtp()}
                placeholder="10-digit mobile"
                autoFocus
                style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'12px 14px', fontFamily:'Inter,sans-serif', fontSize:15, color:'#fff', outline:'none', letterSpacing:'.06em' }}
              />
            </div>
            {errMsg && <div style={{ color:'#F87171', fontFamily:'Inter,sans-serif', fontSize:12, marginBottom:12 }}>{errMsg}</div>}
            <button
              disabled={phone.length !== 10 || sending}
              onClick={handleSendOtp}
              style={{ width:'100%', background: phone.length === 10 ? 'linear-gradient(135deg,#FF7A29,#D95E10)' : 'rgba(255,255,255,0.08)', border:'none', borderRadius:12, color: phone.length === 10 ? '#fff' : 'rgba(255,255,255,0.3)', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, letterSpacing:'.06em', padding:'14px', cursor: phone.length === 10 ? 'pointer' : 'not-allowed', textTransform:'uppercase', transition:'all .2s' }}
            >
              {sending ? 'Sending…' : 'Send OTP →'}
            </button>
            <div style={{ marginTop:16, textAlign:'center', fontFamily:'Inter,sans-serif', fontSize:12, color:'rgba(255,255,255,0.3)' }}>
              New player?{' '}
              <a href={import.meta.env.BASE_URL + 'register'} style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Register here →</a>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            {devOtp && (
              <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontFamily:'Inter,sans-serif', fontSize:12, color:'#86EFAC' }}>
                📱 <strong>Dev mode OTP:</strong> <span style={{ fontFamily:'monospace', fontSize:16, color:'#22C55E', letterSpacing:'.2em' }}>{devOtp}</span>
              </div>
            )}
            <label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'.1em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Enter OTP</label>
            <input
              type="tel" maxLength={6} value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerifyOtp()}
              placeholder="6-digit OTP"
              autoFocus
              style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'14px', fontFamily:'Montserrat,sans-serif', fontSize:24, color:'#FF7A29', outline:'none', letterSpacing:'.3em', textAlign:'center', marginBottom:16, boxSizing:'border-box' }}
            />
            {errMsg && <div style={{ color:'#F87171', fontFamily:'Inter,sans-serif', fontSize:12, marginBottom:12 }}>{errMsg}</div>}
            <button
              disabled={otp.length !== 6 || verifying}
              onClick={handleVerifyOtp}
              style={{ width:'100%', background: otp.length === 6 ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'rgba(255,255,255,0.08)', border:'none', borderRadius:12, color: otp.length === 6 ? '#fff' : 'rgba(255,255,255,0.3)', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, letterSpacing:'.06em', padding:'14px', cursor: otp.length === 6 ? 'pointer' : 'not-allowed', textTransform:'uppercase', transition:'all .2s', marginBottom:12 }}
            >
              {verifying ? 'Verifying…' : '✓ Verify & Login'}
            </button>
            <div style={{ textAlign:'center', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <button onClick={() => { setStep('phone'); setOtp(''); setErrMsg(''); }}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontFamily:'Inter,sans-serif', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
                ← Change number
              </button>
              <button
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || sending}
                style={{ background:'none', border:'none', fontFamily:'Inter,sans-serif', fontSize:12, cursor: resendTimer > 0 ? 'default' : 'pointer', color: resendTimer > 0 ? 'rgba(255,255,255,0.25)' : '#FF7A29', textDecoration: resendTimer > 0 ? 'none' : 'underline' }}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
