import type { Inline, SourceLink } from '@/types/content'

/** 第 6 章のデータ。強み・弱みのカードと、判断フローの木 */
export interface Point {
  id: string
  title: string
  /** 一言でいうと */
  summary: string
  /** 根拠（なぜそう言えるか） */
  evidence: Inline
  /** 公平のための但し書き（強みなら「ただし」、弱みなら「とはいえ」） */
  caveat: Inline
  /** 関連する章 */
  chapter?: { slug: string; label: string }
  sources?: SourceLink[]
}

export const strengths: Point[] = [
  {
    id: 's-xaml',
    title: 'XAML による宣言的な UI',
    summary: '画面の構造が、見た目どおりの入れ子で読める。',
    evidence: 'UI をオブジェクトの木として宣言的に書くので、構造の把握と差分の確認がしやすい。デザインツールやホットリロードが、同じファイルを安全に読み書きできる。',
    caveat: '大きくなると 1 ファイルが数千行になりがちで、分割の規律が要る。XAML 特有の記法（マークアップ拡張、添付プロパティ）は最初の壁になる。',
    chapter: { slug: 'history', label: '第 1 章' },
  },
  {
    id: 's-template',
    title: 'テンプレートによる完全な外観差し替え',
    summary: '動作はそのまま、見た目だけを別物にできる。',
    evidence: 'コントロールは「動作」と「見た目（ControlTemplate）」が分離されている。チェックボックスをトグルスイッチに、リストをカード一覧に、といった変更を、コントロールを作り直さずに行える。',
    caveat: '自由度が高いぶん、既定テンプレートの構造を理解しないと「なぜ効かないのか」で詰まる（ホバー色の問題など）。',
    chapter: { slug: 'foundation', label: '第 3 章' },
  },
  {
    id: 's-binding',
    title: '強力なデータバインディング',
    summary: '画面とデータの同期を、コードを書かずに宣言できる。',
    evidence: '双方向バインディング、変換、検証、コレクションの並べ替え・絞り込み・グループ化までが標準機能。MVVM と組み合わせると、画面のロジックを UI なしでテストできる。',
    caveat: '失敗が例外にならず、実行時に名前で解決されるため、つづり間違いに気づきにくい。コンパイル時に検査する `x:Bind` に相当するものはない。',
    chapter: { slug: 'binding-mvvm', label: '第 4 章' },
  },
  {
    id: 's-vector',
    title: 'ベクタベースの解像度非依存',
    summary: '高 DPI の画面でも、ぼやけずに拡大される。',
    evidence: '長さの単位が DIP（1/96 インチ）で、描画はベクタ。モニターごとの DPI にも対応している（.NET Framework 4.6.2 以降）。',
    caveat: 'ビットマップ画像は倍率別に用意しないとぼやける。WinForms などをホストした部分は、別途 DPI 対応が必要になる。',
    chapter: { slug: 'architecture', label: '第 2 章' },
  },
  {
    id: 's-mature',
    title: '成熟と後方互換性',
    summary: '2006 年のコードと知識が、いまも通用する。',
    evidence: '基本の API は最初のバージョンからほとんど変わっていない。.NET Framework から .NET への移行でも、XAML と大半のコードはそのまま動く。長く保守するアプリにとって、互換性は機能以上の価値を持つ。',
    caveat: '裏を返せば、設計は 2000 年代のまま。近年のフレームワークが備える仕組み（コンパイル時バインディング、宣言的な状態管理など）は取り込まれていない。',
    chapter: { slug: 'history', label: '第 1 章' },
  },
  {
    id: 's-lob',
    title: '業務アプリへの適性',
    summary: '入力フォーム、表、帳票、キーボード操作に強い。',
    evidence: 'DataGrid、入力検証、コマンド、フォーカスとキーボード操作、印刷（FlowDocument / XPS）、アクセシビリティ（UI オートメーション）など、業務アプリに必要な部品が標準で揃う。マウスとキーボードで大量のデータを扱う用途と相性がよい。',
    caveat: '標準の DataGrid は機能も性能も最低限で、本格的な用途ではサードパーティ製品を使うことが多い。',
    chapter: { slug: 'practice', label: '第 7 章' },
  },
  {
    id: 's-interop',
    title: 'Win32 / WinForms との相互運用',
    summary: '既存の資産を捨てずに、少しずつ移行できる。',
    evidence: '`WindowsFormsHost` で WinForms のコントロールを WPF に、`ElementHost` で WPF を WinForms に、`HwndHost` で Win32 のウィンドウを埋め込める。P/Invoke や COM もそのまま使える。',
    caveat: '埋め込んだ領域は WPF の描画と重ねられない（エアスペース問題）。その上に WPF の要素を重ねたり、回転や透過をかけたりはできない。',
    sources: [{ label: 'Microsoft Learn: WPF と Win32 の相互運用', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/wpf-and-win32-interoperation' }],
  },
  {
    id: 's-oss',
    title: 'オープンソース化後の安定したメンテナンス',
    summary: '毎年の .NET リリースに含まれ、ソースも読める。',
    evidence: '2018 年にオープンソース化され、GitHub の dotnet/wpf で開発されている。.NET 8 / 9 / 10 と毎年、修正と小さな機能追加（Fluent テーマ、ダークモードなど）が続いている。挙動に迷ったら実装を読める。',
    caveat: '変更の中心は不具合修正と小さな改善で、大きな新機能が次々に入る状況ではない。.NET 11 の変更点も、公開されている範囲では修正が中心。',
    chapter: { slug: 'history', label: '第 1 章' },
    sources: [{ label: 'GitHub: dotnet/wpf', url: 'https://github.com/dotnet/wpf' }],
  },
  {
    id: 's-ecosystem',
    title: '豊富なサードパーティと既存の知見',
    summary: '困りごとの大半は、すでに誰かが解決している。',
    evidence: '商用のコントロールスイート、オープンソースのテーマや MVVM ライブラリ、20 年近く蓄積された Q&A と書籍がある。採用できる経験者も比較的見つけやすい。',
    caveat: '情報が多いぶん、古いもの（.NET Framework 3.5 時代の書き方など）も混ざる。いつの記事かを確かめる習慣が要る。',
  },
]

export const weaknesses: Point[] = [
  {
    id: 'w-windows',
    title: 'Windows 専用',
    summary: 'macOS、Linux、モバイル、Web では動かない。',
    evidence: '.NET 自体はクロスプラットフォームだが、WPF は DirectX と Win32 に依存しており、Windows 以外では動かない。他の OS への対応が Microsoft から発表されたこともない。',
    caveat: '対象が社内の Windows PC に限られるなら、弱みにならない。あとから他の OS が必要になった場合は、Avalonia XPF のような商用の選択肢もある。',
    sources: [{ label: '.NET Blog: Announcing .NET Core 3.0（WPF は Windows のみ）', url: 'https://devblogs.microsoft.com/dotnet/announcing-net-core-3-0/' }],
  },
  {
    id: 'w-startup',
    title: '起動時間とメモリの大きさ',
    summary: '小さなツールでも、起動と常駐メモリはそれなりにかかる。',
    evidence: '起動時に多くのアセンブリの読み込みと JIT コンパイルが走り、描画内容を保持する仕組み（retained mode）もメモリを使う。ネイティブアプリや WinForms と比べると、空のウィンドウの時点で重い傾向がある。',
    caveat: 'ReadyToRun による事前コンパイル、起動時に読み込む XAML の削減、スプラッシュスクリーンで体感は改善できる。常時起動の業務アプリでは問題になりにくい。',
    chapter: { slug: 'practice', label: '第 7 章' },
  },
  {
    id: 'w-touch',
    title: 'タッチとモバイルの体験',
    summary: 'タッチは「使える」が、タッチ前提の設計ではない。',
    evidence: 'タッチやスタイラスのイベントは扱えるが、標準コントロールはマウスとキーボードを前提にした大きさと挙動になっている。タブレットで快適に使える UI にするには、スタイルとテンプレートを相当作り込む必要がある。',
    caveat: 'キーボードとマウスで使うデスクトップ業務アプリが主戦場なら、影響は小さい。',
  },
  {
    id: 'w-learning',
    title: 'XAML デザイナーと学習曲線の険しさ',
    summary: '最初の 1 画面は簡単だが、その先に壁がいくつもある。',
    evidence: '依存関係プロパティ、ルーティングイベント、リソースの検索、テンプレート、バインディング、Dispatcher と、理解すべき独自の概念が多い。Visual Studio の XAML デザイナーは複雑な画面で重くなりやすく、XAML を直接書く開発者が多い。',
    caveat: '概念どうしはよく噛み合っており、一度つかめば応用が利く（この教材の第 2〜5 章がその部分）。XAML ホットリロードで、実行しながら見た目を調整できる。',
    chapter: { slug: 'roadmap', label: '第 8 章' },
  },
  {
    id: 'w-virtualization',
    title: '仮想化が外れたときの性能の崖',
    summary: '設定 1 つで、一覧表示が突然 100 倍重くなる。',
    evidence: '大量データの表示は UI 仮想化（見えている分だけ要素を作る）に頼っている。`StackPanel` や `ScrollViewer` で包む、グループ化する、`CanContentScroll` を切る、といった操作で仮想化が黙って無効になり、全件分の要素が作られる。',
    caveat: '原因と対処は定型化されている（第 7 章）。仮想化が効いていれば、数十万件でも実用的に動く。',
    chapter: { slug: 'practice', label: '第 7 章' },
  },
  {
    id: 'w-strategy',
    title: 'Microsoft の UI フレームワーク戦略の揺れ',
    summary: '「次はこれ」が何度も変わってきた。',
    evidence: 'WPF のあと、Silverlight、WinRT、UWP、WinUI 3、.NET MAUI と、Microsoft は新しい UI 技術を次々に打ち出してきた。そのたびに WPF の将来が議論になり、新機能への投資は長く限定的だった。',
    caveat: '2024 年の Build で Microsoft は、Windows ネイティブアプリの推奨フレームワークとして WinUI 3 と WPF の 2 つを挙げた。少なくとも「捨てられる技術」という位置づけではない。ただし将来を保証するものでもないので、最新の公式発表を確認すること。',
    chapter: { slug: 'history', label: '第 1 章' },
    sources: [
      { label: 'Windows Central: Microsoft is finally getting its native Windows UI platform act together with WinUI 3 and WPF（2024-05）', url: 'https://www.windowscentral.com/software-apps/windows-11/microsoft-is-finally-getting-its-windows-ui-platform-act-together-with-winui-3-and-wpf' },
      { label: 'DEVCLASS: Windows development revamped … and the surprising comeback of WPF（2024-05-22）', url: 'https://www.devclass.com/development/2024/05/22/windows-development-revamped-with-copilot-runtime-native-pytorch-and-the-surprising-comeback-of-wpf/1625341' },
    ],
  },
  {
    id: 'w-graphics',
    title: '3D と高度なアニメーションの制約',
    summary: '業務アプリの演出には十分だが、表現の最前線ではない。',
    evidence: '3D 機能（`Viewport3D`）は基本的な表示向けで、近年のリアルタイム 3D の水準ではない。アニメーションは UI スレッドで進行するため、UI スレッドが詰まると一緒に止まる。新しい DirectX で描いた内容を取り込むには `D3DImage` などを介した工夫が要る。',
    caveat: 'グラフ、図面、ダッシュボード程度の 2D 表現と、状態遷移のアニメーションなら十分こなせる。本格的な 3D は専用のエンジンを埋め込むのが現実的。',
    chapter: { slug: 'architecture', label: '第 2 章' },
  },
  {
    id: 'w-aot',
    title: 'AOT / トリミングに対応していない',
    summary: '配布物を削ったり、ネイティブコードに固めたりできない。',
    evidence: '未使用コードを削るトリミングは、WPF では .NET SDK 側で無効化されている（リフレクションに強く依存しており、削ると動かなくなるため）。Native AOT にも対応していない。自己完結型で配ると、配布サイズは 100 MB を超えることが多い（目安。構成によって変わる）。',
    caveat: 'ランタイムをインストール済みの PC に配る（フレームワーク依存）なら、配布物は小さい。ReadyToRun で起動時間は改善できる。',
    chapter: { slug: 'practice', label: '第 7 章' },
    sources: [
      { label: 'Microsoft Learn: トリミングの既知の非互換性（WPF）', url: 'https://learn.microsoft.com/en-us/dotnet/core/deploying/trimming/incompatibilities' },
      { label: 'Microsoft Learn: Native AOT の展開（制限事項）', url: 'https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/' },
    ],
  },
]

// ───────── 判断フロー ─────────

export interface FlowQuestion {
  kind: 'q'
  id: string
  text: string
  help: string
  yes: string
  no: string
  yesLabel?: string
  noLabel?: string
}
export interface FlowResult {
  kind: 'r'
  id: string
  verdict: 'wpf' | 'maybe' | 'other'
  title: string
  text: string
  alternatives?: string[]
}
export type FlowNode = FlowQuestion | FlowResult

export const flow: FlowNode[] = [
  { kind: 'q', id: 'q-os', text: '動かす OS は Windows だけか？', help: '「いまは Windows だけ」ではなく、アプリの寿命のあいだ Windows だけでよいかを考える。', yes: 'q-existing', no: 'q-mobile', yesLabel: 'Windows だけ', noLabel: 'ほかの OS も必要' },
  { kind: 'q', id: 'q-mobile', text: 'スマートフォン / タブレット（iOS・Android）が対象に入るか？', help: 'モバイルが入るかどうかで、候補が大きく変わる。', yes: 'r-maui', no: 'q-wpf-asset', yesLabel: 'モバイルも必要', noLabel: 'デスクトップだけ' },
  { kind: 'q', id: 'q-wpf-asset', text: '既存の WPF アプリを、macOS / Linux でも動かしたいのか？', help: '新規開発か、既存資産の展開かで道が分かれる。', yes: 'r-xpf', no: 'r-avalonia', yesLabel: '既存の WPF 資産がある', noLabel: '新規開発' },
  { kind: 'q', id: 'q-existing', text: '既存の WPF アプリ、または WPF に慣れたチームがあるか？', help: '資産と経験は、技術の新しさより大きな要因になることが多い。', yes: 'r-wpf-keep', no: 'q-kind', yesLabel: 'ある', noLabel: 'ない（ゼロから）' },
  { kind: 'q', id: 'q-kind', text: 'データの入力・一覧・帳票が中心の業務アプリか？', help: 'フォーム、表、マスター管理、検索と編集、印刷。そういう画面が大半を占めるか。', yes: 'q-touch', no: 'q-native', yesLabel: '業務アプリ', noLabel: 'それ以外' },
  { kind: 'q', id: 'q-touch', text: 'タッチ操作が主役で、Windows 11 らしい見た目が強く求められるか？', help: 'キオスク端末、タブレット専用、OS の最新の見た目やウィジェットとの統一が要件にあるか。', yes: 'r-winui', no: 'r-wpf-new', yesLabel: 'はい', noLabel: 'いいえ（マウスとキーボード中心）' },
  { kind: 'q', id: 'q-native', text: '最新の Windows の機能や見た目を、いち早く使う必要があるか？', help: '新しいシェル統合、最新のコントロール、OS と揃ったアニメーションなど。', yes: 'r-winui', no: 'q-light', yesLabel: 'はい', noLabel: 'いいえ' },
  { kind: 'q', id: 'q-light', text: '起動の速さ・配布サイズの小ささが最優先の小さなツールか？', help: '常駐ユーティリティ、単機能のツール、インストール不要で配りたい exe など。', yes: 'r-light', no: 'r-wpf-new', yesLabel: 'はい', noLabel: 'いいえ' },

  { kind: 'r', id: 'r-wpf-keep', verdict: 'wpf', title: 'WPF を続ける', text: '資産と経験があり、対象が Windows だけなら、WPF を続けるのが最も確実。.NET Framework のままなら、.NET 10（LTS）への移行を計画する価値がある。XAML と大半のコードはそのまま動く。' },
  { kind: 'r', id: 'r-wpf-new', verdict: 'wpf', title: 'WPF は有力な選択肢', text: 'Windows 専用で、マウスとキーボードで使うデータ中心のアプリは、WPF が最も得意とする領域。部品・情報・経験者が揃っており、長期保守の見通しも立てやすい。', alternatives: ['Windows Forms: 画面が単純で、見た目のカスタマイズが不要ならさらに手早い', 'WinUI 3: 新規で、OS の最新の見た目を重視するなら比較する'] },
  { kind: 'r', id: 'r-winui', verdict: 'other', title: 'WinUI 3 を検討する', text: 'タッチ、Windows 11 の見た目、OS の新機能との統合が重要なら、WinUI 3（Windows App SDK）が向く。XAML と MVVM の知識はそのまま活きる。', alternatives: ['WPF + Fluent テーマ（.NET 9 以降）: 見た目だけが理由なら、これで足りる場合もある'] },
  { kind: 'r', id: 'r-maui', verdict: 'other', title: '.NET MAUI など、モバイル対応のフレームワークを検討する', text: 'iOS / Android が対象なら、WPF は選べない。.NET で書くなら .NET MAUI、Avalonia、Uno Platform が候補になる。ロジックを WPF 非依存のライブラリに分けておけば、既存の C# 資産は再利用できる。' },
  { kind: 'r', id: 'r-avalonia', verdict: 'other', title: 'Avalonia を検討する', text: 'デスクトップで複数 OS が必要なら、WPF に近い書き味の Avalonia が有力。XAML、バインディング、MVVM の考え方はほぼ共通で、WPF の知識が活きる。', alternatives: ['Web 技術（Electron、Tauri など）: Web の UI 資産やチームがあるなら', '.NET MAUI: macOS も対象にできるが、デスクトップでの実績は要確認'] },
  { kind: 'r', id: 'r-xpf', verdict: 'maybe', title: 'Avalonia XPF、または段階的な移行を検討する', text: '既存の WPF アプリをそのまま他の OS で動かす商用製品として Avalonia XPF がある。費用と対応状況を確認したうえで、Avalonia への書き換えと比較する。まずは ViewModel とロジックを WPF 非依存に切り出しておくと、どちらに進むにも有利。' },
  { kind: 'r', id: 'r-light', verdict: 'other', title: 'WPF 以外も比較する', text: '起動時間とサイズが最優先なら、WPF は不利。Windows Forms（.NET）や、ネイティブ / Native AOT に対応した技術のほうが要件に合う可能性が高い。', alternatives: ['Windows Forms: 起動が速く、トリミングは WPF と同様に未対応だが構成が軽い', 'WinUI 3 / Avalonia: Native AOT やトリミングへの対応が進んでいる（最新の対応状況は各公式ドキュメントで確認）'] },
]

export const flowStart = 'q-os'
