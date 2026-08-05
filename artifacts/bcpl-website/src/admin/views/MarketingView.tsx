import { useState, useEffect, useCallback, useRef } from "react";
import {
  getMarketingFunnel, listReferrals, createReferral, updateReferral, deleteReferral,
  listCampaigns, createCampaign, updateCampaign, deleteCampaign,
  listEmailCampaigns, previewAudience, sendTestEmail, sendEmailCampaign, referralLink,
  listSmsCampaigns, previewPhoneAudience, sendBulkCampaign,
  type FunnelData, type ReferralStat, type Campaign, type EmailCampaign, type AudienceStage,
  type SmsCampaign, type BulkChannel,
  adminGetAbandoned, type AbandonedRow,
} from "@/lib/marketingApi";
import { listWaTemplates, type WaTemplate } from "@/lib/adminToolsApi";

/* ── Shared UI helpers ── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={onClose}>
      <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 7, letterSpacing: .5, textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 9, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" };
const sel: React.CSSProperties = { ...inp, cursor: "pointer" };
const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
const btnPrimary: React.CSSProperties = { background: "#FF6B00", color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "#1E293B", color: "#CBD5E1", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E293B", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px", fontSize: 13, color: "#E2E8F0", borderBottom: "1px solid #14203A", verticalAlign: "middle" };
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const dt = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const PLATFORMS = ["Instagram", "YouTube", "WhatsApp", "Facebook", "Twitter", "LinkedIn", "Offline", "Other"];
const CHANNELS = ["WhatsApp", "Instagram", "Facebook", "Google Ads", "YouTube", "Offline", "Other"];
const STAGE_LABELS: Record<AudienceStage, string> = {
  all: "All accounts",
  registered: "Registered (any status)",
  p1_paid: "Phase 1 paid",
  video: "Video uploaded",
  selected: "Phase 1 selected",
  p2_paid: "Phase 2 paid",
};

function CopyLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(referralLink(code)).catch(() => {});
        setCopied(true); setTimeout(() => setCopied(false), 1500);
      }}
      title={referralLink(code)}
      style={{ background: copied ? "#14532D" : "#1E293B", color: copied ? "#4ADE80" : "#93C5FD", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
      {copied ? "✓ Copied" : "🔗 Copy link"}
    </button>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    sending: ["#78350F", "#FBBF24"], sent: ["#14532D", "#4ADE80"], failed: ["#7F1D1D", "#FCA5A5"],
    active: ["#14532D", "#4ADE80"], paused: ["#78350F", "#FBBF24"], completed: ["#1E293B", "#94A3B8"],
    dry_run: ["#1E3A8A", "#93C5FD"],
  };
  const [bg, fg] = map[status] ?? ["#1E293B", "#94A3B8"];
  return <span style={{ background: bg, color: fg, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>{status.toUpperCase()}</span>;
}

/* ── Blank forms ── */
const blankReferral = { name: "", code: "", platform: "Instagram", city: "", phone: "", email: "", commissionRate: "0" };
const blankCampaign = { name: "", channel: "WhatsApp", budget: "", spent: "", startDate: "", endDate: "", goal: "", status: "active", notes: "" };

/* ═══════════════════════════════════════════════════ */
function AbandonedSection() {
  const [rows, setRows] = useState<AbandonedRow[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    adminGetAbandoned().then(d => setRows(d.abandoned)).catch(e => setErr(e?.message || "Failed to load abandoned registrations"));
  }, []);
  const fmtAge = (h: number) => (h < 24 ? h + "h" : Math.floor(h / 24) + "d " + (h % 24) + "h");
  const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #131C2E", color: "#94A3B8" };
  return (
    <div style={{ ...card, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#F1F5F9" }}>Abandoned Registrations</h3>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#F59E0B", background: "#F59E0B1A", border: "1px solid #F59E0B44", padding: "2px 9px", borderRadius: 999 }}>{rows ? rows.length : "…"}</span>
      </div>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
        Registered but Phase 1 payment pending. Auto-reminders go out at 24h and 72h — once each per player, never duplicated.
      </div>
      {err && <div style={{ color: "#FCA5A5", fontSize: 12.5 }}>{err}</div>}
      {rows && rows.length === 0 && <div style={{ color: "#64748B", fontSize: 13 }}>No abandoned registrations right now.</div>}
      {rows && rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr>
              {["Player", "Phone", "City", "Waiting", "Attempts", "Last attempt", "Reminders"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#64748B", fontSize: 10.5, letterSpacing: ".07em", textTransform: "uppercase", borderBottom: "1px solid #1E293B" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.slice(0, 100).map(r => (
                <tr key={r.registrationId}>
                  <td style={{ ...td, color: "#E2E8F0", fontWeight: 700 }}>{r.name}</td>
                  <td style={{ ...td, fontFamily: "monospace" }}>{r.phone}</td>
                  <td style={td}>{r.city || "—"}</td>
                  <td style={{ ...td, color: "#F59E0B", fontWeight: 700 }}>{fmtAge(r.ageHours)}</td>
                  <td style={td}>{r.paymentAttempts}</td>
                  <td style={{ ...td, color: r.lastAttemptStatus === "failed" ? "#FCA5A5" : "#94A3B8" }}>{r.lastAttemptStatus || "none"}</td>
                  <td style={{ ...td, color: r.remindersSent ? "#10B981" : "#64748B" }}>{r.remindersSent}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 100 && <div style={{ color: "#475569", fontSize: 12, marginTop: 8 }}>Showing first 100 of {rows.length}.</div>}
        </div>
      )}
    </div>
  );
}

export default function MarketingView() {
  const [tab, setTab] = useState<"funnel" | "referrals" | "platforms" | "campaigns" | "email" | "messaging">("funnel");
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [referrals, setReferrals] = useState<ReferralStat[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [emails, setEmails] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [f, r, c, e] = await Promise.all([
        getMarketingFunnel(), listReferrals(), listCampaigns(), listEmailCampaigns(),
      ]);
      setFunnel(f); setReferrals(r.referrals); setCampaigns(c.campaigns); setEmails(e.campaigns);
    } catch (e: any) { setError(e.message ?? "Failed to load marketing data"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  const refreshReferrals = () => listReferrals().then(r => setReferrals(r.referrals)).catch(() => {});
  const refreshCampaigns = () => listCampaigns().then(c => setCampaigns(c.campaigns)).catch(() => {});
  const refreshEmails = useCallback(() => listEmailCampaigns().then(e => setEmails(e.campaigns)).catch(() => {}), []);

  // Poll while any email campaign is still sending
  const anySending = emails.some(e => e.status === "sending");
  useEffect(() => {
    if (!anySending) return;
    const iv = setInterval(refreshEmails, 3000);
    return () => clearInterval(iv);
  }, [anySending, refreshEmails]);

  /* ── Referral modal state ── */
  const [refModal, setRefModal] = useState<null | { id?: string; form: typeof blankReferral; active?: boolean }>(null);
  const [refBusy, setRefBusy] = useState(false);
  const [refErr, setRefErr] = useState("");

  const saveReferral = async () => {
    if (!refModal) return;
    const f = refModal.form;
    if (!f.name.trim()) { setRefErr("Name is required"); return; }
    setRefBusy(true); setRefErr("");
    try {
      if (refModal.id) {
        await updateReferral(refModal.id, {
          name: f.name, platform: f.platform, city: f.city, phone: f.phone, email: f.email,
          commissionRate: Number(f.commissionRate) || 0,
        });
      } else {
        await createReferral({
          name: f.name, code: f.code.trim() || undefined, kind: "influencer", platform: f.platform,
          city: f.city || undefined, phone: f.phone || undefined, email: f.email || undefined,
          commissionRate: Number(f.commissionRate) || 0,
        });
      }
      setRefModal(null); refreshReferrals();
    } catch (e: any) { setRefErr(e.message ?? "Save failed"); }
    finally { setRefBusy(false); }
  };

  const removeReferral = async (id: string) => {
    if (!confirm("Delete this referral link? (Codes with signups can only be deactivated)")) return;
    try { await deleteReferral(id); setRefModal(null); refreshReferrals(); }
    catch (e: any) { setRefErr(e.message ?? "Delete failed"); }
  };

  /* ── Campaign modal state ── */
  const [campModal, setCampModal] = useState<null | { id?: string; form: typeof blankCampaign }>(null);
  const [campBusy, setCampBusy] = useState(false);
  const [campErr, setCampErr] = useState("");

  const saveCampaign = async () => {
    if (!campModal) return;
    const f = campModal.form;
    if (!f.name.trim()) { setCampErr("Name is required"); return; }
    setCampBusy(true); setCampErr("");
    const payload = {
      name: f.name, channel: f.channel, budget: Number(f.budget) || 0, spent: Number(f.spent) || 0,
      startDate: f.startDate || null, endDate: f.endDate || null, goal: f.goal || null,
      status: f.status as Campaign["status"], notes: f.notes || null,
    };
    try {
      if (campModal.id) await updateCampaign(campModal.id, payload);
      else await createCampaign(payload);
      setCampModal(null); refreshCampaigns();
    } catch (e: any) { setCampErr(e.message ?? "Save failed"); }
    finally { setCampBusy(false); }
  };

  /* ── Email composer state ── */
  const [emSubject, setEmSubject] = useState("");
  const [emBody, setEmBody] = useState("");
  const [emStage, setEmStage] = useState<AudienceStage>("all");
  const [emCity, setEmCity] = useState("");
  const [emPreview, setEmPreview] = useState<null | { total: number; sample: { email: string; name: string }[] }>(null);
  const [emPreviewBusy, setEmPreviewBusy] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testedEmail, setTestedEmail] = useState("");   // set only after a successful test send
  const [emMsg, setEmMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [sendBusy, setSendBusy] = useState(false);

  // Any change to content/audience invalidates the previous test + preview
  const contentKey = `${emSubject}|${emBody}|${emStage}|${emCity}`;
  const prevKey = useRef(contentKey);
  useEffect(() => {
    if (prevKey.current !== contentKey) {
      prevKey.current = contentKey;
      setTestedEmail(""); setEmPreview(null); setEmMsg(null);
    }
  }, [contentKey]);

  const doPreview = async () => {
    setEmPreviewBusy(true); setEmMsg(null);
    try { setEmPreview(await previewAudience({ stage: emStage, city: emCity || undefined })); }
    catch (e: any) { setEmMsg({ kind: "err", text: e.message ?? "Preview failed" }); }
    finally { setEmPreviewBusy(false); }
  };

  const doTest = async () => {
    if (!emSubject.trim() || !emBody.trim()) { setEmMsg({ kind: "err", text: "Write subject and message first" }); return; }
    if (!testEmail.includes("@")) { setEmMsg({ kind: "err", text: "Enter a valid test email address" }); return; }
    setTestBusy(true); setEmMsg(null);
    try {
      await sendTestEmail({ subject: emSubject, body: emBody, toEmail: testEmail });
      setTestedEmail(testEmail);
      setEmMsg({ kind: "ok", text: `Test sent to ${testEmail} — check the inbox, then send to everyone.` });
    } catch (e: any) { setEmMsg({ kind: "err", text: e.message ?? "Test send failed" }); }
    finally { setTestBusy(false); }
  };

  const doSend = async () => {
    if (!testedEmail) return;
    let total = emPreview?.total;
    if (total === undefined) {
      try { total = (await previewAudience({ stage: emStage, city: emCity || undefined })).total; }
      catch { total = undefined; }
    }
    if (!confirm(`Send this email to ${total ?? "all matching"} recipient(s)? This cannot be undone.`)) return;
    setSendBusy(true); setEmMsg(null);
    try {
      await sendEmailCampaign({
        subject: emSubject, body: emBody,
        audience: { stage: emStage, city: emCity || undefined },
        testedEmail,
      });
      setEmSubject(""); setEmBody(""); setEmPreview(null); setTestedEmail("");
      setEmMsg({ kind: "ok", text: "Campaign started — live progress below." });
      refreshEmails();
    } catch (e: any) { setEmMsg({ kind: "err", text: e.message ?? "Send failed" }); }
    finally { setSendBusy(false); }
  };

  /* ── Bulk SMS / WhatsApp composer state ── */
  const [msgs, setMsgs] = useState<SmsCampaign[]>([]);
  const [bulkEnabled, setBulkEnabled] = useState(true);
  const [waTemplates, setWaTemplates] = useState<WaTemplate[]>([]);
  const [smChannel, setSmChannel] = useState<BulkChannel>("sms");
  const [smName, setSmName] = useState("");
  const [smBody, setSmBody] = useState("");
  const [smFlowId, setSmFlowId] = useState("");
  const [smTemplate, setSmTemplate] = useState("");
  const [smVars, setSmVars] = useState("");
  const [smStage, setSmStage] = useState<AudienceStage>("all");
  const [smCity, setSmCity] = useState("");
  const [smPreview, setSmPreview] = useState<null | { total: number; sample: { name: string; phone: string }[] }>(null);
  const [smPreviewBusy, setSmPreviewBusy] = useState(false);
  const [smSendBusy, setSmSendBusy] = useState(false);
  const [smMsg, setSmMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const refreshMessaging = useCallback(() => {
    listSmsCampaigns().then(d => { setMsgs(d.campaigns); setBulkEnabled(d.bulkEnabled); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (tab !== "messaging") return;
    refreshMessaging();
    listWaTemplates().then(d => setWaTemplates(d.templates)).catch(() => {});
  }, [tab, refreshMessaging]);

  // Poll while any bulk campaign is still sending
  const anyMsgSending = msgs.some(m => m.status === "sending");
  useEffect(() => {
    if (tab !== "messaging" || !anyMsgSending) return;
    const iv = setInterval(refreshMessaging, 3000);
    return () => clearInterval(iv);
  }, [tab, anyMsgSending, refreshMessaging]);

  // Any audience change invalidates the previous preview count.
  const smAudKey = `${smStage}|${smCity}`;
  const smPrevKey = useRef(smAudKey);
  useEffect(() => {
    if (smPrevKey.current !== smAudKey) { smPrevKey.current = smAudKey; setSmPreview(null); }
  }, [smAudKey]);

  const smParsedVars = () => smVars.split("|").map(v => v.trim()).filter(Boolean);

  const doSmPreview = async () => {
    setSmPreviewBusy(true); setSmMsg(null);
    try { setSmPreview(await previewPhoneAudience({ stage: smStage, city: smCity || undefined })); }
    catch (e: any) { setSmMsg({ kind: "err", text: e.message ?? "Preview failed" }); }
    finally { setSmPreviewBusy(false); }
  };

  const doSmSend = async () => {
    if (!smName.trim()) { setSmMsg({ kind: "err", text: "Give the campaign a name" }); return; }
    if (smChannel === "sms" && !smFlowId.trim()) { setSmMsg({ kind: "err", text: "A MSG91 Flow Template ID is required for bulk SMS (DLT)" }); return; }
    if (smChannel === "whatsapp" && !smTemplate) { setSmMsg({ kind: "err", text: "Pick a WhatsApp template" }); return; }
    let total = smPreview?.total;
    if (total === undefined) {
      try { total = (await previewPhoneAudience({ stage: smStage, city: smCity || undefined })).total; }
      catch { total = undefined; }
    }
    const dryNote = bulkEnabled ? "" : "\n\n(Dry-run mode: nothing will actually be sent — server is not in send mode.)";
    if (!confirm(`Send this ${smChannel === "sms" ? "SMS" : "WhatsApp message"} to ${total ?? "all matching"} recipient(s)? This cannot be undone.${dryNote}`)) return;
    setSmSendBusy(true); setSmMsg(null);
    try {
      const r = await sendBulkCampaign({
        channel: smChannel,
        name: smName,
        body: smBody,
        flowTemplateId: smChannel === "sms" ? smFlowId : undefined,
        templateName: smChannel === "whatsapp" ? smTemplate : undefined,
        templateVars: smParsedVars(),
        audience: { stage: smStage, city: smCity || undefined },
      });
      setSmName(""); setSmBody(""); setSmVars(""); setSmPreview(null);
      setSmMsg({ kind: "ok", text: r.dryRun ? "Dry-run recorded — nothing sent (server not in send mode). See history below." : "Campaign started — live progress below." });
      refreshMessaging();
    } catch (e: any) { setSmMsg({ kind: "err", text: e.message ?? "Send failed" }); }
    finally { setSmSendBusy(false); }
  };

  /* ── Render ── */
  if (loading) return <div style={{ color: "#64748B", padding: 40, fontSize: 14 }}>Loading marketing data…</div>;
  if (error) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: "#FCA5A5", fontSize: 14, marginBottom: 14 }}>⚠ {error}</div>
      <button style={btnGhost} onClick={loadAll}>Retry</button>
    </div>
  );

  const influencers = referrals.filter(r => r.kind !== "agent");
  const c = funnel?.counts;
  const stages = c ? [
    { label: "Accounts Created", value: c.users, color: "#6366F1" },
    { label: "Registrations", value: c.registrations, color: "#3B82F6" },
    { label: "Phase 1 Paid", value: c.phase1Paid, color: "#F59E0B" },
    { label: "Video Uploaded", value: c.videoUploaded, color: "#FF6B00" },
    { label: "Phase 1 Selected", value: c.phase1Selected, color: "#22C55E" },
    { label: "Phase 2 Paid", value: c.phase2Paid, color: "#10B981" },
  ] : [];
  const maxStage = Math.max(1, ...stages.map(s => s.value));

  /* Platform aggregation (from ALL referral links, incl. agents) */
  const platMap = new Map<string, { links: number; clicks: number; signups: number; paid: number; revenue: number }>();
  for (const r of referrals) {
    const p = platMap.get(r.platform) ?? { links: 0, clicks: 0, signups: 0, paid: 0, revenue: 0 };
    p.links++; p.clicks += r.clicks; p.signups += r.signups; p.paid += r.paid; p.revenue += r.revenue;
    platMap.set(r.platform, p);
  }
  const platRows = [...platMap.entries()].sort((a, b) => b[1].signups - a[1].signups || b[1].clicks - a[1].clicks);

  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button onClick={() => setTab(id)} style={{
      background: tab === id ? "#FF6B00" : "transparent", color: tab === id ? "#fff" : "#94A3B8",
      border: tab === id ? "none" : "1px solid #1E293B", borderRadius: 9, padding: "9px 16px",
      fontSize: 13, fontWeight: 700, cursor: "pointer",
    }}>{label}</button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <TabBtn id="funnel" label="📊 Funnel" />
        <TabBtn id="referrals" label="🔗 Referral Links" />
        <TabBtn id="platforms" label="📱 Platforms" />
        <TabBtn id="campaigns" label="📣 Ad Campaigns" />
        <TabBtn id="email" label="✉️ Email" />
        <TabBtn id="messaging" label="💬 SMS / WhatsApp" />
      </div>

      {/* ═══ FUNNEL ═══ */}
      {tab === "funnel" && funnel && c && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Accounts", value: String(c.users), sub: "verified signups" },
              { label: "Registrations", value: String(c.registrations), sub: "Phase 1 forms" },
              { label: "Phase 1 Paid", value: String(c.phase1Paid), sub: `${c.registrations ? Math.round(c.phase1Paid / c.registrations * 100) : 0}% of registrations` },
              { label: "Total Revenue", value: inr(funnel.revenue.total), sub: `P1 ${inr(funnel.revenue.phase1)} · P2 ${inr(funnel.revenue.phase2)}` },
            ].map(k => (
              <div key={k.label} style={card}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#F1F5F9" }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>Registration Funnel</div>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 18 }}>Live counts from the database — no estimates.</div>
            {stages.map((s, i) => {
              const prev = i > 0 ? stages[i - 1].value : 0;
              const conv = i > 0 && prev > 0 ? Math.round(s.value / prev * 100) : null;
              return (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 150, fontSize: 12, color: "#94A3B8", fontWeight: 600, textAlign: "right", flexShrink: 0 }}>{s.label}</div>
                  <div style={{ flex: 1, background: "#060B18", borderRadius: 8, height: 34, position: "relative", overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(2, s.value / maxStage * 100)}%`, background: s.color, height: "100%", borderRadius: 8, opacity: .85 }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 13, fontWeight: 800, color: "#fff" }}>{s.value}</div>
                  </div>
                  <div style={{ width: 80, fontSize: 11, color: conv === null ? "#334155" : conv >= 50 ? "#4ADE80" : "#FBBF24", fontWeight: 700, flexShrink: 0 }}>
                    {conv === null ? "" : `${conv}% ⤷`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ REFERRALS ═══ */}
      {tab === "referrals" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Share <span style={{ color: "#93C5FD", fontFamily: "monospace" }}>bcplt20.com/r/CODE</span> — clicks, signups and payments are tracked automatically. Agent codes live in the <b>Affiliates</b> section.
            </div>
            <button style={btnPrimary} onClick={() => { setRefErr(""); setRefModal({ form: { ...blankReferral } }); }}>+ New Referral Link</button>
          </div>

          <div style={{ ...card, padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>Code</th><th style={th}>Name</th><th style={th}>Platform</th><th style={th}>Link</th>
                <th style={th}>Clicks</th><th style={th}>Signups</th><th style={th}>Paid</th><th style={th}>Revenue</th>
                <th style={th}>Status</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {influencers.length === 0 && (
                  <tr><td style={{ ...td, color: "#475569", textAlign: "center", padding: 30 }} colSpan={10}>
                    No referral links yet — create one and share it on social media.
                  </td></tr>
                )}
                {influencers.map(r => (
                  <tr key={r.id}>
                    <td style={{ ...td, fontFamily: "monospace", fontWeight: 800, color: "#FF9A57" }}>{r.code}</td>
                    <td style={td}>{r.name}</td>
                    <td style={td}>{r.platform}</td>
                    <td style={td}><CopyLink code={r.code} /></td>
                    <td style={td}>{r.clicks}</td>
                    <td style={{ ...td, fontWeight: 800 }}>{r.signups}</td>
                    <td style={{ ...td, color: "#4ADE80", fontWeight: 800 }}>{r.paid}</td>
                    <td style={td}>{inr(r.revenue)}</td>
                    <td style={td}>
                      <button onClick={() => updateReferral(r.id, { active: !r.active }).then(refreshReferrals).catch(() => {})}
                        style={{ background: r.active ? "#14532D" : "#1E293B", color: r.active ? "#4ADE80" : "#64748B", border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                        {r.active ? "ACTIVE" : "PAUSED"}
                      </button>
                    </td>
                    <td style={td}>
                      <button onClick={() => { setRefErr(""); setRefModal({ id: r.id, active: r.active, form: { name: r.name, code: r.code, platform: r.platform, city: r.city ?? "", phone: r.phone ?? "", email: r.email ?? "", commissionRate: String(r.commissionRate) } }); }}
                        style={{ background: "transparent", color: "#64748B", border: "none", cursor: "pointer", fontSize: 15 }}>✎</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ PLATFORMS ═══ */}
      {tab === "platforms" && (
        <div style={{ ...card, padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={th}>Platform</th><th style={th}>Links</th><th style={th}>Clicks</th>
              <th style={th}>Signups</th><th style={th}>Paid</th><th style={th}>Revenue</th>
            </tr></thead>
            <tbody>
              {platRows.length === 0 && (
                <tr><td style={{ ...td, color: "#475569", textAlign: "center", padding: 30 }} colSpan={6}>
                  No referral links yet — platform stats aggregate from referral links.
                </td></tr>
              )}
              {platRows.map(([platform, p]) => (
                <tr key={platform}>
                  <td style={{ ...td, fontWeight: 800 }}>{platform}</td>
                  <td style={td}>{p.links}</td>
                  <td style={td}>{p.clicks}</td>
                  <td style={{ ...td, fontWeight: 800 }}>{p.signups}</td>
                  <td style={{ ...td, color: "#4ADE80", fontWeight: 800 }}>{p.paid}</td>
                  <td style={td}>{inr(p.revenue)}</td>
                </tr>
              ))}
              {platRows.length > 0 && (
                <tr><td style={{ ...td, color: "#475569", fontSize: 11, borderBottom: "none" }} colSpan={6}>
                  Aggregated from referral-link traffic only — direct/organic visitors are not tracked.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ AD CAMPAIGNS ═══ */}
      {tab === "campaigns" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>Manual budget/spend tracker for ads and offline promotions.</div>
            <button style={btnPrimary} onClick={() => { setCampErr(""); setCampModal({ form: { ...blankCampaign } }); }}>+ New Campaign</button>
          </div>
          <div style={{ ...card, padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>Campaign</th><th style={th}>Channel</th><th style={th}>Budget</th><th style={th}>Spent</th>
                <th style={th}>Period</th><th style={th}>Goal</th><th style={th}>Status</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {campaigns.length === 0 && (
                  <tr><td style={{ ...td, color: "#475569", textAlign: "center", padding: 30 }} colSpan={8}>
                    No campaigns tracked yet.
                  </td></tr>
                )}
                {campaigns.map(cp => (
                  <tr key={cp.id}>
                    <td style={{ ...td, fontWeight: 700 }}>{cp.name}{cp.notes ? <div style={{ fontSize: 11, color: "#64748B", fontWeight: 400, marginTop: 2 }}>{cp.notes}</div> : null}</td>
                    <td style={td}>{cp.channel}</td>
                    <td style={td}>{inr(cp.budget)}</td>
                    <td style={{ ...td, color: cp.spent > cp.budget ? "#FCA5A5" : "#E2E8F0" }}>{inr(cp.spent)}</td>
                    <td style={{ ...td, fontSize: 12, color: "#94A3B8" }}>{cp.startDate || "—"} → {cp.endDate || "—"}</td>
                    <td style={{ ...td, fontSize: 12, color: "#94A3B8" }}>{cp.goal || "—"}</td>
                    <td style={td}><StatusChip status={cp.status} /></td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button onClick={() => { setCampErr(""); setCampModal({ id: cp.id, form: { name: cp.name, channel: cp.channel, budget: String(cp.budget || ""), spent: String(cp.spent || ""), startDate: cp.startDate ?? "", endDate: cp.endDate ?? "", goal: cp.goal ?? "", status: cp.status, notes: cp.notes ?? "" } }); }}
                        style={{ background: "transparent", color: "#64748B", border: "none", cursor: "pointer", fontSize: 15 }}>✎</button>
                      <button onClick={() => { if (confirm(`Delete campaign "${cp.name}"?`)) deleteCampaign(cp.id).then(refreshCampaigns).catch(() => {}); }}
                        style={{ background: "transparent", color: "#7F1D1D", border: "none", cursor: "pointer", fontSize: 15 }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ EMAIL ═══ */}
      {tab === "email" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(380px, 1.15fr) minmax(320px, 1fr)", gap: 16, alignItems: "start" }}>
          {/* Composer */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", marginBottom: 14 }}>New Email Campaign</div>
            <Field label="Subject"><input style={inp} value={emSubject} onChange={e => setEmSubject(e.target.value)} placeholder="e.g. Phase 2 trial dates announced!" /></Field>
            <Field label="Message (plain text — blank line = new paragraph)">
              <textarea style={{ ...inp, minHeight: 150, resize: "vertical", fontFamily: "inherit" }} value={emBody} onChange={e => setEmBody(e.target.value)} placeholder={"Dear player,\n\nGood news…"} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Audience">
                <select style={sel} value={emStage} onChange={e => setEmStage(e.target.value as AudienceStage)}>
                  {(Object.keys(STAGE_LABELS) as AudienceStage[]).map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </Field>
              <Field label="Trial City">
                <select style={sel} value={emCity} onChange={e => setEmCity(e.target.value)}>
                  <option value="">All cities</option>
                  {(funnel?.cities ?? []).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </Field>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
              <button style={btnGhost} onClick={doPreview} disabled={emPreviewBusy}>{emPreviewBusy ? "Counting…" : "👥 Preview audience"}</button>
              {emPreview && (
                <div style={{ fontSize: 12, color: "#94A3B8" }}>
                  <b style={{ color: "#F1F5F9" }}>{emPreview.total}</b> recipient(s)
                  {emPreview.sample.length > 0 && <span style={{ color: "#475569" }}> — e.g. {emPreview.sample.map(s => s.email).slice(0, 3).join(", ")}</span>}
                </div>
              )}
            </div>

            <div style={{ background: "#060B18", border: "1px solid #1E293B", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#FBBF24", letterSpacing: .5, marginBottom: 8 }}>STEP 1 — SEND A TEST FIRST (REQUIRED)</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...inp, flex: 1 }} value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com" />
                <button style={{ ...btnGhost, whiteSpace: "nowrap" }} onClick={doTest} disabled={testBusy}>{testBusy ? "Sending…" : "Send test"}</button>
              </div>
              {testedEmail && <div style={{ fontSize: 12, color: "#4ADE80", marginTop: 8 }}>✓ Test delivered to {testedEmail}</div>}
            </div>

            <button
              style={{ ...btnPrimary, width: "100%", padding: "13px", opacity: testedEmail && emSubject.trim() && emBody.trim() && !sendBusy ? 1 : .45, cursor: testedEmail ? "pointer" : "not-allowed" }}
              disabled={!testedEmail || !emSubject.trim() || !emBody.trim() || sendBusy}
              onClick={doSend}>
              {sendBusy ? "Starting…" : "🚀 STEP 2 — Send to audience"}
            </button>
            {emMsg && <div style={{ fontSize: 12, color: emMsg.kind === "ok" ? "#4ADE80" : "#FCA5A5", marginTop: 10 }}>{emMsg.kind === "ok" ? "✓ " : "⚠ "}{emMsg.text}</div>}
          </div>

          {/* History */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", marginBottom: 14 }}>Sent Campaigns</div>
            {emails.length === 0 && <div style={{ fontSize: 13, color: "#475569" }}>No email campaigns yet.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {emails.map(ec => {
                const aud = ec.audience ?? {};
                const audLabel = `${STAGE_LABELS[(aud.stage as AudienceStage) ?? "all"] ?? aud.stage}${aud.city ? ` · ${aud.city}` : ""}`;
                return (
                  <div key={ec.id} style={{ background: "#060B18", border: "1px solid #1E293B", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{ec.subject}</div>
                      <StatusChip status={ec.status} />
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", margin: "6px 0" }}>{audLabel} · {dt(ec.createdAt)}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>
                      {ec.status === "sending"
                        ? <>Sending… <b style={{ color: "#FBBF24" }}>{ec.sentCount + ec.failedCount}</b> / {ec.totalRecipients}</>
                        : <>Delivered <b style={{ color: "#4ADE80" }}>{ec.sentCount}</b>{ec.failedCount > 0 && <> · Failed <b style={{ color: "#FCA5A5" }}>{ec.failedCount}</b></>} / {ec.totalRecipients}</>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SMS / WHATSAPP ═══ */}
      {tab === "messaging" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(380px, 1.15fr) minmax(320px, 1fr)", gap: 16, alignItems: "start" }}>
          {/* Composer */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", marginBottom: 14 }}>New SMS / WhatsApp Campaign</div>

            {!bulkEnabled && (
              <div style={{ background: "#1E3A8A22", border: "1px solid #3B82F655", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "#93C5FD" }}>
                🧪 <b>Dry-run mode</b> — this environment is not set to send. Sends are recorded with a would-send count but no SMS/WhatsApp is delivered. Set <code>BULK_MESSAGING_ENABLED=1</code> (or run in production) to send for real.
              </div>
            )}

            <Field label="Channel">
              <div style={{ display: "flex", gap: 8 }}>
                {(["sms", "whatsapp"] as BulkChannel[]).map(ch => (
                  <button key={ch} onClick={() => { setSmChannel(ch); setSmMsg(null); }}
                    style={{ flex: 1, ...(smChannel === ch ? btnPrimary : btnGhost), padding: "9px 0" }}>
                    {ch === "sms" ? "📱 SMS (MSG91 Flow)" : "💬 WhatsApp (Interakt)"}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Campaign name (internal)"><input style={inp} value={smName} onChange={e => setSmName(e.target.value)} placeholder="e.g. Phase 2 dates — Delhi" /></Field>

            {smChannel === "sms" ? (
              <>
                <Field label="MSG91 Flow Template ID * (DLT-approved marketing flow)">
                  <input style={{ ...inp, fontFamily: "monospace" }} value={smFlowId} onChange={e => setSmFlowId(e.target.value)} placeholder="e.g. 66a1f0e2d6fc0512ab3c4567" />
                </Field>
                <div style={{ fontSize: 11.5, color: "#64748B", margin: "-6px 0 14px" }}>
                  Bulk SMS is sent only through an approved MSG91 marketing Flow template — no raw-text sends. Template variables map to var1, var2… below.
                </div>
              </>
            ) : (
              <Field label="WhatsApp template *">
                <select style={sel} value={smTemplate} onChange={e => setSmTemplate(e.target.value)}>
                  <option value="">— pick a template —</option>
                  {waTemplates.map(t => <option key={t.id} value={t.name}>{t.name}{t.status !== "approved" ? ` (${t.status})` : ""}</option>)}
                </select>
              </Field>
            )}

            <Field label="Template variables (optional — separate with |, maps to var1, var2…)">
              <input style={inp} value={smVars} onChange={e => setSmVars(e.target.value)} placeholder="e.g. Delhi | 15 Aug" />
            </Field>

            <Field label="Message preview / reference (not sent — the approved template text is delivered)">
              <textarea style={{ ...inp, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} value={smBody} onChange={e => setSmBody(e.target.value)} placeholder="For your own reference — the DLT/Interakt-approved template body is what actually goes out." />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Audience">
                <select style={sel} value={smStage} onChange={e => setSmStage(e.target.value as AudienceStage)}>
                  {(Object.keys(STAGE_LABELS) as AudienceStage[]).map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </Field>
              <Field label="Trial City">
                <select style={sel} value={smCity} onChange={e => setSmCity(e.target.value)}>
                  <option value="">All cities</option>
                  {(funnel?.cities ?? []).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </Field>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
              <button style={btnGhost} onClick={doSmPreview} disabled={smPreviewBusy}>{smPreviewBusy ? "Counting…" : "👥 Preview audience"}</button>
              {smPreview && (
                <div style={{ fontSize: 12, color: "#94A3B8" }}>
                  <b style={{ color: "#F1F5F9" }}>{smPreview.total}</b> recipient(s) with a phone
                  {smPreview.sample.length > 0 && <span style={{ color: "#475569" }}> — e.g. {smPreview.sample.map(s => s.name).slice(0, 3).join(", ")}</span>}
                </div>
              )}
            </div>

            <button
              style={{ ...btnPrimary, width: "100%", padding: "13px", opacity: smName.trim() && !smSendBusy ? 1 : .45, cursor: smName.trim() ? "pointer" : "not-allowed" }}
              disabled={!smName.trim() || smSendBusy}
              onClick={doSmSend}>
              {smSendBusy ? "Starting…" : bulkEnabled ? "🚀 Send to audience" : "🧪 Record dry-run"}
            </button>
            {smMsg && <div style={{ fontSize: 12, color: smMsg.kind === "ok" ? "#4ADE80" : "#FCA5A5", marginTop: 10 }}>{smMsg.kind === "ok" ? "✓ " : "⚠ "}{smMsg.text}</div>}
          </div>

          {/* History */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", marginBottom: 14 }}>Sent Campaigns</div>
            {msgs.length === 0 && <div style={{ fontSize: 13, color: "#475569" }}>No SMS / WhatsApp campaigns yet.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {msgs.map(mc => {
                const aud = mc.audience ?? {};
                const audLabel = `${STAGE_LABELS[(aud.stage as AudienceStage) ?? "all"] ?? aud.stage}${aud.city ? ` · ${aud.city}` : ""}`;
                return (
                  <div key={mc.id} style={{ background: "#060B18", border: "1px solid #1E293B", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>
                        {mc.channel === "sms" ? "📱" : "💬"} {mc.name}
                      </div>
                      <StatusChip status={mc.status} />
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", margin: "6px 0" }}>{audLabel} · {dt(mc.createdAt)}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>
                      {mc.status === "dry_run"
                        ? <>Dry-run — <b style={{ color: "#93C5FD" }}>{mc.totalRecipients}</b> would-send (nothing sent)</>
                        : mc.status === "sending"
                        ? <>Sending… <b style={{ color: "#FBBF24" }}>{mc.sentCount + mc.failedCount + mc.skippedCount}</b> / {mc.totalRecipients}</>
                        : <>Delivered <b style={{ color: "#4ADE80" }}>{mc.sentCount}</b>{mc.failedCount > 0 && <> · Failed <b style={{ color: "#FCA5A5" }}>{mc.failedCount}</b></>}{mc.skippedCount > 0 && <> · Skipped <b style={{ color: "#94A3B8" }}>{mc.skippedCount}</b></>} / {mc.totalRecipients}</>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Referral modal ═══ */}
      {refModal && (
        <Modal onClose={() => setRefModal(null)}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", marginBottom: 18 }}>{refModal.id ? "Edit Referral Link" : "New Referral Link"}</div>
          <Field label="Name *"><input style={inp} value={refModal.form.name} onChange={e => setRefModal({ ...refModal, form: { ...refModal.form, name: e.target.value } })} placeholder="e.g. Rohit Cricket Vlogs" /></Field>
          {!refModal.id ? (
            <Field label="Code (optional — auto-generated from name)">
              <input style={{ ...inp, fontFamily: "monospace", textTransform: "uppercase" }} value={refModal.form.code} onChange={e => setRefModal({ ...refModal, form: { ...refModal.form, code: e.target.value.toUpperCase() } })} placeholder="ROHIT" />
            </Field>
          ) : (
            <Field label="Code (locked — link may already be shared)">
              <input style={{ ...inp, fontFamily: "monospace", opacity: .5 }} value={refModal.form.code} disabled />
            </Field>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Platform">
              <select style={sel} value={refModal.form.platform} onChange={e => setRefModal({ ...refModal, form: { ...refModal.form, platform: e.target.value } })}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="City"><input style={inp} value={refModal.form.city} onChange={e => setRefModal({ ...refModal, form: { ...refModal.form, city: e.target.value } })} /></Field>
            <Field label="Phone"><input style={inp} value={refModal.form.phone} onChange={e => setRefModal({ ...refModal, form: { ...refModal.form, phone: e.target.value } })} /></Field>
            <Field label="Email"><input style={inp} value={refModal.form.email} onChange={e => setRefModal({ ...refModal, form: { ...refModal.form, email: e.target.value } })} /></Field>
          </div>
          <Field label="Commission % (of attributed revenue)"><input style={inp} type="number" min={0} max={100} value={refModal.form.commissionRate} onChange={e => setRefModal({ ...refModal, form: { ...refModal.form, commissionRate: e.target.value } })} /></Field>
          {refErr && <div style={{ fontSize: 12, color: "#FCA5A5", marginBottom: 10 }}>⚠ {refErr}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 6 }}>
            <div>{refModal.id && <button style={{ ...btnGhost, color: "#FCA5A5" }} onClick={() => removeReferral(refModal.id!)}>Delete</button>}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btnGhost} onClick={() => setRefModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={saveReferral} disabled={refBusy}>{refBusy ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══ Campaign modal ═══ */}
      {campModal && (
        <Modal onClose={() => setCampModal(null)}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", marginBottom: 18 }}>{campModal.id ? "Edit Campaign" : "New Campaign"}</div>
          <Field label="Name *"><input style={inp} value={campModal.form.name} onChange={e => setCampModal({ ...campModal, form: { ...campModal.form, name: e.target.value } })} placeholder="e.g. Delhi trials — Instagram ads" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Channel">
              <select style={sel} value={campModal.form.channel} onChange={e => setCampModal({ ...campModal, form: { ...campModal.form, channel: e.target.value } })}>
                {CHANNELS.map(ch => <option key={ch}>{ch}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={sel} value={campModal.form.status} onChange={e => setCampModal({ ...campModal, form: { ...campModal.form, status: e.target.value } })}>
                <option value="active">active</option><option value="paused">paused</option><option value="completed">completed</option>
              </select>
            </Field>
            <Field label="Budget (₹)"><input style={inp} type="number" min={0} value={campModal.form.budget} onChange={e => setCampModal({ ...campModal, form: { ...campModal.form, budget: e.target.value } })} /></Field>
            <Field label="Spent (₹)"><input style={inp} type="number" min={0} value={campModal.form.spent} onChange={e => setCampModal({ ...campModal, form: { ...campModal.form, spent: e.target.value } })} /></Field>
            <Field label="Start Date"><input style={inp} type="date" value={campModal.form.startDate} onChange={e => setCampModal({ ...campModal, form: { ...campModal.form, startDate: e.target.value } })} /></Field>
            <Field label="End Date"><input style={inp} type="date" value={campModal.form.endDate} onChange={e => setCampModal({ ...campModal, form: { ...campModal.form, endDate: e.target.value } })} /></Field>
          </div>
          <Field label="Goal"><input style={inp} value={campModal.form.goal} onChange={e => setCampModal({ ...campModal, form: { ...campModal.form, goal: e.target.value } })} placeholder="e.g. 200 registrations" /></Field>
          <Field label="Notes"><textarea style={{ ...inp, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} value={campModal.form.notes} onChange={e => setCampModal({ ...campModal, form: { ...campModal.form, notes: e.target.value } })} /></Field>
          {campErr && <div style={{ fontSize: 12, color: "#FCA5A5", marginBottom: 10 }}>⚠ {campErr}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button style={btnGhost} onClick={() => setCampModal(null)}>Cancel</button>
            <button style={btnPrimary} onClick={saveCampaign} disabled={campBusy}>{campBusy ? "Saving…" : "Save"}</button>
          </div>
        </Modal>
      )}
      {tab === "funnel" && <AbandonedSection />}
    </div>
  );
}
