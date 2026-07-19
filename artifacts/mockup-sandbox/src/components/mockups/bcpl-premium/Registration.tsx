import React, { useState } from 'react';
import { Check, Edit2, Lock, CreditCard, User, Upload, ArrowRight, ArrowLeft, ChevronDown, CheckCircle2, ShieldCheck, Mail, MapPin, Phone, Briefcase, Calendar, History, Video } from 'lucide-react';

function Navbar({ active = '' }) {
  const links = [['Home', 'home'], ['Schedule', 'schedule'], ['Match Center', 'matchcenter'], ['Teams', 'teams'], ['Points Table', 'points'], ['About', 'about']];
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,22,40,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22 }}>
          <span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 4 }}>T20</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, marginLeft: 10, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Bhartiya Corporate Premier League</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {links.map(([label, key]) => (
            <a key={key} href="#" style={{ color: active === key ? '#FF7A29' : 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', fontFamily: 'Inter,sans-serif', borderBottom: active === key ? '2px solid #FF7A29' : '2px solid transparent', paddingBottom: 2 }}>{label}</a>
          ))}
          <button style={{ background: 'linear-gradient(135deg,#FF7A29,#E8611A)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,122,41,0.4)', fontFamily: 'Inter,sans-serif' }}>Register ₹299</button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const footerSections = [
    { title: 'League', links: ['Home', 'Schedule', 'Match Center', 'Teams', 'Points Table'] },
    { title: 'Info', links: ['About BCPL', 'FAQ', 'Contact Us', 'Eligibility', 'Code of Conduct'] },
    { title: 'Legal', links: ['Cricket Rulebook', 'Terms of Service', 'Privacy Policy'] }
  ];

  return (
    <footer style={{ background: '#06101E', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '56px 40px 32px', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 24, marginBottom: 10 }}><span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 4 }}>T20</span></div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, lineHeight: 1.7, margin: '0 0 20px' }}>Bhartiya Corporate Premier League. World's largest corporate cricket league for working professionals.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['📸', '▶️', '🐦', '📘'].map((ic, i) => <a key={i} href="#" style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)' }}>{ic}</a>)}
            </div>
          </div>
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>{title}</div>
              {links.map(l => <div key={l} style={{ marginBottom: 9 }}><a href="#" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>{l}</a></div>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>© 2025 Kriparti Playing 11 Private Limited. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

export function Registration() {
  const steps = [
    { id: 1, label: 'Role', status: 'completed' },
    { id: 2, label: 'Details', status: 'active' },
    { id: 3, label: 'History', status: 'upcoming' },
    { id: 4, label: 'Video', status: 'upcoming' },
    { id: 5, label: 'Payment', status: 'upcoming' },
  ];

  const upcomingStyle = {
    padding: '24px 32px',
    marginBottom: 24,
    opacity: 0.6,
    pointerEvents: 'none' as const,
    filter: 'grayscale(30%)',
    background: 'rgba(15,34,71,0.4)'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #1a3a6e 0%, #0A1628 60%)',
      backgroundColor: '#0A1628',
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style>{`
        .input-field {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: #fff;
          padding: 12px 16px;
          width: 100%;
          font-family: Inter, sans-serif;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .input-field:focus {
          border-color: #FF7A29;
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(255,122,41,0.2);
        }
        .input-field::placeholder {
          color: rgba(255,255,255,0.3);
        }
        select.input-field option {
          background: #0A1628;
          color: #fff;
        }
        .glass-card {
          background: rgba(15,34,71,0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
        }
        .payment-tab {
          flex: 1;
          padding: 12px;
          text-align: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
        }
        .payment-tab.active {
          background: rgba(255,122,41,0.1);
          border-color: #FF7A29;
          color: #FF7A29;
        }
        .payment-tab:first-child { border-radius: 8px 0 0 8px; }
        .payment-tab:last-child { border-radius: 0 8px 8px 0; }
        .faq-item summary::-webkit-details-marker { display: none; }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
      `}</style>

      <Navbar active="" />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Main Content Area */}
        <div style={{ flex: '1 1 600px', minWidth: 0 }}>
          
          {/* Progress Tracker */}
          <div className="glass-card" style={{ padding: '24px 32px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 80, zIndex: 90 }}>
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'column', width: 60, flexShrink: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14,
                    background: step.status === 'completed' ? '#FF7A29' : step.status === 'active' ? '#FF7A29' : 'rgba(255,255,255,0.05)',
                    color: step.status === 'upcoming' ? 'rgba(255,255,255,0.4)' : '#fff',
                    border: step.status === 'upcoming' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    boxShadow: step.status === 'active' ? '0 0 15px rgba(255,122,41,0.4)' : 'none'
                  }}>
                    {step.status === 'completed' ? <Check size={18} strokeWidth={3} /> : step.id}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: step.status === 'completed' ? '#FF7A29' : step.status === 'active' ? '#FF7A29' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', whiteSpace: 'nowrap' }}>{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: steps[idx].status === 'completed' ? '#FF7A29' : 'rgba(255,255,255,0.1)', margin: '0 8px', marginTop: -20 }}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* STEP 1 - Completed */}
          <div className="glass-card" style={{ padding: '24px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,122,41,0.1)', color: '#FF7A29', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Step 01</div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                  Your Role
                  <span style={{ background: 'rgba(46,158,79,0.15)', color: '#2E9E4F', border: '1px solid rgba(46,158,79,0.3)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🏏 Batsman &middot; ₹299 <Check size={14} strokeWidth={3} />
                  </span>
                </div>
              </div>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#FF7A29', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit2 size={14} /> Change
            </button>
          </div>

          {/* STEP 2 - Active */}
          <div className="glass-card" style={{ padding: '32px', marginBottom: 24, border: '1px solid rgba(255,122,41,0.3)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 28, color: '#fff', margin: '0 0 8px 0' }}>02 / Your Details</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, margin: 0 }}>Tell us about yourself. All details are kept confidential.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Full Name*</label>
                <input type="text" className="input-field" placeholder="Enter your full name" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Date of Birth*</label>
                <input type="date" className="input-field" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>City / Location*</label>
                <div style={{ position: 'relative' }}>
                  <select className="input-field" style={{ appearance: 'none' }} defaultValue="">
                    <option value="" disabled>Select your city</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="delhi">Delhi</option>
                    <option value="bangalore">Bangalore</option>
                    <option value="hyderabad">Hyderabad</option>
                    <option value="chennai">Chennai</option>
                  </select>
                  <ChevronDown size={16} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Mobile Number*</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>+91</div>
                  <input type="tel" className="input-field" placeholder="10-digit mobile number" style={{ flex: 1 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Email Address*</label>
                <input type="email" className="input-field" placeholder="you@company.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Company / Organization*</label>
                <input type="text" className="input-field" placeholder="Where do you work?" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Job Title</label>
                <input type="text" className="input-field" placeholder="e.g. Software Engineer" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Years at Company</label>
                <div style={{ position: 'relative' }}>
                  <select className="input-field" style={{ appearance: 'none' }} defaultValue="">
                    <option value="" disabled>Select duration</option>
                    <option value="<1">&lt; 1 Year</option>
                    <option value="1-3">1-3 Years</option>
                    <option value="3-5">3-5 Years</option>
                    <option value="5+">5+ Years</option>
                  </select>
                  <ChevronDown size={16} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <ArrowLeft size={16} /> Back
              </button>
              <button style={{ background: 'linear-gradient(135deg, #FF7A29, #E8611A)', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 24px rgba(255,122,41,0.4)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* STEP 3 - Upcoming */}
          <div className="glass-card" style={upcomingStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', margin: '0 0 6px 0' }}>03 / Cricket History</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>Batting Style, Bowling Style, Years Playing, Highest Level</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: 20 }}>
                <Lock size={14} /> Complete step 2
              </div>
            </div>
          </div>

          {/* STEP 4 - Upcoming */}
          <div className="glass-card" style={upcomingStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', margin: '0 0 6px 0' }}>04 / Video Submission</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>Upload a 2-min gameplay video</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: 20 }}>
                <Lock size={14} /> Complete step 3
              </div>
            </div>
          </div>

          {/* STEP 5 - Payment Preview (Visible but locked) */}
          <div className="glass-card" style={{ padding: '32px', marginBottom: 24, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,22,40,0.5)', zIndex: 10, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
              <div style={{ background: 'rgba(15,34,71,0.9)', padding: '12px 24px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <Lock size={16} color="#FF7A29" /> Complete previous steps to unlock payment
              </div>
            </div>

            <div style={{ filter: 'blur(1px)', opacity: 0.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24, color: '#fff', margin: '0 0 8px 0' }}>05 / Payment</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Complete your registration to secure your spot.</p>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Role: Batsman</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>₹299</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Trial fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>₹299</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Auction fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>₹0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Tournament fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>₹0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>Total Amount</span>
                  <span style={{ fontWeight: 800, fontSize: 24, color: '#FF7A29' }}>₹299</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2E9E4F', fontSize: 12, marginTop: 12, fontWeight: 600 }}>
                  <ShieldCheck size={14} /> No hidden charges. No recurring fees.
                </div>
              </div>

              <div style={{ display: 'flex', marginBottom: 24 }}>
                <div className="payment-tab active">Pay via UPI</div>
                <div className="payment-tab">Pay via Card</div>
                <div className="payment-tab">Net Banking</div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>UPI ID*</label>
                <input type="text" className="input-field" placeholder="username@bank" disabled />
              </div>

              <button style={{ width: '100%', background: 'linear-gradient(135deg, #FF7A29, #E8611A)', border: 'none', color: '#fff', padding: '16px', borderRadius: 10, fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.7 }}>
                <Lock size={18} /> Complete Registration — ₹299
              </button>
            </div>
          </div>

        </div>

        {/* Aside */}
        <aside style={{ width: 340, flexShrink: 0, position: 'sticky', top: 100, display: 'flex', flexDirection: 'column', gap: 24, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }} className="custom-scrollbar">
          
          <div className="glass-card" style={{ padding: 24, borderTop: '4px solid #FF7A29' }}>
            <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', margin: '0 0 16px 0' }}>What You Get</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 500 }}>
                <span style={{ fontSize: 16 }}>🏆</span> Fair shot at BCPL Season 5
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 500 }}>
                <span style={{ fontSize: 16 }}>🎽</span> Official kit & jersey if selected
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 500 }}>
                <span style={{ fontSize: 16 }}>🏟️</span> Stadium-grade grounds
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 500 }}>
                <span style={{ fontSize: 16 }}>👨‍🏫</span> Professional coaching
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 500 }}>
                <span style={{ fontSize: 16 }}>📺</span> TV coverage
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 500 }}>
                <CheckCircle2 size={16} color="#2E9E4F" style={{ flexShrink: 0 }} /> No auction fee
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 500 }}>
                <CheckCircle2 size={16} color="#2E9E4F" style={{ flexShrink: 0 }} /> No tournament fee
              </li>
            </ul>
          </div>

          <div className="glass-card" style={{ padding: 24, background: 'linear-gradient(180deg, rgba(15,34,71,0.8) 0%, rgba(10,22,40,0.8) 100%)' }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#E8B23D', fontSize: 14 }}>★</span>)}
            </div>
            <p style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 20px 0' }}>
              "I registered in 5 minutes. Got the call in 2 weeks. Now I play for Delhi Dynamos!"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7A29, #E8611A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 10px rgba(255,122,41,0.3)' }}>RM</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Rahul M.</div>
                <div style={{ color: '#FF7A29', fontSize: 11, fontWeight: 600 }}>Delhi Dynamos</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', margin: '0 0 16px 0' }}>FAQ</h4>
            
            <details className="faq-item" style={{ marginBottom: 12 }} open>
              <summary style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.9)' }}>
                Can I cancel? <ChevronDown size={14} color="rgba(255,255,255,0.5)" />
              </summary>
              <div style={{ padding: '8px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Yes, within 7 days of registration.
              </div>
            </details>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }}></div>
            
            <details className="faq-item" style={{ marginBottom: 12 }}>
              <summary style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.9)' }}>
                What if not shortlisted? <ChevronDown size={14} color="rgba(255,255,255,0.5)" />
              </summary>
              <div style={{ padding: '8px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                The trial fee is non-refundable as it covers operational costs.
              </div>
            </details>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }}></div>
            
            <details className="faq-item">
              <summary style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.9)' }}>
                Any hidden fee? <ChevronDown size={14} color="rgba(255,255,255,0.5)" />
              </summary>
              <div style={{ padding: '8px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Absolutely none. No auction fee, no tournament fee.
              </div>
            </details>
          </div>

          <div style={{ marginTop: 8 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px 4px' }}>Available Roles (Reference)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { role: 'Batsman', price: 299, desc: 'Top & middle order', icon: ShieldCheck },
                { role: 'Bowler', price: 299, desc: 'Pace & spin options', icon: History },
                { role: 'Wicket-Keeper', price: 299, desc: 'Behind the stumps', icon: User },
                { role: 'All-Rounder', price: 399, desc: 'Batting & bowling', icon: CheckCircle2 }
              ].map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.role} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color="#FF7A29" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{r.role}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{r.desc}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#E8B23D' }}>₹{r.price}</div>
                  </div>
                );
              })}
            </div>
          </div>

        </aside>

      </main>

      <Footer />
    </div>
  );
}
