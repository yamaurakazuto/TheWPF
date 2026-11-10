import type { Chapter } from '@/types/content'
export { chapterMetas, metaOf } from './meta'

/** 章本文の遅延ローダー。章を追加するときはここと meta.ts に 1 つずつ足す */
const loaders: Record<string, () => Promise<{ default: Chapter }>> = {
  history: () => import('./chapters/ch01-history'),
  architecture: () => import('./chapters/ch02-architecture'),
  foundation: () => import('./chapters/ch03-foundation'),
  'binding-mvvm': () => import('./chapters/ch04-binding-mvvm'),
  dispatcher: () => import('./chapters/ch05-dispatcher'),
  tradeoffs: () => import('./chapters/ch06-tradeoffs'),
  practice: () => import('./chapters/ch07-practice'),
  roadmap: () => import('./chapters/ch08-roadmap'),
}

const cache = new Map<string, Chapter>()

export async function loadChapter(slug: string): Promise<Chapter | null> {
  const hit = cache.get(slug)
  if (hit) return hit
  const loader = loaders[slug]
  if (!loader) return null
  const chapter = (await loader()).default
  cache.set(slug, chapter)
  return chapter
}

export async function loadAllChapters(): Promise<Chapter[]> {
  const all = await Promise.all(Object.keys(loaders).map((s) => loadChapter(s)))
  return all.filter((c): c is Chapter => c !== null)
}
