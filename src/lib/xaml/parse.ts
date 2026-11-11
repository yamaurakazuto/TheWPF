import type { XamlNode } from '@/types/content'

/**
 * 行番号を保持する小さな XML パーサ。
 * DOMParser は行番号を返さず、エラーメッセージもブラウザごとに違うため自前で持つ。
 * 対応: 要素 / 属性 / テキスト / コメント / CDATA / XML 宣言 / 定義済み実体参照。
 * 非対応: DTD、名前空間の検証（プレフィックスは名前の一部としてそのまま保持する）。
 */
export class XamlParseError extends Error {
  line: number
  constructor(message: string, line: number) {
    super(message)
    this.name = 'XamlParseError'
    this.line = line
  }
}

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : m
    }
    return ENTITIES[e] ?? m
  })
}

const NAME = /[A-Za-z_][\w.:-]*/y

export function parseXaml(src: string): XamlNode {
  let i = 0
  let line = 1
  const n = src.length
  let root: XamlNode | null = null
  const stack: XamlNode[] = []

  const advance = (to: number) => {
    for (let k = i; k < to; k++) if (src.charCodeAt(k) === 10) line++
    i = to
  }
  const skipWs = () => {
    let k = i
    while (k < n && /\s/.test(src[k])) k++
    advance(k)
  }
  const readName = (): string => {
    NAME.lastIndex = i
    const m = NAME.exec(src)
    if (!m) throw new XamlParseError('要素名または属性名が必要です', line)
    advance(i + m[0].length)
    return m[0]
  }

  while (i < n) {
    if (src[i] !== '<') {
      // テキスト
      let end = src.indexOf('<', i)
      if (end < 0) end = n
      const raw = src.slice(i, end)
      const text = decode(raw).trim()
      if (text) {
        const cur = stack[stack.length - 1]
        if (!cur) throw new XamlParseError('ルート要素の外にテキストがあります', line)
        cur.text = cur.text ? `${cur.text} ${text}` : text
      }
      advance(end)
      continue
    }

    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4)
      if (end < 0) throw new XamlParseError('コメントが閉じられていません（--> が必要）', line)
      advance(end + 3)
      continue
    }
    if (src.startsWith('<?', i)) {
      const end = src.indexOf('?>', i + 2)
      if (end < 0) throw new XamlParseError('<? ... ?> が閉じられていません', line)
      advance(end + 2)
      continue
    }
    if (src.startsWith('<![CDATA[', i)) {
      const end = src.indexOf(']]>', i + 9)
      if (end < 0) throw new XamlParseError('CDATA が閉じられていません', line)
      const cur = stack[stack.length - 1]
      if (cur) cur.text += src.slice(i + 9, end)
      advance(end + 3)
      continue
    }

    if (src[i + 1] === '/') {
      // 終了タグ
      const startLine = line
      advance(i + 2)
      const name = readName()
      skipWs()
      if (src[i] !== '>') throw new XamlParseError(`</${name} の後に > が必要です`, line)
      advance(i + 1)
      const cur = stack.pop()
      if (!cur) throw new XamlParseError(`対応する開始タグのない </${name}> があります`, startLine)
      if (cur.name !== name) {
        throw new XamlParseError(
          `<${cur.name}>（${cur.line} 行目）を閉じる前に </${name}> が現れました`,
          startLine,
        )
      }
      cur.endLine = line
      continue
    }

    // 開始タグ
    const startLine = line
    advance(i + 1)
    const name = readName()
    const node: XamlNode = {
      name,
      attrs: [],
      children: [],
      text: '',
      line: startLine,
      endLine: startLine,
      parent: stack[stack.length - 1] ?? null,
    }

    for (;;) {
      skipWs()
      if (i >= n) throw new XamlParseError(`<${name}> のタグが閉じられていません`, startLine)
      if (src[i] === '>') {
        advance(i + 1)
        if (node.parent) node.parent.children.push(node)
        else if (root) throw new XamlParseError('ルート要素は 1 つだけにしてください', startLine)
        else root = node
        stack.push(node)
        break
      }
      if (src[i] === '/' && src[i + 1] === '>') {
        advance(i + 2)
        node.endLine = line
        if (node.parent) node.parent.children.push(node)
        else if (root) throw new XamlParseError('ルート要素は 1 つだけにしてください', startLine)
        else root = node
        break
      }
      const attrLine = line
      const attr = readName()
      skipWs()
      if (src[i] !== '=') throw new XamlParseError(`属性 ${attr} に = と値が必要です`, attrLine)
      advance(i + 1)
      skipWs()
      const q = src[i]
      if (q !== '"' && q !== "'") throw new XamlParseError(`属性 ${attr} の値は引用符で囲んでください`, attrLine)
      const end = src.indexOf(q, i + 1)
      if (end < 0) throw new XamlParseError(`属性 ${attr} の引用符が閉じられていません`, attrLine)
      const value = decode(src.slice(i + 1, end))
      if (node.attrs.some((a) => a.name === attr)) {
        throw new XamlParseError(`属性 ${attr} が同じ要素に 2 回書かれています`, attrLine)
      }
      node.attrs.push({ name: attr, value })
      advance(end + 1)
    }
  }

  if (stack.length) {
    const open = stack[stack.length - 1]
    throw new XamlParseError(`<${open.name}> が閉じられていません`, open.line)
  }
  if (!root) throw new XamlParseError('要素がありません', 1)
  return root
}

/** 安全版: 失敗時は null とエラーを返す */
export function tryParseXaml(src: string): { root: XamlNode | null; error: XamlParseError | null } {
  try {
    return { root: parseXaml(src), error: null }
  } catch (e) {
    if (e instanceof XamlParseError) return { root: null, error: e }
    throw e
  }
}

export function attr(node: XamlNode, name: string): string | undefined {
  return node.attrs.find((a) => a.name === name)?.value
}

/** プレフィックスを除いた要素名（"local:MyControl" → "MyControl"） */
export function localName(node: XamlNode): string {
  const i = node.name.indexOf(':')
  return i >= 0 ? node.name.slice(i + 1) : node.name
}

export function walk(node: XamlNode, visit: (n: XamlNode) => void): void {
  visit(node)
  for (const c of node.children) walk(c, visit)
}

export function flatten(root: XamlNode | null): XamlNode[] {
  const out: XamlNode[] = []
  if (root) walk(root, (x) => out.push(x))
  return out
}

/** プロパティ要素（<Grid.RowDefinitions> など）かどうか */
export function isPropertyElement(node: XamlNode): boolean {
  return node.name.includes('.')
}
