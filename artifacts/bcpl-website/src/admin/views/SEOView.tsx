import { useState, useEffect, useCallback } from "react";
import {
  fetchSeoMeta, saveSeoPage, resetSeoPage, saveGscCode, fetchGscAnalytics,
  type SeoMeta, type SeoPage, type GscAnalytics,
} from "../../lib/seoApi";

/**
 * SEO — honest tools only.
 *  • Meta Tags: per-page title/description/OG image, saved to the server and
 *    injected into the HTML that bcplt20.com serves (view-source verifiable).
 *  • Sitemap & Robots: the real, live sitemap.xml / robots.txt.
 *  • Google Verification: paste the Search Console tag; it goes live in the
 *    site's HTML so the owner can click "Verify" in GSC.
 */

const card: React.CSSProperties = {
  background: "#0D1526",
  border: "1px solid #1E293B",
  borderRadius: 14,
  padding: "18px 20px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid #1E293B",
  background: "#060B18",
  color: "#F1F5F9",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const orangeBtn: React.CSSProperties = {
  padding: "9px 18px",
  borderRadius: 9,
  border: "none",
  background: "linear-gradient(135deg,#FF6B00,#FF8C40)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 9,
  border: "1px solid #1E293B",
  background: "transparent",
  color: "#94A3B8",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

type Tab = "meta" | "sitemap" | "google";

export default function SEOView() {
  const [data, setData] = useState<SeoMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("meta");

  const [selPath, setSelPath] = useState("/");
  const [form, setForm] = useState({ title: "", description: "", ogImage: "" });
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const [gscInput, setGscInput] = useState("");
  const [gscBusy, setGscBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [gsc, setGsc] = useState<GscAnalytics | null>(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscError, setGscError] = useState<string | null>(null);

  const loadGsc = useCallback(async (refresh = false) => {
    setGscLoading(true);
    setGscError(null);
    try {
      setGsc(await fetchGscAnalytics(refresh));
    } catch (e) {
      setGscError(e instanceof Error ? e.message : "Failed to load Search Console data");
    } finally {
      setGscLoading(false);
    }
  }, []);

  const syncForm = useCallback((page: SeoPage, meta: SeoMeta) => {
    setForm({
      title: page.title,
      description: page.description,
      ogImage: page.ogImage === meta.defaultOgImage ? "" : page.ogImage,
    });
  }, []);

  const load = useCallback(async (keepPath?: string) => {
    try {
      const meta = await fetchSeoMeta();
      setData(meta);
      setError(null);
      const want = keepPath ?? selPath;
      const page = meta.pages.find((p) => p.path === want) ?? meta.pages[0];
      if (page) { setSelPath(page.path); syncForm(page, meta); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load SEO settings");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selPath, syncForm]);

  useEffect(() => { void load("/"); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  // Lazy-load Search Console numbers the first time the Google tab is opened.
  useEffect(() => {
    if (tab === "google" && gsc === null && !gscLoading) void loadGsc(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const sel = data?.pages.find((p) => p.path === selPath) ?? null;
  const customized = data?.pages.filter((p) => !p.isDefault).length ?? 0;
  const sitemapUrls = (data?.pages.length ?? 0) + (data?.teamSlugs.length ?? 0);
  const origin = data?.siteOrigin ?? "https://bcplt20.com";

  function pick(page: SeoPage) {
    if (!data) return;
    setSelPath(page.path);
    syncForm(page, data);
    setFlash(null);
  }

  async function handleSave() {
    if (!sel) return;
    setSaving(true);
    setError(null);
    try {
      await saveSeoPage({
        path: sel.path,
        title: form.title.trim(),
        description: form.description.trim(),
        ogImage: form.ogImage.trim(),
      });
      await load(sel.path);
      setFlash("Saved — live on the site within a minute");
      setTimeout(() => setFlash(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!sel || sel.isDefault) return;
    if (!window.confirm(`Reset "${sel.label}" back to the default title & description?`)) return;
    setSaving(true);
    setError(null);
    try {
      await resetSeoPage(sel.path);
      await load(sel.path);
      setFlash("Reset to default");
      setTimeout(() => setFlash(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleGscSave(clear = false) {
    setGscBusy(true);
    setError(null);
    try {
      await saveGscCode(clear ? "" : gscInput.trim());
      setGscInput("");
      await load(selPath);
      setFlash(clear ? "Verification code removed" : "Verification tag is now served in the site HTML");
      setTimeout(() => setFlash(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save code");
    } finally {
      setGscBusy(false);
    }
  }

  function copy(text: string, key: string) {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  /* ── honest, computed checks for the selected page ── */
  const titleLen = form.title.trim().length;
  const descLen = form.description.trim().length;
  const checks = [
    { ok: titleLen >= 30 && titleLen <= 60, label: `Title length ${titleLen} (aim 30–60)` },
    { ok: descLen >= 120 && descLen <= 160, label: `Description length ${descLen} (aim 120–160)` },
    { ok: /bcpl/i.test(form.title), label: "Title mentions BCPL" },
    { ok: form.ogImage.trim() === "" || /^https:\/\//.test(form.ogImage.trim()), label: "Share image is empty (uses logo) or a full https:// link" },
  ];

  if (loading) {
    return <div style={{ padding: 40, color: "#64748B", fontSize: 13 }}>Loading SEO settings…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9" }}>SEO</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
            Everything here is live data — what you save is what bcplt20.com serves.
          </div>
        </div>
        <a href={`${origin}/sitemap.xml`} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: "none", display: "inline-block" }}>
          View live sitemap ↗
        </a>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "#EF444415", border: "1px solid #EF4444", borderRadius: 10, color: "#FCA5A5", fontSize: 12.5 }}>
          {error}
        </div>
      )}
      {flash && (
        <div style={{ padding: "10px 14px", background: "#10B98115", border: "1px solid #10B981", borderRadius: 10, color: "#6EE7B7", fontSize: 12.5 }}>
          ✓ {flash}
        </div>
      )}

      {/* overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Public pages", value: String(data?.pages.length ?? 0), color: "#FF6B00" },
          { label: "Custom meta set", value: `${customized} of ${data?.pages.length ?? 0}`, color: "#3B82F6" },
          { label: "URLs in sitemap", value: String(sitemapUrls), color: "#10B981" },
          { label: "Google verification", value: data?.gscCode ? "Tag live" : "Not set", color: data?.gscCode ? "#10B981" : "#F59E0B" },
        ].map((s) => (
          <div key={s.label} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {([["meta", "Meta Tags"], ["sitemap", "Sitemap & Robots"], ["google", "Google Verification"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "9px 18px", borderRadius: 9, border: "1px solid " + (tab === t ? "#FF6B00" : "#1E293B"),
            background: tab === t ? "#FF6B0015" : "transparent", color: tab === t ? "#FF6B00" : "#94A3B8",
            fontSize: 12.5, fontWeight: 700, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* ── META TAB ── */}
      {tab === "meta" && data && (
        <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 14, alignItems: "start" }}>
          <div style={{ ...card, padding: 10 }}>
            {data.pages.map((p) => (
              <button key={p.path} onClick={() => pick(p)} style={{
                width: "100%", padding: "9px 12px", borderRadius: 9, border: "none", textAlign: "left",
                background: selPath === p.path ? "#FF6B0015" : "transparent",
                borderLeft: `2px solid ${selPath === p.path ? "#FF6B00" : "transparent"}`,
                cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 12.5, color: selPath === p.path ? "#FF6B00" : "#94A3B8", fontWeight: selPath === p.path ? 700 : 500 }}>
                  {p.label}
                </span>
                {!p.isDefault && <span title="Customized" style={{ width: 7, height: 7, borderRadius: "50%", background: "#3B82F6", flexShrink: 0 }} />}
              </button>
            ))}
            <div style={{ marginTop: 10, padding: "10px 12px", background: "#060B18", borderRadius: 9, border: "1px solid #1E293B", fontSize: 10.5, color: "#475569", lineHeight: 1.6 }}>
              <span style={{ color: "#3B82F6" }}>●</span> = custom text saved. Others use the built-in default.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{sel?.label} — meta tags</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 3, fontFamily: "monospace" }}>{origin}{sel?.path === "/" ? "" : sel?.path}</div>
                </div>
                {sel && !sel.isDefault && (
                  <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "#3B82F622", color: "#60A5FA", fontWeight: 700 }}>CUSTOMIZED</span>
                )}
              </div>

              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>
                Page title <span style={{ color: titleLen > 60 ? "#EF4444" : "#475569", fontWeight: 500 }}>({titleLen}/60)</span>
              </label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} maxLength={120} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", margin: "14px 0 6px" }}>
                Description <span style={{ color: descLen > 160 ? "#EF4444" : "#475569", fontWeight: 500 }}>({descLen}/160)</span>
              </label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={320} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", margin: "14px 0 6px" }}>
                Share image URL <span style={{ color: "#475569", fontWeight: 500 }}>(optional — WhatsApp/Facebook preview; leave empty for the BCPL logo)</span>
              </label>
              <input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} style={inputStyle} placeholder={data.defaultOgImage} />

              <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
                <button onClick={() => void handleSave()} disabled={saving} style={{ ...orangeBtn, opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving…" : "Save & publish meta"}
                </button>
                {sel && !sel.isDefault && (
                  <button onClick={() => void handleReset()} disabled={saving} style={ghostBtn}>Reset to default</button>
                )}
                <span style={{ fontSize: 11, color: "#475569" }}>Served on the live site within ~1 minute (needs the site deployed once with this feature).</span>
              </div>
            </div>

            {/* real, computed checks */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>Quick checks</div>
              {checks.map((c) => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12, color: c.ok ? "#94A3B8" : "#FCD34D" }}>
                  <span>{c.ok ? "✅" : "⚠️"}</span> {c.label}
                </div>
              ))}
            </div>

            {/* Google preview (renders exactly what's in the form) */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>Google result preview</div>
              <div style={{ background: "#fff", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 12, color: "#202124" }}>{origin.replace("https://", "")}{sel?.path === "/" ? "" : sel?.path}</div>
                <div style={{ fontSize: 17, color: "#1a0dab", marginTop: 3, lineHeight: 1.3 }}>{form.title || "(no title)"}</div>
                <div style={{ fontSize: 13, color: "#4d5156", marginTop: 4, lineHeight: 1.5 }}>{form.description || "(no description)"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SITEMAP TAB ── */}
      {tab === "sitemap" && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>Live files</div>
            {[
              { key: "sm", label: "Sitemap", url: `${origin}/sitemap.xml`, note: "Auto-updates when team pages are added" },
              { key: "rb", label: "Robots", url: `${origin}/robots.txt`, note: "Allows everything except /admin, points crawlers to the sitemap" },
            ].map((f) => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", width: 70 }}>{f.label}</span>
                <code style={{ fontSize: 12, color: "#FF8C40", background: "#060B18", padding: "5px 10px", borderRadius: 7, border: "1px solid #1E293B" }}>{f.url}</code>
                <button onClick={() => copy(f.url, f.key)} style={{ ...ghostBtn, padding: "5px 12px" }}>{copied === f.key ? "Copied ✓" : "Copy"}</button>
                <a href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: "#3B82F6" }}>Open ↗</a>
                <span style={{ fontSize: 11, color: "#475569", flexBasis: "100%" }}>{f.note}</span>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>
              URLs in the sitemap ({sitemapUrls})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[...data.pages.map((p) => p.path), ...data.teamSlugs.map((s) => `/team/${s}`)].map((u) => (
                <div key={u} style={{ fontSize: 11.5, fontFamily: "monospace", color: "#94A3B8", padding: "6px 10px", background: "#060B18", borderRadius: 7, border: "1px solid #12203A" }}>
                  {u}
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>Submit the sitemap to Google (one time)</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#94A3B8", lineHeight: 2 }}>
              <li>Finish verification first (see the <b>Google Verification</b> tab).</li>
              <li>Open <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" style={{ color: "#3B82F6" }}>Google Search Console</a> → select bcplt20.com.</li>
              <li>Left menu → <b>Sitemaps</b> → enter <code style={{ color: "#FF8C40" }}>sitemap.xml</code> → Submit.</li>
              <li>Google will start crawling within a few days; status shows on the same page.</li>
            </ol>
          </div>
        </div>
      )}

      {/* ── GOOGLE VERIFICATION TAB ── */}
      {tab === "google" && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 900 }}>

          {/* ── Real Search Console traffic ── */}
          <GscPanel gsc={gsc} loading={gscLoading} error={gscError} onRefresh={() => void loadGsc(true)} />

          <div style={{ ...card, borderLeft: `3px solid ${data.gscCode ? "#10B981" : "#F59E0B"}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 8 }}>
              {data.gscCode ? "✅ Verification tag is being served" : "⏳ No verification code set yet"}
            </div>
            {data.gscCode ? (
              <>
                <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7, marginBottom: 10 }}>
                  This tag is injected into every page of the live site. Open the site → right-click → View Page Source to see it.
                </div>
                <code style={{ display: "block", fontSize: 11.5, color: "#6EE7B7", background: "#060B18", padding: "10px 12px", borderRadius: 8, border: "1px solid #1E293B", wordBreak: "break-all" }}>
                  {`<meta name="google-site-verification" content="${data.gscCode}" />`}
                </code>
                <button onClick={() => void handleGscSave(true)} disabled={gscBusy} style={{ ...ghostBtn, marginTop: 12, color: "#F87171", borderColor: "#7F1D1D" }}>
                  {gscBusy ? "Removing…" : "Remove code"}
                </button>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7 }}>
                Paste the meta tag (or just the code) from Google Search Console below. It will be served in the site's HTML so Google can verify you own bcplt20.com.
              </div>
            )}
          </div>

          <div style={card}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>
              Paste verification meta tag or code
            </label>
            <textarea
              value={gscInput}
              onChange={(e) => setGscInput(e.target.value)}
              rows={2}
              placeholder={'<meta name="google-site-verification" content="AbCdEf123…" />'}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
            />
            <button onClick={() => void handleGscSave()} disabled={gscBusy || !gscInput.trim()} style={{ ...orangeBtn, marginTop: 12, opacity: gscBusy || !gscInput.trim() ? 0.6 : 1 }}>
              {gscBusy ? "Saving…" : "Save & serve tag"}
            </button>
          </div>

          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>How to verify (one time)</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#94A3B8", lineHeight: 2 }}>
              <li>Open <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" style={{ color: "#3B82F6" }}>search.google.com/search-console</a> and sign in with the BCPL Google account.</li>
              <li>Add property → <b>URL prefix</b> → enter <code style={{ color: "#FF8C40" }}>https://bcplt20.com</code>.</li>
              <li>Choose the <b>HTML tag</b> method and copy the whole <code style={{ color: "#FF8C40" }}>&lt;meta …&gt;</code> line.</li>
              <li>Paste it above and click <b>Save & serve tag</b>.</li>
              <li>Deploy the site (the tag must be live on bcplt20.com).</li>
              <li>Back in Search Console, click <b>Verify</b>.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Google Search Console traffic panel ────────────────────────────────────
   Shows real clicks / impressions / CTR / average position (last 28 days,
   with the change vs the previous 28 days), plus the top search queries and
   top pages. When the service account isn't configured yet, it shows simple
   Hindi setup steps instead of an error. */

const num = (n: number) => n.toLocaleString("en-IN");
const pct = (n: number) => (n * 100).toFixed(1) + "%";
const pos = (n: number) => (n ? n.toFixed(1) : "—");
const signed = (n: number, fmt: (x: number) => string) => (n > 0 ? "+" : n < 0 ? "−" : "") + fmt(Math.abs(n));

function StatCard({ label, value, delta, deltaGood, hint }: {
  label: string; value: string; delta?: string; deltaGood?: boolean; hint?: string;
}) {
  const dc = deltaGood === undefined ? "#94A3B8" : deltaGood ? "#10B981" : "#F87171";
  return (
    <div style={{ background: "#060B18", border: "1px solid #1E293B", borderRadius: 12, padding: "14px 16px", flex: "1 1 150px", minWidth: 140 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B", letterSpacing: .5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9", marginTop: 6, lineHeight: 1 }}>{value}</div>
      {delta !== undefined && (
        <div style={{ fontSize: 11.5, color: dc, marginTop: 6 }}>{delta} <span style={{ color: "#475569" }}>{hint ?? "vs prev 28d"}</span></div>
      )}
    </div>
  );
}

function MiniTable({ title, colLabel, rows }: {
  title: string; colLabel: string;
  rows: Array<{ label: string; clicks: number; impressions: number; ctr: number; position: number }>;
}) {
  return (
    <div style={{ background: "#060B18", border: "1px solid #1E293B", borderRadius: 12, padding: 14, flex: "1 1 360px", minWidth: 300 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12, color: "#64748B", padding: "8px 0" }}>No data yet for this period.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#475569", fontSize: 10, letterSpacing: .3 }}>
              <th style={{ padding: "5px 6px", fontWeight: 700 }}>{colLabel}</th>
              <th style={{ padding: "5px 6px", fontWeight: 700, textAlign: "right" }}>Clicks</th>
              <th style={{ padding: "5px 6px", fontWeight: 700, textAlign: "right" }}>Impr.</th>
              <th style={{ padding: "5px 6px", fontWeight: 700, textAlign: "right" }}>CTR</th>
              <th style={{ padding: "5px 6px", fontWeight: 700, textAlign: "right" }}>Pos.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: "1px solid #1E293B", color: "#CBD5E1" }}>
                <td style={{ padding: "6px 6px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.label}>{r.label || "—"}</td>
                <td style={{ padding: "6px 6px", textAlign: "right", color: "#F1F5F9", fontWeight: 600 }}>{num(r.clicks)}</td>
                <td style={{ padding: "6px 6px", textAlign: "right" }}>{num(r.impressions)}</td>
                <td style={{ padding: "6px 6px", textAlign: "right" }}>{pct(r.ctr)}</td>
                <td style={{ padding: "6px 6px", textAlign: "right" }}>{pos(r.position)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function GscSetupPanel({ message }: { message: string }) {
  return (
    <div style={{ ...card, borderLeft: "3px solid #F59E0B" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>📊 Search Console data abhi set nahi hui</div>
      <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 10 }}>{message}</div>
      <div style={{ fontSize: 12.5, color: "#CBD5E1", fontWeight: 600, marginBottom: 6 }}>Setup (ek baar) — 3 steps:</div>
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#94A3B8", lineHeight: 1.9 }}>
        <li>Google Cloud Console me ek <b>Service Account</b> banao aur uski <b>JSON key</b> download karo.</li>
        <li>Wo poori JSON server ke <code style={{ color: "#FF8C40" }}>GSC_SERVICE_ACCOUNT_JSON</code> env variable me daalo (aur zaroorat ho to <code style={{ color: "#FF8C40" }}>GSC_SITE_URL</code> = <code style={{ color: "#FF8C40" }}>sc-domain:bcplt20.com</code>).</li>
        <li>Search Console → Settings → <b>Users and permissions</b> me service-account ki email ko <b>user</b> ke roop me add karo (Full ya Restricted).</li>
      </ol>
      <div style={{ fontSize: 11, color: "#475569", marginTop: 10 }}>Ye ho jaane ke baad yahan clicks, impressions aur queries apne-aap dikhne lagenge.</div>
    </div>
  );
}

function GscPanel({ gsc, loading, error, onRefresh }: {
  gsc: GscAnalytics | null; loading: boolean; error: string | null; onRefresh: () => void;
}) {
  if (loading && !gsc) {
    return <div style={{ ...card }}><div style={{ fontSize: 12.5, color: "#64748B" }}>Loading Search Console data…</div></div>;
  }
  if (error) {
    return <div style={{ ...card, borderLeft: "3px solid #F87171" }}><div style={{ fontSize: 12.5, color: "#F87171" }}>⚠ {error}</div></div>;
  }
  if (!gsc) return null;

  if (gsc.configured === false) return <GscSetupPanel message={gsc.message} />;
  if (!("current" in gsc)) {
    // configured but errored (403 / permission or transient) — show setup
    // guidance (esp. the "add service-account as user" step).
    return <GscSetupPanel message={gsc.message} />;
  }

  const g = gsc; // narrowed to the summary shape
  return (
    <div style={{ ...card }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Google Search traffic</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
            {g.range.startDate} → {g.range.endDate} · {g.siteUrl}
            {g.cached ? " · cached" : ""}
          </div>
        </div>
        <button onClick={onRefresh} disabled={loading} style={{ ...ghostBtn, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <StatCard label="Total clicks" value={num(g.current.clicks)}
          delta={signed(g.delta.clicks, num)} deltaGood={g.delta.clicks >= 0} />
        <StatCard label="Impressions" value={num(g.current.impressions)}
          delta={signed(g.delta.impressions, num)} deltaGood={g.delta.impressions >= 0} />
        <StatCard label="Average CTR" value={pct(g.current.ctr)}
          delta={signed(g.delta.ctr, pct)} deltaGood={g.delta.ctr >= 0} />
        <StatCard label="Avg. position" value={pos(g.current.position)}
          delta={signed(g.delta.position, pos)} deltaGood={g.delta.position >= 0} hint="vs prev 28d (lower is better)" />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <MiniTable title="Top search queries" colLabel="Query"
          rows={g.topQueries.map((q) => ({ label: q.query, clicks: q.clicks, impressions: q.impressions, ctr: q.ctr, position: q.position }))} />
        <MiniTable title="Top pages" colLabel="Page"
          rows={g.topPages.map((p) => ({ label: p.page, clicks: p.clicks, impressions: p.impressions, ctr: p.ctr, position: p.position }))} />
      </div>
    </div>
  );
}
