import { useState, useEffect } from "react";
import { adminGetRegistrations, getTeams, getTeamDetail, adminAddTeamPlayer } from "../../lib/api";

type PoolPlayer = { regId: string; name: string; role: string; city: string; regNumber: string; base: number };
type TeamState  = { id: string; name: string; color: string; slug: string; budget: number; spent: number; squad: number };

const BUDGET = 3000000; // ₹30L per franchise per season
const BASE_PRICE = 50000;
const ROLE_LABEL: Record<string, string> = { bat: "Batsman", bowl: "Bowler", wk: "Wicket-keeper", ar: "All-rounder" };

const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

export default function AuctionView() {
  const [pool, setPool]           = useState<PoolPlayer[] | null>(null);
  const [teams, setTeams]         = useState<TeamState[]>([]);
  const [inPhase2, setInPhase2]   = useState(0);
  const [loadErr, setLoadErr]     = useState("");

  const [currentIdx, setCurrentIdx]   = useState(0);
  const [currentBid, setCurrentBid]   = useState(BASE_PRICE);
  const [bidHistory, setBidHistory]   = useState<{ team: string; amount: number }[]>([]);
  const [soldPlayers, setSoldPlayers] = useState<{ player: PoolPlayer; team: string; amount: number }[]>([]);
  const [unsold, setUnsold]           = useState<PoolPlayer[]>([]);
  const [timer, setTimer]             = useState(30);
  const [running, setRunning]         = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [saving, setSaving]           = useState(false);
  const [actionErr, setActionErr]     = useState("");
  const [banner, setBanner]           = useState("");

  const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };

  useEffect(() => {
    Promise.all([adminGetRegistrations(), getTeams(5)])
      .then(async ([regsRes, teamsRes]) => {
        const regs = (regsRes.registrations || []) as any[];
        const eligible = regs.filter(r => r.phase2Status === "kyc_done" || r.phase2Status === "selected");
        setInPhase2(regs.filter(r => r.phase2Status && r.phase2Status !== "rejected").length);
        const details = await Promise.all(teamsRes.teams.map(t => getTeamDetail(t.slug)));
        // Players already sold to a squad (tracked via stats.regId) must not re-enter the pool
        const taken = new Set(
          details.flatMap(d => d.players.map(p => (p.stats as any)?.regId).filter(Boolean))
        );
        setPool(eligible.filter(r => !taken.has(r.id)).map(r => ({
          regId: r.id,
          name: r.user?.name || "Unknown",
          role: ROLE_LABEL[r.role] || r.role,
          city: r.trialCity || "",
          regNumber: r.regNumber || "",
          base: BASE_PRICE,
        })));
        setTeams(teamsRes.teams.map((t, i) => ({
          id: t.id, name: t.name, color: t.color || "#FF6B00", slug: t.slug,
          budget: BUDGET,
          spent: details[i].players.reduce((a, p) => a + (Number(p.auctionPrice) || 0), 0),
          squad: details[i].players.length,
        })));
      })
      .catch(e => setLoadErr(e?.message || "Could not load auction data"));
  }, []);

  useEffect(() => {
    if (!running) return;
    if (timer <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [running, timer]);

  const player = pool && currentIdx < pool.length ? pool[currentIdx] : null;
  const done = pool !== null && pool.length > 0 && currentIdx >= pool.length;

  function advance() {
    const next = currentIdx + 1;
    setCurrentIdx(next);
    setCurrentBid(pool?.[next]?.base ?? BASE_PRICE);
    setBidHistory([]);
    setTimer(30);
    setRunning(false);
    setActionErr("");
  }

  function placeBid(teamIdx: number, jump: number) {
    if (!player || saving) return;
    const team = teams[teamIdx];
    const newBid = currentBid + jump;
    if (newBid > team.budget - team.spent) {
      setActionErr(`${team.name} has only ${fmt(team.budget - team.spent)} left — cannot bid ${fmt(newBid)}`);
      return;
    }
    setActionErr("");
    setSelectedTeam(teamIdx);
    setBidHistory(h => [{ team: team.name, amount: newBid }, ...h.slice(0, 6)]);
    setCurrentBid(newBid);
    setTimer(30);
  }

  async function soldTo(teamIdx: number) {
    if (!player || saving) return;
    const team = teams[teamIdx];
    if (currentBid > team.budget - team.spent) {
      setActionErr(`${team.name} has only ${fmt(team.budget - team.spent)} left — cannot pay ${fmt(currentBid)}`);
      return;
    }
    setSaving(true);
    setActionErr("");
    try {
      await adminAddTeamPlayer(team.id, {
        name: player.name,
        role: player.role,
        state: player.city,
        auctionPrice: String(currentBid),
        stats: { regId: player.regId, regNumber: player.regNumber },
      });
      setTeams(ts => ts.map((t, i) => i === teamIdx ? { ...t, spent: t.spent + currentBid, squad: t.squad + 1 } : t));
      setSoldPlayers(p => [...p, { player, team: team.name, amount: currentBid }]);
      setBanner(`✓ ${player.name} SOLD to ${team.name} for ${fmt(currentBid)} — saved to squad`);
      setTimeout(() => setBanner(""), 4000);
      advance();
    } catch (e: any) {
      setActionErr(e?.message || "Could not save the sale — player NOT added. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function markUnsold() {
    if (!player || saving) return;
    setUnsold(u => [...u, player]);
    advance();
  }

  /* ── LOADING / ERROR ── */
  if (loadErr) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Live Auction</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Franchise bidding console — SOLD players are saved to the squad instantly</div>
      </div>
      <div style={{ ...card, textAlign: "center", padding: "50px 30px" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#F87171", marginBottom: 8 }}>Could not load auction data</div>
        <div style={{ fontSize: 12, color: "#64748B" }}>{loadErr} — refresh to try again.</div>
      </div>
    </div>
  );

  if (pool === null) return (
    <div style={{ ...card, textAlign: "center", color: "#475569", fontSize: 13, padding: "50px 20px" }}>Loading auction data…</div>
  );

  /* ── EMPTY POOL ── */
  if (pool.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Live Auction</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Franchise bidding console — SOLD players are saved to the squad instantly</div>
      </div>
      <div style={{ background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔨</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 10 }}>No Auction-Eligible Players Yet</div>
        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
          Players appear here automatically once their <strong style={{ color: "#94A3B8" }}>Phase 2 KYC is complete</strong>.<br />
          {inPhase2 > 0 ? `${inPhase2} player${inPhase2 > 1 ? "s are" : " is"} currently in Phase 2.` : "No players have entered Phase 2 yet."}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          {teams.map(t => (
            <div key={t.id} style={{ padding: "6px 14px", borderRadius: 8, background: `${t.color}15`, border: `1px solid ${t.color}40`, fontSize: 11, fontWeight: 700, color: t.color }}>
              {t.name}{t.squad > 0 ? ` · ${t.squad}` : ""}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, fontSize: 12, color: "#334155" }}>
          {teams.length} franchise teams · ₹30L budget each · Total pool: ₹{(teams.length * 30).toLocaleString("en-IN")}L
        </div>
      </div>
    </div>
  );

  /* ── AUCTION COMPLETE ── */
  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Live Auction — Complete</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>All {pool.length} players have gone under the hammer</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Players Auctioned", value: pool.length, color: "#6366F1" },
          { label: "Sold", value: soldPlayers.length, color: "#10B981" },
          { label: "Unsold", value: unsold.length, color: "#EF4444" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 12 }}>SOLD PLAYERS (saved to squads)</div>
        {soldPlayers.length === 0 && <div style={{ fontSize: 12, color: "#334155" }}>No players were sold.</div>}
        {soldPlayers.map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #0F1B2D" }}>
            <span style={{ fontSize: 12, color: "#F1F5F9" }}>{s.player.name} <span style={{ color: "#475569" }}>→ {s.team}</span></span>
            <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>{fmt(s.amount)}</span>
          </div>
        ))}
        {unsold.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", margin: "16px 0 8px" }}>UNSOLD</div>
            {unsold.map((p, i) => (
              <div key={i} style={{ fontSize: 12, color: "#64748B", padding: "4px 0" }}>{p.name}{p.regNumber ? ` (${p.regNumber})` : ""}</div>
            ))}
          </>
        )}
      </div>
      <div style={card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 12 }}>TEAM SPEND</div>
        {teams.map(t => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0F1B2D" }}>
            <span style={{ fontSize: 12, color: t.color, fontWeight: 700 }}>{t.name}</span>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>{t.squad} players · {fmt(t.spent)} spent · {fmt(t.budget - t.spent)} left</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── LIVE CONSOLE ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Live Auction</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Real bidding console — <strong style={{ color: "#10B981" }}>SOLD players are saved to the franchise squad instantly</strong></div>
        </div>
        <span style={{ fontSize: 12, color: "#64748B" }}>Player {currentIdx + 1}/{pool.length}</span>
      </div>

      {banner && (
        <div style={{ padding: "11px 16px", background: "#10B98115", border: "1px solid #10B98140", borderRadius: 10, color: "#10B981", fontSize: 13, fontWeight: 700 }}>{banner}</div>
      )}
      {actionErr && (
        <div style={{ padding: "11px 16px", background: "#EF444412", border: "1px solid #EF444440", borderRadius: 10, color: "#F87171", fontSize: 13 }}>{actionErr}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* Center — current player */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Player card */}
          <div style={{ ...card, textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, #FF6B0010 0%, transparent 70%)", pointerEvents: "none" }}/>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#FF6B0040,#1E293B)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#FF8C40" }}>
              {player!.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#FF6B00" }}>{player!.name}</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>{player!.role}{player!.city ? ` · ${player!.city}` : ""}</div>
            {player!.regNumber && <div style={{ fontSize: 12, color: "#475569", marginTop: 4, fontFamily: "monospace" }}>{player!.regNumber}</div>}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14 }}>
              <div><div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B" }}>{fmt(player!.base)}</div><div style={{ fontSize: 10, color: "#475569" }}>Base Price</div></div>
            </div>
          </div>

          {/* Current Bid */}
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>CURRENT BID</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#FF6B00", letterSpacing: -1 }}>{fmt(currentBid)}</div>
            {bidHistory[0] && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Last bid by {bidHistory[0].team}</div>}

            {/* Timer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `conic-gradient(${timer <= 10 ? "#EF4444" : "#FF6B00"} ${timer / 30 * 360}deg,#1E293B 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0A1020", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: timer <= 10 ? "#EF4444" : "#FF6B00" }}>{timer}</div>
              </div>
              <button onClick={() => setRunning(r => !r)} style={{ padding: "9px 20px", borderRadius: 9, background: running ? "#EF444420" : "#10B98120", color: running ? "#EF4444" : "#10B981", fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${running ? "#EF444440" : "#10B98140"}` }}>
                {running ? "⏸ Pause" : "▶ Start Timer"}
              </button>
            </div>

            {/* Team bid buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 16 }}>
              {teams.map((t, i) => (
                <button key={t.id} onClick={() => placeBid(i, 25000)} disabled={saving} style={{ padding: "10px 4px", borderRadius: 10, border: `1px solid ${selectedTeam === i ? t.color : t.color + "40"}`, background: `${t.color}${selectedTeam === i ? "30" : "15"}`, color: t.color, fontSize: 10, fontWeight: 700, cursor: "pointer", lineHeight: 1.4, opacity: saving ? 0.6 : 1 }}>
                  {t.name.split(" ")[0]}<br/>+₹25K
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 8 }}>
              {[50000, 100000, 200000, 500000].map(j => (
                <button key={j} onClick={() => placeBid(selectedTeam, j)} disabled={saving} style={{ padding: "8px", borderRadius: 9, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>+{fmt(j)}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => soldTo(selectedTeam)} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: saving ? "#10B98160" : "linear-gradient(135deg,#10B981,#059669)", color: "#fff", fontWeight: 800, fontSize: 13, cursor: saving ? "wait" : "pointer" }}>
                {saving ? "Saving…" : `✓ SOLD to ${teams[selectedTeam]?.name.split(" ")[0] ?? ""}`}
              </button>
              <button onClick={markUnsold} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#EF444420", color: "#EF4444", fontWeight: 800, fontSize: 13, cursor: "pointer", border: "1px solid #EF444440", opacity: saving ? 0.6 : 1 }}>✗ UNSOLD</button>
            </div>
          </div>
        </div>

        {/* Right — teams + history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Team budgets */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 12 }}>TEAM BUDGETS (₹30L each)</div>
            {teams.map((t, i) => {
              const rem = t.budget - t.spent;
              const pct = Math.min(100, Math.round(t.spent / t.budget * 100));
              return (
                <div key={t.id} onClick={() => setSelectedTeam(i)} style={{ marginBottom: 12, cursor: "pointer", padding: "8px 10px", borderRadius: 9, background: selectedTeam === i ? `${t.color}15` : "transparent", border: `1px solid ${selectedTeam === i ? t.color + "40" : "transparent"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.name.split(" ")[0]} <span style={{ color: "#475569", fontWeight: 600 }}>· {t.squad}</span></span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>{fmt(rem)} left</span>
                  </div>
                  <div style={{ height: 4, background: "#1E293B", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: t.color, borderRadius: 2 }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bid history */}
          <div style={{ ...card, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 12 }}>BID HISTORY</div>
            {bidHistory.length === 0 && <div style={{ fontSize: 11, color: "#334155", textAlign: "center", padding: "20px 0" }}>No bids yet</div>}
            {bidHistory.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #0F1B2D" }}>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{b.team.split(" ")[0]}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#FF6B00" }}>{fmt(b.amount)}</span>
              </div>
            ))}
          </div>

          {/* Sold players */}
          {soldPlayers.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 10 }}>SOLD (saved to squads)</div>
              {soldPlayers.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0F1B2D" }}>
                  <span style={{ fontSize: 11, color: "#F1F5F9" }}>{s.player.name}</span>
                  <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>{fmt(s.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
