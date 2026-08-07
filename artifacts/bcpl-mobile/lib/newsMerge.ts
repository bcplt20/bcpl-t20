/**
 * Merge admin-published (API) news articles with the static Season-4 archive.
 * API articles come first (newest first); static articles keep their order and
 * are dropped if an API article reuses the same slug.
 */
import { NEWS_ARTICLES, type NewsArticle } from '@/data/news';
import { SITE_ASSETS, type ApiNewsArticle } from '@/lib/api';

export type MergedNews = NewsArticle & {
  /** Full image URI (API articles may use absolute URLs). Empty = no image. */
  imageUri: string;
  paragraphsHi?: string[];
};

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function mergeNews(api: ApiNewsArticle[] | undefined): MergedNews[] {
  const fromApi: MergedNews[] = (api ?? []).map((a) => ({
    slug: a.slug,
    tag: a.tag,
    title: a.title,
    titleHi: a.titleHi || a.title,
    date: fmtDate(a.publishedAt),
    iso: a.publishedAt ?? '',
    image: a.image,
    imageUri: a.image ? (a.image.startsWith('http') ? a.image : `${SITE_ASSETS}/bcpl-assets/news/${a.image}`) : '',
    paragraphs: a.paragraphs,
    paragraphsHi: a.paragraphsHi,
    press: a.press,
  }));
  const apiSlugs = new Set(fromApi.map((a) => a.slug));
  const statics: MergedNews[] = NEWS_ARTICLES.filter((s) => !apiSlugs.has(s.slug)).map((s) => ({
    ...s,
    imageUri: `${SITE_ASSETS}/bcpl-assets/news/${s.image}`,
  }));
  return [...fromApi, ...statics];
}
