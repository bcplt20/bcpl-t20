import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSiteSetting, adminSetSiteSetting, adminGetSampleUploadUrl,
  type SampleVideos, type SampleVideoRole,
} from "../../lib/api";

/**
 * Admin manager for the sample trial videos shown to players on the
 * "Upload your trial video" page. One slot per role. Videos are uploaded
 * to S3 (same bucket as player trial videos) or set via a direct URL.
 */

const ROLES: { key: SampleVideoRole; label: string; icon: string }[] = [
  { key: "batsman",       label: "Batsman",       icon: "🏏" },
  { key: "bowler",        label: "Bowler",        icon: "🎳" },
  { key: "wicket-keeper", label: "Wicket-Keeper", icon: "🧤" },
  { key: "all-rounder",   label: "All-Rounder",   icon: "⭐" },
];

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
const MAX_SIZE = 500 * 1024 * 1024; // 500 MB (same cap as player uploads)

export function SampleVideosCard() {
  const [data, setData]       = useState<SampleVideos | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [busy, setBusy]       = useState<SampleVideoRole | null>(null);
  const [notice, setNotice]   = useState("");
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await getSiteSetting<SampleVideos>("sample_videos");
      setData(r.value ?? {});
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load sample videos");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (next: SampleVideos, successMsg: string) => {
    await adminSetSiteSetting("sample_videos", next);
    setData(next);
    setNotice(successMsg);
    setTimeout(() => setNotice(""), 4000);
  };

  const onFilePicked = async (role: SampleVideoRole, file: File) => {
    setErr("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErr("Only MP4, MOV, WEBM or AVI video files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setErr("Video is larger than 500 MB. Please compress it and try again.");
      return;
    }
    setBusy(role);
    try {
      const { presignedUrl, publicUrl } = await adminGetSampleUploadUrl(file.type);
      const up = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!up.ok) throw new Error("S3 upload failed (HTTP " + up.status + ")");
      // Merge onto the freshest server value so a parallel edit on another role is not lost
      const fresh = (await getSiteSetting<SampleVideos>("sample_videos")).value ?? {};
      const next: SampleVideos = { ...fresh, [role]: { url: publicUrl, label: file.name, uploadedAt: new Date().toISOString() } };
      await save(next, ROLES.find(r => r.key === role)?.label + " sample video uploaded ✓");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
      const el = fileInputs.current[role];
      if (el) el.value = "";
    }
  };

  const onSaveUrl = async (role: SampleVideoRole) => {
    const url = (urlDrafts[role] ?? "").trim();
    setErr("");
    if (!/^https?:\/\/.+/.test(url)) {
      setErr("Please paste a full video URL starting with http:// or https://");
      return;
    }
    setBusy(role);
    try {
      const fresh = (await getSiteSetting<SampleVideos>("sample_videos")).value ?? {};
      const next: SampleVideos = { ...fresh, [role]: { url, uploadedAt: new Date().toISOString() } };
      await save(next, ROLES.find(r => r.key === role)?.label + " sample URL saved ✓");
      setUrlDrafts(d => ({ ...d, [role]: "" }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const onRemove = async (role: SampleVideoRole) => {
    if (!window.confirm("Remove this sample video? Players will see 'coming soon' for this role.")) return;
    setErr(""); setBusy(role);
    try {
      const fresh = (await getSiteSetting<SampleVideos>("sample_videos")).value ?? {};
      const next: SampleVideos = { ...fresh };
      delete next[role];
      await save(next, "Sample video removed");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9" }}>🎬 Sample Videos (shown to players)</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            These play on the "Upload Trial Video" page. Upload a video file or paste a video URL for each role.
          </div>
        </div>
        <button onClick={load} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>↺ Reload</button>
      </div>

      {notice && (
        <div style={{ margin: "10px 0 0", padding: 10, borderRadius: 9, background: "#22C55E15", border: "1px solid #22C55E40", color: "#22C55E", fontSize: 12, fontWeight: 600 }}>{notice}</div>
      )}
      {err && (
        <div style={{ margin: "10px 0 0", padding: 10, borderRadius: 9, background: "#EF444415", border: "1px solid #EF444440", color: "#EF4444", fontSize: 12 }}>⚠ {err}</div>
      )}

      {loading ? (
        <div style={{ padding: 18, color: "#64748B", fontSize: 13 }}>Loading sample videos…</div>
      ) : data === null ? (
        <div style={{ padding: 18, color: "#EF4444", fontSize: 13 }}>Could not load — use Reload to try again.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, marginTop: 14 }}>
          {ROLES.map(r => {
            const entry = data[r.key];
            const isBusy = busy === r.key;        // this role is being worked on (label)
            const anyBusy = busy !== null;        // block ALL actions while any write runs
            return (
              <div key={r.key} style={{ border: "1px solid #1E293B", borderRadius: 12, padding: 14, background: "#0A1020" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0" }}>{r.icon} {r.label}</span>
                  {entry
                    ? <span style={{ fontSize: 10, fontWeight: 800, color: "#22C55E", background: "#22C55E15", border: "1px solid #22C55E40", padding: "3px 8px", borderRadius: 6 }}>LIVE ✓</span>
                    : <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", background: "#64748B15", border: "1px solid #33415555", padding: "3px 8px", borderRadius: 6 }}>NOT SET</span>}
                </div>

                {entry && (
                  <div style={{ marginBottom: 10 }}>
                    <video src={entry.url} controls preload="metadata" style={{ width: "100%", maxHeight: 130, background: "#000", borderRadius: 8, display: "block" }} />
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 4, wordBreak: "break-all" }}>{entry.label || entry.url}</div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    ref={el => { fileInputs.current[r.key] = el; }}
                    type="file" accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) onFilePicked(r.key, f); }}
                  />
                  <button
                    disabled={anyBusy}
                    onClick={() => fileInputs.current[r.key]?.click()}
                    style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #3B82F640", background: "#3B82F615", color: "#60A5FA", fontSize: 12, fontWeight: 700, cursor: anyBusy ? "wait" : "pointer" }}
                  >
                    {isBusy ? "Working… (large videos take time)" : (entry ? "⬆ Replace with new video file" : "⬆ Upload video file")}
                  </button>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={urlDrafts[r.key] ?? ""}
                      onChange={e => setUrlDrafts(d => ({ ...d, [r.key]: e.target.value }))}
                      placeholder="…or paste video URL"
                      disabled={anyBusy}
                      style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 8, border: "1px solid #1E293B", background: "#0D1526", color: "#E2E8F0", fontSize: 12 }}
                    />
                    <button disabled={anyBusy || !(urlDrafts[r.key] ?? "").trim()} onClick={() => onSaveUrl(r.key)}
                      style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #22C55E40", background: "#22C55E15", color: "#22C55E", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Save
                    </button>
                  </div>
                  {entry && (
                    <button disabled={anyBusy} onClick={() => onRemove(r.key)}
                      style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #EF444430", background: "transparent", color: "#EF4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      ✕ Remove sample
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
