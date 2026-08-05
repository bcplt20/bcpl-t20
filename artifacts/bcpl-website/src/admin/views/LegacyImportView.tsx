import { useEffect, useRef, useState } from "react";
import { adminReq, adminUpload } from "../../lib/adminHttp";

/* Legacy data import — CSV exports from the old WordPress site (bcpl-t20.com).
 * Rows land in the separate legacy_registrations table, fully isolated from
 * live users/registrations. Re-uploading the same file is safe (duplicates
 * are skipped on source + Registration ID). */

type Stats = {
  bySource: { source: string; count: number; amountPaise: number }[];
  alreadyOnNewSite: number;
};
type ImportResult = { ok: boolean; source: string; totalRows: number; inserted: number; skippedDup: number; badRows: number };

const card: React.CSSProperties = { background: "#243050", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 22 };
const h3: React.CSSProperties = { margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#fff" };
const small: React.CSSProperties = { fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 };

function fmtInr(paise: number) {
  return "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function LegacyImportView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = { paid: useRef<HTMLInputElement>(null), unpaid: useRef<HTMLInputElement>(null) };

  async function loadStats() {
    try { setStats(await adminReq<Stats>("GET", "/admin-tools/legacy-stats")); }
    catch (e) { setError(String((e as Error)?.message ?? e)); }
  }
  useEffect(() => { void loadStats(); }, []);

  async function handleUpload(source: "paid" | "unpaid", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(source); setError(null); setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await adminUpload<ImportResult>(`/admin-tools/legacy-import?source=${source}`, form);
      setResult(r);
      await loadStats();
    } catch (err) {
      setError(String((err as Error)?.message ?? err));
    } finally {
      setBusy(null);
    }
  }

  const srcMeta: Record<"paid" | "unpaid", { title: string; desc: string; color: string }> = {
    paid:   { title: "PAID registrations (old site)",   desc: "Players who paid on the old WordPress site. ~3 MB CSV.",  color: "#31C56B" },
    unpaid: { title: "UNPAID registrations (old site)", desc: "Signed up on the old site but never paid. ~30 MB CSV.",   color: "#F59E0B" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff" }}>Legacy Data Import</h2>
        <p style={small}>
          Old-site (bcpl-t20.com) registration CSVs. Data goes to a separate legacy table — the live
          Season registrations are never touched. Uploading the same file twice is safe: duplicates are skipped.
        </p>
      </div>

      {/* Current stats */}
      <div style={card}>
        <h3 style={h3}>What&apos;s imported so far</h3>
        {!stats ? <p style={small}>Loading…</p> : (
          <>
            {stats.bySource.length === 0 && <p style={small}>Nothing imported yet.</p>}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
              {stats.bySource.map(s => (
                <div key={s.source} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: srcMeta[s.source as "paid" | "unpaid"]?.color ?? "#fff" }}>{s.source.toUpperCase()}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{s.count.toLocaleString("en-IN")}</div>
                  {s.amountPaise > 0 && <div style={small}>{fmtInr(s.amountPaise)} collected (old site)</div>}
                </div>
              ))}
              {stats.bySource.length > 0 && (
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "#93C5FD" }}>ALREADY ON NEW SITE</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{stats.alreadyOnNewSite.toLocaleString("en-IN")}</div>
                  <div style={small}>same phone number registered on bcplt20.com</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload cards */}
      {(["paid", "unpaid"] as const).map(source => (
        <div key={source} style={card}>
          <h3 style={{ ...h3, color: srcMeta[source].color }}>{srcMeta[source].title}</h3>
          <p style={small}>{srcMeta[source].desc}</p>
          <input ref={fileRefs[source]} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => void handleUpload(source, e)} />
          <button
            onClick={() => fileRefs[source].current?.click()}
            disabled={busy !== null}
            style={{ marginTop: 8, background: busy === source ? "#555" : "linear-gradient(135deg,#FF7A29,#D95E10)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, fontSize: 13, cursor: busy ? "wait" : "pointer" }}
          >
            {busy === source ? "Uploading & importing… (big files can take a minute)" : `Upload ${source.toUpperCase()} CSV`}
          </button>
        </div>
      ))}

      {result && (
        <div style={{ ...card, border: "1px solid rgba(49,197,107,0.5)" }}>
          <h3 style={h3}>Import finished — {result.source.toUpperCase()}</h3>
          <p style={{ ...small, color: "rgba(255,255,255,0.85)" }}>
            Rows in file: <b>{result.totalRows.toLocaleString("en-IN")}</b> · Newly imported: <b style={{ color: "#31C56B" }}>{result.inserted.toLocaleString("en-IN")}</b> ·
            Already existed (skipped): <b>{result.skippedDup.toLocaleString("en-IN")}</b> · Unusable rows: <b>{result.badRows.toLocaleString("en-IN")}</b>
          </p>
        </div>
      )}
      {error && (
        <div style={{ ...card, border: "1px solid rgba(239,68,68,0.6)" }}>
          <h3 style={{ ...h3, color: "#FCA5A5" }}>Import failed</h3>
          <p style={small}>{error}</p>
        </div>
      )}
    </div>
  );
}
