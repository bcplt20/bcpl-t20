import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/i18n";

/**
 * FlipCountdown — stadium-scoreboard countdown with odometer digits.
 * Every digit lives on a vertical 0–9 rail that ROLLS to its next value
 * (the seconds column is always in motion), instead of text that jumps.
 * 9→0 keeps rolling downward through a spare "0" cell, like a real meter.
 *
 * Sizes:  lg — big glass scoreboard (final CTA sections)
 *         sm — inline mini version (hero pill)
 * Respects prefers-reduced-motion via the global CSS kill-switch.
 */

const EASE = "cubic-bezier(.22,1,.36,1)";

function Digit({ value, em }: { value: number; em: number }) {
  const [pos, setPos] = useState(value);        // 0..10 (10 = spare zero)
  const [anim, setAnim] = useState(true);
  const prev = useRef(value);
  const snapT = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (value === prev.current) return;
    const from = prev.current;
    prev.current = value;
    if (from === 9 && value === 0) {
      /* roll forward into the spare 0, then snap back without animation */
      setAnim(true); setPos(10);
      snapT.current = window.setTimeout(() => {
        setAnim(false); setPos(0);
        requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
      }, 620);
      return;
    }
    setAnim(true); setPos(value);
  }, [value]);

  useEffect(() => () => { if (snapT.current) clearTimeout(snapT.current); }, []);

  return (
    <span style={{ display: "inline-block", overflow: "hidden", height: em + "em", lineHeight: em + "em" }} aria-hidden="true">
      <span style={{
        display: "block",
        transform: "translateY(-" + pos * em + "em)",
        transition: anim ? "transform .6s " + EASE : "none",
      }}>
        {[0,1,2,3,4,5,6,7,8,9,0].map((n, i) => (
          <span key={i} style={{ display: "block", height: em + "em", lineHeight: em + "em", textAlign: "center" }}>{n}</span>
        ))}
      </span>
    </span>
  );
}

function useCountdown(target: string) {
  const [tl, setTl] = useState(() => calc(target));
  useEffect(() => {
    const iv = setInterval(() => setTl(calc(target)), 1000);
    return () => clearInterval(iv);
  }, [target]);
  return tl;
}

function calc(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function digitsOf(n: number, min: number) {
  return String(n).padStart(min, "0").split("").map(Number);
}

export function FlipCountdown({ target, size = "lg" }: { target: string; size?: "lg" | "sm" }) {
  const { t } = useLang();
  const { d, h, m, s } = useCountdown(target);
  const groups = [
    { ds: digitsOf(d, 2), label: t("Days", "दिन") },
    { ds: digitsOf(h, 2), label: t("Hrs", "घंटे") },
    { ds: digitsOf(m, 2), label: t("Min", "मिनट") },
    { ds: digitsOf(s, 2), label: t("Sec", "सेकंड") },
  ];
  const srText = d + "d " + h + "h " + m + "m " + s + "s";

  if (size === "sm") {
    return (
      <span role="timer" aria-label={srText} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Barlow Condensed','Mukta',sans-serif", fontWeight: 800, fontSize: 15, color: "#FFB347", letterSpacing: ".04em" }}>
        {groups.map((g, gi) => (
          <span key={gi} style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ display: "inline-flex" }}>
              {g.ds.map((dg, di) => <Digit key={g.ds.length - di} value={dg} em={1.15} />)}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.5)", letterSpacing: ".08em", textTransform: "uppercase" }}>{g.label}</span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <div role="timer" aria-label={srText} style={{ display: "flex", gap: "clamp(8px,1.6vw,14px)", flexWrap: "wrap", justifyContent: "center", alignItems: "stretch" }}>
      {groups.map((g, gi) => (
        <div key={gi} style={{ display: "flex", alignItems: "center", gap: "clamp(8px,1.6vw,14px)" }}>
          <div style={{
            background: "rgba(5,11,22,.82)", border: "1px solid rgba(255,255,255,.09)",
            borderTop: "2px solid rgba(255,122,41,.55)",
            borderRadius: "var(--r,14px)", padding: "clamp(10px,1.8vw,16px) clamp(12px,2.2vw,22px)",
            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 12px 40px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06)",
            minWidth: "clamp(64px,10vw,96px)",
          }}>
            <div style={{
              display: "flex", justifyContent: "center",
              fontFamily: "'Barlow Condensed','Mukta',sans-serif", fontWeight: 800,
              fontSize: "clamp(30px,5.2vw,52px)", color: "#FF7A29",
              textShadow: "0 0 22px rgba(255,122,41,.4)", fontVariantNumeric: "tabular-nums",
            }}>
              {g.ds.map((dg, di) => <Digit key={g.ds.length - di} value={dg} em={1.05} />)}
            </div>
            <div style={{ fontFamily: "'Inter','Mukta',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: ".16em", color: "rgba(255,255,255,.45)", textTransform: "uppercase", textAlign: "center", marginTop: 6 }}>
              {g.label}
            </div>
          </div>
          {gi < groups.length - 1 && (
            <div aria-hidden="true" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: "clamp(20px,3.4vw,34px)", color: "#E8B23D", animation: "fcPulse 1s ease-in-out infinite", alignSelf: "center", paddingBottom: 18 }}>:</div>
          )}
        </div>
      ))}
      <style>{"@keyframes fcPulse{0%,100%{opacity:1}50%{opacity:.25}}"}</style>
    </div>
  );
}
