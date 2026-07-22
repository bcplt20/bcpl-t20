/**
 * Admin tools API client — CSV data export, forecast, content planner,
 * WhatsApp template registry, S3 media library.
 *
 * NOTE: BASE and adminReq are deliberately DUPLICATED from api.ts.
 * Several queued tasks edit api.ts, and keeping this module fully
 * self-contained avoids merge conflicts. If the admin auth scheme
 * changes in api.ts, mirror it here. (Same pattern as marketingApi.ts.)
 */

const BASE =
  (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") ||
  (import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, ""));
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? "";
const ADMIN_TOKEN_KEY = "bcpl_admin_token_v1";

function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}

function adminHeaders(json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  const token = getAdminToken();
  if (token) headers["x-bcpl-admin-token"] = token;
  // Legacy fallback (mirrors api.ts adminReq)
  if (!token && ADMIN_KEY) headers["x-bcpl-admin"] = ADMIN_KEY;
  return headers;
}

async function adminReq<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: adminHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface PlannedPost {
  id: string;
  postDate: string;          // YYYY-MM-DD
  postTime: string | null;   // HH:MM
  platform: string;
  postType: string;
  caption: string;
  status: "draft" | "planned" | "posted";
  createdAt: string;
  updatedAt: string;
}

export interface WaTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  body: string;
  varNames: string[];
  sampleValues: string[];
  status: "draft" | "submitted" | "approved" | "rejected";
  usedInCode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  kind: "photo" | "video" | "mixed";
  createdAt: string;
  fileCount: number;
  totalBytes: number;
}

export interface MediaFile {
  id: string;
  folderId: string;
  name: string;
  s3Key: string;
  s3Url: string;
  contentType: string;
  sizeBytes: number;
  kind: "photo" | "video";
  createdAt: string;
  viewUrl: string;
}

export interface ForecastMonth {
  month: string; // YYYY-MM
  registrations: number;
  paidRegistrations: number;
  revenue: number;
}
export interface ForecastSettings {
  goal: number;
  seasonStart: string | null; // YYYY-MM-DD
  targets: Record<string, number>; // YYYY-MM → target registrations
}
export interface ForecastData {
  monthly: ForecastMonth[];
  totals: { registrations: number; paidRegistrations: number; revenue: number };
  pace14d: { registrations: number; paidRegistrations: number; revenue: number };
  settings: ForecastSettings;
}

/* ─── CSV export ────────────────────────────────────────────────────── */

export type ExportDataset = "registrations" | "payments" | "kyc" | "videos";

/** Fetches the CSV with the admin auth header and triggers a browser download. */
export async function downloadCsv(dataset: ExportDataset, params: Record<string, string>): Promise<string> {
  const entries = Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null);
  const qs = new URLSearchParams(entries).toString();
  const res = await fetch(`${BASE}/api/admin-tools/export/${dataset}${qs ? `?${qs}` : ""}`, {
    headers: adminHeaders(false),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") ?? "";
  const m = cd.match(/filename="([^"]+)"/);
  const filename = m?.[1] ?? `bcpl-${dataset}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return filename;
}

/* ─── Forecast ──────────────────────────────────────────────────────── */

export const getForecast = () =>
  adminReq<ForecastData>("GET", "/admin-tools/forecast");

export const saveForecastSettings = (settings: ForecastSettings) =>
  adminReq<{ success: boolean; settings: ForecastSettings }>("PUT", "/admin-tools/forecast/settings", settings);

/* ─── Content planner ───────────────────────────────────────────────── */

export const listPlannedPosts = () =>
  adminReq<{ posts: PlannedPost[] }>("GET", "/admin-tools/planner/posts");

export const createPlannedPost = (p: Omit<PlannedPost, "id" | "createdAt" | "updatedAt">) =>
  adminReq<{ success: boolean; post: PlannedPost }>("POST", "/admin-tools/planner/posts", p);

export const updatePlannedPost = (id: string, p: Partial<Omit<PlannedPost, "id" | "createdAt" | "updatedAt">>) =>
  adminReq<{ success: boolean; post: PlannedPost }>("PUT", `/admin-tools/planner/posts/${id}`, p);

export const deletePlannedPost = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/admin-tools/planner/posts/${id}`);

/* ─── WhatsApp templates ────────────────────────────────────────────── */

export const listWaTemplates = () =>
  adminReq<{ templates: WaTemplate[] }>("GET", "/admin-tools/wa-templates");

export const createWaTemplate = (t: Omit<WaTemplate, "id" | "usedInCode" | "createdAt" | "updatedAt">) =>
  adminReq<{ success: boolean; template: WaTemplate }>("POST", "/admin-tools/wa-templates", t);

export const updateWaTemplate = (id: string, t: Partial<Omit<WaTemplate, "id" | "usedInCode" | "createdAt" | "updatedAt">>) =>
  adminReq<{ success: boolean; template: WaTemplate }>("PUT", `/admin-tools/wa-templates/${id}`, t);

export const deleteWaTemplate = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/admin-tools/wa-templates/${id}`);

/* ─── Media library ─────────────────────────────────────────────────── */

export const listMediaFolders = () =>
  adminReq<{ folders: MediaFolder[] }>("GET", "/admin-tools/media/folders");

export const createMediaFolder = (name: string, kind: MediaFolder["kind"]) =>
  adminReq<{ success: boolean; folder: MediaFolder }>("POST", "/admin-tools/media/folders", { name, kind });

export const deleteMediaFolder = (id: string) =>
  adminReq<{ success: boolean; deletedFiles: number }>("DELETE", `/admin-tools/media/folders/${id}`);

export const listMediaFiles = (folderId: string) =>
  adminReq<{ files: MediaFile[] }>("GET", `/admin-tools/media/folders/${folderId}/files`);

export const getMediaUploadUrl = (folderId: string, fileName: string, contentType: string, sizeBytes: number) =>
  adminReq<{ success: boolean; presignedUrl: string; s3Key: string }>("POST", "/admin-tools/media/upload-url", {
    folderId, fileName, contentType, sizeBytes,
  });

export const confirmMediaUpload = (folderId: string, s3Key: string, name: string, contentType: string, sizeBytes: number) =>
  adminReq<{ success: boolean; file: MediaFile }>("POST", "/admin-tools/media/confirm", {
    folderId, s3Key, name, contentType, sizeBytes,
  });

export const deleteMediaFile = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/admin-tools/media/files/${id}`);

/** Direct browser → S3 PUT with progress (same flow as the trial-video upload). */
export function uploadToS3(presignedUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (HTTP ${xhr.status}) — check S3 bucket CORS`));
    };
    xhr.onerror = () => reject(new Error("Upload failed — network or S3 CORS error"));
    xhr.send(file);
  });
}

/** "2026-07" → "Jul 2026" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatBytes(n: number): string {
  if (!n || n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
