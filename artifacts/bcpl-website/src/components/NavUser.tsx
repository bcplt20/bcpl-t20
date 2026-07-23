import React, { useEffect, useState } from 'react';
import { getSession, clearSession, openLoginModal, AUTH_CHANGED_EVENT, type AuthUser } from '../lib/auth';

/**
 * Auth-aware navbar item, shared by every page's navbar.
 * Logged out → "Login" (opens the global OTP modal).
 * Logged in  → avatar initial + first name, linking to the profile page.
 * Re-renders on login/logout in this tab (custom event), other tabs
 * (storage event) and on tab focus (also refreshes the activity window).
 */
export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(() => getSession()?.user ?? null);
  useEffect(() => {
    const update = () => setUser(getSession()?.user ?? null);
    window.addEventListener(AUTH_CHANGED_EVENT, update);
    window.addEventListener('storage', update);
    window.addEventListener('focus', update);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, update);
      window.removeEventListener('storage', update);
      window.removeEventListener('focus', update);
    };
  }, []);
  return user;
}

const PROFILE_HREF = `${import.meta.env.BASE_URL ?? '/'}profile`;

export function NavUser({ variant = 'desktop', onNavigate }: {
  variant?: 'desktop' | 'mobile' | 'icon';
  onNavigate?: () => void;
}) {
  const user = useAuthUser();
  const mobile = variant === 'mobile';

  /* Compact icon-only variant for the mobile top bar (44px hit area). */
  if (variant === 'icon') {
    if (!user) {
      return (
        <button
          aria-label="Login"
          onClick={() => { onNavigate?.(); openLoginModal(); }}
          style={{ background:'none', border:'none', cursor:'pointer', width:40, height:44, display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
          </svg>
        </button>
      );
    }
    const iconInitial = ((user.name ?? '').trim().charAt(0) || 'P').toUpperCase();
    return (
      <a href={PROFILE_HREF} onClick={onNavigate} title={user.name} aria-label="My profile"
        style={{ width:40, height:44, display:'inline-flex', alignItems:'center', justifyContent:'center', textDecoration:'none', flexShrink:0 }}>
        <span style={{
          width:28, height:28, borderRadius:'50%',
          background:'linear-gradient(135deg,#FF7A29,#E8B23D)',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, color:'#fff',
        }}>{iconInitial}</span>
      </a>
    );
  }

  if (!user) {
    return (
      <span
        onClick={() => { onNavigate?.(); openLoginModal(); }}
        style={mobile
          ? { color:'#FF7A29', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'block', cursor:'pointer' }
          : { color:'#FF7A29', fontWeight:700, fontSize:13, fontFamily:'Inter,sans-serif', cursor:'pointer' }}
      >{mobile ? '🔑 Login' : 'Login'}</span>
    );
  }

  const firstName = (user.name ?? '').trim().split(/\s+/)[0] || 'Player';
  const initial = firstName.charAt(0).toUpperCase();

  const avatar = (
    <span style={{
      width: mobile ? 28 : 24, height: mobile ? 28 : 24, borderRadius:'50%',
      background:'linear-gradient(135deg,#FF7A29,#E8B23D)',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontFamily:'Montserrat,sans-serif', fontWeight:900,
      fontSize: mobile ? 13 : 11, color:'#fff', flexShrink:0,
    }}>{initial}</span>
  );

  return (
    <>
    <a
      href={PROFILE_HREF}
      onClick={onNavigate}
      title={user.name}
      style={mobile
        ? { display:'flex', alignItems:'center', gap:10, color:'#FF7A29', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.07)', textDecoration:'none' }
        : { display:'inline-flex', alignItems:'center', gap:7, textDecoration:'none' }}
    >
      {avatar}
      <span style={mobile
        ? {}
        : { color:'#FF7A29', fontWeight:700, fontSize:13, fontFamily:'Inter,sans-serif', maxWidth:96, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
      >{firstName}</span>
    </a>
    {mobile && (
      <span
        onClick={() => {
          clearSession();
          onNavigate?.();
          window.location.assign(import.meta.env.BASE_URL || '/');
        }}
        style={{ display:'block', color:'rgba(255,255,255,0.55)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.07)', cursor:'pointer' }}
      >🚪 Sign Out</span>
    )}
    </>
  );
}
