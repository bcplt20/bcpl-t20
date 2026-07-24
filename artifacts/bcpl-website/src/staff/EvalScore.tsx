/**
 * Skill scoring — BLIND evaluator screen (spec §10): trial number + role +
 * attempts only. Never shows name, phone, city or Phase-1 score.
 *
 * STATION_OPERATOR records attempt outcomes only; TRIAL_EVALUATOR /
 * HEAD_ASSESSOR additionally score technique and submit the locked
 * 100-point assessment. The server re-computes everything — numbers shown
 * here are a live preview.
 */
import { useEffect, useMemo, useState } from "react";
import { QrScanner } from "./QrScanner";
import { classifyScan } from "./GateScan";
import {
  evalResolve, evalRubrics, recordAttempt, undoAttempt, submitEvaluation, requestCorrection,
  type PlayerCard, type RubricsPayload, type AttemptState,
} from "./staffApi";

/* §24 COACH NOTICE — exact wording from the owner's spec. Do not edit. */
const COACH_NOTICE =
  "All assessments are digitally audited. High-scoring results, unusual scoring patterns and selected assessments may be independently reviewed or reassessed. Score only the performance observed under the applicable BCPL rubric.";

const BATTING_BUTTONS = [
  { outcome: "MIDDLED", label: "MIDDLED", sub: "3 pts", cls: "hit" },
  { outcome: "GOOD_CONTACT", label: "GOOD CONTACT", sub: "2 pts", cls: "near" },
  { outcome: "PARTIAL", label: "PARTIAL", sub: "1 pt", cls: "near" },
  { outcome: "MISS", label: "MISS", sub: "0 pts", cls: "miss" },
];
const BOWLING_BUTTONS = [
  { outcome: "TARGET_HIT", label: "TARGET HIT", sub: "3 pts", cls: "hit" },
  { outcome: "NEAR_TARGET", label: "NEAR TARGET", sub: "1.5 pts", cls: "near" },
  { outcome: "MISS", label: "MISS", sub: "0 pts", cls: "miss" },
];

export function EvalScore({ role }: { role: string }) {
  const canSubmit = role !== "STATION_OPERATOR";
  const [noticeAck, setNoticeAck] = useState(false);
  const [rubrics, setRubrics] = useState<RubricsPayload | null>(null);
  const [card, setCard] = useState<PlayerCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [tech, setTech] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionSent, setCorrectionSent] = useState(false);

  useEffect(() => { evalRubrics().then(setRubrics).catch((e) => setErr((e as Error).message)); }, []);

  const rubric = card && rubrics ? rubrics.roles[card.role] : undefined;

  const reset = () => {
    setCard(null); setTech({}); setNotes(""); setManual("");
    setSubmitted(null); setErr(null); setCorrectionSent(false); setCorrectionReason("");
  };

  const resolve = async (payload: { token?: string; regNumber?: string }) => {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const c = await evalResolve(payload);
      setCard(c); setTech({}); setSubmitted(null); setCorrectionSent(false);
      if (navigator.vibrate) navigator.vibrate(80);
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const applyAttempts = (attempts: AttemptState) => setCard((c) => (c ? { ...c, attempts } : c));

  const addAttempt = async (discipline: string, outcome?: string, feederError?: boolean) => {
    if (!card || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await recordAttempt({ allocationId: card.allocationId, discipline, outcome, feederError });
      applyAttempts(r.attempts);
    } catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  };
  const undo = async (discipline: string) => {
    if (!card || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await undoAttempt({ allocationId: card.allocationId, discipline });
      applyAttempts(r.attempts);
    } catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  };

  const attemptsComplete = useMemo(() => {
    if (!card) return false;
    return card.requiredDisciplines.every((d) => card.attempts[d].valid.length === 6);
  }, [card]);

  const previewTotal = useMemo(() => {
    if (!card || !rubric || !rubrics) return null;
    let total = 0;
    for (const block of rubric.objective) {
      const map = rubrics.outcomes[block.discipline] ?? {};
      const maxPer = Math.max(...Object.values(map), 1);
      const sum = card.attempts[block.discipline].valid.slice(0, 6).reduce((a, v) => a + (map[v.outcome] ?? 0), 0);
      total += (Math.min(sum, 6 * maxPer) / (6 * maxPer)) * block.weight;
    }
    for (const dim of rubric.technical) total += ((tech[dim.key] ?? 5) / 10) * dim.weight;
    return Math.round(total * 100) / 100;
  }, [card, rubric, rubrics, tech]);

  const anchorFor = (v: number): string =>
    rubrics?.anchors.find((a) => v >= a.min && v <= a.max)?.label ?? "";

  const doSubmit = async () => {
    if (!card || !rubric || busy) return;
    setBusy(true); setErr(null);
    try {
      const technical: Record<string, number> = {};
      for (const dim of rubric.technical) technical[dim.key] = tech[dim.key] ?? 5;
      const r = await submitEvaluation({ allocationId: card.allocationId, technical, notes: notes.trim() || undefined });
      setSubmitted(r.evaluation.totalScore);
      setConfirming(false);
      if (navigator.vibrate) navigator.vibrate([80, 50, 120]);
    } catch (ex) {
      setConfirming(false);
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendCorrection = async () => {
    if (!card || busy || correctionReason.trim().length < 5) return;
    setBusy(true); setErr(null);
    try {
      await requestCorrection({ allocationId: card.allocationId, reason: correctionReason.trim() });
      setCorrecting(false); setCorrectionSent(true);
    } catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  };

  /* ── coach notice — shown before every scoring session (spec §24) ── */
  if (!noticeAck) {
    return (
      <div className="stf-modal" style={{ position: "relative", background: "transparent", minHeight: "70vh" }}>
        <div className="stf-modal-card">
          <div className="stf-modal-title">⚖️ Assessor Notice</div>
          <div className="stf-modal-body">{COACH_NOTICE}</div>
          <div className="stf-sub">Scoring is blind: you see the trial number and role only.</div>
          <button type="button" className="stf-btn stf-btn-primary" onClick={() => setNoticeAck(true)}>I UNDERSTAND — START</button>
        </div>
      </div>
    );
  }

  /* ── scan / search phase ── */
  if (!card) {
    return (
      <div className="stf-screen">
        <QrScanner paused={busy} onScan={(t) => void resolve(classifyScan(t))} />
        <div className="stf-card">
          <div className="stf-h2" style={{ marginBottom: 8 }}>Manual entry</div>
          <div className="stf-sub" style={{ marginBottom: 10 }}>Scan the wristband / pass QR, or type the trial number written on the wristband.</div>
          <form className="stf-manual" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) void resolve({ regNumber: manual.trim() }); }}>
            <input className="stf-input" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="BCPL-DEL-123" autoCapitalize="characters" autoCorrect="off" />
            <button type="submit" className="stf-btn stf-btn-primary" disabled={busy || !manual.trim()}>OPEN</button>
          </form>
          {err && <div className="stf-err" style={{ marginTop: 10 }}>{err}</div>}
        </div>
      </div>
    );
  }

  /* ── submitted success ── */
  if (submitted !== null) {
    return (
      <div className="stf-result green">
        <div className="stf-result-icon">🔒</div>
        <div className="stf-result-label">SCORE LOCKED</div>
        <div className="stf-result-trial">{submitted.toFixed(2)} / 100</div>
        <div className="stf-result-sub">{card.trialNo} · Assessment saved and locked. Changes now need supervisor approval.</div>
        <button type="button" className="stf-btn stf-btn-primary" onClick={reset}>NEXT PLAYER</button>
      </div>
    );
  }

  /* ── locked card ── */
  if (card.evaluation?.locked) {
    return (
      <div className="stf-screen">
        <div className="stf-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 44 }}>🔒</div>
          <div className="stf-h2" style={{ margin: "6px 0" }}>{card.trialNo}</div>
          <span className="stf-chip">{card.role.replaceAll("_", " ")}</span>
          <div className="stf-sub" style={{ marginTop: 12 }}>
            Assessment already submitted &amp; locked{card.evaluation.lockedAt ? ` (${new Date(card.evaluation.lockedAt).toLocaleTimeString()})` : ""}.
            Scores are final once submitted — only a supervisor-approved correction re-opens scoring.
          </div>
          {correctionSent || card.evaluation.correctionPending ? (
            <div className="stf-note" style={{ marginTop: 14 }}>Correction request pending with the supervisor.</div>
          ) : canSubmit ? (
            <button type="button" className="stf-btn stf-btn-ghost" style={{ marginTop: 14 }} onClick={() => setCorrecting(true)}>
              REQUEST CORRECTION
            </button>
          ) : null}
          {err && <div className="stf-err" style={{ marginTop: 10 }}>{err}</div>}
        </div>
        <button type="button" className="stf-btn stf-btn-primary" onClick={reset}>NEXT PLAYER</button>

        {correcting && (
          <div className="stf-modal">
            <div className="stf-modal-card">
              <div className="stf-modal-title">Request correction</div>
              <div className="stf-modal-body">Explain the genuine entry error. The supervisor will approve or reject; the original score stays on record.</div>
              <textarea className="stf-textarea" value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} placeholder="e.g. Entered 3 instead of 8 for Timing — finger slipped" />
              <button type="button" className="stf-btn stf-btn-primary" disabled={busy || correctionReason.trim().length < 5} onClick={() => void sendCorrection()}>SEND TO SUPERVISOR</button>
              <button type="button" className="stf-btn stf-btn-ghost" onClick={() => setCorrecting(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── scoring card ── */
  return (
    <div className="stf-screen">
      <div className="stf-card">
        <div className="stf-row" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{card.trialNo}</div>
            <span className="stf-chip" style={{ marginTop: 6 }}>{card.role.replaceAll("_", " ")}</span>
          </div>
          <button type="button" className="stf-btn stf-btn-ghost" style={{ width: "auto", height: 44, padding: "0 14px" }} onClick={reset}>✕</button>
        </div>
        {!card.checkedIn && <div className="stf-err" style={{ marginTop: 10 }}>Player is NOT checked in — send them to the check-in desk first.</div>}
      </div>

      {card.requiredDisciplines.map((disc) => {
        const st = card.attempts[disc];
        const complete = st.valid.length >= 6;
        return (
          <div key={disc} className="stf-card">
            <div className="stf-row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div className="stf-h2">{disc === "batting" ? "🏏 Batting" : "🎯 Bowling"} — {st.valid.length}/6</div>
              {st.valid.length > 0 && (
                <button type="button" className="stf-btn stf-btn-ghost" style={{ width: "auto", height: 40, padding: "0 12px", fontSize: 12 }} disabled={busy} onClick={() => void undo(disc)}>
                  ↩ UNDO
                </button>
              )}
            </div>
            <div className="stf-dots" style={{ marginBottom: 12 }}>
              {Array.from({ length: 6 }, (_, i) => {
                const a = st.valid[i];
                const map = rubrics?.outcomes[disc] ?? {};
                const pts = a ? map[a.outcome] ?? 0 : null;
                return (
                  <div key={i} className={`stf-dot ${a ? (pts && pts > 0 ? "done" : "zero") : ""}`}>
                    {a ? (pts ?? 0) : i + 1}
                  </div>
                );
              })}
            </div>
            {st.feederErrors > 0 && <div className="stf-sub" style={{ marginBottom: 10 }}>Feeder errors (re-bowled, not counted): {st.feederErrors}</div>}
            {!complete && (
              <div className="stf-outcomes">
                {(disc === "batting" ? BATTING_BUTTONS : BOWLING_BUTTONS).map((b) => (
                  <button type="button" key={b.outcome} className={`stf-outcome ${b.cls}`} disabled={busy} onClick={() => void addAttempt(disc, b.outcome)}>
                    {b.label}<small>{b.sub}</small>
                  </button>
                ))}
                {disc === "batting" && (
                  <button type="button" className="stf-outcome feeder" disabled={busy} onClick={() => void addAttempt(disc, undefined, true)}>
                    FEEDER ERROR<small>bad feed — ball doesn't count, re-bowl</small>
                  </button>
                )}
              </div>
            )}
            {complete && <div className="stf-sub" style={{ color: "#4ADE80", fontWeight: 800 }}>✓ All 6 valid attempts recorded — no extra deliveries.</div>}
          </div>
        );
      })}

      {canSubmit && attemptsComplete && rubric && (
        <>
          <div className="stf-card">
            <div className="stf-h2" style={{ marginBottom: 4 }}>Technique — anchored 0–10</div>
            <div className="stf-sub" style={{ marginBottom: 6 }}>Score ONLY what you observed under the BCPL rubric.</div>
            {rubric.technical.map((dim) => {
              const v = tech[dim.key] ?? 5;
              return (
                <div key={dim.key} className="stf-dim">
                  <div className="stf-dim-top">
                    <div className="stf-dim-name">{dim.label}</div>
                    <div className="stf-dim-w">weight {dim.weight}</div>
                  </div>
                  <div className="stf-step">
                    <button type="button" onClick={() => setTech((t) => ({ ...t, [dim.key]: Math.max(0, (t[dim.key] ?? 5) - 0.5) }))}>−</button>
                    <div className="stf-step-val">
                      <div className="stf-step-num">{v.toFixed(1)}</div>
                      <div className="stf-step-anchor">{anchorFor(v)}</div>
                    </div>
                    <button type="button" onClick={() => setTech((t) => ({ ...t, [dim.key]: Math.min(10, (t[dim.key] ?? 5) + 0.5) }))}>+</button>
                  </div>
                </div>
              );
            })}
            <textarea className="stf-textarea" style={{ marginTop: 12 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional, kept on record)" />
          </div>

          <div className="stf-total">
            <div className="stf-total-row">
              <span>Preview total (server re-computes)</span>
              <span className="stf-total-big">{previewTotal?.toFixed(2) ?? "–"} / 100</span>
            </div>
            {err && <div className="stf-err">{err}</div>}
            <button type="button" className="stf-btn stf-btn-primary" disabled={busy} onClick={() => setConfirming(true)}>
              SUBMIT FINAL SCORE 🔒
            </button>
          </div>
        </>
      )}
      {!canSubmit && attemptsComplete && (
        <div className="stf-note">All attempts recorded. The evaluator will now score technique and submit.</div>
      )}
      {err && !attemptsComplete && <div className="stf-err">{err}</div>}

      {confirming && (
        <div className="stf-modal">
          <div className="stf-modal-card">
            <div className="stf-modal-title">Lock this assessment?</div>
            <div className="stf-modal-body">
              {card.trialNo} · total <b>{previewTotal?.toFixed(2)}</b> / 100.<br />
              After submit the score is <b>permanently locked</b>. Changes need a supervisor-approved correction, and the original stays on record.
            </div>
            <button type="button" className="stf-btn stf-btn-primary" disabled={busy} onClick={() => void doSubmit()}>
              {busy ? "Submitting…" : "CONFIRM & LOCK"}
            </button>
            <button type="button" className="stf-btn stf-btn-ghost" onClick={() => setConfirming(false)}>Go back</button>
          </div>
        </div>
      )}
    </div>
  );
}
