/**
 * Gate security — scan pass → full-screen GREEN / YELLOW / RED verdict.
 * Status-only by design: gate staff see trial number + slot info, never
 * personal details (spec §4).
 */
import { useState } from "react";
import { QrScanner } from "./QrScanner";
import { gateScan, type GateResult } from "./staffApi";

/** BCPL-TRIAL:<64hex> QR → token; anything BCPL-XXX-n style → reg number. */
export function classifyScan(text: string): { token?: string; regNumber?: string } {
  const t = text.trim();
  if (/^BCPL-TRIAL:/i.test(t) || /^[0-9a-f]{64}$/i.test(t)) return { token: t };
  return { regNumber: t.toUpperCase() };
}

export function GateScan() {
  const [result, setResult] = useState<GateResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  const run = async (payload: { token?: string; regNumber?: string }) => {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      setResult(await gateScan(payload));
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stf-screen">
      <QrScanner paused={busy || result !== null} onScan={(t) => void run(classifyScan(t))} />
      <div className="stf-card">
        <div className="stf-h2" style={{ marginBottom: 8 }}>Manual entry</div>
        <div className="stf-sub" style={{ marginBottom: 10 }}>QR not scanning? Type the player's registration number from the pass.</div>
        <form className="stf-manual" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) void run({ regNumber: manual.trim() }); }}>
          <input className="stf-input" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="BCPL-DEL-123" autoCapitalize="characters" autoCorrect="off" />
          <button type="submit" className="stf-btn stf-btn-primary" disabled={busy || !manual.trim()}>CHECK</button>
        </form>
        {err && <div className="stf-err" style={{ marginTop: 10 }}>{err}</div>}
      </div>
      <div className="stf-sub">
        GREEN = allow entry · YELLOW = holding area · RED = help desk. Never argue at the gate — RED always goes to the help desk (spec §5).
      </div>

      {result && (
        <div className={`stf-result ${result.status.toLowerCase()}`}>
          <div className="stf-result-icon">{result.status === "GREEN" ? "✅" : result.status === "YELLOW" ? "⏳" : "⛔"}</div>
          <div className="stf-result-label">{result.label}</div>
          <div className="stf-result-sub">{result.sub}</div>
          {result.trialNo && <div className="stf-result-trial">{result.trialNo}</div>}
          {(result.role || result.batch) && (
            <div className="stf-result-meta">
              {result.role ? result.role.replaceAll("_", " ").toUpperCase() : ""}
              {result.batch ? ` · ${result.batch}` : ""}
              {result.reportingTime ? ` · ${result.reportingTime}` : ""}
            </div>
          )}
          <button type="button" className="stf-btn stf-btn-primary" onClick={() => { setResult(null); setManual(""); }}>
            NEXT SCAN
          </button>
        </div>
      )}
    </div>
  );
}
