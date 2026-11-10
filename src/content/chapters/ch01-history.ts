import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'
import { a } from '@/lib/exercise'

const chapter: Chapter = {
  ...metaOf('history'),
  goals: [
    'WPF が何を解決するために作られたのか（Avalon 構想）を説明できる',
    '.NET Framework 3.0 から .NET 10 / 11 までの主な節目を、順番に言える',
    '「停滞期」と「オープンソース化」が、いまの WPF の立ち位置にどうつながるかがわかる',
    'WinUI 3・.NET MAUI・Avalonia と WPF の違いを 1 文ずつで言える',
  ],
  sections: [
    {
      id: 'overview',
      title: '20 年あまりを 50 秒で',
      lead: '細かい年号の前に、まず全体の形を見ておく。WPF は 2006 年に登場し、途中で「もう終わり」と言われた時期を挟みながら、いまも現役で使われている。',
      blocks: [
        {
          type: 'figure',
          demo: 'LineageVideo',
          kind: 'video',
          title: 'UI フレームワークの系譜',
          caption: '横軸は年。バーは各フレームワークが提供されている期間。ひし形は節目。下の字幕が場面ごとの解説になっている。',
        },
        {
          type: 'p',
          text: 'この図から読み取ってほしいのは 2 点。1 つは、**XAML を使う技術が何度も作り直されてきた**こと（WPF → Silverlight → WinRT / UWP → WinUI 3）。もう 1 つは、その中で **WPF だけが最初から最後まで途切れていない**ことだ。',
        },
      ],
    },
    {
      id: 'timeline',
      title: '年表',
      lead: '各項目を押すと詳細と出典が開く。日付は一次情報で確認できた粒度で書き、資料によって食い違うものは「諸説あり」と明記している。',
      blocks: [
        {
          type: 'figure',
          demo: 'HistoryTimeline',
          kind: 'demo',
          title: 'WPF 年表（2003〜2026）',
          caption: '時代のボタンで絞り込める。色は時代ごとに固定で、上の系譜図とは別の色分け。',
        },
      ],
    },
    {
      id: 'avalon',
      title: 'なぜ作られたのか — Avalon と XAML の発想',
      lead: 'WPF 以前の Windows の UI は、1980 年代に設計された仕組み（GDI と User32）の上に成り立っていた。Avalon は、それを土台から置き換える試みだった。',
      blocks: [
        {
          type: 'table',
          caption: 'それまでの Windows UI と、WPF が目指したもの',
          head: ['観点', 'GDI / User32（WinForms の土台）', 'WPF（Avalon）'],
          rows: [
            ['描画', 'CPU 中心。アプリが「いま描け」と言われるたびに自分で描く', 'DirectX（GPU）で合成。描く内容をフレームワークが保持する（[[retained-mode]]）'],
            ['単位', '物理ピクセル。高解像度の画面では小さくなるか、ぼやける', '[[dip]]（1/96 インチ）。ベクタで描くので拡大しても鮮明'],
            ['画面の定義', 'コード、またはデザイナーが生成したコード', '[[xaml]]。宣言的に書き、ツールも読み書きできる'],
            ['見た目の変更', 'コントロールごとに自前で描画し直す（オーナードロー）', 'テンプレートを差し替える。動作はそのまま、外観だけ別物にできる'],
            ['ウィンドウ', 'ボタン 1 つ 1 つが OS のウィンドウ（[[hwnd]]）', 'ウィンドウ全体で HWND は基本 1 つ。中身は WPF が自分で描く'],
          ],
        },
        {
          type: 'p',
          text: '表の最後の行が重要だ。WinForms のボタンは OS が描く部品だが、**WPF のボタンは WPF 自身が描いた絵**であり、OS から見ればただのピクセルにすぎない。だから丸くも、斜めにも、動画を貼ることもできる。その代わり、OS の部品と重ねるときには制約が生まれる（第 6 章の [[airspace]]）。',
        },
        { type: 'h3', text: 'XAML という発想' },
        {
          type: 'p',
          text: 'XAML の本質は「画面記述言語」ではなく、**オブジェクトの木を XML で書く汎用の記法**である。`<Button Content="OK" />` は「`Button` クラスのインスタンスを作り、`Content` プロパティに `"OK"` を入れる」という意味で、C# で書くのと結果は同じになる。',
        },
        {
          type: 'compare',
          left: {
            label: 'XAML で書く',
            tone: 'neutral',
            lang: 'xaml',
            code: `<StackPanel Margin="16">
    <TextBlock Text="お名前" />
    <Button Content="OK" Width="80" />
</StackPanel>`,
          },
          right: {
            label: '同じ内容を C# で書く',
            tone: 'neutral',
            lang: 'csharp',
            code: `var panel = new StackPanel { Margin = new Thickness(16) };
panel.Children.Add(new TextBlock { Text = "お名前" });
panel.Children.Add(new Button { Content = "OK", Width = 80 });`,
          },
          caption: 'どちらも同じオブジェクトの木を作る。XAML の利点は、構造が見た目どおりに読めることと、デザインツールが安全に読み書きできること。',
        },
        {
          type: 'p',
          text: 'この「ツールが読み書きできる」という性質を前提に作られたのが Expression Blend で、デザイナーが見た目とアニメーションを XAML で作り、開発者が同じファイルにロジックを結び付ける、という分業が構想された。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: WPF アーキテクチャ', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/wpf-architecture' },
            { label: 'Microsoft Learn: XAML の概要（WPF）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/xaml/' },
            { label: 'Wikipedia: Microsoft Blend', url: 'https://en.wikipedia.org/wiki/Microsoft_Blend' },
          ],
        },
      ],
    },
    {
      id: 'xaml-family',
      title: 'Silverlight との関係と、XAML の分岐',
      lead: '「XAML が書ければどれでも作れる」わけではない。XAML を使う技術は複数あり、互いに似ているが別物だ。',
      blocks: [
        {
          type: 'table',
          caption: 'XAML を使う主な UI 技術',
          head: ['技術', '時期', '動く場所', 'WPF との関係'],
          rows: [
            ['WPF', '2006 年〜', 'Windows デスクトップ', '（本家）'],
            ['[[silverlight]]', '2007〜2021 年', 'ブラウザープラグイン', 'WPF の考え方を小さなランタイムに移した別実装。機能はサブセットに近い'],
            ['[[winrt]] XAML / [[uwp]]', '2012 年〜', 'Windows 8 以降のアプリ', 'OS 側にネイティブ実装された別の XAML。API も名前空間も異なる'],
            ['[[winui3]]', '2021 年〜', 'Windows 10 / 11', 'UWP の XAML UI を OS から切り離し、Windows App SDK として提供したもの'],
            ['[[maui]]', '2022 年〜', 'Android / iOS / macOS / Windows', 'XAML で書けるが、各 OS のネイティブ部品に対応付ける方式。Windows では WinUI 3 を使う'],
            ['[[avalonia]]', '2013 年〜', 'Windows / macOS / Linux ほか', 'WPF に近い書き味を持つ、コミュニティ主導の別実装'],
          ],
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '検索結果の XAML がそのまま動かないとき',
          text: 'UWP や WinUI 3、Avalonia 向けの XAML を WPF に貼ると、プロパティ名やコントロール名の違いでビルドエラーになることがある（例: UWP / WinUI の `x:Bind` は WPF にはない）。サンプルを探すときは、**どのフレームワーク向けか**を必ず確認する。',
        },
        {
          type: 'p',
          text: 'Silverlight が広く使われた 2008〜2011 年ごろは、WPF と Silverlight で ViewModel を共有するために [[mvvm]] パターンが盛んに使われた。MVVM 自体は 2005 年に WPF チームの John Gossman が紹介したもので、WPF のバインディングを最大限に活かす設計として定着していく（第 4 章）。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn（アーカイブ）: John Gossman — Introduction to Model/View/ViewModel pattern（2005）', url: 'https://learn.microsoft.com/en-us/archive/blogs/johngossman/introduction-to-modelviewviewmodel-pattern-for-building-wpf-apps' },
            { label: 'Wikipedia: Microsoft Silverlight version history', url: 'https://en.wikipedia.org/wiki/Microsoft_Silverlight_version_history' },
            { label: 'Microsoft Learn: Silverlight 5 のライフサイクル', url: 'https://learn.microsoft.com/en-us/lifecycle/products/silverlight-5' },
          ],
        },
      ],
    },
    {
      id: 'stagnation',
      title: '「停滞期」に現場で起きていたこと',
      lead: '2012 年の Windows 8 から 2018 年まで、WPF には目立った新機能がほとんど追加されなかった。ただし「使われなくなった」わけではない。',
      blocks: [
        {
          type: 'list',
          items: [
            '**不安と様子見**: Microsoft の発信がストアアプリ（WinRT / UWP）に集中し、「WPF で新規開発してよいのか」という議論が各所で起きた。',
            '**それでも WPF で作られ続けた**: 業務アプリが必要とする機能（複雑なデータグリッド、帳票、周辺機器連携、Windows 7 対応）を満たす代替が少なかった。',
            '**エコシステムが空白を埋めた**: サードパーティのコントロール製品や、MVVM フレームワーク・UI テーマなどのオープンソースライブラリが成熟した。',
            '**Microsoft 自身も使い続けた**: Visual Studio は 2010 以降、エディターやシェルを WPF で実装している。',
          ],
        },
        {
          type: 'callout',
          kind: 'history',
          title: '2014 年のロードマップ',
          text: '2014 年 11 月、WPF チームは「The Roadmap for WPF」を公開し、性能・DirectX 相互運用・タッチと高 DPI への対応に投資を続けると明言した。派手な新機能ではなかったが、公式に「続ける」と示されたことで、業務アプリの世界では WPF を選び続ける根拠になった。',
        },
        {
          type: 'p',
          text: 'この時期の教訓は、**フレームワークの寿命は「新機能の数」では決まらない**ということだ。互換性が保たれ、動くものが動き続けることは、業務アプリにとって新機能以上の価値がある。この見方は第 6 章の評価でもう一度使う。',
        },
        {
          type: 'sources',
          items: [
            { label: '.NET Blog: The Roadmap for WPF（2014-11-12）', url: 'https://devblogs.microsoft.com/dotnet/the-roadmap-for-wpf/' },
            { label: "Microsoft Learn: What's new in .NET Framework", url: 'https://learn.microsoft.com/en-us/dotnet/framework/whats-new/' },
          ],
        },
      ],
    },
    {
      id: 'open-source',
      title: '.NET Core 3.0 とオープンソース化という転換点',
      lead: '2018 年 12 月のオープンソース化と、2019 年 9 月の .NET Core 3.0 対応。この 2 つで、WPF は「維持されるだけの技術」から「改善が続く技術」に戻った。',
      blocks: [
        {
          type: 'table',
          caption: '.NET Framework 版と .NET（Core）版の WPF',
          head: ['観点', '.NET Framework 4.x の WPF', '.NET（Core 3.0 以降）の WPF'],
          rows: [
            ['ランタイムの場所', 'OS に 1 つだけ入っている（全アプリ共有）', 'アプリごとに選べる。同梱（[[self-contained]]）もできる'],
            ['プロジェクト形式', '長い旧形式の csproj が基本', '[[sdk-style]] の短い csproj'],
            ['新機能', '追加されない（保守のみ）', '毎年の .NET リリースで追加・修正される'],
            ['ソースコード', '参照用に公開（Reference Source）', 'GitHub の dotnet/wpf で開発。Issue や Pull Request を出せる'],
            ['サポート', 'OS のライフサイクルに従う', 'LTS は 3 年、STS は 2 年（[[lts]]）'],
            ['使えなくなったもの', '—', 'ブラウザー内で動かす XBAP など、一部の古い機能'],
          ],
        },
        {
          type: 'callout',
          kind: 'note',
          title: '「.NET Core」と「.NET」',
          text: '.NET Core 3.1 の次は「.NET 5」で、名前から Core が外れた（4 を飛ばしたのは .NET Framework 4.x との混同を避けるため）。現在は単に「.NET 8」「.NET 10」と呼ぶ。この教材で「.NET」とだけ書いたときは、.NET Framework ではなくこちらを指す。',
        },
        {
          type: 'p',
          text: '注意したいのは、**.NET Core に載っても WPF は Windows 専用のまま**という点だ。.NET 自体は Linux や macOS でも動くが、WPF は DirectX や Win32 に深く依存しているため、他の OS では動かない。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Windows Developer Blog: Announcing Open Source of WPF, Windows Forms, and WinUI（2018-12-04）', url: 'https://blogs.windows.com/windowsdeveloper/2018/12/04/announcing-open-source-of-wpf-windows-forms-and-winui-at-microsoft-connect-2018/' },
            { label: '.NET Blog: Announcing .NET Core 3.0（2019-09-23）', url: 'https://devblogs.microsoft.com/dotnet/announcing-net-core-3-0/' },
            { label: 'GitHub: dotnet/wpf', url: 'https://github.com/dotnet/wpf' },
            { label: 'Microsoft Learn: .NET Framework のライフサイクル', url: 'https://learn.microsoft.com/en-us/lifecycle/products/microsoft-net-framework' },
          ],
        },
      ],
    },
    {
      id: 'now',
      title: '現在地 — .NET のバージョンと、隣のフレームワーク',
      lead: '執筆時点（2026 年 11 月 10 日）の状況を整理する。サポート期間は時間とともに変わるので、実際に選ぶときは必ず出典のページで最新の状態を確認してほしい。',
      blocks: [
        {
          type: 'table',
          caption: '.NET のバージョンとサポート（2026-11-10 時点）',
          head: ['バージョン', '公開日', '種別', 'サポート終了', 'WPF の主な変更'],
          rows: [
            ['.NET 8', '2023-11-14', 'LTS', '2026-11-10', 'RDP でのハードウェアアクセラレーション、`OpenFolderDialog`'],
            ['.NET 9', '2024-11-12', 'STS', '2026-11-10', 'Fluent テーマ、`ThemeMode`、アクセントカラー'],
            ['.NET 10', '2025-11-11', 'LTS', '2028-11-14', 'Fluent の対象拡大、`Grid` の短縮記法、`MessageBox` のボタン追加'],
            ['.NET 11', 'RC 段階（正式版は未掲載）', 'STS', '—', '公開されている範囲では不具合修正が中心'],
            ['.NET Framework 4.8.1', '2022-08-09', '—', '終了日の記載なし（OS に従う）', '新機能の追加はなし'],
          ],
        },
        {
          type: 'table',
          caption: 'WPF と、隣のフレームワーク',
          head: ['', 'WPF', 'WinUI 3', '.NET MAUI', 'Avalonia'],
          rows: [
            ['動く OS', 'Windows のみ', 'Windows 10 / 11', 'Android / iOS / macOS / Windows', 'Windows / macOS / Linux ほか'],
            ['描画', 'DirectX で自前描画', 'OS の合成エンジン上にネイティブ実装', '各 OS のネイティブ部品', '独自レンダラーで自前描画'],
            ['提供元', 'Microsoft（.NET の一部）', 'Microsoft（Windows App SDK）', 'Microsoft（.NET の一部）', 'AvaloniaUI 社とコミュニティ'],
            ['登場', '2006 年', '2021 年（1.0）', '2022 年', '2013 年に開発開始'],
            ['向いている場面', 'Windows 専用の業務アプリ、既存資産の継続', 'Windows 11 らしい見た目と最新 API', 'モバイルを含む複数 OS', 'デスクトップで複数 OS、WPF に近い書き味'],
          ],
        },
        {
          type: 'callout',
          kind: 'note',
          text: 'この表は性格の違いをつかむための要約で、優劣の表ではない。どれを選ぶべきかは第 6 章の判断フローで扱う。',
        },
        {
          type: 'sources',
          items: [
            { label: '.NET 公式: サポートポリシー', url: 'https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core', note: '公開日・種別・サポート終了日' },
            { label: "Microsoft Learn: What's new in WPF（.NET 8 / 9 / 10 / 11）", url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/whats-new/' },
            { label: 'Microsoft Learn: .NET Framework のライフサイクル', url: 'https://learn.microsoft.com/en-us/lifecycle/products/microsoft-net-framework' },
            { label: 'GitHub: Windows App SDK 1.0 リリース', url: 'https://github.com/microsoft/WindowsAppSDK/releases/tag/v1.0' },
            { label: 'Avalonia UI 公式サイト', url: 'https://avaloniaui.net/' },
          ],
        },
      ],
    },
    {
      id: 'why-now',
      title: '今、WPF を選ぶ意味',
      lead: '歴史を踏まえると、WPF の現在の価値は「新しさ」ではなく「確かさ」にある。',
      blocks: [
        {
          type: 'list',
          items: [
            '**20 年近い互換性**: 2006 年に書かれた XAML の大半が、いまの .NET 10 でもそのまま動く。知識もコードも腐りにくい。',
            '**情報と部品の蓄積**: 困りごとのほとんどは、すでに誰かが解決して記録している。サードパーティのコントロールも揃っている。',
            '**ソースが読める**: 挙動に迷ったら dotnet/wpf を読めばよい。',
            '**毎年の .NET に乗る**: C# の新機能、ランタイムの性能改善、新しい配布方式をそのまま使える。',
          ],
        },
        {
          type: 'p',
          text: '一方で、Windows でしか動かないこと、Microsoft の UI 戦略の中心ではないことは変わらない。**「Windows 専用で、長く保守する、データと入力が中心のアプリ」**なら今でも第一候補になり、そうでなければ他の選択肢を検討する価値がある。この判断基準は、仕組み（第 2 章）と実務（第 3〜7 章）を見たあと、第 6 章で詳しく扱う。',
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '歴史を知っていると役に立つ場面',
          text: '古い記事やコードを読むとき、「これは .NET Framework 時代の書き方か」「4.5 以降でもっと良い方法があるか」を判断できる。たとえば、`Dispatcher.BeginInvoke` を使った古いコードは、4.5 で追加された `InvokeAsync` と `async/await` で書き直せることが多い（第 5 章）。',
        },
      ],
    },
  ],
  quiz: [
    {
      id: 'h1',
      q: 'WPF が最初に含まれていた .NET のバージョンはどれか。',
      choices: ['.NET Framework 2.0', '.NET Framework 3.0', '.NET Framework 4.0', '.NET Core 3.0'],
      answer: 1,
      explain: '.NET Framework 3.0（2006 年 11 月）で登場した。3.0 は「.NET Framework 2.0 + WPF・WCF・WF・CardSpace」という構成で、もとは WinFX と呼ばれていた。',
    },
    {
      id: 'h2',
      q: '「Avalon」とは何か。',
      choices: ['Silverlight の開発コードネーム', 'WPF の開発コードネーム', 'XAML を編集するデザインツール', 'Windows Vista の開発コードネーム'],
      answer: 1,
      explain: 'Avalon は WPF のコードネームで、2003 年の PDC で Longhorn（のちの Windows Vista）の表示基盤として紹介された。2005 年 7 月に Windows Presentation Foundation という正式名称になった。デザインツールは Expression Blend（コードネーム Sparkle）。',
    },
    {
      id: 'h3',
      q: 'WPF と Silverlight の関係として正しいものはどれか。',
      choices: [
        'Silverlight は WPF の後継で、WPF を置き換えた',
        '同じ実装を共有しており、XAML は完全に互換だった',
        '考え方は共通だが別実装で、XAML はそのままでは共有できなかった',
        'Silverlight は WPF より先に公開された',
      ],
      answer: 2,
      explain: 'Silverlight（2007 年〜2021 年）は WPF の考え方を小さなランタイムに移した別実装で、機能はサブセットに近い。同じ「XAML」でも互換ではない、という状況はその後の UWP や WinUI 3 でも続いている。',
    },
    {
      id: 'h4',
      q: '.NET Core 3.0 以降の WPF について、正しい説明はどれか。',
      choices: [
        'Linux と macOS でも動くようになった',
        '引き続き Windows でのみ動く',
        'XAML が廃止され、C# だけで画面を書くようになった',
        '.NET Framework 版と同じく、新機能は追加されない',
      ],
      answer: 1,
      explain: '.NET 自体はクロスプラットフォームだが、WPF は DirectX と Win32 に依存するため Windows 専用のまま。変わったのは、SDK スタイルのプロジェクト、アプリごとのランタイム、毎年の機能追加といった点。',
    },
    {
      id: 'h5',
      q: 'WPF のオープンソース化が発表されたのはいつか。',
      choices: ['2014 年 11 月', '2018 年 12 月', '2019 年 9 月', '2021 年 11 月'],
      answer: 1,
      explain: '2018 年 12 月 4 日の Microsoft Connect(); 2018 で発表された。2014 年 11 月は「The Roadmap for WPF」、2019 年 9 月は .NET Core 3.0 の正式版、2021 年 11 月は Windows App SDK 1.0（WinUI 3）と .NET 6 の時期。',
    },
    {
      id: 'h6',
      q: '.NET 9 の WPF で追加されたものはどれか。',
      choices: ['DataGrid コントロール', 'Ribbon コントロール', 'Fluent テーマと `ThemeMode`', '`INotifyDataErrorInfo`'],
      answer: 2,
      explain: '.NET 9（2024 年 11 月）で Windows 11 風の Fluent テーマと、ライト / ダークを切り替える `ThemeMode` が追加された。DataGrid は .NET Framework 4、Ribbon と `INotifyDataErrorInfo` は 4.5 での追加。',
    },
  ],
  exercises: [
    {
      id: 'ex-history-hello',
      title: '2006 年から変わらない、最小の画面',
      lang: 'xaml',
      level: 1,
      preview: true,
      prompt:
        'WPF の XAML は、基本部分については最初のバージョンからほとんど変わっていない。`Window` の中に `StackPanel` を置き、その中に `TextBlock`（好きな文言）と `Button`（`Content` に好きな文言）を並べてみよう。`Window` には `Title` も付けること。',
      starter: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Width="300" Height="160">

    <!-- ここに StackPanel を置き、TextBlock と Button を並べる -->

</Window>`,
      solution: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="はじめての WPF" Width="300" Height="160">

    <StackPanel Margin="16">
        <TextBlock Text="こんにちは、WPF" FontSize="16" />
        <Button Content="OK" Margin="0,12,0,0" HorizontalAlignment="Left" Padding="16,4" />
    </StackPanel>

</Window>`,
      solutionNote:
        '名前空間の URL に含まれる「2006」は、WPF が登場した年の名残。この 2 行（既定の名前空間と `x:`）は、いま新規作成される XAML ファイルにも同じものが書かれる。',
      hints: [
        '`Window` は子要素を 1 つしか持てない。だから複数の要素を並べるには、まずパネル（`StackPanel` など）を 1 つ置く。',
        '`TextBlock` の文字は `Text` 属性、`Button` の文字は `Content` 属性で指定する。',
      ],
      checks: [
        { label: 'ルート要素が Window で、Title が設定されている', test: (c) => c.xml?.name === 'Window' && !!a(c.xml, 'Title') },
        { label: 'Window の直下に StackPanel が 1 つある', test: (c) => c.xml?.children.filter((n) => !n.name.includes('.')).length === 1 && c.xml.children.some((n) => n.name === 'StackPanel') },
        { label: 'StackPanel の中に、Text を持つ TextBlock がある', test: (c) => c.els('StackPanel').some((s) => s.children.some((n) => n.name === 'TextBlock' && (!!a(n, 'Text') || !!n.text))) },
        { label: 'StackPanel の中に、Content を持つ Button がある', test: (c) => c.els('StackPanel').some((s) => s.children.some((n) => n.name === 'Button' && (!!a(n, 'Content') || !!n.text))) },
      ],
    },
  ],
}

export default chapter
