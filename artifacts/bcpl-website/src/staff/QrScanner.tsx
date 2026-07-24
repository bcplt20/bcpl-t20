/**
 * Camera QR scanner (jsqr) for the staff app — field phones, rear camera.
 * Always paired with a manual entry fallback by the parent screen:
 * sunlight glare, cracked screens and cheap cameras WILL fail (spec §37).
 */
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

interface Props {
  onScan: (text: string) => void;
  paused: boolean;
}

export function QrScanner({ onScan, paused }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    const video = videoRef.current;
    if (!video) return;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        video.srcObject = stream;
        video.setAttribute("playsinline", "true"); // iOS Safari
        await video.play();
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        let lastHit = 0;
        const tick = () => {
          if (cancelled) return;
          if (!pausedRef.current && video.readyState === video.HAVE_ENOUGH_DATA) {
            const w = Math.min(video.videoWidth, 640);
            const h = Math.round(video.videoHeight * (w / Math.max(video.videoWidth, 1)));
            if (w > 0 && h > 0) {
              canvas.width = w; canvas.height = h;
              ctx.drawImage(video, 0, 0, w, h);
              const img = ctx.getImageData(0, 0, w, h);
              const hit = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
              const now = Date.now();
              if (hit && hit.data && now - lastHit > 1500) {
                lastHit = now;
                if (navigator.vibrate) navigator.vibrate(80);
                onScanRef.current(hit.data.trim());
              }
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) setError("Camera unavailable — use manual entry below, or allow camera access and reload.");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", background: "#000", aspectRatio: "4/3" }}>
      {error ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFB84D", fontSize: 14, fontWeight: 700, padding: 20, textAlign: "center" }}>
          {error}
        </div>
      ) : (
        <>
          <video ref={videoRef} muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: "62%", aspectRatio: "1", border: "3px solid rgba(255,122,41,.85)", borderRadius: 18, boxShadow: "0 0 0 2000px rgba(0,0,0,.25)" }} />
          </div>
          {paused && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, letterSpacing: ".08em", fontSize: 13 }}>
              SCANNER PAUSED
            </div>
          )}
        </>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
