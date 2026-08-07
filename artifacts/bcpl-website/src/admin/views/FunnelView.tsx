import { useEffect, useState } from "react";
import { adminGetConversionFunnel } from "../../lib/api";
import type { ConversionFunnel, FunnelStage } from "../../lib/api";

type Window = "all" | "d30" | "d7";

const WINDOWS: { id: Window; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "d30", label: "Last 30 days" },
  { id: "d7", label: "Last 7 days" },
];

/* Ordered funnel steps. `key` maps to the API funnel object. */
const STEPS: { key: keyof ConversionFunnel["funnel"]; label: string; color: string }[] = [
  { key: "draftsStarted",      label: "Draft",        color: "#8593B3" },
  { key: "usersTotal",         label: "Account",      color: "#6366F1" },
  { key: "registrationsTotal", label: "Registration", color: "#3B82F6" },
  { key: "phase1Paid",         label: "Paid",         color: "#F59E0B" },
  { key: "videoSubmitted",     label: "Video",        color: "#EAB308" },
  { key: "selected",           label: "Selected",     color: "#10B981" },
  { key: "phase2Paid",         label: "Phase 2 Paid", color: "#14B8A6" },
  { key: "kycDone",            label: "KYC",          color: "#A855F7" },
];

const pick = (s: FunnelStage | undefined, w: Window) => (s ? s[w] : 0);

export default function FunnelView() {
  const [win, setWin] = useState<Window>("all");
  const [data, setData] = useState<ConversionFunnel | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminGetConversionFunnel()
      .then((d) => { if (!cancelled) { setData(d); setErr(""); } })
      .catch((e) => { if (!cancelled) setErr(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const rows = STEPS.map((s) => ({ ...s, value: pick(data?.funnel[s.key], win) }));
  const maxVal = Math.max(1, ...rows.map((r) => r.value));

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg,#2C3A5E 0%,#1F2B49 100%)",
    border: "1px solid #33436B", borderRadius: 16, padding: 20,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Conversion Funnel</div>
          <div style={{ fontSize: 12, color: "#A6B3D0", marginTop: 2 }}>Draft to KYC — real counts per stage</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {WINDOWS.map((w) => (
            <button key={w.id} onClick={() => setWin(w.id)}
              style={{
                padding: "8px 16px", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 800,
                border: "1px solid " + (win === w.id ? "#FF6B00" : "#33436B"),
                background: win === w.id ? "#FF6B0022" : "transparent",
                color: win === w.id ? "#FF6B00" : "#A6B3D0",
              }}>{w.label}</button>
          ))}
        </div>
      </div>

      {err && (
        <div style={{ padding: "12px 16px", background: "#EF444415", border: "1px solid #EF444444", borderRadius: 12, color: "#EF4444", fontSize: 13 }}>
          Failed to load conversion funnel: {err}
        </div>
      )}

      {loading && !data && (
        <div style={{ ...card, textAlign: "center", color: "#8593B3", fontSize: 13 }}>Loading…</div>
      )}

      {data && (
        <div style={card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {rows.map((r, i) => {
              const prev = i > 0 ? rows[i - 1].value : null;
              const dropPct = prev && prev > 0 ? Math.round((1 - r.value / prev) * 100) : null;
              const barPct = Math.round((r.value / maxVal) * 100);
              return (
                <div key={r.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#C3CEE3" }}>{r.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9", letterSpacing: -0.5 }}>{r.value.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 14, borderRadius: 7, background: "#243050", overflow: "hidden", border: "1px solid #33436B" }}>
                    <div style={{ height: "100%", width: `${barPct}%`, minWidth: r.value > 0 ? 6 : 0, background: r.color, borderRadius: 7 }} />
                  </div>
                  {dropPct !== null && (
                    <div style={{ fontSize: 11, color: dropPct > 0 ? "#EF9A9A" : "#8593B3", marginTop: 4 }}>
                      {dropPct > 0
                        ? `${dropPct}% drop from ${rows[i - 1].label}`
                        : dropPct < 0
                          ? `${Math.abs(dropPct)}% higher than ${rows[i - 1].label}`
                          : `No change from ${rows[i - 1].label}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, padding: "12px 14px", background: "#243050", border: "1px solid #33436B", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#A6B3D0", lineHeight: 1.6 }}>
              Note: {data.carryoverCount.toLocaleString()} legacy carryover player{data.carryoverCount === 1 ? "" : "s"} are counted in Selected and Phase 2 Paid but never made a Phase 1 payment or uploaded a video. They are excluded from paid-conversion math, which explains part of the gap between the Paid and Selected steps. Steps that count distinct rows (Account, Paid, Video, Phase 2 Paid, KYC) may exceed a strict top-to-bottom sequence because a later stage can include players whose earlier row falls outside the selected window.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
