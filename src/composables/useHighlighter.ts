import type { HighlighterCore } from 'shiki/core'
import type { CodeLang } from '@/types/content'

/**
 * Shiki を「必要な文法とテーマだけ」個別 import して使う。
 * 正規表現エンジンは JavaScript 実装（WASM を配らずに済む）。
 * 出力はトークン配列で受け取り、Vue 側で <span> に描く（v-html を使わない）。
 */
export interface Tok {
  content: string
  style: Record<string, string>
}

const SHIKI_LANG: Record<Exclude<CodeLang, 'text'>, string> = {
  csharp: 'csharp',
  xaml: 'xml', // XAML は XML の方言なので XML 文法で正確に色付けできる
  xml: 'xml',
  json: 'json',
  powershell: 'powershell',
}

let pending: Promise<HighlighterCore> | null = null

function getHighlighter(): Promise<HighlighterCore> {
  pending ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ])
    return createHighlighterCore({
      themes: [import('shiki/themes/github-light-default.mjs'), import('shiki/themes/github-dark-default.mjs')],
      langs: [
        import('shiki/langs/csharp.mjs'),
        import('shiki/langs/xml.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/powershell.mjs'),
      ],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return pending
}

export function plainTokens(code: string): Tok[][] {
  return code.split('\n').map((line) => [{ content: line, style: {} }])
}

function toStyle(s: unknown): Record<string, string> {
  if (!s) return {}
  if (typeof s === 'string') {
    const out: Record<string, string> = {}
    for (const part of s.split(';')) {
      const i = part.indexOf(':')
      if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
    }
    return out
  }
  return s as Record<string, string>
}

const KEEP = ['--shiki-light', '--shiki-dark']

/** コードを行 × トークンに分解して返す。失敗時は素のテキストにフォールバックする */
export async function tokenize(code: string, lang: CodeLang): Promise<Tok[][]> {
  if (lang === 'text') return plainTokens(code)
  try {
    const h = await getHighlighter()
    const res = h.codeToTokens(code, {
      lang: SHIKI_LANG[lang],
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
      defaultColor: false,
    })
    return res.tokens.map((line) =>
      line.map((t) => {
        const style = toStyle(t.htmlStyle)
        // 文字色だけ残す（背景はサイト側のトークンで統一する）
        const picked: Record<string, string> = {}
        for (const k of KEEP) if (style[k]) picked[k] = style[k]
        return { content: t.content, style: picked }
      }),
    )
  } catch (e) {
    console.warn('[theWPF] highlight failed', e)
    return plainTokens(code)
  }
}
