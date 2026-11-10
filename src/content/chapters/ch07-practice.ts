import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'
import { a } from '@/lib/exercise'

const chapter: Chapter = {
  ...metaOf('practice'),
  goals: [
    'UI 仮想化が効く条件と、黙って外れる原因を挙げられる',
    '性能問題を「要素の数」「レイアウト」「描画」「バインディング」に分けて疑える',
    'Live Visual Tree や Snoop で、実行中のアプリの中身を調べられる',
    'ViewModel の単体テストを書け、UI テストをどこまでやるかを判断できる',
    '配布方式（MSIX / ClickOnce / 自己完結型 / 単一ファイル）を要件から選べる',
    '代表的なアンチパターンを見分け、直し方がわかる',
  ],
  sections: [
    {
      id: 'virtualization',
      title: 'パフォーマンス ① UI 仮想化',
      lead: 'WPF の性能問題の半分は、「作らなくてよい UI 要素を作っている」ことが原因だ。10 万件のデータを表示するのに、10 万行分の要素は要らない。',
      blocks: [
        {
          type: 'figure',
          demo: 'VirtualizationDemo',
          kind: 'demo',
          title: 'UI 仮想化 — データの件数と、作られる要素の数',
          caption: '件数を 100,000 件にして、仮想化のチェックを外してみる。次に Standard と Recycling を切り替えてスクロールし、「累計」と行の「コンテナ #」の変化を見る。',
        },
        {
          type: 'p',
          text: '[[ui-virtualization]]は、`ListBox`、`ListView`、`DataGrid` では既定で有効になっている。問題は、**設定や構成によって黙って無効になる**ことだ。エラーも警告も出ず、ただ遅くなる。',
        },
        {
          type: 'table',
          caption: '仮想化が外れる原因と対処',
          head: ['原因', 'なぜ外れるか', '対処'],
          rows: [
            ['リストを `StackPanel` や `ScrollViewer` の中に置いた', '親が高さ「無限大」を渡すので、リストが全項目分の高さを要求する（第 2 章）', '`Grid` の `*` の行や `DockPanel` に置き、リスト自身にスクロールさせる'],
            ['`ScrollViewer.CanContentScroll="False"` にした', 'ピクセル単位でスクロールさせる古い方法で、仮想化と両立しない', '`VirtualizingPanel.ScrollUnit="Pixel"` を使う'],
            ['`ItemsPanel` を `WrapPanel` などに差し替えた', '仮想化するのは `VirtualizingStackPanel` などの専用パネルだけ', '仮想化対応のパネルを使う（タイル表示なら、対応したサードパーティ製パネル）'],
            ['グループ化した', '既定では、グループ化すると仮想化されない', '`VirtualizingPanel.IsVirtualizingWhenGrouping="True"`'],
            ['`TreeView` / `ComboBox` を使っている', 'この 2 つは既定で仮想化が無効', '`VirtualizingPanel.IsVirtualizing="True"`（`ComboBox` は `ItemsPanel` も `VirtualizingStackPanel` にする）'],
            ['`DataGrid` の列が非常に多い', '列の仮想化は既定で無効', '`EnableColumnVirtualization="True"`'],
          ],
        },
        {
          type: 'code',
          lang: 'xaml',
          title: '大量データ向けのリスト設定',
          excerpt: true,
          code: `<!-- Grid の * の行に置く（高さが有限になる） -->
<Grid>
    <Grid.RowDefinitions>
        <RowDefinition Height="Auto" />
        <RowDefinition Height="*" />
    </Grid.RowDefinitions>

    <TextBlock Grid.Row="0" Text="顧客一覧" />

    <ListBox Grid.Row="1"
             ItemsSource="{Binding Customers}"
             VirtualizingPanel.IsVirtualizing="True"
             VirtualizingPanel.VirtualizationMode="Recycling"
             VirtualizingPanel.ScrollUnit="Pixel" />
</Grid>`,
        },
        {
          type: 'table',
          caption: '仮想化に関するプロパティ',
          head: ['プロパティ', '値', '効果'],
          rows: [
            ['`VirtualizingPanel.IsVirtualizing`', '`True` / `False`', '仮想化そのものの有効 / 無効'],
            ['`VirtualizingPanel.VirtualizationMode`', '`Standard`（既定）/ `Recycling`', '`Recycling` は画面外に出たコンテナを使い回す（[[container-recycling]]）。スクロールが軽くなり、GC の負担も減る'],
            ['`VirtualizingPanel.ScrollUnit`', '`Item`（既定）/ `Pixel`', '`Item` は 1 項目ずつカクッと動く。`Pixel` は滑らかに動く'],
            ['`VirtualizingPanel.CacheLength`', '既定は前後 1 ページ分', '表示範囲の前後に、余分に作っておく量。増やすとスクロールは滑らかに、メモリは多くなる'],
            ['`ScrollViewer.IsDeferredScrollingEnabled`', '`True` / `False`', 'スクロールバーをドラッグ中は中身を更新せず、離したときに 1 回だけ更新する'],
          ],
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: 'Recycling にしたら、行の状態が別の行に移った',
          text: 'コンテナを使い回すということは、**前の項目で使われていた UI が、そのまま次の項目に使われる**ということだ。行の状態（展開している、チェックが入っている、スクロール位置など）を UI 要素の側だけに持たせていると、別の行にその状態が現れる。状態は必ずデータ（ViewModel）に持たせ、バインディングで UI に反映する。',
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'UI 仮想化と「データ仮想化」は別の話',
          text: 'UI 仮想化は「UI 要素を全部作らない」仕組みで、データそのものは全件メモリにある前提だ。100 万件のデータを全部読み込むこと自体が重い場合は、ページングや検索条件による絞り込みで「そもそも全件を持たない」設計にする。WPF 標準には、データを必要な分だけ読み込む仕組み（データ仮想化）は用意されていない。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: パフォーマンスの最適化: コントロール（UI 仮想化）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/optimizing-performance-controls' },
            { label: 'Microsoft Learn: VirtualizingPanel クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.controls.virtualizingpanel' },
            { label: "Microsoft Learn: What's new in WPF version 4.5（ScrollUnit、CacheLength、グループ化時の仮想化）", url: 'https://learn.microsoft.com/en-us/dotnet/framework/wpf/getting-started/whats-new' },
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'パフォーマンス ② 要素・レイアウト・描画・バインディング',
      lead: '仮想化が効いていても遅いときは、次の 4 つを順に疑う。',
      blocks: [
        {
          type: 'table',
          caption: '性能を落とす要因と、効く対策',
          head: ['疑う場所', '症状', '対策'],
          rows: [
            ['**要素の数**（ビジュアルツリーの大きさ）', '画面の表示・切り替えが遅い。メモリが多い', 'ツリーを浅く保つ。入れ子の `Grid` を減らす。`Label` より `TextBlock`、装飾だけの `Border` の重ね掛けを避ける。行テンプレートを単純にする'],
            ['**レイアウトの再計算**', 'リサイズや値の更新でカクつく', '更新のたびに大きさが変わらない構成にする（固定幅、`Auto` の乱用を避ける）。アニメーションは `Margin` や `Width` ではなく `RenderTransform` で行う'],
            ['**描画**', 'スクロールやアニメーションが重い', 'ブラシやジオメトリを `Freeze()` する。影やぼかし（`Effect`）、`Opacity` の重ね掛け、巨大な画像を減らす。画像は表示サイズでデコードする（`DecodePixelWidth`）'],
            ['**バインディング**', '一覧の表示や更新が遅い', '変わらない値は `Mode=OneTime`。`ItemsSource` には `IEnumerable` ではなく `IList`（`ObservableCollection` など）を渡す。大量の追加は 1 件ずつではなく、まとめて行う'],
          ],
        },
        { type: 'h3', text: 'ビジュアルツリーを浅く保つ' },
        {
          type: 'compare',
          left: {
            label: '要素が多い行テンプレート',
            tone: 'bad',
            lang: 'xaml',
            code: `<DataTemplate>
    <Border Padding="4">
        <Grid>
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="Auto" />
                <ColumnDefinition Width="*" />
            </Grid.ColumnDefinitions>
            <Border Grid.Column="0" Padding="2">
                <StackPanel>
                    <Label Content="{Binding Code}" />
                </StackPanel>
            </Border>
            <Border Grid.Column="1" Padding="2">
                <StackPanel>
                    <Label Content="{Binding Name}" />
                </StackPanel>
            </Border>
        </Grid>
    </Border>
</DataTemplate>`,
            points: ['`Label` は 1 つで複数の要素に展開されるコントロール', '役割のない `Border` と `StackPanel` が、行ごとに何個も作られる', '1,000 行なら、この差が 1,000 倍になる'],
          },
          right: {
            label: '同じ見た目を、少ない要素で',
            tone: 'good',
            lang: 'xaml',
            code: `<DataTemplate>
    <Grid Margin="4">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="80" />
            <ColumnDefinition Width="*" />
        </Grid.ColumnDefinitions>
        <TextBlock Grid.Column="0" Margin="2"
                   Text="{Binding Code}" />
        <TextBlock Grid.Column="1" Margin="2"
                   Text="{Binding Name}" />
    </Grid>
</DataTemplate>`,
            points: ['`TextBlock` は展開されない軽い要素', '余白は `Margin` で付ければ、包む要素が要らない', '列幅を固定すると、行ごとの幅の計算も不要になる'],
          },
        },
        { type: 'h3', text: 'レイアウトを起こさないアニメーション' },
        {
          type: 'code',
          lang: 'xaml',
          title: '位置を動かすなら RenderTransform',
          excerpt: true,
          code: `<!-- ✗ Margin を動かすと、毎フレーム Measure / Arrange が走る -->
<!-- ✓ RenderTransform は描画時の変形なので、レイアウトは走らない -->
<Border x:Name="Panel" Width="240" Background="{StaticResource PanelBrush}">
    <Border.RenderTransform>
        <TranslateTransform x:Name="PanelOffset" X="-240" />
    </Border.RenderTransform>
    <Border.Triggers>
        <EventTrigger RoutedEvent="Loaded">
            <BeginStoryboard>
                <Storyboard>
                    <DoubleAnimation Storyboard.TargetName="PanelOffset"
                                     Storyboard.TargetProperty="X"
                                     To="0" Duration="0:0:0.25" />
                </Storyboard>
            </BeginStoryboard>
        </EventTrigger>
    </Border.Triggers>
</Border>`,
        },
        { type: 'h3', text: 'Freeze と画像' },
        {
          type: 'table',
          caption: '描画まわりの設定',
          head: ['設定', '効果', '使いどころ'],
          rows: [
            ['`Freeze()` / `po:Freeze="True"`', '変更監視が不要になり、メモリと描画の負荷が下がる（第 5 章）', '実行中に変えないブラシ、ペン、ジオメトリ、画像のすべて'],
            ['`BitmapImage.DecodePixelWidth`', '表示サイズに縮小してデコードする。メモリ使用量が大きく減る', 'サムネイル一覧。4000×3000 の写真を 200 px で表示するような場面'],
            ['`RenderOptions.BitmapScalingMode`', '`LowQuality` は速い。`HighQuality` は縮小がきれい。`NearestNeighbor` は補間せずくっきり', '大量の画像のスクロールは `LowQuality`、ドット絵や拡大表示は `NearestNeighbor`'],
            ['`CacheMode="BitmapCache"`', '複雑なベクタ描画を、一度ビットマップにして使い回す', '中身は変わらないが、移動や透過でたびたび再描画される複雑な図形'],
            ['`TextOptions.TextFormattingMode="Display"`', '小さな文字を、ピクセルに合わせてくっきり描く', '12 px 前後の本文が多い業務画面'],
          ],
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '測ってから直す',
          text: 'ここに挙げた対策を闇雲に全部やる必要はない。Visual Studio のパフォーマンスプロファイラー（CPU 使用率、メモリ使用量、.NET オブジェクトの割り当て）で、**時間を使っているのがレイアウトなのか、描画なのか、自分のコードなのか**をまず確かめる。原因が自分のコード（データの取得や変換）だった、ということも多い。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: WPF アプリケーションのパフォーマンスの最適化', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/optimizing-wpf-application-performance' },
            { label: 'Microsoft Learn: パフォーマンスの最適化: レイアウトとデザイン', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/optimizing-performance-layout-and-design' },
            { label: 'Microsoft Learn: パフォーマンスの最適化: データ バインディング', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/optimizing-performance-data-binding' },
            { label: 'Microsoft Learn: パフォーマンスの最適化: 2D グラフィックスとイメージング', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/optimizing-performance-2d-graphics-and-imaging' },
          ],
        },
      ],
    },
    {
      id: 'debugging',
      title: 'デバッグの道具',
      lead: 'WPF のデバッグは、「いま画面に何が、どういう状態で存在しているか」を見られるかどうかで、かかる時間が大きく変わる。',
      blocks: [
        {
          type: 'table',
          caption: '道具と、それで解決する問い',
          head: ['道具', '何ができるか', 'こんなときに'],
          rows: [
            ['ライブ ビジュアル ツリー（Visual Studio）', 'デバッグ実行中のアプリのビジュアルツリーを表示する。画面上の要素をクリックして、ツリー上の位置を特定できる', '「この余白はどの要素のものか」「テンプレートの中身はどうなっているか」'],
            ['ライブ プロパティ エクスプローラー（Visual Studio）', '選んだ要素のプロパティ値と、**その値がどこから来たか**（ローカル値、スタイル、継承…）を表示する。その場で値を変えて試せる', '「なぜこの色になっているのか」「DataContext に何が入っているか」'],
            ['XAML ホット リロード（Visual Studio）', '実行したまま XAML を編集し、すぐに反映する', '余白や色の調整。ビルドし直す往復をなくす'],
            ['XAML バインド エラー ウィンドウ（Visual Studio）', '失敗したバインディングを一覧表示する（第 4 章）', '「表示されない」ときの最初の確認'],
            ['Snoop（オープンソース）', '実行中の任意の WPF アプリに接続して、ツリー、プロパティ、イベントの伝播、バインディングエラーを調べる', 'Visual Studio のない検証環境や、デバッグ実行でない状態を調べたいとき'],
            ['パフォーマンス プロファイラー（Visual Studio）', 'CPU 使用率、メモリ、オブジェクトの割り当てを計測する', '「遅い」「メモリが増え続ける」の原因調査'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'DebuggerDisplay — デバッガーでの見え方を整える',
          code: `using System.Diagnostics;

// ウォッチ ウィンドウやデータヒントに、型名ではなく中身が表示されるようになる。
// コレクションの中身を調べるとき、1 件ずつ展開しなくて済む
[DebuggerDisplay("{Code}: {Name} (在庫 {Stock})")]
public class Product
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Stock { get; set; }
}`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'バインディングエラーでデバッガーを止める（デバッグビルドのみ）',
          code: `using System.Diagnostics;

/// <summary>バインディングエラーが出力された瞬間に、デバッガーを止めるリスナー。</summary>
public sealed class BindingErrorListener : TraceListener
{
    /// <summary>App.OnStartup から 1 回呼ぶ。</summary>
    [Conditional("DEBUG")]
    public static void Register()
    {
        PresentationTraceSources.Refresh();
        PresentationTraceSources.DataBindingSource.Switch.Level = SourceLevels.Error;
        PresentationTraceSources.DataBindingSource.Listeners.Add(new BindingErrorListener());
    }

    public override void Write(string? message)
    {
    }

    public override void WriteLine(string? message)
    {
        // message にエラー文が入っている。見逃しを防ぐため、その場で止める
        if (Debugger.IsAttached)
        {
            Debugger.Break();
        }
    }
}`,
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '調査の定石',
          text: '見た目の問題は「ライブ ビジュアル ツリーで要素を特定 → ライブ プロパティ エクスプローラーで値の出どころを確認」。表示されない問題は「出力ウィンドウのバインディングエラー → DataContext の確認」。遅い問題は「プロファイラーで場所を特定 → 仮想化と要素数を確認」。この 3 本の道筋を覚えておけば、大半は片が付く。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: 実行中の XAML レイアウトを検査する（ライブ ビジュアル ツリー）', url: 'https://learn.microsoft.com/en-us/visualstudio/xaml-tools/inspect-xaml-properties-while-debugging' },
            { label: 'Microsoft Learn: XAML ホット リロード', url: 'https://learn.microsoft.com/en-us/visualstudio/xaml-tools/xaml-hot-reload' },
            { label: 'GitHub: snoopwpf/snoopwpf', url: 'https://github.com/snoopwpf/snoopwpf' },
            { label: 'Microsoft Learn: Visual Studio のプロファイリング ツール', url: 'https://learn.microsoft.com/en-us/visualstudio/profiling/profiling-feature-tour' },
            { label: 'Microsoft Learn: DebuggerDisplay 属性', url: 'https://learn.microsoft.com/en-us/visualstudio/debugger/using-the-debuggerdisplay-attribute' },
          ],
        },
      ],
    },
    {
      id: 'testing',
      title: 'テスト — ViewModel は厚く、UI は薄く',
      lead: 'MVVM で組んだ見返りが、いちばんはっきり出るのがテストだ。画面を開かずに、画面のロジックを検証できる。',
      blocks: [
        {
          type: 'code',
          lang: 'csharp',
          title: 'CustomerEditViewModelTests.cs — ViewModel の単体テスト（xUnit）',
          code: `using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

public class CustomerEditViewModelTests
{
    // 本物のデータベースの代わりに使う、テスト用の偽物
    private sealed class FakeRepository : ICustomerRepository
    {
        public string? SavedName { get; private set; }

        public Task SaveAsync(string name)
        {
            SavedName = name;
            return Task.CompletedTask;
        }
    }

    [Fact]
    public void SaveCommand_IsDisabled_WhenNameIsEmpty()
    {
        var viewModel = new CustomerEditViewModel(new FakeRepository());

        // 「名前が空なら保存ボタンは押せない」を、ボタンなしで検証している
        Assert.False(viewModel.SaveCommand.CanExecute(null));
    }

    [Fact]
    public async Task SaveCommand_PassesNameToRepository()
    {
        var repository = new FakeRepository();
        var viewModel = new CustomerEditViewModel(repository) { Name = "山田" };

        await viewModel.SaveCommand.ExecuteAsync(null);

        Assert.Equal("山田", repository.SavedName);
        Assert.False(viewModel.IsBusy);
    }

    [Fact]
    public void Name_RaisesPropertyChanged()
    {
        var viewModel = new CustomerEditViewModel(new FakeRepository());
        var raised = new List<string?>();
        viewModel.PropertyChanged += (_, e) => raised.Add(e.PropertyName);

        viewModel.Name = "佐藤";

        Assert.Contains(nameof(viewModel.Name), raised);
    }
}`,
        },
        {
          type: 'p',
          text: 'これは第 4 章の `CustomerEditViewModel` に対するテストで、WPF の型は 1 つも出てこない。ViewModel を WPF 非依存のプロジェクトに置いていれば（第 3 章）、テストプロジェクトも `net10.0` で済み、Windows 以外の CI でも実行できる。',
        },
        { type: 'h3', text: 'UI テストの現実' },
        {
          type: 'table',
          caption: 'UI を自動操作するテストの道具',
          head: ['道具', '概要', '現状（執筆時点）'],
          rows: [
            ['FlaUI', 'Windows の UI オートメーション（UIA2 / UIA3）を包んだ .NET ライブラリ。C# でアプリを起動し、要素を探して操作する', 'オープンソースで開発が続いており、WPF の UI テストでは有力な選択肢'],
            ['WinAppDriver', 'Microsoft 製。Appium / Selenium と同じ WebDriver の流儀でデスクトップアプリを操作する', '長く新しいリリースが出ていない。新規に採用する前に、リポジトリで状況を確認する'],
            ['Appium（Windows ドライバー）', 'WinAppDriver の上に乗る形で、ほかのプラットフォームと同じ書き方ができる', 'すでに Appium を使っているチーム向け'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'FlaUI による UI テストの例',
          excerpt: true,
          code: `using FlaUI.Core.AutomationElements;
using FlaUI.UIA3;
using Xunit;

public class MainWindowUiTests
{
    [Fact]
    public void Save_ShowsSavedMessage()
    {
        using var app = FlaUI.Core.Application.Launch(@"MyApp.exe");
        using var automation = new UIA3Automation();
        Window window = app.GetMainWindow(automation);

        // XAML 側で AutomationProperties.AutomationId を付けておく
        window.FindFirstDescendant(cf => cf.ByAutomationId("NameBox")).AsTextBox().Enter("山田");
        window.FindFirstDescendant(cf => cf.ByAutomationId("SaveButton")).AsButton().Invoke();

        string status = window.FindFirstDescendant(cf => cf.ByAutomationId("StatusText")).AsLabel().Text;
        Assert.Equal("保存しました", status);

        app.Close();
    }
}`,
        },
        {
          type: 'code',
          lang: 'xaml',
          title: 'テストから見つけやすくする',
          excerpt: true,
          code: `<!-- 表示文字や並び順ではなく、変わらない ID で要素を特定できるようにする -->
<TextBox AutomationProperties.AutomationId="NameBox" Text="{Binding Name}" />
<Button AutomationProperties.AutomationId="SaveButton" Content="保存" Command="{Binding SaveCommand}" />
<TextBlock AutomationProperties.AutomationId="StatusText" Text="{Binding Status}" />`,
        },
        {
          type: 'callout',
          kind: 'warn',
          title: 'UI テストは「少数精鋭」に',
          text: 'UI テストは、実行が遅く（1 件に数秒〜数十秒）、タイミングや環境の違いで不安定になりやすく、画面を少し変えただけで壊れる。**ロジックの検証は ViewModel の単体テストに任せ、UI テストは「起動して主要な画面を一巡りできる」程度の少数に絞る**のが現実的な配分だ。`AutomationId` を付けておくことは、アクセシビリティ（スクリーンリーダー対応）の改善にもつながる。',
        },
        {
          type: 'sources',
          items: [
            { label: 'GitHub: FlaUI/FlaUI', url: 'https://github.com/FlaUI/FlaUI' },
            { label: 'GitHub: microsoft/WinAppDriver', url: 'https://github.com/microsoft/WinAppDriver' },
            { label: 'Microsoft Learn: UI オートメーションの概要', url: 'https://learn.microsoft.com/en-us/dotnet/framework/ui-automation/ui-automation-overview' },
            { label: 'xUnit.net 公式サイト', url: 'https://xunit.net/' },
          ],
        },
      ],
    },
    {
      id: 'deployment',
      title: '配布',
      lead: '作ったアプリを、利用者の PC でどう動かすか。決めることは 2 つある。「.NET ランタイムを同梱するか」と「どうやってインストール・更新するか」だ。',
      blocks: [
        {
          type: 'figure',
          demo: 'PublishBuilder',
          kind: 'demo',
          title: 'dotnet publish のオプションを選ぶ',
          caption: 'オプションを切り替えると、コマンドと、その構成で起きること・注意点が変わる。「トリミング」を選ぶと、WPF では使えないことがわかる。',
        },
        {
          type: 'table',
          caption: 'ランタイムを同梱するかどうか',
          head: ['', '[[framework-dependent]]', '[[self-contained]]'],
          rows: [
            ['利用者の PC に必要なもの', '.NET デスクトップ ランタイム（同じメジャーバージョン）', 'なし'],
            ['配布サイズ', '小さい', '大きい'],
            ['.NET のセキュリティ更新', 'PC 側のランタイム更新で適用される', 'アプリを発行し直して配り直す必要がある'],
            ['向いている場面', '社内 PC をまとめて管理できる。ランタイムを配布済み', '利用者の環境を前提にできない。一般向けの配布'],
          ],
        },
        {
          type: 'table',
          caption: 'インストールと更新の方式',
          head: ['方式', '特徴', '向いている場面', '注意点'],
          rows: [
            ['[[msix]]', 'クリーンなインストール / アンインストール、差分更新、Microsoft Store 配布に対応', '一般向けの配布、企業の管理ツール（Intune など）での配布', 'パッケージへの署名（証明書）が必要。コンテナー内で動くため、ファイルやレジストリの扱いに一部制約がある'],
            ['[[clickonce]]', '共有フォルダーや Web からインストールでき、起動時に更新を確認する。管理者権限が要らない', '社内向けアプリを手軽に配り、自動更新したい', '.NET 版は Visual Studio の発行機能から作る。.NET Framework 版とは一部の API に違いがある'],
            ['インストーラー（MSI など）', 'インストール先やショートカット、前提条件を細かく制御できる', '既存の配布の仕組みがある。サービスやドライバーも入れる', '自動更新は自前で用意する'],
            ['フォルダーのコピー / zip', '発行したフォルダーをそのまま渡す', '少人数、検証用、単一ファイル発行と組み合わせて', '更新の仕組みがない'],
          ],
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '単一ファイルにしたのに、ファイルが複数出てくる',
          text: 'WPF はネイティブ DLL を含むため、`PublishSingleFile=true` だけではそれらが exe の隣に残る。自己完結型で `IncludeNativeLibrariesForSelfExtract=true` も指定すると 1 つにまとまる（初回起動時に一時フォルダーへ展開される）。また単一ファイルでは `Assembly.Location` が空文字を返すので、exe の場所が必要なときは `AppContext.BaseDirectory` を使う。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: .NET アプリケーションの発行の概要', url: 'https://learn.microsoft.com/en-us/dotnet/core/deploying/' },
            { label: 'Microsoft Learn: 単一ファイルの配置', url: 'https://learn.microsoft.com/en-us/dotnet/core/deploying/single-file/overview' },
            { label: 'Microsoft Learn: ReadyToRun コンパイル', url: 'https://learn.microsoft.com/en-us/dotnet/core/deploying/ready-to-run' },
            { label: 'Microsoft Learn: トリミングの既知の非互換性（WPF）', url: 'https://learn.microsoft.com/en-us/dotnet/core/deploying/trimming/incompatibilities' },
            { label: 'Microsoft Learn: MSIX とは', url: 'https://learn.microsoft.com/en-us/windows/msix/overview' },
            { label: 'Microsoft Learn: .NET Windows アプリの ClickOnce 配置', url: 'https://learn.microsoft.com/en-us/visualstudio/deployment/clickonce-deployment-dotnet' },
          ],
        },
      ],
    },
    {
      id: 'anti-patterns',
      title: 'アンチパターン集',
      lead: '現場のコードで繰り返し見かける「つまずき」を 5 つ。どれも、ここまでの章の内容で理由を説明できる。',
      blocks: [
        { type: 'h3', text: '① コードビハインドへのロジック流出' },
        {
          type: 'compare',
          left: {
            label: 'ハンドラーに業務ロジックが書かれている',
            tone: 'bad',
            lang: 'csharp',
            code: `private void OnSaveClick(object sender, RoutedEventArgs e)
{
    if (string.IsNullOrWhiteSpace(NameBox.Text))
    {
        MessageBox.Show("名前を入力してください");
        return;
    }

    using var connection = new SqlConnection(_connectionString);
    connection.Open();
    // … SQL を組み立てて実行 …

    StatusText.Text = "保存しました";
    SaveButton.IsEnabled = false;
}`,
            points: ['検証・データアクセス・画面更新が 1 つのメソッドに混ざっている', '画面を開かないとテストできない', '同じ処理をメニューやショートカットから呼びたくなったとき、コピーが増える'],
          },
          right: {
            label: 'View は「つなぐ」だけ',
            tone: 'good',
            lang: 'xaml',
            code: `<TextBox Text="{Binding Name, UpdateSourceTrigger=PropertyChanged}" />
<Button Content="保存" Command="{Binding SaveCommand}" />
<TextBlock Text="{Binding Status}" />`,
            points: ['検証と保存は ViewModel とサービスへ（第 4 章）', 'ボタンの有効 / 無効は `CanExecute` が決める', 'コードビハインドに残してよいのは、フォーカス移動やアニメーションなど「見た目だけ」の処理'],
          },
        },
        { type: 'h3', text: '② Dispatcher.Invoke の濫用' },
        {
          type: 'compare',
          left: {
            label: '念のため全部 Invoke で包む',
            tone: 'bad',
            lang: 'csharp',
            code: `private async void OnLoadClick(object sender, RoutedEventArgs e)
{
    var items = await _service.LoadAsync();

    // ここはすでに UI スレッド。包む必要がない
    Application.Current.Dispatcher.Invoke(() =>
    {
        foreach (var item in items)
        {
            // ループの中でさらに Invoke
            Application.Current.Dispatcher.Invoke(
                () => Items.Add(item));
        }
    });
}`,
            points: ['「どのスレッドで動いているか」を把握していない証拠', '同期の `Invoke` はデッドロックの種になる（第 5 章）', '静的な `Application.Current` への依存で、テストしにくくなる'],
          },
          right: {
            label: 'スレッドの境界を 1 か所に決める',
            tone: 'good',
            lang: 'csharp',
            code: `private async void OnLoadClick(object sender, RoutedEventArgs e)
{
    // 重い処理は、サービス側（または Task.Run）で別スレッドへ
    var items = await _service.LoadAsync();

    // await の続きは UI スレッド。そのまま触ってよい
    foreach (var item in items)
    {
        Items.Add(item);
    }
}`,
            points: ['UI 層は `await` でつなぎ、続きが UI スレッドに戻る性質に任せる', '別スレッドからの通知は `IProgress<T>` で受ける', 'どうしても必要な場面でだけ `InvokeAsync` を使う'],
          },
        },
        { type: 'h3', text: '③ イベントハンドラーによるメモリリーク' },
        {
          type: 'figure',
          demo: 'LeakDemo',
          kind: 'demo',
          title: 'イベント購読が、閉じたウィンドウを生かし続ける',
          caption: '「解除しない」のままウィンドウを開いて閉じ、GC を実行してみる。次に「ThemeChanged を発生」を押すと、閉じたはずのウィンドウのハンドラーまで呼ばれる。ほかの 2 つの方式と比べる。',
        },
        {
          type: 'p',
          text: 'イベントを購読すると、**発行する側が、購読する側への参照を持つ**。発行側が長生き（静的なイベント、シングルトンのサービス、`Application`、親ウィンドウ）で、購読側が短命（子ウィンドウ、ダイアログ、一時的な ViewModel）のとき、購読を解除し忘れると、購読側は発行側が生きている限り解放されない。',
        },
        {
          type: 'table',
          caption: 'リークを起こしやすい組み合わせと対処',
          head: ['よくある原因', '対処'],
          rows: [
            ['静的なイベントや、シングルトンのサービスのイベントを購読したまま', '`Closed` / `Unloaded` で `-=` する。または `WeakEventManager<TSource, TArgs>` で購読する（[[weak-event]]）'],
            ['動かしたままの `DispatcherTimer`', '不要になったら `Stop()` する（第 5 章）'],
            ['`INotifyPropertyChanged` を実装していないオブジェクトへのバインディング', '表示するオブジェクトには `INotifyPropertyChanged` を実装する（実装していないと、WPF が内部で強い参照を持つ場合がある）'],
            ['ラムダ式で購読して、解除できない', '解除が必要な購読は、メソッドにするか、ラムダをフィールドに保持する'],
          ],
        },
        { type: 'h3', text: '④ 巨大な XAML' },
        {
          type: 'table',
          caption: '1 ファイルが数千行になったら',
          head: ['切り出すもの', '切り出し先'],
          rows: [
            ['画面の中の、まとまった領域（ヘッダー、検索条件、明細）', '`UserControl`。それぞれに ViewModel を対応させる'],
            ['色、余白、スタイル、テンプレート', '`Themes/` 以下の `ResourceDictionary`（第 3 章）'],
            ['リストの 1 行の見た目', '`DataTemplate` をリソースにして、キーまたは `DataType` で参照する'],
            ['同じ並びの繰り返し（ラベル + 入力欄 が 20 個）', 'スタイルで共通化するか、`ItemsControl` + `DataTemplate` でデータから生成する'],
          ],
        },
        { type: 'h3', text: '⑤ UserControl とカスタムコントロールの誤用' },
        {
          type: 'table',
          caption: 'どちらを作るべきか',
          head: ['', '[[user-control]]', '[[custom-control]]'],
          rows: [
            ['作り方', 'XAML で既存のコントロールを組み合わせる', '`Control` を継承したクラス + `Themes/Generic.xaml` の既定スタイル'],
            ['見た目の差し替え', '想定しない（中身は固定）', '`ControlTemplate` を差し替えられる'],
            ['向いているもの', 'そのアプリの中だけで使う、画面の部品（住所入力欄、検索パネル）', '複数のアプリやテーマで使い回す、汎用の部品（評価の星、数値入力、トグルスイッチ）'],
            ['作る手間', '小さい', '大きい（依存関係プロパティ、テンプレートパーツ、状態の設計が要る）'],
          ],
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: 'UserControl の中で DataContext = this と書かない',
          text: '`UserControl` のコンストラクターで `DataContext = this;` と書くと、使う側が `<local:AddressBox Value="{Binding Address}" />` と書いたときのバインディングが、親の ViewModel ではなく UserControl 自身を見てしまい、動かなくなる。UserControl 自身のプロパティに内部からバインドしたいときは、ルート要素の DataContext には触れず、`{Binding Value, RelativeSource={RelativeSource AncestorType=UserControl}}` のように相対指定する。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: 弱いイベント パターン', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/events/weak-event-patterns' },
            { label: 'Microsoft Learn: コントロールの作成の概要（UserControl とカスタムコントロール）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/controls/control-authoring-overview' },
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: 'p1',
      q: '1 万件を表示する `ListBox` が極端に遅い。XAML は次のとおり。原因はどれか。',
      code: {
        lang: 'xaml',
        code: `<ScrollViewer>
    <StackPanel>
        <TextBlock Text="一覧" />
        <ListBox ItemsSource="{Binding Items}" />
    </StackPanel>
</ScrollViewer>`,
      },
      choices: [
        '`ItemsSource` が `OneWay` だから',
        '`StackPanel` が高さ無限大を渡すため、`ListBox` が全件分の要素を作ってしまう（仮想化が効かない）',
        '`TextBlock` が重いから',
        '`ListBox` は 1 万件に対応していないから',
      ],
      answer: 1,
      explain: '`StackPanel`（と外側の `ScrollViewer`）は、子に「高さはいくらでも」と伝える。`ListBox` は全項目を並べた高さを要求し、表示範囲という概念がなくなるので、仮想化が働かない。`Grid` の `*` の行に置いて、`ListBox` 自身にスクロールさせる。',
    },
    {
      id: 'p2',
      q: '`VirtualizingPanel.VirtualizationMode="Recycling"` にしたところ、ある行で開いた詳細表示が、スクロールすると別の行でも開いた状態で現れた。原因はどれか。',
      choices: [
        'Recycling モードの不具合',
        '「開いている」という状態を UI 要素だけが持っており、コンテナが別の項目に使い回されたから',
        '`ObservableCollection` を使っていないから',
        '`DataTemplate` が大きすぎるから',
      ],
      answer: 1,
      explain: 'Recycling はコンテナ（UI 要素）を次の項目に再利用する。状態が UI 側にしかないと、前の項目の状態がそのまま残る。状態を ViewModel のプロパティ（`IsExpanded` など）にして、バインディングで反映すれば解決する。',
    },
    {
      id: 'p3',
      q: 'パネルを横からスライドインさせたい。レイアウトの再計算を起こさない方法はどれか。',
      choices: ['`Margin` をアニメーションする', '`Width` をアニメーションする', '`RenderTransform` の `TranslateTransform.X` をアニメーションする', '`Canvas.Left` をアニメーションする'],
      answer: 2,
      explain: '`RenderTransform` は、レイアウトが済んだあとの描画に対する変形なので、Measure / Arrange が走らない。`Margin` や `Width` は毎フレーム、レイアウトをやり直すことになる。',
    },
    {
      id: 'p4',
      q: 'シングルトンの `ThemeService.ThemeChanged` を購読するダイアログを、開いては閉じる操作を繰り返すと、メモリが増え続ける。最も適切な対処はどれか。',
      choices: [
        'ダイアログを閉じたあと `GC.Collect()` を呼ぶ',
        'ダイアログの `Closed` で購読を解除する（または `WeakEventManager` で購読する）',
        'ダイアログを `static` にする',
        '`ThemeService` を毎回 `new` する',
      ],
      answer: 1,
      explain: '`ThemeService`（長生き）のイベントが、ダイアログ（短命）への参照を持ち続けている。参照が残っている限り、`GC.Collect()` を呼んでも回収されない。購読を解除するか、弱いイベントパターンを使う。',
    },
    {
      id: 'p5',
      q: 'テストの配分として、最も現実的なものはどれか。',
      choices: [
        'すべての検証を UI の自動操作テストで行う',
        'ロジックは ViewModel の単体テストで広く検証し、UI テストは主要な画面を一巡りする少数に絞る',
        'テストは書かず、リリース前に手で確認する',
        'XAML の内容を文字列比較でテストする',
      ],
      answer: 1,
      explain: 'UI テストは遅く、不安定で、画面の変更に弱い。MVVM で画面のロジックを ViewModel に寄せておけば、速くて安定した単体テストで大半を検証できる。UI テストは「つながっていること」の確認に絞る。',
    },
    {
      id: 'p6',
      q: '利用者の PC に .NET が入っているかわからない。インストーラーなしで「exe を 1 つ渡せば動く」形にしたい。適切な発行の指定はどれか。',
      choices: [
        'フレームワーク依存で発行する',
        '自己完結型 + 単一ファイル（ネイティブライブラリも含める）で発行する',
        'トリミングを有効にして発行する',
        'Debug 構成のままビルドした `bin` フォルダーを渡す',
      ],
      answer: 1,
      explain: '`--self-contained true` でランタイムを同梱し、`PublishSingleFile=true` と `IncludeNativeLibrariesForSelfExtract=true` で 1 つの exe にまとめる。トリミングは WPF では使えない。',
    },
    {
      id: 'p7',
      q: '住所入力欄（郵便番号・都道府県・番地の 3 つの入力欄をまとめたもの）を、このアプリの 3 つの画面で使い回したい。見た目を差し替える予定はない。作るべきものはどれか。',
      choices: ['カスタムコントロール', 'UserControl', 'ControlTemplate', 'DataTrigger'],
      answer: 1,
      explain: '既存のコントロールを組み合わせた、そのアプリ専用の部品は `UserControl` が手軽で適切。カスタムコントロールは、テンプレートの差し替えや複数アプリでの再利用が必要な汎用部品向けで、作る手間が大きい。',
    },
  ],
  exercises: [
    {
      id: 'ex-prac-virtual',
      title: '仮想化が効くレイアウトに直す',
      lang: 'xaml',
      level: 2,
      preview: true,
      prompt:
        'この画面は、`ListBox` が `StackPanel` の中にあるため仮想化が効かない。**`StackPanel` を `Grid` に置き換え**、見出しを `Auto` の行、`ListBox` を `*` の行に置こう。さらに `ListBox` に `VirtualizingPanel.VirtualizationMode="Recycling"` を指定すること。',
      starter: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="顧客一覧" Width="320" Height="240">
    <StackPanel Margin="12">
        <TextBlock Text="顧客一覧" FontWeight="Bold" Margin="0,0,0,8" />
        <ListBox ItemsSource="{Binding Customers}" />
    </StackPanel>
</Window>`,
      solution: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="顧客一覧" Width="320" Height="240">
    <Grid Margin="12">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
        </Grid.RowDefinitions>

        <TextBlock Grid.Row="0" Text="顧客一覧" FontWeight="Bold" Margin="0,0,0,8" />
        <ListBox Grid.Row="1"
                 ItemsSource="{Binding Customers}"
                 VirtualizingPanel.VirtualizationMode="Recycling" />
    </Grid>
</Window>`,
      solutionNote:
        '`*` の行は「残りの高さ」という有限の値を `ListBox` に渡すので、`ListBox` は自分の中でスクロールし、見えている分だけ要素を作る。プレビューでも、`ListBox` が残りの領域いっぱいに広がるのがわかる。',
      hints: ['`Grid.RowDefinitions` に `Height="Auto"` と `Height="*"` の 2 行を定義する。', '`ListBox` に `Grid.Row="1"` を付ける。', '`VirtualizingPanel.VirtualizationMode` は `ListBox` の属性として書ける添付プロパティ。'],
      checks: [
        { label: 'ListBox の親が StackPanel でも ScrollViewer でもない', test: (c) => c.els('ListBox').length > 0 && c.els('ListBox').every((n) => n.parent?.name !== 'StackPanel' && n.parent?.name !== 'ScrollViewer') },
        { label: 'ListBox が Grid の直下にある', test: (c) => c.els('ListBox').some((n) => n.parent?.name === 'Grid') },
        {
          label: '行定義が Auto と * の 2 行',
          test: (c) => {
            const rows = c.els('RowDefinition')
            return rows.length === 2 && a(rows[0], 'Height') === 'Auto' && /^\d*\*$/.test(a(rows[1], 'Height') ?? '*')
          },
        },
        { label: 'ListBox が * の行（Grid.Row="1"）にある', test: (c) => c.els('ListBox').some((n) => a(n, 'Grid.Row') === '1') },
        { label: 'VirtualizationMode が Recycling', test: (c) => c.els('ListBox').some((n) => a(n, 'VirtualizingPanel.VirtualizationMode') === 'Recycling') },
      ],
    },
    {
      id: 'ex-prac-leak',
      title: 'イベント購読のリークを直す',
      lang: 'csharp',
      level: 2,
      prompt:
        '`ClockWindow` は、アプリ全体で 1 つの `ClockService` の `Tick` イベントを購読している。このままだと、ウィンドウを閉じても解放されない。**ウィンドウが閉じたときに購読を解除する**よう直そう（`Closed` イベント、または `OnClosed` のオーバーライドを使う）。',
      starter: `public partial class ClockWindow : Window
{
    private readonly ClockService _clock;

    public ClockWindow(ClockService clock)
    {
        InitializeComponent();
        _clock = clock;
        _clock.Tick += OnTick;
    }

    private void OnTick(object? sender, EventArgs e)
    {
        TimeText.Text = DateTime.Now.ToString("HH:mm:ss");
    }
}`,
      solution: `public partial class ClockWindow : Window
{
    private readonly ClockService _clock;

    public ClockWindow(ClockService clock)
    {
        InitializeComponent();
        _clock = clock;
        _clock.Tick += OnTick;
    }

    protected override void OnClosed(EventArgs e)
    {
        _clock.Tick -= OnTick;
        base.OnClosed(e);
    }

    private void OnTick(object? sender, EventArgs e)
    {
        TimeText.Text = DateTime.Now.ToString("HH:mm:ss");
    }
}`,
      solutionNote:
        '`+=` と `-=` は必ず対にする。解除できるように、ハンドラーはラムダ式ではなくメソッドにしておく。購読先が多い場合や解除のタイミングが取りにくい場合は、`WeakEventManager<ClockService, EventArgs>.AddHandler(...)` を使う方法もある。',
      hints: ['`protected override void OnClosed(EventArgs e)` をオーバーライドする。', 'その中で `_clock.Tick -= OnTick;` と書き、最後に `base.OnClosed(e);` を呼ぶ。'],
      checks: [
        { label: '購読（+=）は残っている', test: (c) => c.has(/_clock\.Tick\s*\+=\s*OnTick\s*;/) },
        { label: '購読を解除（-=）している', test: (c) => c.has(/_clock\.Tick\s*-=\s*OnTick\s*;/) },
        {
          label: '解除が、ウィンドウを閉じたときに実行される（OnClosed / Closed / Unloaded）',
          test: (c) => c.has(/override\s+void\s+OnClosed\s*\([^)]*\)\s*\{[^}]*_clock\.Tick\s*-=/) || c.has(/(Closed|Unloaded)\s*\+=\s*[^;]*_clock\.Tick\s*-=\s*OnTick/) || c.has(/void\s+On(Window)?(Closed|Unloaded)\s*\([^)]*\)\s*\{[^}]*_clock\.Tick\s*-=/),
        },
      ],
    },
  ],
}

export default chapter
