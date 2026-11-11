/**
 * コンテンツの型定義。
 * 文章・コード・クイズ・演習はすべて src/content/ 以下にこの型で置き、
 * コンポーネント側には表示ロジックだけを書く。
 */

/**
 * インライン記法つき文字列（lib/inline.ts が解釈する）
 *   `code` / **強調** / [表示](URL) / [[用語ID]] / [[用語ID|表示]]
 */
export type Inline = string

export type CodeLang = 'csharp' | 'xaml' | 'xml' | 'json' | 'powershell' | 'text'

export interface SourceLink {
  label: string
  url: string
  /** 何の裏付けに使ったか（任意） */
  note?: string
}

export interface AnnotatedLine {
  /** コード 1 行分（改行を含めない） */
  code: string
  /** 注釈。あれば行がホバー / フォーカス可能になる */
  note?: { title: string; body: Inline }
}

export interface CompareSide {
  label: string
  tone: 'bad' | 'good' | 'neutral'
  lang?: CodeLang
  code?: string
  points?: Inline[]
}

export type Block =
  | { type: 'p'; text: Inline }
  | { type: 'h3'; text: string }
  | { type: 'list'; ordered?: boolean; items: Inline[] }
  | { type: 'steps'; items: { title: string; text: Inline }[] }
  | { type: 'table'; head: string[]; rows: Inline[][]; caption?: string }
  | {
      type: 'callout'
      kind: 'note' | 'tip' | 'warn' | 'pitfall' | 'history'
      title?: string
      text: Inline
    }
  | {
      type: 'code'
      lang: CodeLang
      code: string
      title?: string
      /** true のとき「擬似コード」ラベルを出す */
      pseudo?: boolean
      /** true のとき「抜粋」ラベルを出す（単体ではビルドできない断片） */
      excerpt?: boolean
      /** 強調する行（1 始まり） */
      highlight?: number[]
    }
  | { type: 'annotated'; lang: CodeLang; title: string; lines: AnnotatedLine[]; hint?: string }
  | { type: 'compare'; left: CompareSide; right: CompareSide; caption?: Inline }
  | {
      type: 'figure'
      /** components/demos/registry.ts のキー */
      demo: string
      kind: 'figure' | 'demo' | 'video'
      title: string
      caption?: Inline
    }
  | { type: 'sources'; items: SourceLink[] }

export interface Section {
  id: string
  title: string
  lead?: Inline
  blocks: Block[]
}

export interface QuizQuestion {
  id: string
  q: Inline
  code?: { lang: CodeLang; code: string }
  choices: Inline[]
  /** 正解の choices インデックス */
  answer: number
  explain: Inline
}

/** 演習の判定に渡されるコンテキスト */
export interface CheckContext {
  /** コメントを除去したコード */
  code: string
  /** コメント除去 + 空白を 1 つに畳んだコード */
  flat: string
  /** XAML / XML としてパースできた場合のルート要素（失敗時は null） */
  xml: XamlNode | null
  /** すべての要素をフラットに列挙（xml が null なら空配列） */
  all: XamlNode[]
  /** 要素名（プレフィックスなし）で検索 */
  els(name: string): XamlNode[]
  /** 正規表現が flat にマッチするか */
  has(re: RegExp): boolean
}

export interface ExerciseCheck {
  label: string
  test(ctx: CheckContext): boolean
}

export interface Exercise {
  id: string
  title: string
  lang: 'xaml' | 'csharp' | 'xml'
  /** 目安の難易度 1〜3 */
  level: 1 | 2 | 3
  prompt: Inline
  starter: string
  solution: string
  checks: ExerciseCheck[]
  hints?: Inline[]
  /** XAML の簡易プレビューを横に出す */
  preview?: boolean
  /** 解答例についての補足 */
  solutionNote?: Inline
}

export interface ChapterMeta {
  slug: string
  no: number
  title: string
  subtitle: string
  summary: string
  /** 読了目安（分） */
  minutes: number
  /** トップページのカードに出す短いキーワード */
  keywords: string[]
}

export interface Chapter extends ChapterMeta {
  /** この章でわかること */
  goals: Inline[]
  sections: Section[]
  quiz: QuizQuestion[]
  exercises: Exercise[]
}

export interface GlossaryEntry {
  id: string
  term: string
  /** 読み・正式名称など */
  alt?: string
  /** 1 行説明 */
  desc: string
  /** 関連する章の slug */
  chapter?: string
}

/** 簡易 XAML パーサのノード */
export interface XamlNode {
  /** プレフィックス込みの要素名（例: "Grid.RowDefinitions", "x:Array"） */
  name: string
  attrs: { name: string; value: string }[]
  children: XamlNode[]
  /** 要素直下のテキスト（前後空白は除去） */
  text: string
  /** 開始タグの行（1 始まり） */
  line: number
  /** 終了タグの行（1 始まり） */
  endLine: number
  parent: XamlNode | null
}
