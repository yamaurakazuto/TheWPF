import type { Inline, SourceLink } from '@/types/content'

/** 第 1 章の年表データ。日付は出典で確認できた粒度（年月 or 年月日）で書く */
export interface Era {
  id: 'concept' | 'launch' | 'stall' | 'turn' | 'now'
  label: string
  range: string
  /** tokens.css の色トークン名（--c-xxx） */
  color: 'ui' | 'render' | 'mute' | 'warn' | 'data'
  note: string
}

export interface TimelineNode {
  id: string
  era: Era['id']
  /** 表示用の日付 */
  date: string
  title: string
  summary: Inline
  details: Inline[]
  /** 日付や解釈が資料によって割れる場合の注記 */
  uncertain?: Inline
  sources: SourceLink[]
}

export const eras: Era[] = [
  { id: 'concept', label: '構想期', range: '2003–2006', color: 'ui', note: 'Longhorn の一部として Avalon が構想され、名前が固まるまで' },
  { id: 'launch', label: '登場と拡張', range: '2006–2012', color: 'render', note: '.NET Framework 3.0 で登場し、4.5 まで機能が増え続けた時期' },
  { id: 'stall', label: '停滞期', range: '2012–2018', color: 'mute', note: 'Microsoft の関心が WinRT / UWP に移り、WPF は保守中心に' },
  { id: 'turn', label: '転換', range: '2018–2019', color: 'warn', note: 'オープンソース化と .NET Core 対応で、将来の見通しが変わった' },
  { id: 'now', label: '現在', range: '2020–', color: 'data', note: '毎年の .NET リリースに乗り、ゆっくり着実に改善が続く' },
]

export const timeline: TimelineNode[] = [
  {
    id: 'pdc2003',
    era: 'concept',
    date: '2003年10月',
    title: 'PDC 2003 で「Avalon」と XAML が披露される',
    summary: '次期 Windows「Longhorn」の新しい表示基盤として、コードネーム **Avalon** が開発者会議 PDC 2003 で紹介された。',
    details: [
      'Avalon は、文書・UI・メディアを 1 つの仕組みで描く「Longhorn のグラフィックスサブシステム」と説明された。',
      '同じ場で、UI を宣言的に書くための XML ベースのマークアップ言語 [[xaml]] も紹介された。',
      '当時は Avalon（表示）・Indigo（通信）・WinFS（ストレージ）を束ねた新 API 群「WinFX」が Longhorn の柱とされていた。',
    ],
    sources: [
      { label: 'BetaNews: Longhorn and More — PDC 2003 Wrap-Up（2003-10-31）', url: 'https://betanews.com/2003/10/31/longhorn-and-more-betanews-pdc-2003-wrap-up/' },
      { label: 'PC Watch: PDC 2003 レポート（2003-10-31）', url: 'https://pc.watch.impress.co.jp/docs/2003/1031/kaigai040.htm' },
      { label: 'eWeek: Gates Rounds Up Longhorn Plans', url: 'https://www.eweek.com/news/gates-rounds-up-longhorn-plans/' },
    ],
  },
  {
    id: 'rename2005',
    era: 'concept',
    date: '2005年7月',
    title: '正式名称「Windows Presentation Foundation」が決まる',
    summary: 'WinFX Beta 1 の公開に合わせて、Avalon は **Windows Presentation Foundation（WPF）**、Indigo は Windows Communication Foundation（WCF）と名付けられた。',
    details: [
      'この時点の WinFX Beta 1 は、Longhorn だけでなく Windows XP と Windows Server 2003 でも動くものとして提供された。',
      'つまり WPF は「次期 OS 専用の機能」から「既存の Windows にも入れられるフレームワーク」へと位置づけが変わっていた。',
    ],
    sources: [
      { label: 'Microsoft Learn（アーカイブ）: WinFX Beta 1 and new names（2005-07-28）', url: 'https://learn.microsoft.com/en-us/archive/blogs/scottwil/winfx-beta-1-and-new-names' },
      { label: 'Wikipedia: Windows Presentation Foundation', url: 'https://en.wikipedia.org/wiki/Windows_Presentation_Foundation', note: '2004 年 8 月に XP / Server 2003 への提供方針が示された旨の記述' },
    ],
  },
  {
    id: 'netfx3-name',
    era: 'concept',
    date: '2006年6月',
    title: 'WinFX が「.NET Framework 3.0」に改名される',
    summary: 'WinFX という名前は廃止され、.NET Framework 2.0 に WPF・WCF・WF・CardSpace を足したものが **.NET Framework 3.0** と呼ばれることになった。',
    details: [
      '発表では、変更は名前だけであり、中身（.NET Framework 2.0 の上に新しいライブラリ群を追加する構成）は変わらないと説明された。',
      'このため .NET Framework 3.0 は CLR（実行エンジン）もコンパイラも 2.0 のまま、という少し変わったバージョンになった。',
    ],
    sources: [
      { label: 'Microsoft Learn（アーカイブ）: Somasegar — .NET Framework 3.0（2006-06-09）', url: 'https://learn.microsoft.com/en-us/archive/blogs/somasegar/net-framework-3-0' },
    ],
  },
  {
    id: 'netfx30',
    era: 'launch',
    date: '2006年11月',
    title: '.NET Framework 3.0 リリース — WPF 登場',
    summary: 'WPF の最初のバージョンが .NET Framework 3.0 の一部として公開された。Windows Vista には標準搭載され、Windows XP SP2 / Server 2003 には追加インストールできた。',
    details: [
      '最初のバージョンの時点で、[[dp]]、[[routed-event]]、[[binding]]、スタイルとテンプレート、DirectX による描画といった、現在まで続く骨格はすべて揃っていた。',
      'いま書かれている WPF の XAML は、基本的な部分についてはこの時代のものとほとんど変わらない。',
    ],
    uncertain: '.NET Framework 3.0 のリリース日は資料によって異なる（Wikipedia の .NET Framework バージョン履歴は 2006-11-06、同 WPF 記事は 2006-11-21）。ここでは月までの記載に留める。',
    sources: [
      { label: 'Wikipedia: .NET Framework version history', url: 'https://en.wikipedia.org/wiki/.NET_Framework_version_history' },
      { label: 'Wikipedia: Windows Presentation Foundation', url: 'https://en.wikipedia.org/wiki/Windows_Presentation_Foundation' },
    ],
  },
  {
    id: 'blend-silverlight',
    era: 'launch',
    date: '2007年',
    title: 'Expression Blend と Silverlight',
    summary: 'デザイナー向けツール **Expression Blend**（コードネーム Sparkle）が 4 月に完成。9 月には XAML をブラウザーで動かす **Silverlight 1.0** が公開された。',
    details: [
      'Blend は「デザイナーが XAML で見た目を作り、開発者が同じファイルにロジックを付ける」という分業を実現するための道具だった。最初の公開プレビューは 2007-01-24、製造工程向けリリース（RTM）は 2007-04-30。',
      '[[silverlight]] は WPF の考え方（XAML、依存関係プロパティ、バインディング）を小さなランタイムに移したもので、1.0 は 2007-09-05、.NET のコードが書けるようになった 2 は 2008-10-14 に公開された。',
      'WPF と Silverlight は「似ているが別実装」で、同じ XAML がそのまま両方で動くわけではなかった。この「似て非なる XAML」は、のちの WinRT・UWP・WinUI でも繰り返されることになる。',
    ],
    sources: [
      { label: 'Wikipedia: Microsoft Blend', url: 'https://en.wikipedia.org/wiki/Microsoft_Blend' },
      { label: 'Wikipedia: Microsoft Silverlight version history', url: 'https://en.wikipedia.org/wiki/Microsoft_Silverlight_version_history' },
    ],
  },
  {
    id: 'netfx35',
    era: 'launch',
    date: '2007年11月〜2008年8月',
    title: '.NET Framework 3.5 / 3.5 SP1',
    summary: '3.5（2007-11-19）でバインディングの検証や 3D 上の UI が強化され、3.5 SP1（2008-08-11）ではピクセルシェーダーによるエフェクトなどが加わった。',
    details: [
      '3.5 では `IDataErrorInfo` による入力検証（`ValidatesOnDataErrors`）、バインディングのデバッグに使う `PresentationTraceSources.TraceLevel`、3D 空間に置ける UI（`UIElement3D`、`Viewport2DVisual3D`）などが追加された。',
      '3.5 SP1 では、GPU で動くエフェクト `ShaderEffect` が導入された（.NET Framework 4 のドキュメントに「3.5 SP1 で導入」と明記されている）。',
      '現場の感覚としては「3.0 は試す人のもの、3.5 SP1 から実用」という評価が多かった。ただしこれは当時の一般的な評判であり、公式な位置づけではない。',
    ],
    sources: [
      { label: "Microsoft Learn（旧版）: What's New in WPF Version 3.5", url: 'https://learn.microsoft.com/en-us/previous-versions/dotnet/netframework-3.5/bb613588(v=vs.90)' },
      { label: 'Wikipedia: .NET Framework version history', url: 'https://en.wikipedia.org/wiki/.NET_Framework_version_history', note: 'リリース日' },
      { label: 'Microsoft Learn: .NET Framework のライフサイクル', url: 'https://learn.microsoft.com/en-us/lifecycle/products/microsoft-net-framework' },
    ],
  },
  {
    id: 'netfx40',
    era: 'launch',
    date: '2010年4月',
    title: '.NET Framework 4 — 業務アプリに必要な部品が揃う',
    summary: '2010-04-12 公開。**DataGrid・Calendar・DatePicker** が標準コントロールになり、文字のにじみを改善する新しいテキスト描画、タッチ対応などが加わった。',
    details: [
      '追加された主なもの: `DataGrid` / `Calendar` / `DatePicker`、`VisualStateManager`、タッチとマニピュレーションのイベント、新しいテキスト描画スタック、イージング関数、レイアウト丸め（`UseLayoutRounding`）、描画結果のキャッシュ（`BitmapCache`）、Windows 7 のタスクバー連携（`JumpList`、`TaskbarItemInfo`）。',
      '「WPF の文字はぼやける」という初期の不満は、この版のテキスト描画の改善でかなり解消された。',
    ],
    sources: [
      { label: "Microsoft Learn（旧版）: What's New in WPF Version 4", url: 'https://learn.microsoft.com/en-us/previous-versions/dotnet/netframework-4.0/bb613588(v=vs.100)' },
      { label: 'Microsoft Learn: .NET Framework のライフサイクル', url: 'https://learn.microsoft.com/en-us/lifecycle/products/microsoft-net-framework' },
    ],
  },
  {
    id: 'netfx45',
    era: 'launch',
    date: '2012年8月',
    title: '.NET Framework 4.5 — 最後の大きな機能追加',
    summary: '**Ribbon** コントロール、`INotifyDataErrorInfo`、仮想化の強化、別スレッドからのコレクション更新、`Dispatcher.InvokeAsync` など、いまも日常的に使う機能がまとめて入った。',
    details: [
      '仮想化: `VirtualizingPanel.ScrollUnit`（項目単位 / ピクセル単位）、`CacheLength`、グループ化時の仮想化 `IsVirtualizingWhenGrouping`。',
      'バインディング: 非同期検証に対応した `INotifyDataErrorInfo`、入力のたびにソースを更新しすぎないための `Delay`、静的プロパティへのバインド、ライブシェイピング（データ変更に追従する並べ替え・絞り込み）。',
      'スレッド: UI スレッド以外からコレクションを触るための仕組み（`BindingOperations.EnableCollectionSynchronization`）、`Dispatcher.InvokeAsync`。',
      'これ以降の .NET Framework では、WPF への追加は DPI 対応や診断機能など範囲の狭いものが中心になる。',
    ],
    uncertain: '公開は 2012-08-15（Wikipedia のバージョン履歴）。Microsoft のライフサイクル表では開始日が 2012-10-09 になっている。',
    sources: [
      { label: "Microsoft Learn: What's new in WPF version 4.5", url: 'https://learn.microsoft.com/en-us/dotnet/framework/wpf/getting-started/whats-new' },
      { label: 'Wikipedia: .NET Framework version history', url: 'https://en.wikipedia.org/wiki/.NET_Framework_version_history' },
    ],
  },
  {
    id: 'win8',
    era: 'stall',
    date: '2012年10月',
    title: 'Windows 8 と WinRT — XAML がもう 1 つ生まれる',
    summary: 'Windows 8 は、ストアアプリ用の新しい API 群 [[winrt]] と、WPF とは別実装の XAML UI を導入した。Microsoft の発信は新しいアプリモデルに集中した。',
    details: [
      'WinRT の XAML は書き味こそ WPF に似ているが、コントロールも API も互換ではなく、WPF アプリをそのまま持っていくことはできなかった。',
      '同時期、[[silverlight]] は 5（2011-12-09 公開）が最後のメジャーバージョンとなり、2021 年 10 月にサポートを終えた。',
      '現場では「WPF はもう終わりなのか」という不安が広がった一方、業務アプリの多くは代替がなく、WPF（あるいは WinForms）で作られ続けた。',
    ],
    sources: [
      { label: 'Microsoft Learn: Silverlight 5 のライフサイクル', url: 'https://learn.microsoft.com/en-us/lifecycle/products/silverlight-5' },
      { label: 'Wikipedia: Microsoft Silverlight version history', url: 'https://en.wikipedia.org/wiki/Microsoft_Silverlight_version_history' },
    ],
  },
  {
    id: 'roadmap2014',
    era: 'stall',
    date: '2014年11月',
    title: '「The Roadmap for WPF」— 沈黙が破られる',
    summary: 'WPF チームが 2014-11-12 にロードマップを公開し、WPF への投資を続けることを明言した。',
    details: [
      '投資領域として挙げられたのは、性能（起動時間、`ItemsControl` のスクロールと仮想化）、新しい DirectX との相互運用、タッチや高 DPI といった新しいハードウェアへの対応。',
      'あわせて Visual Studio 2015 向けの診断ツール（実行中のビジュアルツリーを見るツールなど）が予告された。これが現在の Live Visual Tree につながる。',
      '大きな新機能の約束ではなかったが、「捨てられていない」ことが公式に示された意味は大きかった。',
    ],
    sources: [{ label: '.NET Blog: The Roadmap for WPF（2014-11-12）', url: 'https://devblogs.microsoft.com/dotnet/the-roadmap-for-wpf/' }],
  },
  {
    id: 'netfx46-48',
    era: 'stall',
    date: '2015年〜2019年',
    title: '.NET Framework 4.6 〜 4.8 — DPI とタッチの地道な改善',
    summary: '4.6.2（2016-08-02）でモニターごとの DPI 対応、4.7（2017-04-11）で新しいタッチ / スタイラス入力、4.8（2019-04-18）で Per-Monitor V2 に対応した。',
    details: [
      '4.6.2: モニターごとに DPI が違う環境で、ウィンドウを移動しても鮮明に描き直せるようになった（それ以前はシステム DPI で描いたものを OS が拡大縮小していた）。',
      '4.7: Windows の `WM_POINTER` メッセージに基づく新しいタッチ / スタイラス入力スタック。',
      '4.8: Per-Monitor V2 と、WinForms などをホストした混在環境での DPI スケーリング。',
      '.NET Framework は 4.8.1（2022-08-09。Arm64 ネイティブ対応とアクセシビリティ改善）が執筆時点の最新で、以後は新機能ではなく保守が中心になっている。',
    ],
    sources: [
      { label: "Microsoft Learn: What's new in .NET Framework", url: 'https://learn.microsoft.com/en-us/dotnet/framework/whats-new/' },
      { label: '.NET Blog: Announcing the .NET Framework 4.8', url: 'https://devblogs.microsoft.com/dotnet/announcing-the-net-framework-4-8/' },
      { label: 'Microsoft Learn: .NET Framework のライフサイクル', url: 'https://learn.microsoft.com/en-us/lifecycle/products/microsoft-net-framework', note: '各バージョンの開始日' },
    ],
  },
  {
    id: 'build2018',
    era: 'turn',
    date: '2018年5月',
    title: 'Build 2018 —「.NET Core 3 でデスクトップをサポート」',
    summary: '2018-05-07、.NET Core 3 が Windows デスクトップアプリ（Windows Forms、WPF、UWP XAML）をサポートすると発表された。',
    details: [
      'それまで .NET Core はサーバーとコンソール向けで、WPF は .NET Framework でしか動かなかった。',
      'この発表で、WPF が「凍結されつつある .NET Framework」から「進化を続ける .NET Core」の側へ移る道筋が示された。',
    ],
    sources: [
      { label: '.NET Blog: .NET Core 3 and Support for Windows Desktop Applications（2018-05-07）', url: 'https://devblogs.microsoft.com/dotnet/net-core-3-and-support-for-windows-desktop-applications/' },
    ],
  },
  {
    id: 'oss2018',
    era: 'turn',
    date: '2018年12月4日',
    title: 'WPF がオープンソースになる',
    summary: 'Microsoft Connect(); 2018 で、WPF・Windows Forms・WinUI のオープンソース化が発表された。リポジトリは GitHub の `dotnet/wpf`、ライセンスは MIT。',
    details: [
      '公開は段階的で、最初は `System.Xaml` から始まり、残りは数か月かけて順次公開された。',
      'ソースが読めるようになったことで、「この挙動は仕様かバグか」を自分で確かめられるようになった。これは日々の開発にとって非常に大きい。',
    ],
    sources: [
      { label: 'Windows Developer Blog: Announcing Open Source of WPF, Windows Forms, and WinUI（2018-12-04）', url: 'https://blogs.windows.com/windowsdeveloper/2018/12/04/announcing-open-source-of-wpf-windows-forms-and-winui-at-microsoft-connect-2018/' },
      { label: 'GitHub: dotnet/wpf', url: 'https://github.com/dotnet/wpf' },
    ],
  },
  {
    id: 'netcore30',
    era: 'turn',
    date: '2019年9月23日',
    title: '.NET Core 3.0 — WPF が .NET Core で動く',
    summary: '.NET Core 3.0 の正式版で、WPF と Windows Forms が .NET Core 上で動くようになった。ただし動作するのは引き続き **Windows のみ**。',
    details: [
      'SDK スタイルの簡潔な csproj、アプリごとにランタイムを同梱できる配布（[[self-contained]]）、同じ PC に複数バージョンを共存できることなど、.NET Core 側の利点を WPF でも使えるようになった。',
      '同年 12 月 3 日には長期サポート版の .NET Core 3.1 が公開された。',
    ],
    sources: [
      { label: '.NET Blog: Announcing .NET Core 3.0（2019-09-23）', url: 'https://devblogs.microsoft.com/dotnet/announcing-net-core-3-0/' },
      { label: '.NET 公式: サポートポリシー（リリース日一覧）', url: 'https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core' },
    ],
  },
  {
    id: 'neighbors',
    era: 'now',
    date: '2020年〜2023年',
    title: '.NET 5 / 6 と、隣人たちの登場',
    summary: '.NET 5（2020-11-10）、.NET 6（2021-11-08）と毎年のリリースに WPF も含まれるようになった。同じ時期に WinUI 3、.NET MAUI、Avalonia 11 が出そろう。',
    details: [
      '[[winui3]] を含む Windows App SDK 1.0 は 2021-11-16 に公開された。',
      '[[maui]] は 2022-05-23 に一般提供が始まった。',
      '[[avalonia]] は 2023 年 7 月に 11 を公開。同社は WPF アプリを macOS / Linux でも動かす商用製品「Avalonia XPF」も提供している。',
      'WPF はこれらに置き換えられたのではなく、「Windows 専用で、実績が長い」という位置に留まり続けている。',
    ],
    uncertain: 'Avalonia 11 の公開日は、Wikipedia が引用する 2023-07-10 付の報道に基づく。',
    sources: [
      { label: '.NET 公式: サポートポリシー（リリース日一覧）', url: 'https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core' },
      { label: 'GitHub: Windows App SDK 1.0 リリース', url: 'https://github.com/microsoft/WindowsAppSDK/releases/tag/v1.0' },
      { label: '.NET Blog: Introducing .NET MAUI（2022-05-23）', url: 'https://devblogs.microsoft.com/dotnet/introducing-dotnet-maui-one-codebase-many-platforms/' },
      { label: 'Wikipedia: Avalonia (software framework)', url: 'https://en.wikipedia.org/wiki/Avalonia_(software_framework)' },
    ],
  },
  {
    id: 'net8',
    era: 'now',
    date: '2023年11月14日',
    title: '.NET 8 — 小さいが実用的な追加',
    summary: 'リモートデスクトップでのハードウェアアクセラレーション（オプトイン）と、フォルダー選択ダイアログ `OpenFolderDialog` が追加された。',
    details: [
      'RDP 経由では従来ソフトウェア描画になっていたが、`Switch.System.Windows.Media.EnableHardwareAccelerationInRdp` を `runtimeconfig.json` で有効にすると GPU を使えるようになった。',
      '`Microsoft.Win32.OpenFolderDialog` の追加で、フォルダー選択のために WinForms を参照したり Win32 API を直接呼んだりする必要がなくなった。',
    ],
    sources: [{ label: "Microsoft Learn: What's new in WPF for .NET 8", url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/whats-new/net80' }],
  },
  {
    id: 'net9',
    era: 'now',
    date: '2024年11月12日',
    title: '.NET 9 — Fluent テーマとダークモード',
    summary: 'Windows 11 風の **Fluent テーマ**が追加され、ライト / ダークの切り替えとシステムのアクセントカラーに対応した。',
    details: [
      '`ThemeMode`（`Light` / `Dark` / `System` / `None`）を `Application` か `Window` に設定するだけでテーマを切り替えられる。既定は `None`（従来の Aero2）。',
      'コードから `ThemeMode` を設定する API は実験的扱いで、警告 `WPF0001` の抑制が必要。',
      '`BinaryFormatter` の実装が .NET から削除された影響で、クリップボードやドラッグ & ドロップで独自型を扱うコードは見直しが必要になった。',
    ],
    sources: [{ label: "Microsoft Learn: What's new in WPF for .NET 9", url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/whats-new/net90' }],
  },
  {
    id: 'net10',
    era: 'now',
    date: '2025年11月11日',
    title: '.NET 10（LTS）— 細部の磨き込み',
    summary: 'Fluent スタイルの対象コントロール拡大、`Grid` の行・列定義の短縮記法、`MessageBox` のボタン追加、内部の性能改善など。',
    details: [
      '`<Grid ColumnDefinitions="1*, 2*, Auto" RowDefinitions="Auto, *">` のように、行と列を属性 1 つで書けるようになった。',
      'クリップボード関連の実装が Windows Forms と共通化された。',
      '.NET 10 は長期サポート版で、サポート期限は 2028-11-14。',
    ],
    sources: [
      { label: "Microsoft Learn: What's new in WPF for .NET 10", url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/whats-new/net100' },
      { label: '.NET 公式: サポートポリシー', url: 'https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core' },
    ],
  },
  {
    id: 'net11',
    era: 'now',
    date: '2026年（執筆時点）',
    title: '.NET 11 — 正式版の直前',
    summary: '執筆時点（2026-11-10）で .NET 11 はリリース候補（RC）段階。WPF の変更点として公開されているのは不具合修正が中心。',
    details: [
      'RC 1 は 2026-09-08、RC 2 は 10-13、RC 3 は 10-25 に公開された。正式版の日付は、執筆時点で公式のサポートポリシーには掲載されていない。',
      '公開されている WPF の変更: 自己完結型で発行したときの混合モードアセンブリの読み込み修正、デスクトップウィンドウマネージャー障害時のクラッシュ防止、Windows 10 上の Fluent 背景の修正など。',
      '.NET 8 と .NET 9 は 2026-11-10 にサポートが終了する。いま新規に始めるなら .NET 10 が基準になる。',
    ],
    uncertain: '.NET 11 の正式リリース日と最終的な変更内容は、このページの執筆後に確定する。必ず公式の最新情報で確認してほしい。',
    sources: [
      { label: "Microsoft Learn: What's new in WPF for .NET 11", url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/whats-new/net110' },
      { label: '.NET 公式: サポートポリシー', url: 'https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core' },
    ],
  },
]
