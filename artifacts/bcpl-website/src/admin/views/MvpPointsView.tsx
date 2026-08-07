import { useEffect, useState } from "react";
import {
  adminGetMvpPointsConfig, adminPutMvpPointsConfig,
  DEFAULT_MVP_POINTS_CONFIG, type MvpPointsConfig,
} from "../../lib/api";

/* ── styling (mirrors other admin views) ── */
const card: React.CSSProperties = { background: "linear-gradient(135deg,#2C3A5E,#1F2B49)", border: "1px solid #33436B", borderRadius: 16, padding: 20 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid #33436B", background: "#1F2B49", color: "#E2E8F0", fontSize: 14, fontWeight: 700, outline: "none", boxSizing: "border-box", fontVariantNumeric: "tabular-nums" };
const label: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, color: "#CBD5E1", marginBottom: 6 };
const sub: React.CSSProperties = { fontSize: 10.5, color: "#8593B3", marginTop: 3 };
const btn = (variant: "primary" | "ghost" = "primary"): React.CSSProperties => ({
  padding: "11px 18px", borderRadius: 10, border: variant === "ghost" ? "1px solid #33436B" : "none", fontSize: 13, fontWeight: 800, cursor: "pointer",
  background: variant === "primary" ? "linear-gradient(135deg,#FF6B00,#FF8C40)" : "transparent",
  color: variant === "ghost" ? "#A6B3D0" : "#fff",
});

/* Field metadata: keyed by config sub-object, with bilingual labels. */
type FieldDef = { key: string; en: string; hi: string };
type GroupDef = {
  section: keyof MvpPointsConfig;
  title: string;
  accent: string;   // header accent color
  icon: string;
  fields: FieldDef[];
};

const GROUPS: GroupDef[] = [
  {
    section: "batting", title: "Batting · बैटिंग", accent: "#FF6B00", icon: "🏏",
    fields: [
      { key: "run",          en: "Each run",            hi: "हर run" },
      { key: "fourBonus",    en: "Four bonus",          hi: "Four (चौका) bonus" },
      { key: "sixBonus",     en: "Six bonus",           hi: "Six (छक्का) bonus" },
      { key: "milestone30",  en: "30 runs bonus",       hi: "30 run bonus" },
      { key: "milestone50",  en: "Half-century (50)",   hi: "Fifty (50) bonus" },
      { key: "milestone100", en: "Century (100)",       hi: "Century (100) bonus" },
      { key: "duck",         en: "Duck (out on 0)",     hi: "Duck (0 पर out)" },
    ],
  },
  {
    section: "bowling", title: "Bowling · बॉलिंग", accent: "#6366F1", icon: "🎯",
    fields: [
      { key: "wicket",         en: "Each wicket",          hi: "हर wicket" },
      { key: "bowledLbwBonus", en: "Bowled / LBW bonus",   hi: "Bowled / LBW bonus" },
      { key: "haul3",          en: "3 wickets bonus",      hi: "3 wicket bonus" },
      { key: "haul4",          en: "4 wickets bonus",      hi: "4 wicket bonus" },
      { key: "haul5",          en: "5 wickets bonus",      hi: "5 wicket bonus" },
      { key: "maidenOver",     en: "Maiden over",          hi: "Maiden over" },
    ],
  },
  {
    section: "fielding", title: "Fielding · फील्डिंग", accent: "#10B981", icon: "🧤",
    fields: [
      { key: "catch",          en: "Catch",                hi: "Catch (कैच)" },
      { key: "threeCatchBonus",en: "3 catches bonus",      hi: "3 catch bonus" },
      { key: "stumping",       en: "Stumping",             hi: "Stumping" },
      { key: "directRunout",   en: "Run-out (direct)",     hi: "Run-out (direct)" },
      { key: "assistedRunout", en: "Run-out (assist)",     hi: "Run-out (assist)" },
    ],
  },
];

/* deep clone the config so edits don't mutate the fetched object */
const clone = (c: MvpPointsConfig): MvpPointsConfig => ({
  batting: { ...c.batting }, bowling: { ...c.bowling }, fielding: { ...c.fielding },
});

export default function MvpPointsView() {
  const [config, setConfig] = useState<MvpPointsConfig>(() => clone(DEFAULT_MVP_POINTS_CONFIG));
  const [raw, setRaw] = useState<Record<string, Record<string, string>>>({}); // per-field input text
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function hydrate(c: MvpPointsConfig) {
    setConfig(clone(c));
    const r: Record<string, Record<string, string>> = {};
    for (const g of GROUPS) {
      r[g.section] = {};
      for (const f of g.fields) {
        r[g.section][f.key] = String((c[g.section] as Record<string, number>)[f.key]);
      }
    }
    setRaw(r);
  }

  async function refresh() {
    setLoading(true); setErr("");
    try {
      const res = await adminGetMvpPointsConfig();
      // Merge stored over defaults so a missing/older key never breaks the form.
      const stored = res.value;
      const merged: MvpPointsConfig = {
        batting:  { ...DEFAULT_MVP_POINTS_CONFIG.batting,  ...(stored?.batting  ?? {}) },
        bowling:  { ...DEFAULT_MVP_POINTS_CONFIG.bowling,  ...(stored?.bowling  ?? {}) },
        fielding: { ...DEFAULT_MVP_POINTS_CONFIG.fielding, ...(stored?.fielding ?? {}) },
      };
      hydrate(merged);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load MVP points config");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  function setField(section: keyof MvpPointsConfig, key: string, text: string) {
    setRaw(r => ({ ...r, [section]: { ...r[section], [key]: text } }));
  }

  /* Build a numbers-only config from the raw text; returns null if any field is
     not a finite number (so we never send NaN to the zod-strict server). */
  function buildConfig(): MvpPointsConfig | null {
    const out = clone(config);
    for (const g of GROUPS) {
      for (const f of g.fields) {
        const txt = (raw[g.section]?.[f.key] ?? "").trim();
        const n = Number(txt);
        if (txt === "" || !Number.isFinite(n)) return null;
        (out[g.section] as Record<string, number>)[f.key] = n;
      }
    }
    return out;
  }

  async function save() {
    if (saving) return;
    const built = buildConfig();
    if (!built) {
      setToast({ kind: "err", text: "हर field में सिर्फ number होना चाहिए · Every field must be a number." });
      return;
    }
    setSaving(true);
    try {
      await adminPutMvpPointsConfig(built);
      setConfig(built);
      setToast({ kind: "ok", text: "Saved ✓ — Save के बाद 1 minute में lagoo (leaderboard cache)." });
    } catch (e) {
      setToast({ kind: "err", text: e instanceof Error ? e.message : "Save failed — try again." });
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    hydrate(DEFAULT_MVP_POINTS_CONFIG);
    setToast({ kind: "ok", text: "Default values भर दिए — Save दबाना ना भूलें." });
  }

  if (loading) {
    return <div style={{ padding: 40, color: "#8593B3", fontSize: 14 }}>Loading MVP points…</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4px 4px 40px" }}>
      {/* Header */}
      <div style={{ ...card, marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: .3 }}>MVP Points · Fantasy scoring</div>
          <div style={{ fontSize: 13, color: "#A6B3D0", marginTop: 6, lineHeight: 1.6, maxWidth: 640 }}>
            हर action का point value यहाँ से बदलें. Batting, Bowling, Fielding — सब आपके हाथ में.
            असली official scorecards से ये points अपने-आप निकलते हैं.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={resetToDefault} style={btn("ghost")} disabled={saving}>↺ Reset to default</button>
          <button onClick={save} style={btn("primary")} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>

      {err && (
        <div style={{ ...card, borderColor: "#7F1D1D", marginBottom: 18, color: "#FCA5A5", fontSize: 13 }}>⚠ {err}</div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          marginBottom: 18, padding: "12px 16px", borderRadius: 11, fontSize: 13, fontWeight: 700,
          background: toast.kind === "ok" ? "#052e1a" : "#3f1414",
          border: `1px solid ${toast.kind === "ok" ? "#16A34A66" : "#EF444466"}`,
          color: toast.kind === "ok" ? "#86EFAC" : "#FCA5A5",
        }}>{toast.text}</div>
      )}

      {/* Category cards */}
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {GROUPS.map(g => (
          <div key={g.section} style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{
              padding: "14px 18px", display: "flex", alignItems: "center", gap: 10,
              background: `linear-gradient(90deg, ${g.accent}22, transparent)`,
              borderBottom: `2px solid ${g.accent}55`,
            }}>
              <span style={{ fontSize: 20 }}>{g.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: .3 }}>{g.title}</span>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              {g.fields.map(f => (
                <div key={f.key}>
                  <label style={label}>{f.hi}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={raw[g.section]?.[f.key] ?? ""}
                      onChange={e => setField(g.section, f.key, e.target.value)}
                      style={{ ...inputStyle, borderColor: `${g.accent}66` }}
                    />
                    <span style={{
                      flexShrink: 0, minWidth: 34, textAlign: "center",
                      fontSize: 11, fontWeight: 800, color: g.accent,
                      background: `${g.accent}18`, border: `1px solid ${g.accent}44`,
                      borderRadius: 8, padding: "6px 4px",
                    }}>pts</span>
                  </div>
                  <div style={sub}>{f.en}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note (owner-facing) */}
      <div style={{ ...card, marginTop: 18, color: "#A6B3D0", fontSize: 12.5, lineHeight: 1.6 }}>
        ℹ️ Save के बाद leaderboard पर नए points <b style={{ color: "#fff" }}>1 minute में lagoo</b> होते हैं (cache 60 seconds).
        Duck जैसे minus points के लिए negative number भरें (जैसे −2).
      </div>
    </div>
  );
}
