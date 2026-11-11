import type { XamlNode } from '@/types/content'
import { attr, isPropertyElement, localName } from './parse'

/**
 * 簡易 XAML プレビュー。XAML のよく使う部分集合を HTML/CSS に写して「だいたいの見た目」を出す。
 *
 * これは WPF のレンダラーではない。レイアウトは CSS の flex / grid による近似で、
 * バインディング・ControlTemplate・アニメーションは評価しない。
 * 学習用に「XAML のどの記述が画面のどこに対応するか」を確かめるためのもの。
 *
 * 安全性: DOM は createElement と textContent だけで組み立てる（innerHTML は使わない）。
 */

export interface PreviewResult {
  el: HTMLElement
  warnings: string[]
}

type Props = Map<string, string>

interface StyleDef {
  key: string | null
  targetType: string | null
  basedOn: string | null
  setters: [string, string][]
  triggers: { property: string; value: string; setters: [string, string][] }[]
}

interface Scope {
  brushes: Map<string, string>
  styles: StyleDef[]
  parent: Scope | null
}

const CONTENT_HOSTS = new Set([
  'Window',
  'UserControl',
  'Page',
  'Border',
  'ContentControl',
  'ScrollViewer',
  'Viewbox',
  'GroupBox',
  'Expander',
])

// ───────── 値の解釈 ─────────

function markup(v: string): { ext: string; arg: string } | null {
  const m = /^\{\s*([\w:]+)\s*(.*)\}$/s.exec(v.trim())
  return m ? { ext: m[1], arg: m[2].trim() } : null
}

function lookupBrush(scope: Scope | null, key: string): string | undefined {
  for (let s = scope; s; s = s.parent) {
    const hit = s.brushes.get(key)
    if (hit) return hit
  }
  return undefined
}

function lookupStyleByKey(scope: Scope | null, key: string): StyleDef | undefined {
  for (let s = scope; s; s = s.parent) {
    const hit = s.styles.find((x) => x.key === key)
    if (hit) return hit
  }
  return undefined
}

function lookupImplicitStyle(scope: Scope | null, type: string): StyleDef | undefined {
  for (let s = scope; s; s = s.parent) {
    const hit = s.styles.find((x) => x.key === null && x.targetType === type)
    if (hit) return hit
  }
  return undefined
}

/** WPF の色表記 → CSS の色。#AARRGGBB は rgba() に直す */
export function toCssColor(v: string, scope: Scope | null = null): string | null {
  const s = v.trim()
  const mk = markup(s)
  if (mk) {
    if (mk.ext === 'StaticResource' || mk.ext === 'DynamicResource') {
      const key = mk.arg.replace(/^ResourceKey\s*=\s*/, '')
      return lookupBrush(scope, key) ?? null
    }
    if (mk.ext === 'x:Null') return 'transparent'
    return null
  }
  if (/^#[0-9a-fA-F]{8}$/.test(s)) {
    const a = parseInt(s.slice(1, 3), 16) / 255
    const r = parseInt(s.slice(3, 5), 16)
    const g = parseInt(s.slice(5, 7), 16)
    const b = parseInt(s.slice(7, 9), 16)
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`
  }
  if (/^#[0-9a-fA-F]{4}$/.test(s)) {
    const [a, r, g, b] = s
      .slice(1)
      .split('')
      .map((c) => parseInt(c + c, 16))
    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
  }
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)) return s
  if (/^[A-Za-z]+$/.test(s)) return s.toLowerCase() // 名前付き色は CSS とほぼ共通
  return null
}

function px(v: string | undefined): string | null {
  if (v === undefined) return null
  const t = v.trim()
  if (t === 'Auto' || t === 'NaN') return null
  const num = Number(t)
  return Number.isFinite(num) ? `${num}px` : null
}

/** Thickness: "8" / "8,4" / "1,2,3,4"（左,上,右,下）→ CSS の 上 右 下 左 */
function thickness(v: string | undefined): string | null {
  if (!v) return null
  const p = v
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
  if (p.some((x) => !Number.isFinite(x))) return null
  if (p.length === 1) return `${p[0]}px`
  if (p.length === 2) return `${p[1]}px ${p[0]}px`
  if (p.length === 4) return `${p[1]}px ${p[2]}px ${p[3]}px ${p[0]}px`
  return null
}

function cornerRadius(v: string | undefined): string | null {
  if (!v) return null
  const p = v
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
  if (p.some((x) => !Number.isFinite(x))) return null
  // CornerRadius は 左上,右上,右下,左下。CSS の border-radius と同じ順
  return p.map((x) => `${x}px`).join(' ')
}

function gridLength(v: string): string {
  const t = v.trim()
  if (t === '' || t === '*') return 'minmax(0, 1fr)'
  if (/^auto$/i.test(t)) return 'auto'
  const star = /^([\d.]+)\*$/.exec(t)
  if (star) return `minmax(0, ${Number(star[1])}fr)`
  const num = Number(t)
  return Number.isFinite(num) ? `${num}px` : 'auto'
}

const H_ALIGN: Record<string, string> = { Left: 'start', Center: 'center', Right: 'end', Stretch: 'stretch' }
const V_ALIGN: Record<string, string> = { Top: 'start', Center: 'center', Bottom: 'end', Stretch: 'stretch' }

// ───────── リソースとスタイル ─────────

function readSetters(owner: XamlNode): [string, string][] {
  const out: [string, string][] = []
  for (const c of owner.children) {
    if (localName(c) !== 'Setter') continue
    const prop = attr(c, 'Property')
    let value = attr(c, 'Value')
    if (value === undefined) {
      // <Setter.Value><SolidColorBrush Color="..."/></Setter.Value> だけ拾う
      const brush = c.children.find((x) => x.name === 'Setter.Value')?.children.find((x) => localName(x) === 'SolidColorBrush')
      value = brush ? attr(brush, 'Color') : undefined
    }
    if (prop && value !== undefined) out.push([prop, value])
  }
  return out
}

function typeName(v: string | undefined): string | null {
  if (!v) return null
  const mk = markup(v)
  const raw = mk && mk.ext === 'x:Type' ? mk.arg : v
  const i = raw.indexOf(':')
  return (i >= 0 ? raw.slice(i + 1) : raw).trim()
}

function readScope(node: XamlNode, parent: Scope | null, warnings: string[]): Scope {
  const scope: Scope = { brushes: new Map(), styles: [], parent }
  const holder = node.children.find((c) => c.name === `${node.name}.Resources`)
  if (!holder) return scope
  let items = holder.children
  // <ResourceDictionary> で包まれていれば中身を見る（MergedDictionaries は外部ファイルなので読めない）
  if (items.length === 1 && localName(items[0]) === 'ResourceDictionary') items = items[0].children
  for (const r of items) {
    const kind = localName(r)
    const key = attr(r, 'x:Key') ?? null
    if (kind === 'SolidColorBrush' && key) {
      const c = toCssColor(attr(r, 'Color') ?? '', parent)
      if (c) scope.brushes.set(key, c)
    } else if (kind === 'Style') {
      const basedOnMk = markup(attr(r, 'BasedOn') ?? '')
      const def: StyleDef = {
        key,
        targetType: typeName(attr(r, 'TargetType')),
        basedOn: basedOnMk ? basedOnMk.arg.replace(/^ResourceKey\s*=\s*/, '') : null,
        setters: readSetters(r),
        triggers: [],
      }
      const trig = r.children.find((c) => c.name === 'Style.Triggers')
      for (const t of trig?.children ?? []) {
        if (localName(t) !== 'Trigger') continue
        const property = attr(t, 'Property')
        const value = attr(t, 'Value')
        if (property && value !== undefined) def.triggers.push({ property, value, setters: readSetters(t) })
      }
      if (def.setters.some(([p]) => p === 'Template')) {
        warnings.push('Style 内の Template（ControlTemplate）はプレビューでは反映されません')
      }
      scope.styles.push(def)
    } else if (kind.endsWith('.MergedDictionaries')) {
      warnings.push('MergedDictionaries（外部ファイル）はプレビューでは読み込めません')
    }
  }
  return scope
}

/** BasedOn をたどって Setter を基底→派生の順に並べる */
function flattenStyle(def: StyleDef, scope: Scope | null, depth = 0): StyleDef {
  if (!def.basedOn || depth > 8) return def
  // BasedOn="{StaticResource {x:Type Button}}" は「Button の暗黙スタイル」を指す
  const base = def.basedOn.startsWith('{')
    ? lookupImplicitStyle(scope, typeName(def.basedOn) ?? '')
    : lookupStyleByKey(scope, def.basedOn)
  if (!base || base === def) return def
  const b = flattenStyle(base, scope, depth + 1)
  return { ...def, setters: [...b.setters, ...def.setters], triggers: [...b.triggers, ...def.triggers] }
}

// ───────── 要素の生成 ─────────

interface Ctx {
  warnings: string[]
  unknown: Set<string>
}

function contentChildren(node: XamlNode): XamlNode[] {
  return node.children.filter((c) => !isPropertyElement(c))
}

function isBinding(v: string): boolean {
  const mk = markup(v)
  return !!mk && /^(Binding|x:Bind|TemplateBinding)$/.test(mk.ext)
}

function textNode(text: string): HTMLElement {
  const span = document.createElement('span')
  if (isBinding(text)) {
    span.className = 'xp-binding'
    span.title = 'バインディング式はプレビューでは評価されません'
  }
  span.textContent = text
  return span
}

function collectProps(node: XamlNode, type: string, scope: Scope): { base: Props; style: StyleDef | null } {
  const props: Props = new Map()
  // 優先順位は WPF と同じ: スタイルの Setter < ローカル値
  let style: StyleDef | null = null
  const styleAttr = attr(node, 'Style')
  if (styleAttr) {
    const mk = markup(styleAttr)
    if (mk && (mk.ext === 'StaticResource' || mk.ext === 'DynamicResource')) {
      style = lookupStyleByKey(scope, mk.arg.replace(/^ResourceKey\s*=\s*/, '')) ?? null
    }
  } else {
    style = lookupImplicitStyle(scope, type) ?? null
  }
  if (style) {
    style = flattenStyle(style, scope)
    for (const [k, v] of style.setters) props.set(k, v)
  }
  return { base: props, style }
}

function localProps(node: XamlNode): Props {
  const p: Props = new Map()
  for (const a of node.attrs) p.set(a.name, a.value)
  return p
}

/** 見た目に関するプロパティ（トリガーで変わりうるもの）を反映する */
function applyVisual(el: HTMLElement, type: string, p: Props, scope: Scope) {
  const s = el.style
  const bg = p.get('Background') ?? p.get('Fill')
  s.background = (bg && toCssColor(bg, scope)) || ''
  const fg = p.get('Foreground')
  s.color = (fg && toCssColor(fg, scope)) || ''

  const bt = thickness(p.get('BorderThickness') ?? p.get('StrokeThickness'))
  const bb = p.get('BorderBrush') ?? p.get('Stroke')
  const bbc = bb ? toCssColor(bb, scope) : null
  if (bt || bbc) {
    s.borderStyle = 'solid'
    s.borderWidth = bt ?? (type === 'Border' ? '0' : '1px')
    s.borderColor = bbc ?? 'transparent'
  } else {
    s.borderStyle = ''
    s.borderWidth = ''
    s.borderColor = ''
  }
  const cr = cornerRadius(p.get('CornerRadius') ?? p.get('RadiusX'))
  s.borderRadius = cr ?? (type === 'Ellipse' ? '50%' : '')

  s.fontSize = px(p.get('FontSize')) ?? ''
  const fw = p.get('FontWeight')
  s.fontWeight = fw ? ({ Bold: '700', SemiBold: '600', Medium: '500', Normal: '400', Light: '300' }[fw] ?? '') : ''
  s.fontStyle = p.get('FontStyle') === 'Italic' ? 'italic' : ''
  const ff = p.get('FontFamily')
  s.fontFamily = ff && /^[\w\s,-]+$/.test(ff) ? `"${ff.split(',')[0].trim()}", sans-serif` : ''
  const op = Number(p.get('Opacity'))
  s.opacity = p.has('Opacity') && Number.isFinite(op) ? String(op) : ''
  const cursor = p.get('Cursor')
  s.cursor = cursor === 'Hand' ? 'pointer' : ''
}

function applyLayout(el: HTMLElement, node: XamlNode, p: Props, parentType: string | null) {
  const s = el.style
  const set = (k: 'width' | 'height' | 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight', v: string | null) => {
    if (v) s[k] = v
  }
  set('width', px(p.get('Width')))
  set('height', px(p.get('Height')))
  set('minWidth', px(p.get('MinWidth')))
  set('maxWidth', px(p.get('MaxWidth')))
  set('minHeight', px(p.get('MinHeight')))
  set('maxHeight', px(p.get('MaxHeight')))
  const m = thickness(p.get('Margin'))
  if (m) s.margin = m
  const pad = thickness(p.get('Padding'))
  if (pad) s.padding = pad

  const vis = p.get('Visibility')
  if (vis === 'Collapsed') s.display = 'none'
  else if (vis === 'Hidden') s.visibility = 'hidden'

  // 幅や高さを明示した要素は、WPF では Stretch 指定でも中央に置かれる
  const ha = p.get('HorizontalAlignment') ?? (p.has('Width') ? 'Center' : 'Stretch')
  const va = p.get('VerticalAlignment') ?? (p.has('Height') ? 'Center' : 'Stretch')

  if (parentType === 'StackPanel:Vertical') {
    s.alignSelf = H_ALIGN[ha] ?? 'stretch'
    s.flex = 'none'
  } else if (parentType === 'StackPanel:Horizontal') {
    s.alignSelf = V_ALIGN[va] ?? 'stretch'
    s.flex = 'none'
  } else if (parentType === 'WrapPanel') {
    s.flex = 'none'
  } else if (parentType === 'Canvas') {
    s.position = 'absolute'
    s.left = px(p.get('Canvas.Left')) ?? '0'
    s.top = px(p.get('Canvas.Top')) ?? '0'
  } else if (parentType === 'Dock') {
    // DockPanel の子: ドック方向と直交する軸には伸びる
  } else {
    // Grid のセル、または単一コンテンツのホスト（1 セルの grid として表現）
    s.justifySelf = H_ALIGN[ha] ?? 'stretch'
    s.alignSelf = V_ALIGN[va] ?? 'stretch'
  }

  if (parentType === 'Grid') {
    const row = Number(p.get('Grid.Row') ?? 0) + 1
    const col = Number(p.get('Grid.Column') ?? 0) + 1
    const rs = Number(p.get('Grid.RowSpan') ?? 1)
    const cs = Number(p.get('Grid.ColumnSpan') ?? 1)
    s.gridRow = `${row} / span ${rs}`
    s.gridColumn = `${col} / span ${cs}`
  } else if (parentType === 'Cell') {
    s.gridArea = '1 / 1'
  }
  const z = p.get('Panel.ZIndex')
  if (z && Number.isFinite(Number(z))) {
    s.zIndex = z
    if (!s.position) s.position = 'relative'
  }
  const tip = p.get('ToolTip')
  if (tip && !markup(tip)) el.title = tip
  if (p.get('IsEnabled') === 'False') el.classList.add('xp-disabled')
  el.dataset.xl = String(node.line)
  el.dataset.xe = String(node.endLine)
}

function build(node: XamlNode, parentScope: Scope, parentType: string | null, ctx: Ctx): HTMLElement {
  const type = localName(node)
  const scope = readScope(node, parentScope, ctx.warnings)
  const { base, style } = collectProps(node, type, scope)
  const local = localProps(node)
  const merged = (extra?: [string, string][]): Props => {
    const p: Props = new Map(base)
    for (const [k, v] of extra ?? []) p.set(k, v)
    for (const [k, v] of local) p.set(k, v)
    return p
  }
  const p = merged()
  const kids = contentChildren(node)
  let el: HTMLElement
  /** 子要素を入れる場所（el と違う場合がある） */
  let host: HTMLElement | null = null
  let childParentType: string | null = 'Cell'

  const single = (cls: string, tag = 'div') => {
    const d = document.createElement(tag)
    d.className = `xp-cell ${cls}`
    return d
  }

  switch (type) {
    case 'Window': {
      el = document.createElement('div')
      el.className = 'xp-window'
      const bar = document.createElement('div')
      bar.className = 'xp-window__bar'
      const title = document.createElement('span')
      title.textContent = p.get('Title') ?? ''
      const btns = document.createElement('span')
      btns.className = 'xp-window__btns'
      btns.textContent = '─  ☐  ✕'
      btns.setAttribute('aria-hidden', 'true')
      bar.append(title, btns)
      host = single('xp-window__client')
      el.append(bar, host)
      // Window の Width/Height は枠込みのサイズ。ここではクライアント領域の目安として使う
      const w = px(p.get('Width'))
      const h = px(p.get('Height'))
      if (w) el.style.width = w
      if (h) host.style.height = `calc(${h} - 31px)`
      const bg = p.get('Background')
      if (bg) host.style.background = toCssColor(bg, scope) ?? ''
      el.dataset.xl = String(node.line)
      el.dataset.xe = String(node.endLine)
      for (const c of kids) host.append(build(c, scope, 'Cell', ctx))
      return el
    }
    case 'UserControl':
    case 'Page':
    case 'ContentControl':
    case 'Viewbox':
    case 'Border': {
      el = single(`xp-${type.toLowerCase()}`)
      host = el
      break
    }
    case 'ScrollViewer': {
      el = single('xp-scroll')
      host = el
      break
    }
    case 'GroupBox': {
      el = document.createElement('fieldset')
      el.className = 'xp-groupbox'
      const lg = document.createElement('legend')
      lg.textContent = p.get('Header') ?? ''
      host = single('')
      el.append(lg, host)
      break
    }
    case 'Expander': {
      el = document.createElement('details')
      el.className = 'xp-expander'
      if (p.get('IsExpanded') === 'True') (el as HTMLDetailsElement).open = true
      const sm = document.createElement('summary')
      sm.textContent = p.get('Header') ?? ''
      host = single('')
      el.append(sm, host)
      break
    }
    case 'StackPanel': {
      const horizontal = p.get('Orientation') === 'Horizontal'
      el = document.createElement('div')
      el.className = `xp-stack ${horizontal ? 'xp-stack--h' : 'xp-stack--v'}`
      host = el
      childParentType = horizontal ? 'StackPanel:Horizontal' : 'StackPanel:Vertical'
      break
    }
    case 'WrapPanel': {
      el = document.createElement('div')
      el.className = 'xp-wrap'
      if (p.get('Orientation') === 'Vertical') el.style.flexDirection = 'column'
      host = el
      childParentType = 'WrapPanel'
      break
    }
    case 'Canvas': {
      el = document.createElement('div')
      el.className = 'xp-canvas'
      host = el
      childParentType = 'Canvas'
      break
    }
    case 'UniformGrid': {
      el = document.createElement('div')
      el.className = 'xp-grid'
      const cols = Number(p.get('Columns')) || Math.ceil(Math.sqrt(kids.length || 1))
      const rows = Number(p.get('Rows')) || Math.ceil((kids.length || 1) / cols)
      el.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`
      el.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`
      host = el
      childParentType = 'Uniform'
      break
    }
    case 'Grid': {
      el = document.createElement('div')
      el.className = 'xp-grid'
      const defs = (prop: 'RowDefinitions' | 'ColumnDefinitions', itemName: string, lenAttr: string): string => {
        const short = p.get(prop) // .NET 10 で追加された短縮記法: ColumnDefinitions="1*, Auto, 200"
        if (short && !markup(short)) return short.split(',').map(gridLength).join(' ')
        const holder = node.children.find((c) => c.name === `${node.name}.${prop}`)
        const items = holder?.children.filter((c) => localName(c) === itemName) ?? []
        if (!items.length) return 'minmax(0, 1fr)'
        return items.map((d) => gridLength(attr(d, lenAttr) ?? '*')).join(' ')
      }
      el.style.gridTemplateRows = defs('RowDefinitions', 'RowDefinition', 'Height')
      el.style.gridTemplateColumns = defs('ColumnDefinitions', 'ColumnDefinition', 'Width')
      if (p.get('ShowGridLines') === 'True') el.classList.add('xp-grid--lines')
      host = el
      childParentType = 'Grid'
      break
    }
    case 'DockPanel': {
      el = document.createElement('div')
      el.className = 'xp-dock'
      const lastFill = p.get('LastChildFill') !== 'False'
      let cur: HTMLElement = el
      kids.forEach((c, idx) => {
        const child = build(c, scope, 'Dock', ctx)
        const isLast = idx === kids.length - 1
        if (isLast && lastFill) {
          child.style.flex = '1 1 auto'
          child.style.minWidth = '0'
          child.style.minHeight = '0'
          cur.append(child)
          return
        }
        const dock = attr(c, 'DockPanel.Dock') ?? 'Left'
        const vertical = dock === 'Top' || dock === 'Bottom'
        cur.style.flexDirection = vertical ? 'column' : 'row'
        child.style.flex = 'none'
        const rest = document.createElement('div')
        rest.className = 'xp-dock xp-dock__rest'
        if (dock === 'Top' || dock === 'Left') cur.append(child, rest)
        else cur.append(rest, child)
        cur = rest
      })
      applyVisual(el, type, p, scope)
      applyLayout(el, node, p, parentType)
      return el
    }
    case 'TextBlock':
    case 'Label':
    case 'Run': {
      el = document.createElement(type === 'Run' ? 'span' : 'div')
      el.className = `xp-text xp-${type.toLowerCase()}`
      const text = p.get(type === 'Label' ? 'Content' : 'Text') ?? node.text
      if (text) el.append(textNode(text))
      for (const c of kids) {
        const k = localName(c)
        if (k === 'LineBreak') el.append(document.createElement('br'))
        else if (k === 'Run' || k === 'Bold' || k === 'Italic' || k === 'Underline' || k === 'Hyperlink') {
          const r = build({ ...c, name: 'Run' }, scope, null, ctx)
          if (k === 'Bold') r.style.fontWeight = '700'
          if (k === 'Italic') r.style.fontStyle = 'italic'
          if (k === 'Underline' || k === 'Hyperlink') r.style.textDecoration = 'underline'
          if (k === 'Hyperlink') r.style.color = '#0066cc'
          el.append(r)
        } else el.append(build(c, scope, 'Cell', ctx))
      }
      if (p.get('TextWrapping') === 'Wrap' || p.get('TextWrapping') === 'WrapWithOverflow') el.style.whiteSpace = 'normal'
      const ta = p.get('TextAlignment') ?? p.get('HorizontalContentAlignment')
      if (ta) el.style.textAlign = ta.toLowerCase()
      if (p.get('TextTrimming') && p.get('TextTrimming') !== 'None') {
        el.style.overflow = 'hidden'
        el.style.textOverflow = 'ellipsis'
      }
      break
    }
    case 'Button':
    case 'ToggleButton':
    case 'RepeatButton': {
      el = document.createElement('button')
      ;(el as HTMLButtonElement).type = 'button'
      el.className = 'xp-button xp-cell'
      host = el
      const content = p.get('Content')
      if (content !== undefined) el.append(textNode(content))
      else if (node.text) el.append(textNode(node.text))
      const hc = p.get('HorizontalContentAlignment')
      const vc = p.get('VerticalContentAlignment')
      if (hc) el.style.justifyItems = H_ALIGN[hc] ?? ''
      if (vc) el.style.alignItems = V_ALIGN[vc] ?? ''
      break
    }
    case 'TextBox':
    case 'PasswordBox': {
      const input = document.createElement('input')
      input.type = type === 'PasswordBox' ? 'password' : 'text'
      input.className = 'xp-textbox'
      const text = p.get('Text') ?? node.text
      if (text && isBinding(text)) {
        input.placeholder = text
        input.title = 'バインディング式はプレビューでは評価されません'
      } else if (text) input.value = text
      if (p.get('IsReadOnly') === 'True') input.readOnly = true
      input.setAttribute('aria-label', attr(node, 'x:Name') ?? type)
      el = input
      break
    }
    case 'CheckBox':
    case 'RadioButton': {
      el = document.createElement('label')
      el.className = 'xp-check'
      const input = document.createElement('input')
      input.type = type === 'CheckBox' ? 'checkbox' : 'radio'
      if (type === 'RadioButton') input.name = `xp-${p.get('GroupName') ?? node.parent?.line ?? 0}`
      input.checked = p.get('IsChecked') === 'True'
      el.append(input)
      const content = p.get('Content') ?? node.text
      if (content) el.append(textNode(content))
      host = el
      break
    }
    case 'ComboBox': {
      const sel = document.createElement('select')
      sel.className = 'xp-combo'
      kids.forEach((c, idx) => {
        const o = document.createElement('option')
        o.textContent = attr(c, 'Content') ?? c.text
        if (attr(c, 'IsSelected') === 'True' || String(idx) === p.get('SelectedIndex')) o.selected = true
        sel.append(o)
      })
      sel.setAttribute('aria-label', attr(node, 'x:Name') ?? 'ComboBox')
      el = sel
      break
    }
    case 'ListBox':
    case 'ListView': {
      el = document.createElement('div')
      el.className = 'xp-listbox'
      kids.forEach((c, idx) => {
        const item = document.createElement('div')
        item.className = 'xp-listbox__item'
        if (attr(c, 'IsSelected') === 'True' || String(idx) === p.get('SelectedIndex')) item.classList.add('is-selected')
        const content = attr(c, 'Content') ?? c.text
        if (content) item.append(textNode(content))
        for (const g of contentChildren(c)) item.append(build(g, scope, 'Cell', ctx))
        item.dataset.xl = String(c.line)
        item.dataset.xe = String(c.endLine)
        el.append(item)
      })
      if (p.has('ItemsSource')) {
        const note = document.createElement('div')
        note.className = 'xp-listbox__item'
        note.append(textNode(p.get('ItemsSource')!))
        el.append(note)
      }
      break
    }
    case 'Slider': {
      const r = document.createElement('input')
      r.type = 'range'
      r.className = 'xp-slider'
      r.min = p.get('Minimum') ?? '0'
      r.max = p.get('Maximum') ?? '10'
      r.value = p.get('Value') && !markup(p.get('Value')!) ? p.get('Value')! : r.min
      r.setAttribute('aria-label', attr(node, 'x:Name') ?? 'Slider')
      el = r
      break
    }
    case 'ProgressBar': {
      el = document.createElement('div')
      el.className = 'xp-progress'
      const min = Number(p.get('Minimum') ?? 0)
      const max = Number(p.get('Maximum') ?? 100)
      const val = Number(p.get('Value') ?? 0)
      const fill = document.createElement('div')
      fill.style.width = `${Math.max(0, Math.min(100, ((val - min) / (max - min || 1)) * 100))}%`
      el.append(fill)
      break
    }
    case 'Rectangle':
    case 'Ellipse': {
      el = document.createElement('div')
      el.className = 'xp-shape'
      break
    }
    case 'Separator': {
      el = document.createElement('div')
      el.className = 'xp-separator'
      break
    }
    case 'Image': {
      el = document.createElement('div')
      el.className = 'xp-image'
      el.textContent = `🖼 ${p.get('Source') ?? 'Image'}`
      break
    }
    case 'Menu':
    case 'StatusBar':
    case 'ToolBar': {
      el = document.createElement('div')
      el.className = `xp-bar xp-${type.toLowerCase()}`
      for (const c of kids) {
        const item = document.createElement('span')
        item.className = 'xp-bar__item'
        const header = attr(c, 'Header') ?? attr(c, 'Content') ?? c.text
        if (header) item.textContent = header.replace(/_/g, '')
        else for (const g of contentChildren(c)) item.append(build(g, scope, 'Cell', ctx))
        item.dataset.xl = String(c.line)
        item.dataset.xe = String(c.endLine)
        el.append(item)
      }
      break
    }
    case 'TabControl': {
      el = document.createElement('div')
      el.className = 'xp-tabs'
      const heads = document.createElement('div')
      heads.className = 'xp-tabs__heads'
      const body = single('xp-tabs__body')
      const panes: HTMLElement[] = []
      const tabs: HTMLElement[] = []
      const select = (idx: number) => {
        tabs.forEach((t, k) => t.classList.toggle('is-selected', k === idx))
        panes.forEach((pn, k) => (pn.style.display = k === idx ? '' : 'none'))
      }
      kids.forEach((c, idx) => {
        const hd = document.createElement('button')
        hd.type = 'button'
        hd.className = 'xp-tabs__head'
        hd.textContent = attr(c, 'Header') ?? `Tab ${idx + 1}`
        hd.addEventListener('click', () => select(idx))
        heads.append(hd)
        tabs.push(hd)
        const pane = single('')
        for (const g of contentChildren(c)) pane.append(build(g, scope, 'Cell', ctx))
        pane.style.gridArea = '1 / 1'
        body.append(pane)
        panes.push(pane)
      })
      el.append(heads, body)
      select(0)
      break
    }
    default: {
      el = single('xp-unknown')
      const tag = document.createElement('span')
      tag.className = 'xp-unknown__tag'
      tag.textContent = `<${node.name}>`
      el.append(tag)
      if (!ctx.unknown.has(type)) {
        ctx.unknown.add(type)
        ctx.warnings.push(`<${node.name}> はプレビュー未対応のため、枠だけ表示しています`)
      }
      host = el
    }
  }

  applyVisual(el, type, p, scope)
  applyLayout(el, node, p, parentType)

  if (host) {
    for (const c of kids) host.append(build(c, scope, childParentType, ctx))
    if (CONTENT_HOSTS.has(type) && kids.length > 1) {
      ctx.warnings.push(`<${node.name}> は子要素を 1 つしか持てません（${node.line} 行目）。実際の WPF ではビルドエラーになります`)
    }
  }

  // スタイルのトリガー（IsMouseOver / IsPressed）を実際のマウス操作に結び付ける
  if (style?.triggers.length) {
    const state = { IsMouseOver: false, IsPressed: false }
    const refresh = () => {
      const extra: [string, string][] = []
      for (const t of style.triggers) {
        const on = t.value === 'True'
        if ((t.property === 'IsMouseOver' && state.IsMouseOver === on) || (t.property === 'IsPressed' && state.IsPressed === on)) {
          extra.push(...t.setters)
        }
      }
      applyVisual(el, type, merged(extra), scope)
    }
    el.addEventListener('mouseenter', () => ((state.IsMouseOver = true), refresh()))
    el.addEventListener('mouseleave', () => ((state.IsMouseOver = false), (state.IsPressed = false), refresh()))
    el.addEventListener('mousedown', () => ((state.IsPressed = true), refresh()))
    el.addEventListener('mouseup', () => ((state.IsPressed = false), refresh()))
    refresh()
  }
  return el
}

export function renderXaml(root: XamlNode): PreviewResult {
  const ctx: Ctx = { warnings: [], unknown: new Set() }
  const rootScope: Scope = { brushes: new Map(), styles: [], parent: null }
  const surface = document.createElement('div')
  surface.className = 'xp-root'
  const type = localName(root)
  if (type === 'Application' || type === 'ResourceDictionary') {
    const note = document.createElement('p')
    note.className = 'xp-note'
    note.textContent = `<${root.name}> は画面を持たないため、プレビューするものがありません。`
    surface.append(note)
    return { el: surface, warnings: ctx.warnings }
  }
  const el = build(root, rootScope, type === 'Window' ? null : 'Cell', ctx)
  if (type !== 'Window') surface.classList.add('xp-root--bare', 'xp-cell')
  surface.append(el)
  return { el: surface, warnings: ctx.warnings }
}
