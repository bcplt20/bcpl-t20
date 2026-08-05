import { useEffect, useRef, useState } from "react";
import {
  listMediaFolders, createMediaFolder, deleteMediaFolder, listMediaFiles,
  getMediaUploadUrl, confirmMediaUpload, deleteMediaFile, uploadToS3, formatBytes,
  setMediaFolderPublic,
  type MediaFolder, type MediaFile,
} from "../../lib/adminToolsApi";

/* Real media library — files live in the BCPL S3 bucket (same one as trial
 * videos). Uploads go browser → S3 directly via pre-signed URLs; previews use
 * 1-hour signed links because the bucket is private. */

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm";
const ACCEPT: Record<MediaFolder["kind"], string> = {
  photo: IMAGE_ACCEPT,
  video: VIDEO_ACCEPT,
  mixed: `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`,
};
const ALLOWED = new Set([...IMAGE_ACCEPT.split(","), ...VIDEO_ACCEPT.split(",")]);

type UploadState = { id: string; name: string; pct: number; error?: string; done?: boolean };

const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
const btnPrimary: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" };

const KIND_META: Record<MediaFolder["kind"], { icon: string; label: string }> = {
  photo: { icon: "📸", label: "Photos" },
  video: { icon: "🎬", label: "Videos" },
  mixed: { icon: "📁", label: "Mixed" },
};

export default function MediaView() {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState<MediaFolder | null>(null);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderKind, setNewFolderKind] = useState<MediaFolder["kind"]>("photo");
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refreshFolders() {
    try {
      const { folders: f } = await listMediaFolders();
      setFolders(f);
      setOpenFolder(cur => (cur ? f.find(x => x.id === cur.id) ?? null : cur));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refreshFolders(); }, []);

  async function openFolderView(f: MediaFolder) {
    setOpenFolder(f);
    setFiles([]);
    setFilesLoading(true);
    setError(null);
    try {
      setFiles((await listMediaFiles(f.id)).files);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFilesLoading(false);
    }
  }

  /* Presigned viewUrls expire after 1 h (bucket is private). If the panel
   * stays open, silently re-fetch fresh links before they die so thumbnails
   * and the preview modal never break. */
  async function refreshFileUrls(folderId: string) {
    try {
      const { files: fresh } = await listMediaFiles(folderId);
      setFiles(fresh);
      const map = new Map(fresh.map(f => [f.id, f]));
      setPreview(p => (p ? map.get(p.id) ?? p : p));
    } catch {
      /* transient — the 50-min timer or an onError retry will try again */
    }
  }

  // Proactive refresh at ~50 min (well inside the 1-h expiry) while a folder is open.
  useEffect(() => {
    if (!openFolder) return;
    const id = openFolder.id;
    const timer = window.setInterval(() => { void refreshFileUrls(id); }, 50 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [openFolder?.id]);

  // Reactive fallback: if a thumbnail/preview fails to load (e.g. link already
  // expired), refetch once. Guard against loops with a per-file retry flag.
  const retriedRef = useRef<Set<string>>(new Set());
  function handleMediaError(f: MediaFile) {
    if (!openFolder || retriedRef.current.has(f.id)) return;
    retriedRef.current.add(f.id);
    void refreshFileUrls(openFolder.id).finally(() => {
      // Allow a future retry after URLs have been refreshed once.
      setTimeout(() => retriedRef.current.delete(f.id), 5000);
    });
  }

  async function createFolder() {
    const name = newFolderName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      await createMediaFolder(name, newFolderKind);
      setNewFolderOpen(false);
      setNewFolderName("");
      await refreshFolders();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function removeFolder(f: MediaFolder) {
    if (!window.confirm(`Delete folder "${f.name}" and its ${f.fileCount} file(s) from S3? This cannot be undone.`)) return;
    try {
      await deleteMediaFolder(f.id);
      if (openFolder?.id === f.id) setOpenFolder(null);
      await refreshFolders();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function togglePublic(f: MediaFolder) {
    try {
      await setMediaFolderPublic(f.id, !f.isPublic);
      setFolders(fs => fs.map(x => (x.id === f.id ? { ...x, isPublic: !x.isPublic } : x)));
      setOpenFolder(cur => (cur && cur.id === f.id ? { ...cur, isPublic: !cur.isPublic } : cur));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeFile(f: MediaFile) {
    if (!window.confirm(`Delete "${f.name}" from S3? This cannot be undone.`)) return;
    try {
      await deleteMediaFile(f.id);
      setFiles(fs => fs.filter(x => x.id !== f.id));
      if (preview?.id === f.id) setPreview(null);
      void refreshFolders();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleFiles(list: FileList | null) {
    if (!list || !openFolder) return;
    const chosen = Array.from(list);
    for (const file of chosen) {
      const id = `${Date.now()}-${Math.random()}`;
      const upd = (patch: Partial<UploadState>) => setUploads(u => u.map(x => (x.id === id ? { ...x, ...patch } : x)));
      setUploads(u => [...u, { id, name: file.name, pct: 0 }]);
      if (!ALLOWED.has(file.type)) {
        upd({ error: "Unsupported file type (use JPG/PNG/WebP/GIF or MP4/MOV/WebM)" });
        continue;
      }
      try {
        const { presignedUrl, s3Key } = await getMediaUploadUrl(openFolder.id, file.name, file.type, file.size);
        await uploadToS3(presignedUrl, file, pct => upd({ pct }));
        const { file: saved } = await confirmMediaUpload(openFolder.id, s3Key, file.name, file.type, file.size);
        upd({ pct: 100, done: true });
        setFiles(fs => [saved, ...fs]);
        setTimeout(() => setUploads(u => u.filter(x => x.id !== id)), 3000);
      } catch (e) {
        upd({ error: (e as Error).message });
      }
    }
    void refreshFolders();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const activeUploads = uploads.filter(u => !u.done);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Media Library</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            Match photos & videos stored in the BCPL S3 bucket — previews use 1-hour signed links
          </div>
        </div>
        {!openFolder && (
          <button onClick={() => setNewFolderOpen(true)} style={btnPrimary}>+ New Folder</button>
        )}
      </div>

      {error && (
        <div style={{ background: "#EF444422", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#FCA5A5", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
      )}

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Uploads</div>
            {activeUploads.every(u => u.error) && (
              <button onClick={() => setUploads([])} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 12 }}>Clear</button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {uploads.map(u => (
              <div key={u.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: u.error ? "#FCA5A5" : "#94A3B8", marginBottom: 4 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                  <span>{u.error ? "failed" : u.done ? "done ✓" : `${u.pct}%`}</span>
                </div>
                {u.error ? (
                  <div style={{ fontSize: 11, color: "#FCA5A5" }}>{u.error}</div>
                ) : (
                  <div style={{ height: 5, borderRadius: 3, background: "#1E293B", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${u.pct}%`, background: u.done ? "#22C55E" : "linear-gradient(90deg,#FF6B00,#FF8C40)", transition: "width .2s" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!openFolder ? (
        /* ── Folder grid ─────────────────────────────────────────── */
        loading ? (
          <div style={{ ...card, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading folders…</div>
        ) : folders.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗂</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>No folders yet</div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 18 }}>Create a folder (e.g. "Delhi Trials — Day 1") and upload match photos or videos.</div>
            <button onClick={() => setNewFolderOpen(true)} style={btnPrimary}>+ Create First Folder</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
            {folders.map(f => (
              <div key={f.id} style={{ ...card, padding: 18, cursor: "pointer", position: "relative" }} onClick={() => void openFolderView(f)}>
                <button onClick={e => { e.stopPropagation(); void removeFolder(f); }} title="Delete folder"
                  style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14 }}>🗑</button>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{KIND_META[f.kind]?.icon ?? "📁"}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4, paddingRight: 20 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>
                  {f.fileCount} file{f.fileCount === 1 ? "" : "s"} · {formatBytes(f.totalBytes)}
                </div>
                <button onClick={e => { e.stopPropagation(); void togglePublic(f); }}
                  title={f.isPublic ? "Hide from public website Gallery" : "Show on public website Gallery"}
                  style={{ padding: "5px 12px", borderRadius: 100, border: `1px solid ${f.isPublic ? "#22C55E" : "#1E293B"}`, background: f.isPublic ? "#22C55E22" : "transparent", color: f.isPublic ? "#4ADE80" : "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {f.isPublic ? "🌐 Public" : "🔒 Private"}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Folder contents ─────────────────────────────────────── */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => { setOpenFolder(null); setFiles([]); }} style={btnGhost}>‹ All folders</button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9" }}>
                {KIND_META[openFolder.kind]?.icon} {openFolder.name}
              </div>
            </div>
            <div>
              <input ref={fileInputRef} type="file" multiple accept={ACCEPT[openFolder.kind]} style={{ display: "none" }}
                onChange={e => void handleFiles(e.target.files)} />
              <button onClick={() => fileInputRef.current?.click()} style={btnPrimary}>⬆ Upload Files</button>
            </div>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); void handleFiles(e.dataTransfer.files); }}
            style={{ ...card, border: dragOver ? "2px dashed #FF6B00" : "1px solid #1E293B", minHeight: 220 }}>
            {filesLoading ? (
              <div style={{ textAlign: "center", color: "#64748B", fontSize: 13, padding: 40 }}>Loading files…</div>
            ) : files.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>☁</div>
                <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>Drag & drop files here, or click Upload Files</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                  Photos up to 25 MB (JPG/PNG/WebP/GIF) · Videos up to 500 MB (MP4/MOV/WebM)
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
                {files.map(f => (
                  <div key={f.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #1E293B", background: "#060B18", cursor: "pointer", position: "relative" }}
                    onClick={() => setPreview(f)}>
                    {f.kind === "photo" ? (
                      <img src={f.viewUrl} alt={f.name} loading="lazy" onError={() => handleMediaError(f)} style={{ width: "100%", height: 110, objectFit: "cover", display: "block", background: "#0A1020" }} />
                    ) : (
                      <div style={{ width: "100%", height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, background: "#0A1020" }}>🎬</div>
                    )}
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{formatBytes(f.sizeBytes)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New folder modal */}
      {newFolderOpen && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 440, maxWidth: "92vw" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 16 }}>New Folder</div>
            <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>FOLDER NAME</label>
            <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === "Enter" && void createFolder()}
              placeholder='e.g. "Delhi Trials — Day 1"' autoFocus
              style={{ width: "100%", padding: "10px 14px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none", marginBottom: 16 }} />
            <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>CONTENT TYPE</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {(["photo", "video", "mixed"] as const).map(t => (
                <button key={t} onClick={() => setNewFolderKind(t)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `1px solid ${newFolderKind === t ? "#FF6B00" : "#1E293B"}`, background: newFolderKind === t ? "#FF6B0022" : "transparent", color: newFolderKind === t ? "#FF6B00" : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {KIND_META[t].icon} {KIND_META[t].label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setNewFolderOpen(false)} style={{ ...btnGhost, flex: 1 }}>Cancel</button>
              <button onClick={() => void createFolder()} disabled={!newFolderName.trim() || creating}
                style={{ ...btnPrimary, flex: 1, opacity: newFolderName.trim() && !creating ? 1 : 0.5 }}>
                {creating ? "Creating…" : "Create Folder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div onClick={() => setPreview(null)}
          style={{ position: "fixed", inset: 0, background: "#000000CC", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 20, maxWidth: "min(880px,94vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview.name}</div>
              <button onClick={() => setPreview(null)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ overflow: "auto", display: "flex", justifyContent: "center" }}>
              {preview.kind === "photo" ? (
                <img src={preview.viewUrl} alt={preview.name} onError={() => handleMediaError(preview)} style={{ maxWidth: "100%", maxHeight: "68vh", borderRadius: 12 }} />
              ) : (
                <video src={preview.viewUrl} controls autoPlay onError={() => handleMediaError(preview)} style={{ maxWidth: "100%", maxHeight: "68vh", borderRadius: 12 }} />
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                {formatBytes(preview.sizeBytes)} · uploaded {new Date(preview.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={preview.viewUrl} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: "none", padding: "8px 14px" }}>Open in new tab</a>
                <button onClick={() => void removeFile(preview)} style={{ ...btnGhost, color: "#FCA5A5", borderColor: "#EF444455", padding: "8px 14px" }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
