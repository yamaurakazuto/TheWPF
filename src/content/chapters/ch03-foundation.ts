import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'
import { a } from '@/lib/exercise'

const chapter: Chapter = {
  ...metaOf('foundation'),
  goals: [
    'SDK スタイルの csproj を 1 行ずつ説明でき、旧形式との違いがわかる',
    'ビルドアクション（`Page` / `Resource` / `Content` / `EmbeddedResource` / `None`）を使い分けられる',
    '`x:Class`・`.g.cs`・`.baml` の関係と、アプリの起動から終了までの流れを説明できる',
    '`StaticResource` と `DynamicResource` の違い、pack URI の書式、リソースの検索順がわかる',
    '`Style`・`ControlTemplate`・`DataTemplate`・`Trigger` の役割を区別できる',
  ],
  sections: [
    {
      id: 'csproj',
      title: 'csproj — プロジェクトファイルを読む',
      lead: 'プロジェクトを開いて最初に目に入るのが .csproj だ。「ビルドの設定が書いてある XML」で、[[sdk-style]]なら 20 行ほどしかない。まずは 1 行ずつ意味を確かめよう。',
      blocks: [
        {
          type: 'annotated',
          lang: 'xml',
          title: 'MyApp.csproj',
          lines: [
            { code: '<Project Sdk="Microsoft.NET.Sdk">', note: { title: 'SDK スタイルの宣言', body: 'この 1 行で、ビルドに必要な既定の設定と処理がまとめて読み込まれる。旧形式で何十行も書いていた内容がここに畳まれている。.NET 5 以降の WPF は `Microsoft.NET.Sdk` を使う（.NET Core 3.x では `Microsoft.NET.Sdk.WindowsDesktop` だった）。' } },
            { code: '' },
            { code: '  <PropertyGroup>' },
            { code: '    <OutputType>WinExe</OutputType>', note: { title: '出力の種類', body: '`WinExe` はコンソールウィンドウを出さない Windows アプリ。`Exe` にすると黒いコンソールが一緒に開く（デバッグ出力を見たいときにあえて使うこともある）。クラスライブラリなら `Library`。' } },
            { code: '    <TargetFramework>net10.0-windows</TargetFramework>', note: { title: '対象フレームワーク（TFM）', body: 'どの .NET 向けにビルドするか。WPF は Windows 専用なので、必ず `-windows` の付いた [[tfm]] を指定する。Windows 固有の新しい API を使うなら `net10.0-windows10.0.19041.0` のように OS のバージョンまで書く。' } },
            { code: '    <UseWPF>true</UseWPF>', note: { title: 'WPF を使う', body: 'これを書くと、WPF のアセンブリ参照、`*.xaml` の自動取り込み、XAML のコンパイルが有効になる。WPF プロジェクトをそう足らしめている 1 行。WinForms も併用するなら `<UseWindowsForms>true</UseWindowsForms>` を足す。' } },
            { code: '    <Nullable>enable</Nullable>', note: { title: 'null 許容参照型', body: '`string` と `string?` を区別し、null の可能性をコンパイラが警告してくれる。WPF 固有ではないが、新規プロジェクトでは有効にしておくのが普通。' } },
            { code: '    <ImplicitUsings>enable</ImplicitUsings>', note: { title: '暗黙の using', body: '`System`、`System.Linq`、`System.Threading.Tasks` などの `using` を自動で補う。`System.Windows` などの WPF の名前空間は含まれないので、そちらは自分で書く。' } },
            { code: '    <ApplicationIcon>Assets\\app.ico</ApplicationIcon>', note: { title: '実行ファイルのアイコン', body: 'exe に埋め込まれ、エクスプローラーやタスクバーに表示されるアイコン。`.ico` 形式で用意する。ウィンドウ左上のアイコンは `Window.Icon` で別に指定できるが、指定しなければこのアイコンが使われる。' } },
            { code: '    <ApplicationManifest>app.manifest</ApplicationManifest>', note: { title: 'アプリケーションマニフェスト', body: 'OS に対する宣言を書く XML。高 DPI への対応（第 2 章）、管理者権限の要求（`requestedExecutionLevel`）、対応する Windows のバージョンなどを指定する。' } },
            { code: '    <Version>1.2.0</Version>', note: { title: 'バージョン', body: 'アセンブリとファイルのバージョン情報の元になる値。旧形式では `Properties/AssemblyInfo.cs` に書いていたが、SDK スタイルでは csproj から自動生成される。' } },
            { code: '  </PropertyGroup>' },
            { code: '' },
            { code: '  <ItemGroup>' },
            { code: '    <Resource Include="Assets\\logo.png" />', note: { title: 'ビルドアクション: Resource', body: '画像をアセンブリに埋め込み、XAML から `/Assets/logo.png` で参照できるようにする。`*.xaml` と `*.cs` は自動で取り込まれるが、**画像は自動では Resource にならない**ので、こうして明示する（Visual Studio のプロパティで変えても同じ行が書かれる）。' } },
            { code: '    <Content Include="Data\\manual.pdf">', note: { title: 'ビルドアクション: Content', body: 'アセンブリには埋め込まず、アプリに付属するファイルとして扱う。大きなファイルや、あとで差し替えたいファイルに向く。' } },
            { code: '      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>', note: { title: '出力フォルダーへコピー', body: '`PreserveNewest` は「新しければコピー」。これを書かないと、ビルドしても exe の隣にファイルが置かれない。`Always` は毎回コピーするためビルドが遅くなりやすい。' } },
            { code: '    </Content>' },
            { code: '    <None Update="appsettings.json">', note: { title: 'Include ではなく Update', body: '`appsettings.json` は既定の取り込み規則ですでに `None` として含まれている。そこへ設定を**追加**するので `Update` を使う。ここを `Include` にすると「項目が重複している」というビルドエラーになる。' } },
            { code: '      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>' },
            { code: '    </None>' },
            { code: '  </ItemGroup>' },
            { code: '' },
            { code: '  <ItemGroup>' },
            { code: '    <PackageReference Include="CommunityToolkit.Mvvm" Version="8.4.0" />', note: { title: 'NuGet パッケージ参照', body: '使うライブラリとバージョンを書く。旧形式では `packages.config` という別ファイルで管理していた。バージョンは例で、実際には最新の安定版を確認して指定する。' } },
            { code: '    <ProjectReference Include="..\\MyApp.Core\\MyApp.Core.csproj" />', note: { title: 'プロジェクト参照', body: '同じソリューション内の別プロジェクトを参照する。WPF に依存しないロジックを別プロジェクト（ここでは MyApp.Core）に分けておくと、テストしやすくなる。' } },
            { code: '  </ItemGroup>' },
            { code: '' },
            { code: '</Project>' },
          ],
        },
        { type: 'h3', text: '書いていないのに取り込まれるもの（EnableDefaultItems）' },
        {
          type: 'p',
          text: '上の csproj には `MainWindow.xaml` も `App.xaml.cs` も書かれていない。SDK スタイルでは、プロジェクトフォルダー以下のファイルが**既定の規則で自動的に取り込まれる**からだ。',
        },
        {
          type: 'table',
          caption: '既定で取り込まれるファイルと、それを制御するプロパティ',
          head: ['ファイル', '既定のビルドアクション', '止めるプロパティ'],
          rows: [
            ['`**/*.cs`', '`Compile`', '`EnableDefaultCompileItems`'],
            ['`**/*.resx`', '`EmbeddedResource`', '`EnableDefaultEmbeddedResourceItems`'],
            ['`**/*.xaml`（`UseWPF` のとき）', '`Page`', '`EnableDefaultPageItems`'],
            ['`App.xaml`（`UseWPF` のとき）', '`ApplicationDefinition`', '`EnableDefaultApplicationDefinition`'],
            ['その他のファイル', '`None`', '`EnableDefaultNoneItems`'],
            ['上のすべて', '—', '`EnableDefaultItems`（`false` で一括停止）'],
          ],
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '「Duplicate \'Page\' items were included」というエラー',
          text: '旧形式から移行した csproj に `<Page Include="MainWindow.xaml" />` が残っていると、自動取り込みと二重になってこのエラーが出る。対処は、手書きの `<Page>` / `<Compile>` 行を消すこと。`EnableDefaultPageItems` を `false` にして黙らせるのは最後の手段にする。',
        },
        { type: 'h3', text: '旧形式との違い' },
        {
          type: 'compare',
          left: {
            label: '旧形式（.NET Framework 時代）',
            tone: 'neutral',
            lang: 'xml',
            code: `<Project ToolsVersion="15.0"
  xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup>
    <ProjectGuid>{8A3C…}</ProjectGuid>
    <OutputType>WinExe</OutputType>
    <TargetFrameworkVersion>v4.8</TargetFrameworkVersion>
    <ProjectTypeGuids>{60dc8134-…};{FAE04EC0-…}</ProjectTypeGuids>
  </PropertyGroup>
  <ItemGroup>
    <Reference Include="PresentationCore" />
    <Reference Include="PresentationFramework" />
    <Reference Include="WindowsBase" />
    <Reference Include="System.Xaml" />
  </ItemGroup>
  <ItemGroup>
    <ApplicationDefinition Include="App.xaml">
      <Generator>MSBuild:Compile</Generator>
    </ApplicationDefinition>
    <Page Include="MainWindow.xaml">
      <Generator>MSBuild:Compile</Generator>
    </Page>
    <Compile Include="MainWindow.xaml.cs">
      <DependentUpon>MainWindow.xaml</DependentUpon>
    </Compile>
    <!-- ファイルを足すたびに行が増える -->
  </ItemGroup>
  <Import Project="$(MSBuildToolsPath)\\Microsoft.CSharp.targets" />
</Project>`,
            points: ['ファイルを 1 つ追加するたびに csproj が変わり、マージで衝突しやすい', 'NuGet は `packages.config` で別管理', 'バージョン情報は `AssemblyInfo.cs` に手書き'],
          },
          right: {
            label: 'SDK スタイル（.NET Core 3.0 以降）',
            tone: 'good',
            lang: 'xml',
            code: `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net10.0-windows</TargetFramework>
    <UseWPF>true</UseWPF>
  </PropertyGroup>

</Project>`,
            points: ['ファイルは規則で自動的に取り込まれる', 'NuGet は `PackageReference` で csproj に一本化', '`dotnet build` / `dotnet publish` だけでビルドと発行ができる', '複数の対象を同時にビルドできる（`TargetFrameworks`）'],
          },
          caption: '左は説明用に大幅に省略した抜粋（実物は 100 行を超えることも多い）。なお SDK スタイルは .NET Framework 4.x 向けのプロジェクトでも使える（`<TargetFramework>net48</TargetFramework>`）。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: .NET デスクトップ SDK の MSBuild プロパティ（UseWPF、EnableDefaultPageItems など）', url: 'https://learn.microsoft.com/en-us/dotnet/core/project-sdk/msbuild-props-desktop' },
            { label: 'Microsoft Learn: .NET プロジェクト SDK の概要（既定の取り込み規則）', url: 'https://learn.microsoft.com/en-us/dotnet/core/project-sdk/overview' },
            { label: 'Microsoft Learn: ターゲット フレームワーク（OS 固有の TFM）', url: 'https://learn.microsoft.com/en-us/dotnet/standard/frameworks' },
          ],
        },
      ],
    },
    {
      id: 'build-actions',
      title: 'ビルドアクション — ファイルの行き先を決める',
      lead: '「画像を追加したのに表示されない」の原因は、ほとんどが[[build-action]]だ。同じ画像ファイルでも、アクションによって行き先も読み方も変わる。',
      blocks: [
        {
          type: 'figure',
          demo: 'BuildActionExplorer',
          kind: 'demo',
          title: 'ビルドアクション別の行き先',
          caption: 'アクションを切り替えると、ファイルがビルド後にどこへ入り、どうやって読むかが変わる。',
        },
        {
          type: 'table',
          caption: '使い分けの早見表',
          head: ['こうしたい', '選ぶアクション'],
          rows: [
            ['XAML から画像やフォントを参照したい', '`Resource`'],
            ['大きなファイルを exe の外に置きたい / あとで差し替えたい', '`Content` + `CopyToOutputDirectory`'],
            ['文字列を多言語対応したい（.resx）', '`EmbeddedResource`'],
            ['WPF を参照しないライブラリにファイルを埋め込みたい', '`EmbeddedResource`'],
            ['設定ファイルを exe の隣に置きたい', '`None` + `CopyToOutputDirectory`'],
            ['起動時にスプラッシュ画像を出したい', '`SplashScreen`（専用のアクションがある）'],
          ],
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: 'Resource と EmbeddedResource は別物',
          text: '名前は似ているが、`Resource` は WPF の仕組み（pack URI で読む）、`EmbeddedResource` は .NET 共通の仕組み（`ResourceManager` や `GetManifestResourceStream` で読む）。`EmbeddedResource` にした画像は `<Image Source="/Assets/logo.png" />` では読めない。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: WPF アプリケーションのリソース、コンテンツ、およびデータ ファイル', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/app-development/wpf-application-resource-content-and-data-files' },
          ],
        },
      ],
    },
    {
      id: 'xaml-compile',
      title: 'XAML はビルドで何になるか — .g.cs と .baml',
      lead: '`MainWindow.xaml` と `MainWindow.xaml.cs` は、どうやって 1 つのクラスになるのか。答えは obj フォルダーの中にある。',
      blocks: [
        {
          type: 'figure',
          demo: 'BuildPipelineFigure',
          kind: 'figure',
          title: 'XAML のビルドの流れ',
          caption: 'ノードを選ぶと説明が出る。黄色の枠の中は自動生成される中間ファイルで、手で編集するものではない。',
        },
        {
          type: 'p',
          text: 'XAML の先頭にある `x:Class="MyApp.MainWindow"` が要だ。これは「この XAML は、`MyApp` 名前空間の `MainWindow` クラスの一部である」という宣言で、ビルド時に同じ名前の `partial class` が自動生成される。あなたが書いた[[code-behind]]も同じ `partial class` なので、コンパイラが 2 つを 1 つのクラスに結合する。',
        },
        {
          type: 'compare',
          left: {
            label: 'あなたが書く 2 つのファイル',
            tone: 'neutral',
            lang: 'csharp',
            code: `// MainWindow.xaml（先頭だけ）
// <Window x:Class="MyApp.MainWindow" ...>
//     <Button x:Name="OkButton" Click="OnOkClick" />
// </Window>

// MainWindow.xaml.cs
namespace MyApp;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();   // ← 定義は .g.cs にある
    }

    private void OnOkClick(object sender, RoutedEventArgs e)
    {
        OkButton.Content = "押された";   // ← フィールドも .g.cs にある
    }
}`,
          },
          right: {
            label: '自動生成される MainWindow.g.cs（要点のみ）',
            tone: 'neutral',
            lang: 'csharp',
            code: `namespace MyApp
{
    public partial class MainWindow
        : System.Windows.Window,
          System.Windows.Markup.IComponentConnector
    {
        // x:Name を付けた要素は、フィールドになる
        internal System.Windows.Controls.Button OkButton;

        public void InitializeComponent()
        {
            // 埋め込まれた BAML を読み込んで要素の木を作る
            var uri = new System.Uri(
                "/MyApp;component/mainwindow.xaml",
                System.UriKind.Relative);
            System.Windows.Application.LoadComponent(this, uri);
        }

        // BAML の読み込み中に呼ばれ、フィールドとイベントをつなぐ
        void IComponentConnector.Connect(int id, object target)
        {
            OkButton = (System.Windows.Controls.Button)target;
            OkButton.Click += OnOkClick;
        }
    }
}`,
          },
          caption: '右は実際の生成コードを読みやすく整理した擬似コード。実物は obj/Debug/net10.0-windows/ の中で見られる。',
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '「InitializeComponent は現在のコンテキストに存在しません」',
          text: 'このエラーのほとんどは、**`x:Class` の名前空間・クラス名と、コードビハインドのそれが一致していない**ことが原因だ。ファイルを別フォルダーへ移して名前空間だけ変えた、クラス名を片方だけ変えた、というときに起きる。XAML のビルドアクションが `Page` でなくなっている場合も同じエラーになる。',
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'x:Name と Name',
          text: '`x:Name="OkButton"` を付けた要素だけが、コードビハインドからフィールドとして見える。`Name="OkButton"` と書いても多くの場合同じ結果になるが、`x:Name` は XAML 言語の機能なのでどの要素にも使える。MVVM で組むと名前を付ける場面自体が減る（第 4 章）。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: WPF アプリケーションのビルド（マークアップ コンパイル）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/app-development/building-a-wpf-application-wpf' },
            { label: 'Microsoft Learn: WPF における分離コードと XAML', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/code-behind-and-xaml-in-wpf' },
          ],
        },
      ],
    },
    {
      id: 'app-xaml',
      title: 'App.xaml / App.xaml.cs — アプリの入口',
      lead: 'WPF アプリには `Main` メソッドが見当たらない。入口は `App.xaml` で、ここからアプリ全体の設定と起動が始まる。',
      blocks: [
        {
          type: 'figure',
          demo: 'StartupSequenceVideo',
          kind: 'video',
          title: '起動から終了まで（60 秒）',
          caption: '縦の破線は登場人物、横の矢印は呼び出し。上から下へ時間が流れる。App.xaml に StartupUri を書く標準的な構成の場合。',
        },
        {
          type: 'annotated',
          lang: 'xaml',
          title: 'App.xaml',
          lines: [
            { code: '<Application x:Class="MyApp.App"', note: { title: 'x:Class', body: 'コードビハインド（App.xaml.cs）の `App` クラスと結び付く。ビルドアクションが `ApplicationDefinition` なので、通常の XAML の処理に加えて、エントリーポイントの `Main()` が自動生成される。' } },
            { code: '             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"', note: { title: '既定の名前空間', body: 'プレフィックスなしで書いた要素（`Application`、`Button` など）が、WPF のどのクラスに対応するかを決める。URL に見えるが実際にアクセスするわけではなく、単なる識別子。' } },
            { code: '             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"', note: { title: 'x: 名前空間', body: 'XAML 言語自体の機能（`x:Class`、`x:Name`、`x:Key`、`x:Static`、`x:Type` など）を使うための宣言。' } },
            { code: '             StartupUri="Views/MainWindow.xaml"', note: { title: 'StartupUri', body: '起動時に最初に開くウィンドウの XAML。ここに書いたウィンドウは引数なしのコンストラクターで生成される。DI でコンストラクターに依存を渡したいときは、この行を消して `OnStartup` の中で自分でウィンドウを作る（第 4 章）。' } },
            { code: '             ShutdownMode="OnLastWindowClose">', note: { title: 'ShutdownMode', body: 'アプリがいつ終了するか。`OnLastWindowClose`（既定。最後のウィンドウが閉じたら）、`OnMainWindowClose`（メインウィンドウが閉じたら）、`OnExplicitShutdown`（`Shutdown()` を呼ぶまで終了しない。タスクトレイ常駐アプリ向け）の 3 つ。' } },
            { code: '    <Application.Resources>', note: { title: 'アプリ全体のリソース', body: 'ここに置いたリソースは、すべてのウィンドウから参照できる。リソース検索の「最後の砦」にあたる（このあとの節で扱う）。' } },
            { code: '        <ResourceDictionary>' },
            { code: '            <ResourceDictionary.MergedDictionaries>', note: { title: 'MergedDictionaries', body: '別ファイルに分けた ResourceDictionary を取り込む。色・文字・コントロールのスタイルをファイルごとに分け、ここで束ねるのが定番の構成。同じキーがあれば、あとに書いた辞書が優先される。' } },
            { code: '                <ResourceDictionary Source="Themes/Colors.xaml" />' },
            { code: '                <ResourceDictionary Source="Themes/Controls.xaml" />' },
            { code: '            </ResourceDictionary.MergedDictionaries>' },
            { code: '' },
            { code: '            <Thickness x:Key="PagePadding">16</Thickness>', note: { title: '直接書いたリソース', body: 'マージする辞書とは別に、ここへ直接リソースを書くこともできる。`MergedDictionaries` を使う場合は、このように全体を `<ResourceDictionary>` で包む必要がある。' } },
            { code: '        </ResourceDictionary>' },
            { code: '    </Application.Resources>' },
            { code: '</Application>' },
          ],
        },
        { type: 'h3', text: '未処理例外の受け止め方' },
        {
          type: 'p',
          text: 'どこにも `catch` されなかった例外は、放っておくとアプリを突然終了させる。最低限、ログを残し、利用者に状況を伝える処理を `App.xaml.cs` に入れておく。例外の出どころによって、受け取る場所が 3 つある。',
        },
        {
          type: 'annotated',
          lang: 'csharp',
          title: 'App.xaml.cs',
          lines: [
            { code: 'using System;' },
            { code: 'using System.Diagnostics;' },
            { code: 'using System.Threading.Tasks;' },
            { code: 'using System.Windows;' },
            { code: 'using System.Windows.Threading;' },
            { code: '' },
            { code: 'namespace MyApp;' },
            { code: '' },
            { code: 'public partial class App : Application', note: { title: 'partial class App', body: 'App.xaml から生成されるコードと結合される。`Application.Current` で、どこからでもこのインスタンスを取得できる（型は `Application` なので、独自メンバーを使うときは `(App)Application.Current` とキャストする）。' } },
            { code: '{' },
            { code: '    protected override void OnStartup(StartupEventArgs e)', note: { title: 'OnStartup', body: 'メッセージループが回り始めた直後、最初のウィンドウが作られる前に呼ばれる。`e.Args` でコマンドライン引数を受け取れる。初期化処理の定位置。' } },
            { code: '    {' },
            { code: '        DispatcherUnhandledException += OnDispatcherUnhandledException;', note: { title: '① UI スレッドの例外', body: 'UI スレッド上（イベントハンドラー、コマンド、`Dispatcher.Invoke` した処理など）で捕捉されなかった例外。3 つのうち、**続行するかどうかを選べるのはこれだけ**。' } },
            { code: '        AppDomain.CurrentDomain.UnhandledException += OnDomainUnhandledException;', note: { title: '② すべてのスレッドの例外', body: '別スレッドで起きた例外を含む最後の受け皿。ここに来た時点でプロセスの終了は止められないので、ログを残すことだけを考える。' } },
            { code: '        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;', note: { title: '③ 見捨てられた Task の例外', body: '`await` も `Wait()` もされないまま破棄された `Task` の中の例外。ガベージコレクションのタイミングで通知されるので、発生からかなり遅れて届く。' } },
            { code: '' },
            { code: '        base.OnStartup(e);' },
            { code: '    }' },
            { code: '' },
            { code: '    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)' },
            { code: '    {' },
            { code: '        Trace.TraceError(e.Exception.ToString());' },
            { code: '        MessageBox.Show(' },
            { code: '            "予期しないエラーが発生しました。作業内容を保存して、アプリを再起動してください。",' },
            { code: '            "エラー", MessageBoxButton.OK, MessageBoxImage.Error);' },
            { code: '        e.Handled = true;', note: { title: 'Handled = true', body: '`true` にするとアプリは終了せずに続行する。ただし、例外が起きた処理は途中で止まっており、アプリの状態が壊れている可能性がある。「握りつぶして何事もなかったように続ける」ためではなく、「保存と再起動を促す」ために使う。' } },
            { code: '    }' },
            { code: '' },
            { code: '    private void OnDomainUnhandledException(object sender, UnhandledExceptionEventArgs e)' },
            { code: '    {' },
            { code: '        Trace.TraceError(e.ExceptionObject.ToString());' },
            { code: '    }' },
            { code: '' },
            { code: '    private void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)' },
            { code: '    {' },
            { code: '        Trace.TraceError(e.Exception.ToString());' },
            { code: '        e.SetObserved();' },
            { code: '    }' },
            { code: '' },
            { code: '    protected override void OnExit(ExitEventArgs e)', note: { title: 'OnExit', body: 'アプリの終了時に呼ばれる。設定の保存、DI コンテナーの破棄などの後始末をここで行う。`e.ApplicationExitCode` でプロセスの終了コードを指定できる。' } },
            { code: '    {' },
            { code: '        Trace.Flush();' },
            { code: '        base.OnExit(e);' },
            { code: '    }' },
            { code: '}' },
          ],
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'async void のイベントハンドラーで起きた例外',
          text: '`private async void OnClick(...)` の中で `await` のあとに発生した例外は、UI スレッドへ戻されて ① の `DispatcherUnhandledException` に届く。一方、戻り値が `Task` のメソッドを `await` せずに呼び捨てにすると、例外は ③ に行くか、誰にも気づかれずに消える。呼び捨てにしないことが第一（第 5 章）。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: アプリケーション管理の概要（起動・終了・ShutdownMode）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/app-development/application-management-overview' },
            { label: 'Microsoft Learn: Application.DispatcherUnhandledException', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.application.dispatcherunhandledexception' },
            { label: 'Microsoft Learn: WPF ウィンドウの概要（ウィンドウの有効期間イベント）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/windows/' },
          ],
        },
      ],
    },
    {
      id: 'resources',
      title: 'リソース — 一度定義して、あちこちで使う',
      lead: '色、余白、スタイル、テンプレート。繰り返し使う値に名前（キー）を付けて辞書に入れておき、必要な場所から参照する仕組みがリソースだ。',
      blocks: [
        {
          type: 'p',
          text: 'すべての要素（`FrameworkElement`）と `Application` は、`Resources` という [[resource-dictionary]] を持っている。リソースを参照すると、WPF は**参照した要素から親へ向かって順に**辞書を探し、最初に見つかったものを使う。近くに同じキーがあれば、遠くの定義は隠される。',
        },
        {
          type: 'figure',
          demo: 'ResourceLookupDemo',
          kind: 'demo',
          title: 'StaticResource と DynamicResource、検索経路',
          caption: '左で「どの階層に定義するか」を切り替え、右で 2 種類の参照がどう振る舞うかを見る。「テーマ切り替え」を押したとき、追従するのは Dynamic だけ。',
        },
        {
          type: 'table',
          caption: 'StaticResource と DynamicResource の決定的な違い',
          head: ['', '`StaticResource`', '`DynamicResource`'],
          rows: [
            ['いつ探すか', 'XAML の読み込み時に 1 回だけ', '実際に値が必要になったとき。辞書が変わるたびに探し直す'],
            ['辞書を差し替えたら', '追従しない（最初の値のまま）', '追従する'],
            ['見つからないとき', '読み込み時に例外（`XamlParseException`）', '例外にならない。既定の見た目のまま（出力ウィンドウに警告が出ることがある）'],
            ['定義の順序', '参照より**前**に定義されている必要がある', '後ろで定義されていてもよい'],
            ['使える場所', 'ほぼどこでも', '依存関係プロパティなど、限られた場所'],
            ['コスト', '小さい', '参照ごとに追跡の仕組みが付くので、やや大きい'],
          ],
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '使い分けの方針',
          text: '基本は `StaticResource`。**実行中に切り替える可能性があるもの**（テーマの色、言語、システムカラーやアクセントカラーへの追従）だけ `DynamicResource` にする。「念のため全部 Dynamic」は、起動時間とメモリを余計に使うだけになる。',
        },
        {
          type: 'callout',
          kind: 'note',
          title: '「差し替え」と「書き換え」は違う',
          text: 'ここでの「辞書が変わる」とは、キーに対応する**オブジェクトを別のものに入れ替える**ことを指す。ブラシのオブジェクトはそのままで `Color` だけを書き換えた場合は、同じオブジェクトを見ている `StaticResource` 側にも反映される（ブラシが凍結されていなければ）。挙動が直感と合わないときは、どちらの操作をしているかを確認する。',
        },
        { type: 'h3', text: 'ResourceDictionary の構造とテーマ切り替え' },
        {
          type: 'code',
          lang: 'xaml',
          title: 'Themes/Light.xaml — 色だけを集めた辞書',
          code: `<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <!-- Dark.xaml には、同じキーで別の色を定義しておく -->
    <SolidColorBrush x:Key="WindowBackgroundBrush" Color="#FFF8F8FB" />
    <SolidColorBrush x:Key="TextBrush" Color="#FF17171F" />
    <SolidColorBrush x:Key="AccentBrush" Color="#FF5235C9" />

</ResourceDictionary>`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'ThemeManager.cs — 辞書を入れ替えてテーマを切り替える',
          code: `using System;
using System.Windows;

public static class ThemeManager
{
    /// <summary>"Light" または "Dark" を指定して、色の辞書を入れ替える。</summary>
    /// <remarks>
    /// App.xaml の MergedDictionaries の先頭（インデックス 0）を、色の辞書と決めておく。
    /// 色を参照する側は DynamicResource にしておくこと。
    /// </remarks>
    public static void Apply(string themeName)
    {
        var next = new ResourceDictionary
        {
            Source = new Uri($"/Themes/{themeName}.xaml", UriKind.Relative),
        };

        Application.Current.Resources.MergedDictionaries[0] = next;
    }
}`,
        },
        {
          type: 'callout',
          kind: 'history',
          title: '.NET 9 以降の Fluent テーマ',
          text: '.NET 9 で追加された Fluent テーマを使う場合は、`<Application ThemeMode="System">` のように `ThemeMode` を指定するだけで、標準コントロールのライト / ダークが OS の設定に追従する。自作の色については、上のような辞書の入れ替えが引き続き必要になる。',
        },
        { type: 'h3', text: 'pack URI — アプリの中のファイルを指す書式' },
        {
          type: 'p',
          text: '`<Image Source="/Assets/logo.png" />` や `<ResourceDictionary Source="Themes/Colors.xaml" />` に書いているパスは、[[pack-uri]] という書式の省略形だ。別アセンブリのリソースを参照するときなど、省略しない形を知っていないと書けない場面がある。',
        },
        {
          type: 'figure',
          demo: 'PackUriBuilder',
          kind: 'demo',
          title: 'pack URI を組み立てる',
          caption: '種類とパスを入れると、絶対形式と相対形式、XAML / C# での書き方が出る。色は URI の部品に対応している。',
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '先頭の「/」の有無で意味が変わる',
          text: '`/Assets/logo.png` はプロジェクトのルートからのパス、`Assets/logo.png` は**その XAML ファイルがあるフォルダーからの**相対パスになる。`Views/` フォルダーの中の XAML で後者を書くと `Views/Assets/logo.png` を探しに行って見つからない。迷ったら先頭に `/` を付ける。',
        },
        { type: 'h3', text: 'XAML リソースと .resx — 2 種類の「リソース」' },
        {
          type: 'table',
          caption: '同じ「リソース」という名前でも別の仕組み',
          head: ['', 'XAML リソース（ResourceDictionary）', '.resx（埋め込みリソース）'],
          rows: [
            ['入れるもの', 'ブラシ、スタイル、テンプレートなど、あらゆるオブジェクト', '主に文字列。画像やファイルも入れられる'],
            ['仕組み', 'WPF の機能', '.NET 共通の機能（`ResourceManager`）'],
            ['参照のしかた', '`{StaticResource Key}` / `{DynamicResource Key}`', '`{x:Static p:Resources.Key}` または C# から `Resources.Key`'],
            ['多言語対応', '言語ごとに辞書を用意して入れ替える', '`Resources.ja.resx` のように文化圏別のファイルを置くと、自動で選ばれる'],
            ['実行中の切り替え', '辞書の入れ替え + `DynamicResource` で可能', '`x:Static` は読み込み時に 1 回評価されるだけなので、画面の開き直しが必要'],
          ],
        },
        {
          type: 'code',
          lang: 'xaml',
          title: '.resx の文字列を XAML から使う',
          excerpt: true,
          code: `<!-- Resources.resx の「アクセス修飾子」を Public にしておく（既定の Internal では XAML から見えない） -->
<Window xmlns:p="clr-namespace:MyApp.Properties" ...>
    <Button Content="{x:Static p:Resources.SaveButtonText}" />
</Window>`,
        },
        {
          type: 'table',
          caption: 'ローカライズの方式',
          head: ['方式', '向いている場面', '注意点'],
          rows: [
            ['.resx + `x:Static`', '起動時に言語が決まればよいアプリ。翻訳ツールとの相性がよく、最も一般的', '実行中の切り替えには向かない'],
            ['言語別 ResourceDictionary + `DynamicResource`', '設定画面から即座に言語を切り替えたいアプリ', 'キーの管理を自前で行う必要がある'],
            ['`x:Uid` + LocBaml', '（公式ドキュメントに載っている方式）', 'LocBaml はサンプル扱いのツールで、実運用で採用される例は少ない'],
          ],
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: XAML リソースの概要（静的 / 動的リソースと検索の動作）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/systems/xaml-resources-overview' },
            { label: 'Microsoft Learn: マージされたリソース ディクショナリ', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/systems/xaml-resources-merged-dictionaries' },
            { label: 'Microsoft Learn: WPF におけるパッケージの URI', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/app-development/pack-uris-in-wpf' },
            { label: 'Microsoft Learn: WPF のグローバリゼーションとローカリゼーションの概要', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/wpf-globalization-and-localization-overview' },
            { label: "Microsoft Learn: What's new in WPF for .NET 9（ThemeMode）", url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/whats-new/net90' },
          ],
        },
      ],
    },
    {
      id: 'styles-templates',
      title: 'スタイルとテンプレート',
      lead: '`Style` は「プロパティ設定のまとめ」、`ControlTemplate` は「コントロールの見た目そのもの」、`DataTemplate` は「データの見せ方」。名前は似ているが、変えるものが違う。',
      blocks: [
        {
          type: 'figure',
          demo: 'XamlViewer',
          kind: 'demo',
          title: 'XAML と見た目の対応を見る',
          caption: 'タブでサンプルを切り替える。「Style と Trigger」では、暗黙スタイル・BasedOn・ローカル値の優先を確かめられる。',
        },
        {
          type: 'table',
          caption: '4 つの道具',
          head: ['道具', '何を変えるか', '例'],
          rows: [
            ['[[style]]', '既存のプロパティの値をまとめて設定する', 'すべてのボタンの余白と文字サイズを揃える'],
            ['[[trigger]]', '条件を満たす間だけ、プロパティの値を変える', 'マウスが乗ったら太字にする / データが異常なら赤くする'],
            ['[[control-template]]', 'コントロールを構成する要素の木を丸ごと置き換える', 'ボタンを丸くする、チェックボックスをトグルスイッチにする'],
            ['[[data-template]]', 'データオブジェクトを表示するための要素の木を定義する', '顧客オブジェクトを「名前 + 会社名 + アイコン」で表示する'],
          ],
        },
        { type: 'h3', text: 'Style — 暗黙スタイルと BasedOn' },
        {
          type: 'code',
          lang: 'xaml',
          title: 'Themes/Controls.xaml（抜粋）',
          excerpt: true,
          code: `<!-- x:Key を付けない = 暗黙スタイル。このスコープ内のすべての Button に自動で適用される -->
<Style TargetType="Button">
    <Setter Property="Padding" Value="14,6" />
    <Setter Property="FontSize" Value="13" />
</Style>

<!-- x:Key を付ける = 名前付きスタイル。Style="{StaticResource PrimaryButton}" と書いた要素だけに適用される。
     BasedOn で上の暗黙スタイルを引き継ぎ、差分だけを書く -->
<Style x:Key="PrimaryButton" TargetType="Button" BasedOn="{StaticResource {x:Type Button}}">
    <Setter Property="FontWeight" Value="Bold" />
</Style>`,
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '暗黙スタイルを書いたら、既定の見た目が消えた',
          text: 'サードパーティのテーマ（や .NET 9 の Fluent テーマ）を使っているプロジェクトで `<Style TargetType="Button">` を書くと、そのテーマのスタイルが**置き換えられて**しまう。引き継ぎたいときは、必ず `BasedOn="{StaticResource {x:Type Button}}"` を付ける。',
        },
        { type: 'h3', text: 'Trigger と DataTrigger' },
        {
          type: 'code',
          lang: 'xaml',
          title: 'プロパティで切り替える Trigger と、データで切り替える DataTrigger',
          excerpt: true,
          code: `<Style x:Key="StockText" TargetType="TextBlock">
    <Setter Property="Foreground" Value="Black" />
    <Style.Triggers>
        <!-- Trigger: この要素自身のプロパティを条件にする -->
        <Trigger Property="IsMouseOver" Value="True">
            <Setter Property="TextDecorations" Value="Underline" />
        </Trigger>

        <!-- DataTrigger: バインディングで得たデータの値を条件にする -->
        <DataTrigger Binding="{Binding IsOutOfStock}" Value="True">
            <Setter Property="Foreground" Value="Crimson" />
            <Setter Property="FontWeight" Value="Bold" />
        </DataTrigger>
    </Style.Triggers>
</Style>`,
        },
        {
          type: 'p',
          text: 'トリガーの良いところは、**条件が外れたら自動で元に戻る**ことだ。「マウスが離れたら色を戻す」というコードを書く必要がない。これは第 2 章の「値の優先順位」で見たとおり、トリガーが値を上書きしているのではなく、優先度の高い供給元として一時的に加わっているだけだからだ。',
        },
        { type: 'h3', text: 'ControlTemplate — 見た目を丸ごと差し替える' },
        {
          type: 'figure',
          demo: 'TemplateSwapDemo',
          kind: 'demo',
          title: 'テンプレート差し替えの実演',
          caption: '同じ Button のまま、テンプレートだけを入れ替える。色を変えたりクリックしたりして、何が変わり何が変わらないかを確かめる。',
        },
        {
          type: 'table',
          caption: 'テンプレートの中で使う 3 つの部品',
          head: ['部品', '役割'],
          rows: [
            ['[[template-binding]]', '適用先コントロールのプロパティ値を、テンプレート内の要素に引き込む。`Background="{TemplateBinding Background}"` で「使う側が指定した背景色」を受け取る'],
            ['[[content-presenter]]', '`Content` を表示する場所を示す。これを置き忘れると、ボタンの文字が表示されない'],
            ['`ControlTemplate.Triggers`', 'コントロールの状態（`IsMouseOver`、`IsPressed`、`IsEnabled` など）に応じて、テンプレート内の要素（`TargetName` で指定）を変える'],
          ],
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: 'Style で Background を変えても、ホバーの色が変わらない',
          text: '既定の Button テンプレートは、ホバー時に**テンプレート内の Border の色を直接**書き換える（上のデモの「既定」のコードを参照）。`Style` のトリガーで `Button.Background` を変えても、表示に使われている内側の Border には届かない。ホバー時の見た目を変えたいなら、`ControlTemplate` を自分で定義する必要がある。WPF で最もよく質問される挙動の 1 つ。',
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '既定テンプレートを手に入れる',
          text: 'ゼロから書く必要はない。Visual Studio の XAML デザイナーでコントロールを右クリックし、「テンプレートの編集」→「コピーして編集」を選ぶと、既定テンプレートの全文がリソースとして書き出される。それを削って作るのが近道。',
        },
        { type: 'h3', text: 'DataTemplate — データの見せ方' },
        {
          type: 'code',
          lang: 'xaml',
          title: 'リストの 1 行の見た目を定義する',
          excerpt: true,
          code: `<ListBox ItemsSource="{Binding Members}">
    <ListBox.ItemTemplate>
        <!-- このテンプレートの中の DataContext は、Members の要素 1 つ 1 つ -->
        <DataTemplate>
            <StackPanel Orientation="Horizontal">
                <Ellipse Width="8" Height="8" Margin="0,0,8,0" Fill="SeaGreen" VerticalAlignment="Center" />
                <TextBlock Text="{Binding Name}" FontWeight="Bold" />
                <TextBlock Text="{Binding Role}" Foreground="Gray" Margin="8,0,0,0" />
            </StackPanel>
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>`,
        },
        {
          type: 'p',
          text: '`DataTemplate` を指定しないと、WPF はオブジェクトの `ToString()` の結果を文字として表示する。リストに `MyApp.Models.Member` のような型名が並んでしまったら、それは「このデータの見せ方が定義されていない」という合図だ。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: スタイルとテンプレート', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/controls/styles-templates-overview' },
            { label: 'Microsoft Learn: コントロールのテンプレートを作成する方法', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/controls/how-to-create-apply-template' },
            { label: 'Microsoft Learn: データ テンプレートの概要', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/data/data-templating-overview' },
            { label: 'GitHub: dotnet/wpf — Aero2 テーマの Button スタイル', url: 'https://github.com/dotnet/wpf/blob/main/src/Microsoft.DotNet.Wpf/src/Themes/XAML/Button.xaml' },
          ],
        },
      ],
    },
    {
      id: 'structure',
      title: '推奨ディレクトリ構成とソリューション分割',
      lead: '決まった正解はないが、「WPF に依存するコード」と「依存しないコード」を分けるという原則は、どのチームでも役に立つ。',
      blocks: [
        {
          type: 'figure',
          demo: 'ProjectStructure',
          kind: 'demo',
          title: '3 プロジェクト構成の例',
          caption: '項目にカーソルを合わせる（またはタップ / Tab で選ぶ）と、そこに何を置くかが出る。',
        },
        {
          type: 'list',
          items: [
            '**小さなアプリなら 1 プロジェクトで十分**。その場合も `Views` / `ViewModels` / `Models` / `Services` / `Themes` のフォルダー分けは最初からしておく。',
            '**テストを書くなら、ViewModel を WPF 非依存のプロジェクトに出す**。`net10.0`（`-windows` なし）を対象にできれば、テストの実行が速く、CI も Linux で回せる。',
            '**機能が増えたら「機能ごと」のフォルダーに切り替える**。`Features/Customers/` の下に、その機能の View・ViewModel・Model をまとめる構成のほうが、大きなアプリでは見通しがよい。',
            '**共通のコントロールやテーマは別のクラスライブラリへ**。複数アプリで使い回すなら、WPF クラスライブラリ（`UseWPF` を指定した `Library`）に切り出す。',
          ],
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '依存の向きを 1 方向に保つ',
          text: '参照は必ず「MyApp（WPF）→ MyApp.Core」の向きにし、逆向きにしない。Core 側から画面を操作したくなったら、Core にインターフェイス（`IDialogService` など）を定義し、WPF 側で実装して DI で渡す。これで Core は WPF を知らないままでいられる（第 4 章）。',
        },
      ],
    },
  ],
  quiz: [
    {
      id: 'f1',
      q: 'SDK スタイルの WPF プロジェクトに `Assets/logo.png` を追加し、XAML に `<Image Source="/Assets/logo.png" />` と書いたが、実行すると例外になる。最も可能性の高い原因はどれか。',
      choices: [
        '画像は自動では Resource にならず、ビルドアクションが None のままだから',
        'PNG 形式は WPF でサポートされていないから',
        'pack URI は絶対形式で書かなければならないから',
        '`UseWPF` が `true` だと画像を埋め込めないから',
      ],
      answer: 0,
      explain: 'SDK スタイルで自動的に取り込まれるのは `*.cs`（Compile）、`*.xaml`（Page）、`*.resx`（EmbeddedResource）で、それ以外は `None` になる。画像は `<Resource Include="Assets\\logo.png" />` と明示する必要がある。',
    },
    {
      id: 'f2',
      q: '`x:Class="MyApp.Views.MainWindow"` と書かれた XAML のコードビハインドで「InitializeComponent は現在のコンテキストに存在しません」というエラーが出た。まず確認すべきことはどれか。',
      choices: [
        '`Window` に `Title` が設定されているか',
        'コードビハインドの名前空間とクラス名が `MyApp.Views.MainWindow` と一致し、`partial` が付いているか',
        '`App.xaml` に `StartupUri` が書かれているか',
        '`obj` フォルダーを Git にコミットしているか',
      ],
      answer: 1,
      explain: '`InitializeComponent()` は、`x:Class` で指定した名前の partial class として自動生成される。コードビハインド側の名前空間・クラス名が食い違うと別のクラスになってしまい、メソッドが見つからない。',
    },
    {
      id: 'f3',
      q: '設定画面でライト / ダークを切り替えたとき、開いている画面の色を即座に変えたい。色のブラシはどう参照するのが適切か。',
      choices: ['`{StaticResource AccentBrush}`', '`{DynamicResource AccentBrush}`', '`{x:Static local:Colors.AccentBrush}`', '`{Binding AccentBrush}`（DataContext の指定なし）'],
      answer: 1,
      explain: '`DynamicResource` は辞書の差し替えに追従する。`StaticResource` は読み込み時に 1 回解決されるだけなので、画面を開き直すまで変わらない。`x:Static` も読み込み時に 1 回評価されるだけ。',
    },
    {
      id: 'f4',
      q: '参照しているクラスライブラリ `MyApp.Controls` に埋め込まれた `Images/check.png`（ビルドアクション Resource）を指す pack URI として正しいものはどれか。',
      choices: [
        '`/Images/check.png`',
        '`/MyApp.Controls;component/Images/check.png`',
        '`pack://siteoforigin:,,,/MyApp.Controls/Images/check.png`',
        '`MyApp.Controls.Images.check.png`',
      ],
      answer: 1,
      explain: '別アセンブリのリソースは「/アセンブリ名;component/パス」で指す。絶対形式なら `pack://application:,,,/MyApp.Controls;component/Images/check.png`。D は `EmbeddedResource` を `GetManifestResourceStream` で読むときの名前の形。',
    },
    {
      id: 'f5',
      q: 'ボタンを角丸にし、ホバー時の色も自分で決めたい。使うべきものはどれか。',
      choices: ['`Style` の `Setter` だけ', '`DataTemplate`', '`ControlTemplate`', '`ResourceDictionary.MergedDictionaries`'],
      answer: 2,
      explain: '形（角丸）やホバー時の描画は、コントロールを構成する要素の木＝ `ControlTemplate` が決めている。`Style` の Setter は既存のプロパティに値を入れるだけなので、テンプレートが見ていない見た目は変えられない。`DataTemplate` はデータの見せ方を決めるもの。',
    },
    {
      id: 'f6',
      q: '`Application.DispatcherUnhandledException` について正しい説明はどれか。',
      choices: [
        'すべてのスレッドの未処理例外を受け取れる',
        'UI スレッドの未処理例外を受け取り、`e.Handled = true` でアプリの終了を防げる',
        '`await` されなかった `Task` の例外だけを受け取る',
        'ビルド時のエラーを受け取る',
      ],
      answer: 1,
      explain: 'UI スレッド（Dispatcher 上）で捕捉されなかった例外が対象で、`Handled` を `true` にすれば続行できる。別スレッドの例外は `AppDomain.CurrentDomain.UnhandledException`（終了は止められない）、見捨てられた Task は `TaskScheduler.UnobservedTaskException` に届く。',
    },
    {
      id: 'f7',
      q: '`<None Update="appsettings.json">` で `Include` ではなく `Update` を使う理由はどれか。',
      choices: [
        '`Update` のほうがビルドが速いから',
        '`appsettings.json` は既定の規則ですでに取り込まれており、`Include` だと項目が重複するから',
        '`Include` は .NET Framework でしか使えないから',
        '`Update` と書くとファイルが自動更新されるから',
      ],
      answer: 1,
      explain: 'SDK スタイルでは、プロジェクトフォルダー内のファイルが既定で `None` などの項目として取り込まれている。すでにある項目に設定を足すのが `Update`、新しく項目を追加するのが `Include`。',
    },
  ],
  exercises: [
    {
      id: 'ex-found-csproj',
      title: 'csproj を完成させる',
      lang: 'xml',
      level: 1,
      prompt:
        '次の条件を満たす SDK スタイルの csproj を完成させよう。① .NET 10 向けの WPF アプリ（コンソールウィンドウは出さない）、② `Assets\\logo.png` を XAML から参照できるように埋め込む、③ `appsettings.json` を出力フォルダーへ「新しければコピー」する。',
      starter: `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <!-- ① 出力の種類、対象フレームワーク、WPF の有効化 -->

  </PropertyGroup>

  <ItemGroup>
    <!-- ② logo.png -->

    <!-- ③ appsettings.json -->

  </ItemGroup>

</Project>`,
      solution: `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net10.0-windows</TargetFramework>
    <UseWPF>true</UseWPF>
  </PropertyGroup>

  <ItemGroup>
    <Resource Include="Assets\\logo.png" />

    <None Update="appsettings.json">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
  </ItemGroup>

</Project>`,
      solutionNote: '`appsettings.json` は既定で `None` として取り込まれているので `Update` を使う。`Content` + `CopyToOutputDirectory` でも条件は満たせる（その場合は `Include`）。',
      hints: [
        'コンソールを出さない Windows アプリの `OutputType` は `WinExe`。',
        'WPF の対象フレームワークには `-windows` が必要。.NET 10 なら `net10.0-windows`。',
        'XAML から参照できる埋め込みは `Resource`。`EmbeddedResource` ではない。',
      ],
      checks: [
        { label: 'OutputType が WinExe', test: (c) => c.els('OutputType').some((n) => n.text === 'WinExe') },
        { label: 'TargetFramework が net10.0-windows（OS バージョン付きも可）', test: (c) => c.els('TargetFramework').some((n) => /^net10\.0-windows/.test(n.text)) },
        { label: 'UseWPF が true', test: (c) => c.els('UseWPF').some((n) => n.text.toLowerCase() === 'true') },
        { label: 'logo.png が Resource として含まれている', test: (c) => c.els('Resource').some((n) => /Assets[\\/]logo\.png$/i.test(a(n, 'Include') ?? '')) },
        {
          label: 'appsettings.json が PreserveNewest で出力フォルダーにコピーされる',
          test: (c) =>
            [...c.els('None'), ...c.els('Content')].some(
              (n) => /appsettings\.json$/i.test(a(n, 'Update') ?? a(n, 'Include') ?? '') && (n.children.some((k) => k.name === 'CopyToOutputDirectory' && k.text === 'PreserveNewest') || a(n, 'CopyToOutputDirectory') === 'PreserveNewest'),
            ),
        },
      ],
    },
    {
      id: 'ex-found-resource',
      title: 'リソースを定義して参照する',
      lang: 'xaml',
      level: 1,
      preview: true,
      prompt:
        '`Window.Resources` に、キー `HeaderBrush` の `SolidColorBrush`（好きな色）を定義しよう。そして `Border` の `Background` と、`TextBlock`「お知らせ」の `Foreground` の**両方**から `StaticResource` で参照する。',
      starter: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="リソース" Width="320" Height="180">

    <!-- ここに Window.Resources を書く -->

    <StackPanel Margin="16">
        <TextBlock Text="お知らせ" FontSize="16" FontWeight="Bold" />
        <Border Height="6" Margin="0,6,0,12" />
        <TextBlock Text="本日 18 時からメンテナンスを行います。" TextWrapping="Wrap" />
    </StackPanel>
</Window>`,
      solution: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="リソース" Width="320" Height="180">

    <Window.Resources>
        <SolidColorBrush x:Key="HeaderBrush" Color="#C02A55" />
    </Window.Resources>

    <StackPanel Margin="16">
        <TextBlock Text="お知らせ" FontSize="16" FontWeight="Bold"
                   Foreground="{StaticResource HeaderBrush}" />
        <Border Height="6" Margin="0,6,0,12" Background="{StaticResource HeaderBrush}" />
        <TextBlock Text="本日 18 時からメンテナンスを行います。" TextWrapping="Wrap" />
    </StackPanel>
</Window>`,
      solutionNote: '`Color` を 1 か所変えるだけで、見出しと帯の両方が変わる。色をあちこちに直書きしないことが、あとでテーマを足すときの下準備になる。',
      hints: ['`<Window.Resources>` は `Window` の開始タグの直後、`StackPanel` より前に書く（`StaticResource` は前方で定義されている必要がある）。', '参照は `Background="{StaticResource HeaderBrush}"` の形。'],
      checks: [
        { label: 'Window.Resources に x:Key="HeaderBrush" の SolidColorBrush がある', test: (c) => c.els('Window.Resources').some((r) => r.children.some((n) => n.name === 'SolidColorBrush' && a(n, 'x:Key') === 'HeaderBrush' && !!a(n, 'Color'))) },
        { label: 'Border の Background が StaticResource HeaderBrush', test: (c) => c.els('Border').some((n) => /^\{\s*StaticResource\s+HeaderBrush\s*\}$/.test(a(n, 'Background') ?? '')) },
        { label: 'TextBlock の Foreground が StaticResource HeaderBrush', test: (c) => c.els('TextBlock').some((n) => /^\{\s*StaticResource\s+HeaderBrush\s*\}$/.test(a(n, 'Foreground') ?? '')) },
      ],
    },
    {
      id: 'ex-found-style',
      title: '暗黙スタイルとトリガーを書く',
      lang: 'xaml',
      level: 2,
      preview: true,
      prompt:
        '`Window.Resources` に、**すべての `Button` に効く暗黙スタイル**を書こう。`Margin` を `0,0,0,8`、`Padding` を `12,4` に設定し、さらに `IsMouseOver` が `True` の間だけ `FontWeight` を `Bold` にするトリガーを付ける。プレビューのボタンにカーソルを載せて確かめよう。',
      starter: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="スタイル" Width="300" Height="200">
    <Window.Resources>
        <!-- ここに Button の暗黙スタイルを書く -->

    </Window.Resources>

    <StackPanel Margin="16" HorizontalAlignment="Left">
        <Button Content="新規作成" />
        <Button Content="開く" />
        <Button Content="保存" />
    </StackPanel>
</Window>`,
      solution: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="スタイル" Width="300" Height="200">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Margin" Value="0,0,0,8" />
            <Setter Property="Padding" Value="12,4" />
            <Style.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                    <Setter Property="FontWeight" Value="Bold" />
                </Trigger>
            </Style.Triggers>
        </Style>
    </Window.Resources>

    <StackPanel Margin="16" HorizontalAlignment="Left">
        <Button Content="新規作成" />
        <Button Content="開く" />
        <Button Content="保存" />
    </StackPanel>
</Window>`,
      solutionNote: '個々の `Button` には何も書いていないのに 3 つすべてに効く。`x:Key` を付けると名前付きスタイルになり、`Style="{StaticResource ...}"` と書いた要素にしか効かなくなる。',
      hints: ['暗黙スタイルは `x:Key` を付けず、`TargetType="Button"` だけを指定する。', 'トリガーは `<Style.Triggers>` の中に `<Trigger Property="IsMouseOver" Value="True">` を書き、その中に `Setter` を置く。'],
      checks: [
        { label: 'x:Key のない Style で、TargetType が Button', test: (c) => c.els('Style').some((s) => !a(s, 'x:Key') && /^(\{x:Type\s+)?Button\}?$/.test(a(s, 'TargetType') ?? '')) },
        { label: 'Setter で Margin が 0,0,0,8', test: (c) => c.els('Style').some((s) => s.children.some((n) => n.name === 'Setter' && a(n, 'Property') === 'Margin' && (a(n, 'Value') ?? '').replace(/\s/g, '') === '0,0,0,8')) },
        { label: 'Setter で Padding が 12,4', test: (c) => c.els('Style').some((s) => s.children.some((n) => n.name === 'Setter' && a(n, 'Property') === 'Padding' && (a(n, 'Value') ?? '').replace(/\s/g, '') === '12,4')) },
        {
          label: 'IsMouseOver = True のトリガーで FontWeight を Bold にしている',
          test: (c) => c.els('Trigger').some((t) => a(t, 'Property') === 'IsMouseOver' && a(t, 'Value') === 'True' && t.parent?.name === 'Style.Triggers' && t.children.some((n) => n.name === 'Setter' && a(n, 'Property') === 'FontWeight' && a(n, 'Value') === 'Bold')),
        },
      ],
    },
  ],
}

export default chapter
