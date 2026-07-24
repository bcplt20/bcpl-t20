import { useEffect, lazy, Suspense } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { LoginModal } from './components/LoginModal';
import { SiteMeta } from './components/SiteMeta';
import { LangProvider } from './lib/i18n';

// All BCPL pages
import { Home }                from '@/pages/Home';
import { Teams }               from '@/pages/Teams';
import { MatchCenter }         from '@/pages/MatchCenter';
import { Sponsors }            from '@/pages/Sponsors';
import { Photos }              from '@/pages/Photos';
import { Videos }              from '@/pages/Videos';
import { About }               from '@/pages/About';
import { FAQ }                 from '@/pages/FAQ';
import { Contact }             from '@/pages/Contact';
import { TeamDetail }          from '@/pages/TeamDetail';
import { Schedule }            from '@/pages/Schedule';
import { PointsTable }         from '@/pages/PointsTable';
import { CodeOfConduct }       from '@/pages/CodeOfConduct';
import { CricketRulebook }     from '@/pages/CricketRulebook';
import { TrialRules }          from '@/pages/TrialRules';
import { EligibilityCriteria } from '@/pages/EligibilityCriteria';
import { Privacy }             from '@/pages/Privacy';
import { Refunds }             from '@/pages/Refunds';
import { Terms }               from '@/pages/Terms';
import { Registration }        from '@/pages/Registration';
import { ReferralRedirect }    from '@/pages/ReferralRedirect';
import { Phase1PaymentReceipt } from '@/pages/Phase1PaymentReceipt';
import { Phase1VideoUpload }   from '@/pages/Phase1VideoUpload';
import { Phase1Result }        from '@/pages/Phase1Result';
import { Phase2Registration }  from '@/pages/Phase2Registration';
import { Phase2Payment }       from '@/pages/Phase2Payment';
import { Phase2PaymentReceipt } from '@/pages/Phase2PaymentReceipt';
import { Phase2KYC }           from '@/pages/Phase2KYC';
import { Phase2KYCApproved }   from '@/pages/Phase2KYCApproved';
import { AuctionSelected }     from '@/pages/AuctionSelected';
import { AuctionLive }         from '@/pages/AuctionLive';
import { TeamSelected }        from '@/pages/TeamSelected';
import { PlayerProfile }       from '@/pages/PlayerProfile';
import { TrialPass }            from '@/pages/TrialPass';
import { Players }             from '@/pages/Players';
import { Trust }               from '@/pages/Trust';
import AdminPanel              from '@/admin/AdminPanel';

// Staff trial-ops app — lazy: field staff only, keeps jsqr etc out of the main bundle
const StaffApp = lazy(() => import('@/staff/StaffApp'));
function StaffRoute() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#06101E' }} />}>
      <StaffApp />
    </Suspense>
  );
}

// Scroll to top on every route change
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function NotFound() {
  return (
    <div style={{ background:'#06101E', color:'#fff', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', gap:16 }}>
      <div style={{ fontSize:80, fontWeight:900, color:'#FF7A29' }}>404</div>
      <div style={{ fontSize:22, fontWeight:700 }}>Page not found</div>
      <a href="/" style={{ marginTop:12, background:'#FF7A29', color:'#fff', padding:'12px 28px', borderRadius:10, fontWeight:900, fontSize:14, letterSpacing:'.06em', textDecoration:'none' }}>← Back to Home</a>
    </div>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <SiteMeta />
      <Switch>
        {/* Main pages */}
        <Route path="/"            component={Home} />
        <Route path="/teams"       component={Teams} />
        <Route path="/match-center" component={MatchCenter} />
        <Route path="/sponsors"    component={Sponsors} />
        <Route path="/photos"      component={Photos} />
        <Route path="/videos"      component={Videos} />
        <Route path="/about"       component={About} />
        <Route path="/faq"         component={FAQ} />
        <Route path="/contact"     component={Contact} />
        <Route path="/schedule"    component={Schedule} />
        <Route path="/points-table" component={PointsTable} />

        {/* Team detail */}
        <Route path="/team/:slug"  component={TeamDetail} />
        <Route path="/players"     component={Players} />

        {/* Legal & policy pages */}
        <Route path="/code-of-conduct"  component={CodeOfConduct} />
        <Route path="/cricket-rulebook" component={CricketRulebook} />
        <Route path="/trial-rules"      component={TrialRules} />
        <Route path="/eligibility"      component={EligibilityCriteria} />
        <Route path="/privacy"          component={Privacy} />
        <Route path="/trust"            component={Trust} />
        <Route path="/refunds"          component={Refunds} />
        <Route path="/terms"            component={Terms} />

        {/* Referral links: bcplt20.com/r/CODE → tracked redirect to /register */}
        <Route path="/r/:code" component={ReferralRedirect} />

        {/* Registration & player flow */}
        <Route path="/register"                       component={Registration} />
        <Route path="/register/payment-receipt"       component={Phase1PaymentReceipt} />
        <Route path="/register/upload-video"          component={Phase1VideoUpload} />
        <Route path="/register/result"                component={Phase1Result} />
        <Route path="/register/phase2"                component={Phase2Registration} />
        <Route path="/register/phase2/payment"        component={Phase2Payment} />
        <Route path="/register/phase2/payment-receipt" component={Phase2PaymentReceipt} />
        <Route path="/register/phase2/kyc"            component={Phase2KYC} />
        <Route path="/register/phase2/kyc-approved"   component={Phase2KYCApproved} />

        {/* Auction & post-auction flow */}
        <Route path="/auction/selected" component={AuctionSelected} />
        <Route path="/auction/live"     component={AuctionLive} />
        <Route path="/team-selected"    component={TeamSelected} />
        <Route path="/profile"          component={PlayerProfile} />
        <Route path="/trial-pass"       component={TrialPass} />

        {/* Admin panel */}
        <Route path="/admin" component={AdminPanel} />

        {/* Staff trial-ops app (mobile) */}
        <Route path="/staff" component={StaffRoute} />
        <Route path="/staff/:rest*" component={StaffRoute} />

        {/* 404 fallback */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <LangProvider>
      <WouterRouter base={base}>
        <Router />
        <LoginModal />
      </WouterRouter>
    </LangProvider>
  );
}
