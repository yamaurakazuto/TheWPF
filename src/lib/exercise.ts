import type { CheckContext, Exercise, XamlNode } from '@/types/content'
import { flatten, localName, tryParseXaml, type XamlParseError } from './xaml/parse'

/**
 * 演習の判定。
 * ブラウザ内では C# も XAML もコンパイルできないので、
 *   - XAML / XML: パースして要素・属性を検査
 *   - C#: コメントと文字列の中身を除いたテキストに対するパターン検査
 * という「構造チェック」で判定する。合格 = ビルドが通る、ではない点は UI にも明記している。
 */

/** C# のコメントを取り除く（文字列リテラルの中の // は残す） */
export function stripCSharpComments(src: string): string {
  let out = ''
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    const d = src[i + 1]
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') i++
    } else if (c === '/' && d === '*') {
      const end = src.indexOf('*/', i + 2)
      i = end < 0 ? n : end + 2
      out += ' '
    } else if (c === '"' || c === "'") {
      // 逐語的文字列 @"..." は "" がエスケープ
      const verbatim = c === '"' && (src[i - 1] === '@' || (src[i - 1] === '$' && src[i - 2] === '@'))
      let j = i + 1
      while (j < n) {
        if (verbatim) {
          if (src[j] === '"' && src[j + 1] === '"') j += 2
          else if (src[j] === '"') break
          else j++
        } else {
          if (src[j] === '\\') j += 2
          else if (src[j] === c || src[j] === '\n') break
          else j++
        }
      }
      out += src.slice(i, j + 1)
      i = j + 1
    } else {
      out += c
      i++
    }
  }
  return out
}

export function stripXmlComments(src: string): string {
  return src.replace(/<!--[\s\S]*?-->/g, '')
}

export interface CheckOutcome {
  results: { label: string; ok: boolean }[]
  passed: boolean
  parseError: XamlParseError | null
}

export function buildContext(code: string, lang: Exercise['lang']): { ctx: CheckContext; parseError: XamlParseError | null } {
  const isXml = lang === 'xaml' || lang === 'xml'
  const stripped = isXml ? stripXmlComments(code) : stripCSharpComments(code)
  const flat = stripped.replace(/\s+/g, ' ').trim()
  let xml: XamlNode | null = null
  let parseError: XamlParseError | null = null
  if (isXml) {
    const r = tryParseXaml(code)
    xml = r.root
    parseError = r.error
  }
  const all = flatten(xml)
  const ctx: CheckContext = {
    code: stripped,
    flat,
    xml,
    all,
    els: (name) => all.filter((n) => n.name === name || localName(n) === name),
    has: (re) => re.test(flat),
  }
  return { ctx, parseError }
}

export function runChecks(exercise: Exercise, code: string): CheckOutcome {
  const { ctx, parseError } = buildContext(code, exercise.lang)
  const results = exercise.checks.map((c) => {
    let ok = false
    try {
      ok = !parseError && c.test(ctx)
    } catch {
      ok = false
    }
    return { label: c.label, ok }
  })
  return { results, passed: results.every((r) => r.ok), parseError }
}

// ───────── チェックを書くときの小道具 ─────────

/** 要素 node の属性値（なければ undefined） */
export function a(node: XamlNode | undefined, name: string): string | undefined {
  return node?.attrs.find((x) => x.name === name)?.value
}

/** 属性値が {Binding ...} で、指定したパスを含むか */
export function bindsTo(value: string | undefined, path: string): boolean {
  if (!value) return false
  const m = /^\{\s*Binding\b(.*)\}$/s.exec(value.trim())
  if (!m) return false
  const body = m[1]
  return new RegExp(`(^|[\\s,])(Path\\s*=\\s*)?${path.replace(/\./g, '\\.')}\\s*(,|$)`).test(body.trim())
}

/** マークアップ拡張の中に `key=value` があるか（空白の揺れを許す） */
export function hasOption(value: string | undefined, key: string, val: string): boolean {
  if (!value) return false
  return new RegExp(`\\b${key}\\s*=\\s*${val}\\b`).test(value)
}
