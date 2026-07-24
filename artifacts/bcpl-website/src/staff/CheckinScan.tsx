/**
 * Check-in desk — identity verification + wristband hand-off.
 * This is the ONLY field screen that shows the player's name (spec §7):
 * staff must match the face/ID to the registration before wristbanding.
 */
import { useState } from "react";
import { QrScanner } from "./QrScanner";
import { classifyScan } from "./GateScan";
import { staffCheckin, type CheckinResult } from "./staffApi";

export function CheckinScan() {
  const [done, setDone] = useState<CheckinResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  const run = async (payload: { token?: string; regNumber?: string }) => {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      setDone(await staffCheckin({ ...payload, device: navigator.userAgent.slice(0, 100) }));
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stf-screen">
      <QrScanner paused={busy || done !== null} onScan={(t) => void run(classifyScan(t))} />
      <div className="stf-card">
        <div className="stf-h2" style={{ marginBottom: 8 }}>Manual entry</div>
        <form className="stf-manual" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) void run({ regNumber: manual.trim() }); }}>
          <input className="stf-input" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="BCPL-DEL-123" autoCapitalize="characters" autoCorrect="off" />
          <button type="submit" className="stf-btn stf-btn-primary" disabled={busy || !manual.trim()}>FIND</button>
        </form>
        {err && <div className="stf-err" style={{ marginTop: 10 }}>{err}</div>}
      </div>
      <div className="stf-sub">
        Verify the player's face against their photo ID before confirming. After check-in: give the wristband and write the trial number on it.
      </div>

      {done && (
        <div className="stf-result green">
          <div className="stf-result-icon">🎫</div>
          <div className="stf-result-label">CHECKED IN</div>
          <div className="stf-result-sub">{done.player.name}</div>
          <div className="stf-result-trial">{done.player.regNumber}</div>
          <div className="stf-result-meta">
            {done.player.role.replaceAll("_", " ").toUpperCase()}
            {done.slot?.batch ? ` · ${done.slot.batch}` : ""}
          </div>
          <div className="stf-result-sub" style={{ marginTop: 10, fontWeight: 900 }}>
            ➜ Give wristband. Write <u>{done.wristband.trialNo}</u> on it.
          </div>
          <button type="button" className="stf-btn stf-btn-primary" onClick={() => { setDone(null); setManual(""); }}>
            NEXT PLAYER
          </button>
        </div>
      )}
    </div>
  );
}
