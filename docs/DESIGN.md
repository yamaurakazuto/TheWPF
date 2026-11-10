# theWPF 設計メモ

WPF を「歴史 → 仕組み → 開発の土台 → 実践 → 技術選定」の順に、図とインタラクティブなデモで学べる静的サイト。
このドキュメントは実装前に決めた方針をまとめたもので、実装と食い違ったら実装側ではなくここを直す。

## 1. 採用スタック

| 領域 | 採用 | 理由 |
|---|---|---|
| フレームワーク | Vue 3（Composition API / `<script setup>`） | 依頼の固定条件 |
| ビルド | Vite | 依頼の固定条件。静的出力がそのまま GitHub Pages に置ける |
| ルーティング | Vue Router（**hash モード**） | サブパス配信でもサーバー設定なしで直リンクが壊れない |
| 状態管理 | Pinia | クイズ結果・演習の進捗・テーマを 1 か所で持ち localStorage に保存する |
| スタイル | CSS Variables + 素の CSS | デザイントークンを `:root` に定義。図（inline SVG）の配色もトークン経由で切り替える。Tailwind は入れない（依存を増やさず、SVG の色指定と同じ仕組みで統一できるため） |
| コードハイライト | Shiki（`shiki/core` + JavaScript 正規表現エンジン） | C# / XML(XAML) の TextMate 文法で正確に色付け。必要な文法とテーマだけを個別 import して配信サイズを抑える |
| コードエディター | CodeMirror 6 | 演習用。軽量で、キーボード操作とスクリーンリーダー対応が既定で入っている |

VitePress は採用しない。章の大半が「文章にコンポーネントを差し込む」ではなく「デモが主役で文章が補足」という構成のため、
Markdown 起点よりも型付きデータ + ブロックレンダラのほうが、図とデモを同じ型検査の下で管理できる。

## 2. ディレクトリ構成

```
theWPF/
├─ index.html              エントリ（テーマのちらつき防止スクリプトのみインライン）
├─ vite.config.ts          base: './'（どのパスに置いても動く）
├─ docs/DESIGN.md          このファイル
├─ public/                 favicon など静的ファイル
└─ src/
   ├─ main.ts / App.vue / router.ts
   ├─ styles/              tokens.css（デザイントークン）/ base.css（リセットと共通部品）
   ├─ types/content.ts     コンテンツの型定義（Chapter / Section / Block / Quiz / Exercise）
   ├─ content/             ★ 文章・コード・クイズ・演習はすべてここ（コンポーネントに直書きしない）
   │  ├─ index.ts          章メタ情報（目次用）と遅延ロード
   │  ├─ glossary.ts       用語集（ツールチップと用語集ページの元データ）
   │  ├─ timeline.ts       第1章の年表データ
   │  └─ chapters/         ch01-history.ts … ch08-roadmap.ts
   ├─ stores/              progress.ts（クイズ・演習・チェックリスト）/ theme.ts
   ├─ composables/         useHighlighter.ts / useTimeline など
   ├─ lib/                 inline.ts（インライン記法）/ anim.ts / xaml/（簡易 XAML パーサとプレビュー）/ exercise.ts
   ├─ components/
   │  ├─ layout/           AppHeader / AppSidebar / PageToc / ChapterNav
   │  ├─ content/          BlockRenderer / RichText / CodeBlock / AnnotatedCode / Callout / FigureFrame / Term …
   │  ├─ player/           AnimationPlayer（「動画」の再生コントロール）
   │  ├─ quiz/             ChapterQuiz
   │  ├─ editor/           CodeEditor / ExerciseRunner / XamlPlayground
   │  └─ demos/            章ごとの図・デモ・アニメーション（registry.ts でキー → コンポーネント）
   └─ pages/               HomePage / ChapterPage / PlaygroundPage / GlossaryPage / NotFoundPage
```

## 3. ページ構成

| ルート | 内容 |
|---|---|
| `#/` | トップ。サイトの読み方、章カード、進捗 |
| `#/chapters/:slug` | 各章（8 章）。本文 → 章末クイズ → コード演習 → 前後ナビ |
| `#/playground` | XAML プレイグラウンド（簡易プレビュー付きエディター）と全演習の一覧 |
| `#/glossary` | 用語集 |

章 slug: `history` / `architecture` / `foundation` / `binding-mvvm` / `dispatcher` / `tradeoffs` / `practice` / `roadmap`

## 4. コンテンツのデータ構造

章は `Chapter` 型の TypeScript オブジェクト。本文は `Block` の配列で、ブロックの種類は次のとおり。

| type | 用途 |
|---|---|
| `p` / `list` / `table` / `steps` | 文章・箇条書き・表・手順 |
| `callout` | 補足・注意・落とし穴 |
| `code` | コードブロック（`pseudo: true` で「擬似コード」ラベル） |
| `annotated` | 行ごとに注釈が付くコード（注釈付き csproj / App.xaml） |
| `compare` | 左右対比（アンチパターンと改善例など） |
| `figure` | 図・デモ・アニメーション。`demo` に registry のキーを指定 |
| `sources` | 出典リンク |

文章中のインライン記法（`lib/inline.ts`）:

- `` `code` `` … インラインコード
- `**強調**`
- `[表示](https://…)` … リンク（外部は新規タブ）
- `[[用語ID]]` / `[[用語ID|表示文字列]]` … 用語ツールチップ（`glossary.ts` を参照）

クイズ（`QuizQuestion`）と演習（`Exercise`）も章データに含める。演習の判定は `checks: { label, test(ctx) }[]`。
ブラウザ内で C# はコンパイルできないため、**コメントを除去したコードに対する構造チェック**（XAML はパースして要素・属性を検査）で判定し、その旨を UI に明記する。

## 5. デザイン方針

- **図が主役**。各章の冒頭に「この章の地図」となる図かアニメーションを置き、文章は図の読み方を補う。
- 図はすべて自作の inline SVG / HTML。色は `--c-ui`（UI スレッド）`--c-render`（描画スレッド）など**意味に対応したトークン**で指定し、ライト / ダークで切り替える。色だけに意味を持たせない（ラベル・形・線種を併用）。
- 「動画」は `AnimationPlayer` 上の SVG アニメーション。再生 / 一時停止 / ステップ送り / シーク / 速度変更 / 字幕つき。外部埋め込みはしない。`prefers-reduced-motion` のときは自動再生せずステップ送り中心に。
- タイポグラフィ: 本文は OS の日本語 UI フォント、コードは Cascadia Code → Consolas。外部フォントは読み込まない（オフラインでも同じ見た目）。
- レイアウト: 左サイドバー（章目次）+ 本文（最大 780px）+ 右のページ内目次（スクロール連動）。900px 未満はサイドバーをドロワーに、目次は本文上部の折りたたみに。**ページ自体は横スクロールさせない**（幅のあるコードや表はブロック内でスクロール）。
- アクセシビリティ: すべての操作をキーボードで実行可能に。フォーカスリングを消さない。本文コントラストは WCAG AA 以上。
- 専門用語は初出で 1 行説明を添え、以降は `[[用語ID]]` のツールチップで引けるようにする。

## 6. 事実確認の方針

- 年号・バージョン・リリース時期は Microsoft Learn / .NET Blog / Windows Developer Blog / dotnet リポジトリ等で確認し、節ごとに `sources` ブロックで出典を置く。
- 一次情報で日付が割れるもの（例: .NET Framework 3.0 のリリース日）は月までの記載に留め、「諸説あり」と明示する。
- 公式ドキュメントの文章は転載せず、自分の言葉で書いてリンクする。
- C# / XAML のサンプルは実際にビルドが通る形で書く。省略を含むものは「抜粋」、動かないものは「擬似コード」とラベルを付ける。
- 執筆時点は **2026-11-10**。.NET のサポート状況など時間で変わる記述には時点を明記する。
