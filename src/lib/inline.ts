/**
 * 文章用のごく小さなインライン記法。
 *   `code` / **強調** / [表示](URL) / [[用語ID]] / [[用語ID|表示]]
 * Markdown 全体は要らないので、必要な 4 種類だけを自前で解釈する。
 */
export type InlineToken =
  | { t: 'text'; v: string }
  | { t: 'code'; v: string }
  | { t: 'strong'; v: InlineToken[] }
  | { t: 'link'; v: InlineToken[]; href: string }
  | { t: 'term'; id: string; v: string | null }

const RE = /`([^`]+)`|\*\*([^*]+)\*\*|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)\s]+)\)/g

const cache = new Map<string, InlineToken[]>()

export function parseInline(src: string): InlineToken[] {
  const hit = cache.get(src)
  if (hit) return hit
  const out: InlineToken[] = []
  let last = 0
  for (const m of src.matchAll(RE)) {
    const i = m.index ?? 0
    if (i > last) out.push({ t: 'text', v: src.slice(last, i) })
    if (m[1] !== undefined) out.push({ t: 'code', v: m[1] })
    else if (m[2] !== undefined) out.push({ t: 'strong', v: parseInline(m[2]) })
    else if (m[3] !== undefined) out.push({ t: 'term', id: m[3].trim(), v: m[4] ?? null })
    else if (m[5] !== undefined && m[6] !== undefined) out.push({ t: 'link', v: parseInline(m[5]), href: m[6] })
    last = i + m[0].length
  }
  if (last < src.length) out.push({ t: 'text', v: src.slice(last) })
  cache.set(src, out)
  return out
}

/** 記法を取り除いたプレーンテキスト（aria-label などに使う） */
export function plainText(src: string): string {
  const walk = (ts: InlineToken[]): string =>
    ts
      .map((t) => {
        if (t.t === 'text' || t.t === 'code') return t.v
        if (t.t === 'term') return t.v ?? t.id
        return walk(t.v)
      })
      .join('')
  return walk(parseInline(src))
}
