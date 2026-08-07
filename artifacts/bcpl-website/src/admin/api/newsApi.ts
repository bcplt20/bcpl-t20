/**
 * Admin news API — DB-backed articles + BCPL AI drafting.
 * Uses the shared adminReq plumbing (auth headers, token renewal, error shape).
 * Do NOT add fetch logic here — always route through adminReq.
 */
import { adminReq } from "../../lib/adminHttp";
import type { ApiNewsArticle } from "../../lib/api";

export type NewsArticleInput = {
  slug: string; tag: string; title: string; titleHi: string; image: string;
  paragraphs: string[]; paragraphsHi: string[];
  press: Array<{ label: string; url: string }>;
  published: boolean;
};

export const adminListNews = () =>
  adminReq<{ articles: ApiNewsArticle[] }>("GET", "/admin/news");

export const adminCreateNews = (body: NewsArticleInput) =>
  adminReq<{ article: ApiNewsArticle }>("POST", "/admin/news", body);

export const adminUpdateNews = (id: string, body: NewsArticleInput) =>
  adminReq<{ article: ApiNewsArticle }>("PUT", `/admin/news/${id}`, body);

export const adminDeleteNews = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/admin/news/${id}`);

export type NewsAiDraft = {
  slug: string; tag: string; title: string; titleHi: string;
  paragraphs: string[]; paragraphsHi: string[];
};
export const adminNewsAiDraft = (topic: string) =>
  adminReq<NewsAiDraft>("POST", "/admin/news/ai-draft", { topic });
