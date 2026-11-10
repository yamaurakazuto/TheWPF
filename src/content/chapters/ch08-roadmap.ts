import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'
import { a, bindsTo, hasOption } from '@/lib/exercise'

const chapter: Chapter = {
  ...metaOf('roadmap'),
  goals: [
    'WPF を、どの順番で、何ができるようになるまで学べばよいかがわかる',
    '各段階で作るとよい小さな課題と、つまずきやすい点がわかる',
    '完成形のサンプル（ToDo アプリ）を読み、自分で機能を足せる',
  ],
  sections: [
    {
      id: 'path',
      title: '5 段階のロードマップ',
      lead: 'WPF は覚えることが多いが、順番さえ間違えなければ、それぞれの知識が次の段階の土台になる。',
      blocks: [
        {
          type: 'figure',
          demo: 'RoadmapPath',
          kind: 'demo',
          title: '学習ロードマップ',
          caption: '丸を押すと、その段階の到達目標・チェックリスト・課題が出る。チェックはこのブラウザに保存され、丸の外側の輪が達成率を示す。',
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '進め方のコツ',
          text: '読むだけで次へ進まない。各段階の「課題」を、小さくてよいので実際に作る。作る途中で出てきた疑問を持って該当の章に戻ると、同じ文章がまったく違って読める。期間はあくまで目安で、週に数時間ずつ取り組む想定の数字だ。',
        },
        {
          type: 'table',
          caption: 'よくある遠回りと、近道',
          head: ['遠回り', '近道'],
          rows: [
            ['最初から MVVM・DI・Prism を全部入れて始める', 'まずコードビハインドで 1 つ作り、不便を感じてから MVVM に進む'],
            ['仕組み（第 2 章）を飛ばして、動くコードを貼り合わせる', 'ツリーと値の優先順位だけは早めに押さえる。デバッグの時間が何倍も変わる'],
            ['見た目を整えるために、要素へ直接 `Background` や `Margin` を書き散らす', '色と余白はリソースに、共通の見た目はスタイルに出す'],
            ['遅くなってから性能を考える', '一覧を作るときは、最初から仮想化が効く配置にしておく'],
            ['バインディングが効かないとき、コードビハインドで値を直接入れて回避する', '出力ウィンドウを見て、原因を 1 つずつ潰す。回避は負債になる'],
          ],
        },
      ],
    },
    {
      id: 'exercise-map',
      title: '章ごとの演習の一覧',
      lead: '各章の末尾にあるクイズとコード演習を、段階と対応づけて並べた。すべての演習は「演習場」のページからもまとめて取り組める。',
      blocks: [
        {
          type: 'table',
          caption: '演習と段階の対応',
          head: ['章', 'コード演習', '対応する段階'],
          rows: [
            ['[第 1 章 歴史](#/chapters/history)', '最小の画面を XAML で書く', '1'],
            ['[第 2 章 仕組み](#/chapters/architecture)', 'Grid と添付プロパティで配置する / 依存関係プロパティを定義する', '1・2'],
            ['[第 3 章 土台](#/chapters/foundation)', 'csproj を完成させる / リソースを定義して参照する / 暗黙スタイルとトリガーを書く', '1・2'],
            ['[第 4 章 バインディング](#/chapters/binding-mvvm)', '入力・表示・コマンドをバインドする / INotifyPropertyChanged を実装する / CommunityToolkit.Mvvm で書き直す', '3'],
            ['[第 5 章 Dispatcher](#/chapters/dispatcher)', 'デッドロックするコードを直す / 別スレッドの進捗を UI に届ける', '4'],
            ['[第 6 章 強み・弱み](#/chapters/tradeoffs)', 'Fluent テーマを有効にする', '5'],
            ['[第 7 章 実践](#/chapters/practice)', '仮想化が効くレイアウトに直す / イベント購読のリークを直す', '4・5'],
            ['第 8 章（この章）', 'カウンター画面 / カウンターの ViewModel / ToDo の行テンプレート / 非同期の読み込みコマンド', '3・4'],
          ],
        },
      ],
    },
    {
      id: 'capstone',
      title: '完成形のサンプル — ToDo アプリ',
      lead: '第 3 段階の課題の解答例。5 つのファイルをそのまま作れば、ビルドして動かせる。ここまでの章の要素が、どう組み合わさるかを確かめてほしい。',
      blocks: [
        {
          type: 'code',
          lang: 'xml',
          title: 'MyTodo.csproj',
          code: `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net10.0-windows</TargetFramework>
    <UseWPF>true</UseWPF>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="CommunityToolkit.Mvvm" Version="8.4.0" />
  </ItemGroup>

</Project>`,
        },
        {
          type: 'code',
          lang: 'xaml',
          title: 'App.xaml',
          code: `<Application x:Class="MyTodo.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             StartupUri="MainWindow.xaml">
    <Application.Resources>
    </Application.Resources>
</Application>`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'App.xaml.cs / MainWindow.xaml.cs',
          code: `using System.Windows;

namespace MyTodo;

public partial class App : Application
{
}

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }
}`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'TodoItem.cs / MainViewModel.cs',
          code: `using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace MyTodo;

/// <summary>リストの 1 行。IsDone の変更を通知できるよう、これも ObservableObject にする。</summary>
public partial class TodoItem : ObservableObject
{
    public TodoItem(string title)
    {
        Title = title;
    }

    public string Title { get; }

    [ObservableProperty]
    private bool _isDone;
}

public partial class MainViewModel : ObservableObject
{
    // 追加・削除を画面に反映するため ObservableCollection にする
    public ObservableCollection<TodoItem> Items { get; } = new();

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(AddCommand))]
    private string _newTitle = string.Empty;

    [RelayCommand(CanExecute = nameof(CanAdd))]
    private void Add()
    {
        Items.Add(new TodoItem(NewTitle.Trim()));
        NewTitle = string.Empty;
    }

    private bool CanAdd() => !string.IsNullOrWhiteSpace(NewTitle);

    // CommandParameter で渡された項目を受け取る
    [RelayCommand]
    private void Remove(TodoItem item) => Items.Remove(item);
}`,
        },
        {
          type: 'annotated',
          lang: 'xaml',
          title: 'MainWindow.xaml',
          lines: [
            { code: '<Window x:Class="MyTodo.MainWindow"' },
            { code: '        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"' },
            { code: '        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"' },
            { code: '        xmlns:local="clr-namespace:MyTodo"', note: { title: '自分の名前空間を使えるようにする', body: '`local:` というプレフィックスで、`MyTodo` 名前空間のクラス（`MainViewModel`）を XAML から参照できるようにする。' } },
            { code: '        Title="MyTodo" Width="360" Height="420">' },
            { code: '    <Window.DataContext>', note: { title: 'DataContext を XAML で設定する', body: 'いちばん手軽な方法。ViewModel が引数なしのコンストラクターを持つ場合に使える。DI を使うなら、ここを消してコンストラクターで受け取る形にする（第 4 章）。' } },
            { code: '        <local:MainViewModel />' },
            { code: '    </Window.DataContext>' },
            { code: '' },
            { code: '    <Grid Margin="12">' },
            { code: '        <Grid.RowDefinitions>' },
            { code: '            <RowDefinition Height="Auto" />' },
            { code: '            <RowDefinition Height="*" />', note: { title: 'リストは * の行に', body: '残りの高さ（有限の値）を `ListBox` に渡す。こうしておけば、項目が増えても `ListBox` の中でスクロールし、仮想化も効く（第 7 章）。' } },
            { code: '        </Grid.RowDefinitions>' },
            { code: '' },
            { code: '        <DockPanel Grid.Row="0" Margin="0,0,0,8">' },
            { code: '            <Button DockPanel.Dock="Right" Content="追加" Padding="12,4" Margin="8,0,0,0"' },
            { code: '                    Command="{Binding AddCommand}" IsDefault="True" />', note: { title: 'コマンドと IsDefault', body: '`AddCommand` は `[RelayCommand]` から生成されたもの。`CanAdd()` が false の間（入力が空の間）は、ボタンが自動で無効になる。`IsDefault="True"` で、Enter キーでも実行される。' } },
            { code: '            <TextBox Text="{Binding NewTitle, UpdateSourceTrigger=PropertyChanged}" />', note: { title: 'UpdateSourceTrigger=PropertyChanged', body: '1 文字入力するたびに `NewTitle` へ反映する。既定の `LostFocus` のままだと、入力中は `CanAdd()` が変わらず、ボタンが押せるようにならない。' } },
            { code: '        </DockPanel>' },
            { code: '' },
            { code: '        <ListBox Grid.Row="1" ItemsSource="{Binding Items}" HorizontalContentAlignment="Stretch">', note: { title: 'HorizontalContentAlignment="Stretch"', body: '行の中身を横いっぱいに広げる。これがないと、行テンプレートの `DockPanel` が中身の幅しか持たず、「削除」ボタンが右端に寄らない。' } },
            { code: '            <ListBox.ItemTemplate>' },
            { code: '                <DataTemplate>', note: { title: 'DataTemplate の中の DataContext', body: 'この中の DataContext は `MainViewModel` ではなく、`Items` の要素（`TodoItem`）1 つ 1 つになる。だから `{Binding Title}` と書ける。' } },
            { code: '                    <DockPanel>' },
            { code: '                        <Button DockPanel.Dock="Right" Content="削除" Padding="8,2"' },
            { code: '                                Command="{Binding DataContext.RemoveCommand, RelativeSource={RelativeSource AncestorType=ListBox}}"', note: { title: '行の中から、親の ViewModel のコマンドを呼ぶ', body: '行の DataContext は `TodoItem` なので、`{Binding RemoveCommand}` では見つからない。`RelativeSource` で親の `ListBox` までさかのぼり、その `DataContext`（= `MainViewModel`）のコマンドを指定する。リストの中にボタンを置くときの定番の書き方。' } },
            { code: '                                CommandParameter="{Binding}" />', note: { title: '{Binding} だけ書く', body: 'パスを省略すると、DataContext そのもの（この行の `TodoItem`）が渡る。これが `Remove(TodoItem item)` の引数になる。' } },
            { code: '                        <CheckBox Content="{Binding Title}" IsChecked="{Binding IsDone}" VerticalAlignment="Center" />' },
            { code: '                    </DockPanel>' },
            { code: '                </DataTemplate>' },
            { code: '            </ListBox.ItemTemplate>' },
            { code: '        </ListBox>' },
            { code: '    </Grid>' },
            { code: '</Window>' },
          ],
        },
        {
          type: 'callout',
          kind: 'tip',
          title: 'ここから自分で足してみる',
          text: '① 未完了の件数を表示する（`Items` の変化と各 `IsDone` の変化の両方で更新が必要になる）。② 「未完了のみ表示」の切り替えを付ける（[[collection-view]]の `Filter`）。③ 終了時に JSON で保存し、起動時に読み込む（`async` で）。④ `MainViewModel` のテストを書く。どれも、ここまでの章の内容だけで実装できる。',
        },
      ],
    },
    {
      id: 'next',
      title: 'この先へ',
      lead: 'ここまで来れば、あとは作りながら必要なものを足していける。',
      blocks: [
        {
          type: 'table',
          caption: '次に手を伸ばすとよいもの',
          head: ['目的', '調べるキーワード'],
          rows: [
            ['見た目を一気に整えたい', '.NET 9 以降の Fluent テーマ（`ThemeMode`）、オープンソースの UI テーマライブラリ'],
            ['複雑な表を扱いたい', '`DataGrid` の列定義とテンプレート、サードパーティのグリッド製品'],
            ['画面遷移を整理したい', '`ContentControl` + `DataTemplate`（`DataType` 指定）による ViewModel 起点の切り替え'],
            ['自作の部品を作りたい', 'カスタムコントロール、`Themes/Generic.xaml`、テンプレートパーツ、`VisualStateManager`'],
            ['イベントをコマンドにつなぎたい', '`Microsoft.Xaml.Behaviors.Wpf`'],
            ['挙動の根拠を知りたい', 'GitHub の dotnet/wpf（ソースコードと Issue）'],
          ],
        },
        {
          type: 'p',
          text: '最後にもう一度。WPF は「古い技術」ではあるが、「終わった技術」ではない。仕組みが一貫していて、一度理解すれば長く使える。この教材が、その最初の地図になれば幸いだ。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: WPF のドキュメント（.NET）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/' },
            { label: 'GitHub: microsoft/WPF-Samples（公式サンプル集）', url: 'https://github.com/microsoft/WPF-Samples' },
            { label: 'GitHub: dotnet/wpf', url: 'https://github.com/dotnet/wpf' },
            { label: 'Microsoft Learn: CommunityToolkit.Mvvm', url: 'https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/' },
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: 'r1',
      q: 'WPF を学び始めるときの進め方として、この教材が勧めているのはどれか。',
      choices: [
        '最初から MVVM、DI、テストをすべて取り入れる',
        'まずコードビハインドで小さなアプリを作り、不便を体験してから MVVM に進む',
        'XAML は使わず、C# だけで画面を組み立てる',
        '仕組みの学習は後回しにし、サンプルコードの貼り合わせで進める',
      ],
      answer: 1,
      explain: '動くものを先に作ると、MVVM が「何を解決するための設計なのか」が体験としてわかる。仕組み（ツリー、値の優先順位）は早めに押さえるほど、あとのデバッグが速くなる。',
    },
    {
      id: 'r2',
      q: 'ToDo アプリの行テンプレートの中にある「削除」ボタンで、`Command="{Binding RemoveCommand}"` と書いても動かない理由はどれか。',
      choices: [
        '`DataTemplate` の中ではコマンドが使えないから',
        '行の DataContext は `TodoItem` で、`RemoveCommand` は `MainViewModel` にあるから',
        '`RemoveCommand` が `static` でないから',
        '`ListBox` は `Command` に対応していないから',
      ],
      answer: 1,
      explain: '`DataTemplate` の中では、DataContext がリストの各要素に切り替わる。親の ViewModel のコマンドを使うには、`RelativeSource={RelativeSource AncestorType=ListBox}` で親要素までさかのぼり、`DataContext.RemoveCommand` を指定する。',
    },
    {
      id: 'r3',
      q: 'ToDo アプリで、`TextBox` の `UpdateSourceTrigger=PropertyChanged` を外すと、何が起きるか。',
      choices: [
        'ビルドエラーになる',
        '入力しても、フォーカスが外れるまで「追加」ボタンが有効にならない',
        '入力した文字が表示されなくなる',
        '何も変わらない',
      ],
      answer: 1,
      explain: '既定の `LostFocus` では、入力中は `NewTitle` が更新されない。`CanAdd()` の結果も変わらないので、ボタンは無効のまま。入力に応じて有効 / 無効を切り替えたい入力欄は `PropertyChanged` にする。',
    },
    {
      id: 'r4',
      q: 'バインディングが効かないとき、最初にすべきことはどれか。',
      choices: [
        'コードビハインドで、コントロールに値を直接代入する',
        'Visual Studio の出力ウィンドウ（XAML バインド エラー）を確認する',
        'プロジェクトをクリーンして再ビルドする',
        '`Mode=TwoWay` を全部のバインディングに付ける',
      ],
      answer: 1,
      explain: 'バインディングの失敗は例外にならず、出力ウィンドウに記録される。エラー文には、どのパスが、どの型のオブジェクトに対して失敗したかが書いてある（第 4 章）。回避で済ませると、同じ問題が形を変えて戻ってくる。',
    },
  ],
  exercises: [
    {
      id: 'ex-road-counter-view',
      title: '総合 ① カウンターの画面',
      lang: 'xaml',
      level: 1,
      preview: true,
      prompt:
        'ViewModel に `Count`（int）、`IncrementCommand`、`ResetCommand` があるとする。`TextBlock` に `Count` を表示し、「+1」ボタンと「リセット」ボタンをそれぞれのコマンドにバインドしよう。',
      starter: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="カウンター" Width="260" Height="170">
    <StackPanel Margin="16">
        <TextBlock FontSize="28" HorizontalAlignment="Center" />
        <StackPanel Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,12,0,0">
            <Button Content="+1" Width="72" Margin="0,0,8,0" />
            <Button Content="リセット" Width="72" />
        </StackPanel>
    </StackPanel>
</Window>`,
      solution: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="カウンター" Width="260" Height="170">
    <StackPanel Margin="16">
        <TextBlock Text="{Binding Count}" FontSize="28" HorizontalAlignment="Center" />
        <StackPanel Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,12,0,0">
            <Button Content="+1" Width="72" Margin="0,0,8,0" Command="{Binding IncrementCommand}" />
            <Button Content="リセット" Width="72" Command="{Binding ResetCommand}" />
        </StackPanel>
    </StackPanel>
</Window>`,
      hints: ['`TextBlock` は `Text="{Binding Count}"`。表示専用なので `Mode` は書かなくてよい。', 'ボタンは `Command="{Binding IncrementCommand}"`。`Click` は使わない。'],
      checks: [
        { label: 'TextBlock.Text が Count にバインドされている', test: (c) => c.els('TextBlock').some((n) => bindsTo(a(n, 'Text'), 'Count')) },
        { label: '「+1」ボタンが IncrementCommand にバインドされている', test: (c) => c.els('Button').some((n) => bindsTo(a(n, 'Command'), 'IncrementCommand')) },
        { label: '「リセット」ボタンが ResetCommand にバインドされている', test: (c) => c.els('Button').some((n) => bindsTo(a(n, 'Command'), 'ResetCommand')) },
        { label: 'Click イベントハンドラーを使っていない', test: (c) => c.els('Button').every((n) => !a(n, 'Click')) },
      ],
    },
    {
      id: 'ex-road-counter-vm',
      title: '総合 ② カウンターの ViewModel',
      lang: 'csharp',
      level: 2,
      prompt:
        '① の画面に対応する ViewModel を、CommunityToolkit.Mvvm で書こう。`Count` は `[ObservableProperty]`、`Increment` と `Reset` は `[RelayCommand]`。**`Count` が 10 以上になったら「+1」を押せなくする**こと（`CanExecute`）。`Count` が変わったら、押せるかどうかを判定し直す必要がある点に注意。',
      starter: `using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class CounterViewModel : ObservableObject
{
    // Count / IncrementCommand / ResetCommand を実装する

}`,
      solution: `using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class CounterViewModel : ObservableObject
{
    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(IncrementCommand))]
    private int _count;

    [RelayCommand(CanExecute = nameof(CanIncrement))]
    private void Increment() => Count++;

    private bool CanIncrement() => Count < 10;

    [RelayCommand]
    private void Reset() => Count = 0;
}`,
      solutionNote:
        '`[NotifyCanExecuteChangedFor]` がないと、`Count` が 10 になってもボタンは有効なまま、リセットしても無効なままになる。コマンドは「実行可否が変わった」と知らされない限り、問い合わせ直さないからだ。',
      hints: ['フィールドは `[ObservableProperty] private int _count;`。', '`[RelayCommand(CanExecute = nameof(CanIncrement))]` と、`bool` を返す `CanIncrement()` を用意する。', '`_count` のフィールドに `[NotifyCanExecuteChangedFor(nameof(IncrementCommand))]` を付ける。'],
      checks: [
        { label: '[ObservableProperty] 付きの int フィールド（_count）がある', test: (c) => c.has(/\[ObservableProperty\]\s*(\[[^\]]+\]\s*)*private\s+int\s+_?count\b/) || c.has(/\[NotifyCanExecuteChangedFor[^\]]*\]\s*\[ObservableProperty\]\s*private\s+int\s+_?count\b/) },
        { label: 'Increment に [RelayCommand(CanExecute = ...)] が付いている', test: (c) => c.has(/\[RelayCommand\s*\(\s*CanExecute\s*=\s*nameof\s*\(\s*\w+\s*\)\s*\)\]\s*private\s+void\s+Increment\s*\(/) },
        { label: '実行可否の判定で Count を 10 と比較している', test: (c) => c.has(/bool\s+\w+\s*\(\s*\)\s*(=>|\{\s*return)\s*_?[Cc]ount\s*(<|<=)\s*(10|9)\b/) },
        { label: 'Count の変更で IncrementCommand の実行可否を更新している', test: (c) => c.has(/\[NotifyCanExecuteChangedFor\s*\(\s*nameof\s*\(\s*IncrementCommand\s*\)\s*\)\]/) || c.has(/IncrementCommand\.NotifyCanExecuteChanged\s*\(/) },
        { label: 'Reset に [RelayCommand] が付き、Count を 0 にしている', test: (c) => c.has(/\[RelayCommand\]\s*private\s+void\s+Reset\s*\(\s*\)\s*(=>|\{)\s*Count\s*=\s*0/) },
      ],
    },
    {
      id: 'ex-road-todo-row',
      title: '総合 ③ ToDo の行テンプレート',
      lang: 'xaml',
      level: 3,
      preview: true,
      prompt:
        '`ListBox` に `Items` を表示し、各行を **`CheckBox`（`Content` に `Title`、`IsChecked` に `IsDone`）** で表示する `DataTemplate` を書こう。リストは `Grid` の `*` の行に置かれているので、そのままでよい。',
      starter: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ToDo" Width="300" Height="240">
    <Grid Margin="12">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
        </Grid.RowDefinitions>
        <TextBlock Grid.Row="0" Text="やること" FontWeight="Bold" Margin="0,0,0,8" />

        <!-- ItemsSource と ItemTemplate を足す -->
        <ListBox Grid.Row="1">
        </ListBox>
    </Grid>
</Window>`,
      solution: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ToDo" Width="300" Height="240">
    <Grid Margin="12">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
        </Grid.RowDefinitions>
        <TextBlock Grid.Row="0" Text="やること" FontWeight="Bold" Margin="0,0,0,8" />

        <ListBox Grid.Row="1" ItemsSource="{Binding Items}">
            <ListBox.ItemTemplate>
                <DataTemplate>
                    <CheckBox Content="{Binding Title}" IsChecked="{Binding IsDone}" />
                </DataTemplate>
            </ListBox.ItemTemplate>
        </ListBox>
    </Grid>
</Window>`,
      solutionNote:
        '`DataTemplate` の中の DataContext は `Items` の各要素なので、`{Binding Title}` は「その行の項目の Title」を指す。`CheckBox.IsChecked` は既定で双方向なので、チェックを入れると `IsDone` に書き戻される。プレビューではテンプレートは展開されず、`ItemsSource` の式だけが表示される。',
      hints: ['`ListBox` に `ItemsSource="{Binding Items}"` を付ける。', '`<ListBox.ItemTemplate>` の中に `<DataTemplate>` を置き、その中に行の見た目を書く。'],
      checks: [
        { label: 'ListBox.ItemsSource が Items にバインドされている', test: (c) => c.els('ListBox').some((n) => bindsTo(a(n, 'ItemsSource'), 'Items')) },
        { label: 'ListBox.ItemTemplate の中に DataTemplate がある', test: (c) => c.els('DataTemplate').some((n) => n.parent?.name === 'ListBox.ItemTemplate') },
        { label: 'DataTemplate の中に CheckBox がある', test: (c) => c.els('CheckBox').some((n) => { for (let p = n.parent; p; p = p.parent) if (p.name === 'DataTemplate') return true; return false }) },
        { label: 'CheckBox.Content が Title に、IsChecked が IsDone にバインドされている', test: (c) => c.els('CheckBox').some((n) => bindsTo(a(n, 'Content'), 'Title') && bindsTo(a(n, 'IsChecked'), 'IsDone')) },
        { label: 'IsChecked を OneWay / OneTime にしていない（チェックを書き戻せる）', test: (c) => c.els('CheckBox').every((n) => !hasOption(a(n, 'IsChecked'), 'Mode', 'OneWay') && !hasOption(a(n, 'IsChecked'), 'Mode', 'OneTime')) },
      ],
    },
    {
      id: 'ex-road-async',
      title: '総合 ④ 非同期の読み込みコマンド',
      lang: 'csharp',
      level: 3,
      prompt:
        '`LoadAsync` を完成させよう。① 読み込み中は `IsBusy` を `true` にし、**例外が起きても必ず `false` に戻す**。② `_repository.GetAllAsync()` を `await` で待つ（`.Result` は使わない）。③ 取得した項目で `Items` を入れ替える（`Clear()` してから `Add`）。`[RelayCommand]` を付けて、`LoadCommand` として公開すること。',
      starter: `public partial class TodoListViewModel : ObservableObject
{
    private readonly ITodoRepository _repository;

    public TodoListViewModel(ITodoRepository repository) => _repository = repository;

    public ObservableCollection<TodoItem> Items { get; } = new();

    [ObservableProperty]
    private bool _isBusy;

    private async Task LoadAsync()
    {
        // ここを実装する
    }
}`,
      solution: `public partial class TodoListViewModel : ObservableObject
{
    private readonly ITodoRepository _repository;

    public TodoListViewModel(ITodoRepository repository) => _repository = repository;

    public ObservableCollection<TodoItem> Items { get; } = new();

    [ObservableProperty]
    private bool _isBusy;

    [RelayCommand]
    private async Task LoadAsync()
    {
        IsBusy = true;
        try
        {
            var items = await _repository.GetAllAsync();

            Items.Clear();
            foreach (var item in items)
            {
                Items.Add(item);
            }
        }
        finally
        {
            IsBusy = false;
        }
    }
}`,
      solutionNote:
        '`await` の続きは UI スレッドで実行されるので、`Items` をそのまま変更できる（第 5 章）。`[RelayCommand]` を `async Task` のメソッドに付けると、実行中は同じコマンドが再実行されないよう自動で制御される。画面側は `IsBusy` を `ProgressBar` の表示などにバインドする。',
      hints: ['メソッドに `[RelayCommand]` を付ける（`LoadCommand` が生成される）。', '`IsBusy = true;` のあとを `try { ... } finally { IsBusy = false; }` で囲む。', '`var items = await _repository.GetAllAsync();`'],
      checks: [
        { label: 'LoadAsync に [RelayCommand] が付いている', test: (c) => c.has(/\[RelayCommand(\([^)]*\))?\]\s*private\s+async\s+Task\s+LoadAsync\s*\(/) },
        { label: '最初に IsBusy を true にしている', test: (c) => c.has(/LoadAsync\s*\(\s*\)\s*\{\s*IsBusy\s*=\s*true\s*;/) },
        { label: 'GetAllAsync を await で待っている（.Result / .Wait() を使っていない）', test: (c) => c.has(/await\s+_repository\.GetAllAsync\s*\(/) && !c.has(/\.Result\b|\.Wait\s*\(|GetResult\s*\(/) },
        { label: 'Items を Clear してから Add している', test: (c) => c.has(/Items\.Clear\s*\(\s*\)\s*;[\s\S]*Items\.Add\s*\(/) },
        { label: 'finally で IsBusy を false に戻している', test: (c) => c.has(/finally\s*\{\s*IsBusy\s*=\s*false\s*;\s*\}/) },
      ],
    },
  ],
}

export default chapter
