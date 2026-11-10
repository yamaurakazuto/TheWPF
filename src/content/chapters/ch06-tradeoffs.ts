import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'
import { a } from '@/lib/exercise'

const chapter: Chapter = {
  ...metaOf('tradeoffs'),
  goals: [
    'WPF の強みと弱みを、それぞれ根拠とともに説明できる',
    '強みと弱みが、同じ設計の表と裏であることがわかる',
    '「WPF を選ぶべきケース / 選ぶべきでないケース」を、要件から判断できる',
  ],
  sections: [
    {
      id: 'stance',
      title: 'この章の読み方',
      lead: '技術の評価は、賛美にも断罪にも流れやすい。ここでは「何が事実で、どんな条件のときにそれが効いてくるのか」を分けて書く。',
      blocks: [
        {
          type: 'p',
          text: '第 2〜5 章で見てきたとおり、WPF の特徴は「OS に頼らず、自分で全部描く」「見た目と動作を分ける」「値の流れを宣言する」という 3 つの設計判断から来ている。**強みも弱みも、この同じ設計の表と裏**だ。だから各項目には、根拠に加えて「反対側から見た但し書き」を必ず添えてある。',
        },
        {
          type: 'figure',
          demo: 'FrameworkMap',
          kind: 'figure',
          title: '登場年と「動く場所」で見た位置づけ',
          caption: '縦軸は登場した年、横の列は動く OS の範囲。どちらも事実を並べただけで、上下左右に優劣の意味はない。WPF は「Windows のみ」の列にあり、そこで最も長い実績を持つ XAML フレームワークだ。',
        },
        {
          type: 'sources',
          items: [
            { label: '第 1 章の年表（各フレームワークの登場時期の出典）', url: '#/chapters/history' },
            { label: 'Wikipedia: Avalonia (software framework)', url: 'https://en.wikipedia.org/wiki/Avalonia_(software_framework)' },
          ],
        },
      ],
    },
    {
      id: 'pros-cons',
      title: '強みと弱み',
      lead: '左が強み、右が弱み。見出しだけを眺めて全体像をつかんでから、気になる項目を開いて根拠を確かめてほしい。',
      blocks: [
        {
          type: 'figure',
          demo: 'ProsConsBoard',
          kind: 'demo',
          title: 'WPF の強み・弱み（根拠と但し書き付き）',
          caption: '各項目を開くと、根拠・但し書き・関連する章や出典へのリンクが出る。',
        },
        {
          type: 'table',
          caption: '表と裏の関係',
          head: ['設計上の判断', '強みとして現れる', '弱みとして現れる'],
          rows: [
            ['OS の部品を使わず、DirectX で自前描画する', '解像度非依存、自由な外観、どの Windows でも同じ見た目', 'Windows 専用、起動とメモリの重さ、OS の新しい見た目に自動では追従しない'],
            ['見た目（テンプレート）と動作を分離する', '外観の完全な差し替え', '学習曲線、既定テンプレートの理解が必要'],
            ['値の流れを実行時のバインディングで宣言する', 'MVVM、少ないコード、テストしやすさ', '間違いが実行時まで見つからない、AOT / トリミングとの相性の悪さ'],
            ['20 年近く互換性を保つ', '知識と資産が腐らない', '新しい設計の取り込みが遅い'],
          ],
        },
        { type: 'h3', text: '補足: エアスペース問題' },
        {
          type: 'p',
          text: '相互運用の但し書きに出てきた[[airspace]]は、導入してから気づくと痛いので、もう少し説明しておく。WPF のウィンドウは全体で 1 枚の描画面で、その中の要素は自由に重ねたり透過したりできる。ところが `WindowsFormsHost` や `WebView2` などで埋め込んだ領域は、**別の技術がその矩形を丸ごと所有する**。そのため、埋め込んだ領域の上に WPF のポップアップや半透明のオーバーレイを重ねることができず、回転・透過・クリッピングも効かない。',
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '埋め込みを使うときの設計',
          text: '埋め込む領域は、ほかの要素と重ならない独立した矩形にする。その上に何かを出したい場合（読み込み中の表示など）は、埋め込んだ側の技術で描くか、別ウィンドウ（`Popup` や子ウィンドウ）にする。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: WPF と Win32 の相互運用', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/wpf-and-win32-interoperation' },
            { label: 'Microsoft Learn: テクノロジ領域の概要（エアスペース）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/technology-regions-overview' },
            { label: 'Microsoft Learn: トリミングの既知の非互換性', url: 'https://learn.microsoft.com/en-us/dotnet/core/deploying/trimming/incompatibilities' },
            { label: 'Visual Studio Blog: Dive into native Windows development with new WinUI workload（2024-07-02）', url: 'https://devblogs.microsoft.com/visualstudio/dive-into-native-windows-development-with-new-winui-workload-and-template-improvements/' },
          ],
        },
      ],
    },
    {
      id: 'decision',
      title: '判断フローチャート — WPF を選ぶべきか',
      lead: '強みと弱みを踏まえて、実際の要件から考える。質問に答えていくと、検討すべき方向が出る。',
      blocks: [
        {
          type: 'figure',
          demo: 'DecisionFlow',
          kind: 'demo',
          title: 'WPF を選ぶべきか — 判断フロー',
          caption: '質問は「あとから変えにくい条件」の順に並んでいる。最初に OS、次に既存資産、それからアプリの種類。「フロー全体を見る」で全経路を確認できる。',
        },
        {
          type: 'compare',
          left: {
            label: 'WPF を選ぶべきケース',
            tone: 'good',
            points: [
              '対象が Windows の PC に限られ、今後もそうである',
              'データの入力・一覧・検索・帳票が中心の業務アプリ',
              '5 年、10 年と保守する前提で、互換性と安定を重視する',
              '既存の WPF / WinForms 資産や、経験のあるチームがある',
              '独自の見た目や、作り込んだコントロールが必要',
              '周辺機器、COM、Win32 API との連携が多い',
            ],
          },
          right: {
            label: 'WPF を選ぶべきでないケース',
            tone: 'bad',
            points: [
              'macOS、Linux、スマートフォン、ブラウザーでも動かす必要がある',
              'タッチ操作が主役で、タブレットやキオスク端末が主な利用環境',
              '起動時間や配布サイズが最優先の、小さなユーティリティ',
              'Windows 11 の最新の見た目や OS 機能との統合が最重要',
              'ゲームや本格的な 3D など、描画性能そのものが価値になるアプリ',
              'チームが Web 技術に強く、デスクトップ固有の機能がほとんど不要',
            ],
          },
          caption: 'どちらにも当てはまる項目があるのが普通だ。そのときは「あとから変えられない条件」（対象 OS、既存資産）を優先して考える。',
        },
        {
          type: 'callout',
          kind: 'tip',
          title: 'どれを選んでも無駄にならない準備',
          text: 'ViewModel と業務ロジックを、UI フレームワークに依存しないライブラリ（`net10.0`）に分けておく。これだけで、将来 WinUI 3 や Avalonia に移ることになっても、書き直すのは View の層だけで済む。MVVM は「テストのため」だけでなく、**技術選定をやり直せるようにしておく保険**でもある。',
        },
      ],
    },
  ],
  quiz: [
    {
      id: 't1',
      q: '「WPF は Windows でしか動かない」理由として最も適切なものはどれか。',
      choices: [
        '.NET が Windows でしか動かないから',
        'WPF の描画と入力が DirectX と Win32 に依存しているから',
        'XAML が Windows 専用の言語だから',
        'ライセンス上、他の OS での利用が禁じられているから',
      ],
      answer: 1,
      explain: '.NET 自体は Linux や macOS でも動き、XAML は Avalonia や .NET MAUI でも使われている。WPF が Windows 専用なのは、描画エンジン（milcore → DirectX）とウィンドウ・入力の処理（Win32）に深く依存しているため。ライセンスは MIT。',
    },
    {
      id: 't2',
      q: '`WindowsFormsHost` で埋め込んだ WinForms のコントロールの上に、WPF の半透明のオーバーレイを重ねようとしたが、表示されない。この現象を何と呼ぶか。',
      choices: ['デッドロック', 'エアスペース問題', 'メモリリーク', 'バインディングエラー'],
      answer: 1,
      explain: '画面上の 1 つの領域は 1 つの描画技術しか所有できない、という制約。埋め込んだ領域は WinForms（Win32）が所有するため、WPF の要素を重ねたり、透過・回転させたりできない。',
    },
    {
      id: 't3',
      q: 'WPF アプリの発行について、執筆時点で正しい説明はどれか。',
      choices: [
        'トリミングを有効にすれば、配布サイズを 10 MB 以下にできる',
        'Native AOT に対応しており、ランタイムなしで動く単一の exe にできる',
        'トリミングは .NET SDK 側で無効化されており、Native AOT にも対応していない',
        '自己完結型の発行はできない',
      ],
      answer: 2,
      explain: 'WPF はリフレクションへの依存が強く、トリミングすると動かなくなるため、SDK が無効化している。Native AOT にも対応していない。自己完結型（ランタイム同梱）の発行はできるが、配布サイズは大きくなる。',
    },
    {
      id: 't4',
      q: '次のうち、WPF を第一候補にするのが最も妥当なのはどれか。',
      choices: [
        'iOS と Android 向けの会員アプリ',
        '社内の Windows PC で使う、受注入力と帳票出力の業務システム',
        '50 KB で配りたい常駐ユーティリティ',
        'macOS のデザイナー向けの画像編集ツール',
      ],
      answer: 1,
      explain: 'Windows 専用、データ入力と表と帳票が中心、長期保守、という条件は WPF が最も得意とする領域。モバイルや macOS では動かず、極小サイズの配布にも向かない。',
    },
    {
      id: 't5',
      q: '将来、別の UI フレームワークへ移る可能性に備えて、いま最も効果のある設計はどれか。',
      choices: [
        'コードビハインドにすべての処理を書いておく',
        'ViewModel と業務ロジックを、WPF に依存しないライブラリに分けておく',
        'すべてのコントロールを自作しておく',
        'XAML を使わず、C# だけで画面を組み立てておく',
      ],
      answer: 1,
      explain: 'UI に依存しない層が厚いほど、移行時に書き直す範囲が View だけで済む。MVVM と、WPF 非依存のプロジェクト分割（第 3 章）は、そのための最も確実な方法。',
    },
  ],
  exercises: [
    {
      id: 'ex-trade-theme',
      title: 'Fluent テーマを有効にする',
      lang: 'xaml',
      level: 1,
      prompt:
        '「見た目が古い」という弱みは、.NET 9 以降ならかなり緩和できる。`App.xaml` の `Application` 要素に `ThemeMode` を追加して、**OS のライト / ダーク設定に追従する** Fluent テーマを有効にしよう。',
      starter: `<Application x:Class="MyApp.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             StartupUri="MainWindow.xaml">
    <Application.Resources>
    </Application.Resources>
</Application>`,
      solution: `<Application x:Class="MyApp.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             StartupUri="MainWindow.xaml"
             ThemeMode="System">
    <Application.Resources>
    </Application.Resources>
</Application>`,
      solutionNote:
        '`ThemeMode` は `Light` / `Dark` / `System` / `None` の 4 つ。`None`（既定）は従来の見た目のまま。XAML での指定は .NET 9 以降でそのまま使えるが、**C# のコードから設定する API は実験的扱い**で、警告 `WPF0001` の抑制が必要になる。特定のウィンドウだけ変えたい場合は、`Window` にも同じ属性を書ける。',
      hints: ['属性は `Application` の開始タグに足す。', 'OS の設定に追従させる値は `System`。'],
      checks: [
        { label: 'ルート要素が Application のまま', test: (c) => c.xml?.name === 'Application' },
        { label: 'Application に ThemeMode が指定されている', test: (c) => !!a(c.xml ?? undefined, 'ThemeMode') },
        { label: 'ThemeMode の値が System（OS の設定に追従）', test: (c) => a(c.xml ?? undefined, 'ThemeMode') === 'System' },
        { label: 'StartupUri など、もとの属性を消していない', test: (c) => !!a(c.xml ?? undefined, 'StartupUri') && !!a(c.xml ?? undefined, 'x:Class') },
      ],
    },
  ],
}

export default chapter
