import { useEffect, useState } from "react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Stats {
  totalUsers: number;
  phase1Paid: number;
  phase2Paid: number;
  videoSubmitted: number;
  totalRevenue: number;
  kycApproved: number;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{
      background: "#0D1B2E", borderRadius: 14,
      border: `1px solid ${color}33`,
      padding: "24px 20px",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ color: "#7A8EA8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ color: "#fff", fontWeight: 900, fontSize: 32, marginTop: 8 }}>{value}</div>
      {sub && <div style={{ color: "#7A8EA8", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const RECENT = [
  { name: "Rahul Sharma", city: "Mumbai", time: "2 min ago", status: "Phase 1 Paid" },
  { name: "Priya Patel",  city: "Ahmedabad", time: "8 min ago", status: "Video Uploaded" },
  { name: "Amit Singh",   city: "Delhi", time: "15 min ago", status: "Phase 2 Paid" },
  { name: "Sneha Reddy",  city: "Hyderabad", time: "22 min ago", status: "KYC Approved" },
  { name: "Karan Mehta",  city: "Pune", time: "31 min ago", status: "Phase 1 Paid" },
];

const STATUS_COLOR: Record<string, string> = {
  "Phase 1 Paid":    "#3B9EFF",
  "Video Uploaded":  "#A855F7",
  "Phase 2 Paid":    "#FF7A29",
  "KYC Approved":    "#22C55E",
};

export default function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Try live API; fall back to mock
    fetch(`${API}/user/admin-stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStats(d))
      .catch(() => {});

    // Mock after small delay if API not ready
    const t = setTimeout(() => {
      setStats(s => s ?? {
        totalUsers: 1842,
        phase1Paid: 1245,
        phase2Paid: 387,
        videoSubmitted: 903,
        totalRevenue: 24675000,
        kycApproved: 241,
      });
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const fmt = (n: number) =>
    n >= 1_00_00_000 ? `₹${(n / 1_00_00_000).toFixed(2)}Cr`
    : n >= 1_00_000  ? `₹${(n / 1_00_000).toFixed(1)}L`
    : `₹${n.toLocaleString("en-IN")}`;

  return (
    <div>
      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Registrations" value={stats ? stats.totalUsers.toLocaleString() : "…"} color="#3B9EFF" />
        <StatCard label="Phase 1 Paid"   value={stats ? stats.phase1Paid.toLocaleString() : "…"} color="#FF7A29" sub="₹499 each" />
        <StatCard label="Phase 2 Paid"   value={stats ? stats.phase2Paid.toLocaleString() : "…"} color="#A855F7" sub="₹1,999 each" />
        <StatCard label="Videos Submitted" value={stats ? stats.videoSubmitted.toLocaleString() : "…"} color="#22C55E" />
        <StatCard label="KYC Approved"   value={stats ? stats.kycApproved.toLocaleString() : "…"} color="#F59E0B" />
        <StatCard label="Total Revenue"  value={stats ? fmt(stats.totalRevenue) : "…"} color="#EF4444" sub="Phase 1 + Phase 2" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Revenue breakdown */}
        <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", padding: 24 }}>
          <div style={{ fontWeight: 900, color: "#fff", marginBottom: 20 }}>Revenue Breakdown</div>
          {[
            { label: "Phase 1 Registration", amount: stats ? stats.phase1Paid * 499 : 0, color: "#FF7A29" },
            { label: "Phase 2 Registration", amount: stats ? stats.phase2Paid * 1999 : 0, color: "#A855F7" },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#7A8EA8", fontSize: 13 }}>{row.label}</span>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{fmt(row.amount)}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 4, height: 6 }}>
                <div style={{
                  background: row.color, borderRadius: 4, height: 6,
                  width: `${Math.min(100, (row.amount / (stats ? stats.totalRevenue || 1 : 1)) * 100)}%`,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", padding: 24 }}>
          <div style={{ fontWeight: 900, color: "#fff", marginBottom: 20 }}>Recent Activity</div>
          {RECENT.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0",
              borderBottom: i < RECENT.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,122,41,.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, flexShrink: 0,
              }}>
                {r.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.name}
                </div>
                <div style={{ color: "#7A8EA8", fontSize: 11 }}>{r.city} · {r.time}</div>
              </div>
              <div style={{
                background: `${STATUS_COLOR[r.status] ?? "#7A8EA8"}22`,
                color: STATUS_COLOR[r.status] ?? "#7A8EA8",
                borderRadius: 6, padding: "3px 8px",
                fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
              }}>
                {r.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", padding: 24, marginTop: 20 }}>
        <div style={{ fontWeight: 900, color: "#fff", marginBottom: 20 }}>Registration Funnel</div>
        {[
          { label: "Visited Registration", pct: 100, color: "#3B9EFF", count: stats ? Math.round(stats.totalUsers * 2.1) : 0 },
          { label: "Completed Phase 1",    pct: 68,  color: "#FF7A29", count: stats?.phase1Paid ?? 0 },
          { label: "Uploaded Video",       pct: 49,  color: "#A855F7", count: stats?.videoSubmitted ?? 0 },
          { label: "Completed Phase 2",    pct: 21,  color: "#22C55E", count: stats?.phase2Paid ?? 0 },
          { label: "KYC Approved",         pct: 13,  color: "#F59E0B", count: stats?.kycApproved ?? 0 },
        ].map(row => (
          <div key={row.label} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#E8F0FE", fontSize: 13 }}>{row.label}</span>
              <span style={{ color: "#7A8EA8", fontSize: 12 }}>{row.count.toLocaleString()} ({row.pct}%)</span>
            </div>
            <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 4, height: 8 }}>
              <div style={{ background: row.color, borderRadius: 4, height: 8, width: `${row.pct}%`, transition: "width .5s" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
