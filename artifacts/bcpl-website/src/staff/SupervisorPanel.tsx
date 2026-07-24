/**
 * Venue supervisor — today's counters + score-correction queue.
 * Approving a correction NEVER edits the original evaluation: the old
 * row is marked superseded (kept forever) and the evaluator re-scores.
 */
import { useCallback, useEffect, useState } from "react";
import { listCorrections, decideCorrection, supervisorToday, type CorrectionItem, type TodayCounters } from "./staffApi";

export function SupervisorPanel() {
  const [counters, setCounters] = useState<TodayCounters>({});
  const [items, setItems] = useState<CorrectionItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<{ id: string; approve: boolean } | null>(null);
  const [note, setNote] = useState("");

  const refresh = useCallback(async () => {
    setErr(null);
    try {
      const [t, c] = await Promise.all([supervisorToday(), listCorrections()]);
      setCounters(t.counters); setItems(c.corrections);
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const decide = async () => {
    if (!noteFor || busy) return;
    setBusy(noteFor.id);
    try {
      await decideCorrection(noteFor.id, noteFor.approve, note.trim() || undefined);
      setNoteFor(null); setNote("");
      await refresh();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="stf-screen">
      <div className="stf-counters">
        <div className="stf-counter"><b>{counters.checked_in_today ?? "–"}</b><span>CHECKED IN TODAY</span></div>
        <div className="stf-counter"><b>{counters.submitted_today ?? "–"}</b><span>SCORES SUBMITTED</span></div>
        <div className="stf-counter"><b>{counters.in_progress ?? "–"}</b><span>IN PROGRESS</span></div>
        <div className="stf-counter"><b>{counters.pending_corrections ?? "–"}</b><span>PENDING CORRECTIONS</span></div>
      </div>
      <button type="button" className="stf-btn stf-btn-ghost" onClick={() => void refresh()}>↻ REFRESH</button>
      {err && <div className="stf-err">{err}</div>}

      <div className="stf-h2">Correction requests</div>
      {items.length === 0 && <div className="stf-sub">No pending correction requests.</div>}
      {items.map((it) => (
        <div key={it.id} className="stf-list-item">
          <div className="stf-row" style={{ justifyContent: "space-between" }}>
            <b style={{ fontSize: 16 }}>{it.trialNo}</b>
            <span className="stf-chip">{it.evaluation.playerRole.replaceAll("_", " ")}</span>
          </div>
          <div className="stf-sub">
            Locked score <b style={{ color: "#FF7A29" }}>{it.evaluation.totalScore}</b> by {it.evaluation.evaluatorEmail}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>“{it.reason}”</div>
          <div className="stf-sub">Requested by {it.requestedBy} · {new Date(it.createdAt).toLocaleString()}</div>
          <div className="stf-row">
            <button type="button" className="stf-btn stf-btn-primary" style={{ height: 48 }} disabled={busy === it.id}
              onClick={() => { setNoteFor({ id: it.id, approve: true }); setNote(""); }}>
              APPROVE RE-SCORE
            </button>
            <button type="button" className="stf-btn stf-btn-ghost" style={{ height: 48 }} disabled={busy === it.id}
              onClick={() => { setNoteFor({ id: it.id, approve: false }); setNote(""); }}>
              REJECT
            </button>
          </div>
        </div>
      ))}

      {noteFor && (
        <div className="stf-modal">
          <div className="stf-modal-card">
            <div className="stf-modal-title">{noteFor.approve ? "Approve re-score?" : "Reject request?"}</div>
            <div className="stf-modal-body">
              {noteFor.approve
                ? "The locked score will be marked superseded (it stays in the record) and the evaluator can score this player again."
                : "The locked score stays final."}
            </div>
            <textarea className="stf-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
            <button type="button" className="stf-btn stf-btn-primary" disabled={busy !== null} onClick={() => void decide()}>
              {noteFor.approve ? "CONFIRM APPROVE" : "CONFIRM REJECT"}
            </button>
            <button type="button" className="stf-btn stf-btn-ghost" onClick={() => setNoteFor(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
