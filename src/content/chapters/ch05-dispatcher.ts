import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'

const chapter: Chapter = {
  ...metaOf('dispatcher'),
  goals: [
    'UI 要素が「作られたスレッドからしか触れない」理由と、その越え方がわかる',
    'メッセージループと Dispatcher のキューが、どう連携して処理を 1 件ずつ実行しているかを説明できる',
    '`Invoke` / `BeginInvoke` / `InvokeAsync` の違いと、`DispatcherPriority` の選び方がわかる',
    '`async/await` で UI スレッドに戻れる仕組みと、`.Result` でデッドロックする理由を説明できる',
    '別スレッドからのコレクション更新と、`Freeze()` によるスレッド間共有ができる',
  ],
  sections: [
    {
      id: 'affinity',
      title: 'UI スレッドとスレッドアフィニティ',
      lead: 'WPF の UI 要素は、自分を作ったスレッドに「所属」している。別のスレッドから触ろうとすると、即座に例外になる。これが WPF のスレッドモデルの出発点だ。',
      blocks: [
        {
          type: 'figure',
          demo: 'ThreadAffinityFigure',
          kind: 'figure',
          title: '別スレッドから UI に触る 3 つの方法',
          caption: '上のボタンで切り替える。直接触ると例外、Dispatcher に依頼すれば動く、凍結したオブジェクトは共有できる。',
        },
        {
          type: 'p',
          text: 'この性質を[[thread-affinity]]と呼ぶ。`Button` も `TextBlock` も `Window` も、すべて [[dispatcher-object]] を継承しており、プロパティに触れるたびに「いまのスレッドは、自分の所属スレッドか」を検査している。ロックで保護する代わりに「1 つのスレッドからしか触らせない」と決めることで、UI のコードから排他制御をなくしているわけだ。',
        },
        {
          type: 'table',
          caption: 'UI スレッドの決まりごと',
          head: ['決まり', '理由'],
          rows: [
            ['UI スレッドは [[sta]] でなければならない', 'クリップボード、ドラッグ & ドロップ、IME、一部のダイアログなど、Windows の機能が STA を要求する。自動生成される `Main()` に `[STAThread]` が付いているのはこのため'],
            ['UI 要素は、作ったスレッドからしか触れない', '`DispatcherObject` がアクセスのたびに検査する（`VerifyAccess`）'],
            ['UI スレッドを長く止めてはいけない', '入力も描画もアニメーションも、すべてこのスレッドの仕事だから'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'いまのスレッドから触ってよいかを調べる',
          excerpt: true,
          code: `// true なら、このスレッドから直接触ってよい
if (StatusText.Dispatcher.CheckAccess())
{
    StatusText.Text = "完了";
}
else
{
    // 別スレッドなので、UI スレッドに頼む
    StatusText.Dispatcher.InvokeAsync(() => StatusText.Text = "完了");
}`,
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'ViewModel のプロパティは、別スレッドから変えてもよい？',
          text: '単一の値のプロパティ（`string`、`int` など）については、WPF のバインディングが `PropertyChanged` を UI スレッドへ自動で転送するので、別スレッドから変更しても例外にはならない。ただし**コレクションの変更（`ObservableCollection` への追加・削除）は転送されず、例外になる**。この違いが、あとの節で扱う `EnableCollectionSynchronization` の出番につながる。挙動に頼りすぎず、「UI に見えているものは UI スレッドで変える」を原則にしておくと安全だ。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: スレッド モデル（WPF）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/threading-model' },
            { label: 'Microsoft Learn: DispatcherObject クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.threading.dispatcherobject' },
          ],
        },
      ],
    },
    {
      id: 'message-pump',
      title: 'メッセージポンプと Dispatcher のキュー',
      lead: 'UI スレッドは、1 本のループを回し続けている。入力も、描画も、あなたが `BeginInvoke` した処理も、すべてこのループが 1 件ずつ取り出して実行する。',
      blocks: [
        {
          type: 'figure',
          demo: 'MessagePumpVideo',
          kind: 'video',
          title: 'メッセージポンプと Dispatcher キューの動き（70 秒）',
          caption: '左が OS のメッセージキュー、中央がメッセージループ、右上が Dispatcher のキュー、右下が「いま実行中の 1 件」。丸い札が、メッセージや作業を表す。',
        },
        {
          type: 'p',
          text: '[[dispatcher]] は、この[[message-pump]]の上に「優先度付きの作業キュー」を載せたものだ。作業を積むと、Dispatcher は自分宛の合図を OS のキューに送り、ループがその合図を取り出したときに、自分のキューから**最も優先度の高い 1 件だけ**を実行する。1 件ごとにループへ戻るので、作業の合間に入力や描画を挟める。',
        },
        {
          type: 'figure',
          demo: 'DispatcherSimulator',
          kind: 'demo',
          title: 'Dispatcher キューのシミュレータ',
          caption: 'シナリオ A と B を順に実行して、「実行された順番」を見比べる。同じ作業でも、積む優先度を変えるだけで入力が待たされなくなる。自分で作業を積んで試すこともできる。',
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '優先度は「割り込み」ではない',
          text: '優先度が効くのは「次にどれを取り出すか」を決めるときだけだ。**すでに実行が始まった処理は、どんなに優先度の高い作業が積まれても中断されない**。3 秒かかる処理を `Background` で積んでも、実行が始まれば 3 秒間は画面が固まる。UI を止めないためには、作業を細かく分けるか、そもそも別スレッドで実行するしかない。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: スレッド モデル（Dispatcher と優先度）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/threading-model' },
            { label: 'GitHub: dotnet/wpf — Dispatcher.cs', url: 'https://github.com/dotnet/wpf/blob/main/src/Microsoft.DotNet.Wpf/src/WindowsBase/System/Windows/Threading/Dispatcher.cs' },
          ],
        },
      ],
    },
    {
      id: 'invoke',
      title: 'Invoke / BeginInvoke / InvokeAsync と優先度',
      lead: 'UI スレッドに作業を頼む方法は 3 つある。違いは「頼んだ側が終わるまで待つか」と「結果や例外をどう受け取るか」だ。',
      blocks: [
        {
          type: 'table',
          caption: '3 つのメソッドの違い',
          head: ['', '`Invoke`', '`BeginInvoke`', '`InvokeAsync`'],
          rows: [
            ['頼んだ側は', '終わるまで**待つ**（同期）', '待たずに次へ進む', '待たずに次へ進む'],
            ['既定の優先度', '`Send`（優先度を省略した場合）', '`Normal`', '`Normal`'],
            ['戻り値', '処理の戻り値そのもの', '`DispatcherOperation`', '`DispatcherOperation` / `DispatcherOperation<T>`（`await` できる）'],
            ['引数の型', '`Action` / `Func<T>` / `Delegate`', '`Delegate`（型検査が弱い）', '`Action` / `Func<T>`（型検査が効く）'],
            ['登場', '.NET Framework 3.0', '.NET Framework 3.0', '.NET Framework 4.5'],
            ['使いどころ', 'どうしても同期で結果が要るとき。デッドロックの危険がある', '古いコード', '**新しく書くならこれ**'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: '3 つの書き方',
          excerpt: true,
          code: `// ワーカースレッドから UI を更新する 3 通りの方法

// ① Invoke: UI スレッドでの実行が終わるまで、この行で待つ
Dispatcher.Invoke(() => StatusText.Text = "読み込み中…");

// ② BeginInvoke: 積んだらすぐ次の行へ進む（古い書き方）
Dispatcher.BeginInvoke(new Action(() => StatusText.Text = "読み込み中…"));

// ③ InvokeAsync: 積んだらすぐ次の行へ進む。必要なら await で完了を待てる
await Dispatcher.InvokeAsync(() => StatusText.Text = "読み込み中…");

// 戻り値も型付きで受け取れる
double width = await Dispatcher.InvokeAsync(() => MainPanel.ActualWidth);

// 優先度を指定する
await Dispatcher.InvokeAsync(ScrollToLatest, DispatcherPriority.Loaded);`,
        },
        { type: 'h3', text: 'DispatcherPriority の全列挙' },
        {
          type: 'table',
          caption: 'DispatcherPriority（値の大きいものほど先に処理される）',
          head: ['値', '名前', '意味', '実務での使いどころ'],
          rows: [
            ['10', '`Send`', '最優先。ほかの非同期の作業より先に処理される', '自分で指定することはまずない'],
            ['9', '`Normal`', '通常の優先度', '既定値。迷ったらこれ。`await` の続きもここに積まれる'],
            ['8', '`DataBind`', 'データバインディングと同じ', '通常は指定しない'],
            ['7', '`Render`', '描画と同じ', '通常は指定しない'],
            ['6', '`Loaded`', 'レイアウトと描画が済み、入力を処理する前', '「描画が済んでから」実行したい処理（スクロール、フォーカス移動、サイズの取得）'],
            ['5', '`Input`', '入力と同じ', '通常は指定しない'],
            ['4', '`Background`', 'ほかのすべての（アイドル以外の）作業が済んだ後', '入力や描画を優先しつつ、少しずつ進めたい処理'],
            ['3', '`ContextIdle`', 'バックグラウンドの作業が済んだ後', '`Loaded` より確実に「落ち着いてから」実行したいとき'],
            ['2', '`ApplicationIdle`', 'アプリケーションがアイドル状態のとき', '急がない後片付け、先読み'],
            ['1', '`SystemIdle`', 'システムがアイドル状態のとき', 'ほとんど使わない'],
            ['0', '`Inactive`', '処理されない', '作業を保留しておく特殊な用途'],
            ['-1', '`Invalid`', '無効な優先度', '使わない'],
          ],
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '実務での選び方は 3 択でよい',
          text: '**`Normal`**（既定。普通はこれ）、**`Loaded`**（画面の更新が済んでから実行したい）、**`Background`**（入力を邪魔したくない）。この 3 つで、ほとんどの場面は足りる。優先度を細かく使い分けて順序を制御しようとすると、あとで読む人が理由を追えなくなる。',
        },
        {
          type: 'code',
          lang: 'csharp',
          title: '「描画が済んでから」実行する典型例',
          excerpt: true,
          code: `private async void OnAddClick(object sender, RoutedEventArgs e)
{
    ViewModel.Items.Add(new Item("新しい項目"));

    // この時点では、追加した行の UI はまだ作られていない。
    // レイアウトと描画（Render）が済んだ後に実行されるよう、Loaded で積む
    await Dispatcher.InvokeAsync(
        () => ItemsList.ScrollIntoView(ViewModel.Items[^1]),
        DispatcherPriority.Loaded);
}`,
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: DispatcherPriority 列挙型', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.threading.dispatcherpriority' },
            { label: 'Microsoft Learn: Dispatcher.InvokeAsync', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.threading.dispatcher.invokeasync' },
            { label: 'Microsoft Learn: Dispatcher.Invoke', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.threading.dispatcher.invoke' },
          ],
        },
      ],
    },
    {
      id: 'timers',
      title: 'DispatcherTimer と System.Timers.Timer',
      lead: '「1 秒ごとに時計を更新する」ようなタイマーにも、どのスレッドで呼ばれるかの違いがある。',
      blocks: [
        {
          type: 'table',
          caption: 'タイマーの比較',
          head: ['', '`DispatcherTimer`', '`System.Timers.Timer`', '`PeriodicTimer`（.NET 6 以降）'],
          rows: [
            ['コールバックが走るスレッド', 'UI スレッド', 'スレッドプール', '`await` した場所の文脈（UI で使えば UI スレッド）'],
            ['UI を直接触れるか', '触れる', '触れない（Dispatcher 経由が必要）', 'UI スレッドで待てば触れる'],
            ['時間の正確さ', '指定時間より**前**には来ないが、UI スレッドが忙しければ遅れる', 'UI スレッドの影響を受けない', '同左'],
            ['重い処理を書くと', 'UI が固まる', 'UI は固まらない', '`await` の後が UI スレッドなら固まる'],
            ['向いている用途', '時計、進捗の表示、一定間隔の画面更新', 'UI と無関係な定期処理', '`async` メソッドの中での定期処理'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'DispatcherTimer で時計を更新する',
          code: `using System;
using System.Windows;
using System.Windows.Threading;

public partial class ClockWindow : Window
{
    private readonly DispatcherTimer _timer;

    public ClockWindow()
    {
        InitializeComponent();

        _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _timer.Tick += OnTick;          // Tick は UI スレッドで呼ばれるので、UI を直接触ってよい
        _timer.Start();

        // 動いている DispatcherTimer は Dispatcher から参照され続ける。
        // 止めないと、ウィンドウを閉じてもメモリから解放されない
        Closed += (_, _) => _timer.Stop();
    }

    private void OnTick(object? sender, EventArgs e)
    {
        ClockText.Text = DateTime.Now.ToString("HH:mm:ss");
    }
}`,
        },
        {
          type: 'callout',
          kind: 'note',
          text: '`DispatcherTimer` の `Tick` は、Dispatcher のキューに（既定では `Background` の優先度で）積まれて実行される。だから「1 秒ちょうど」ではなく「1 秒以上たってから、順番が来たとき」に呼ばれる。正確な時間計測には `Stopwatch` を併用する。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: DispatcherTimer クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.threading.dispatchertimer' },
            { label: 'Microsoft Learn: System.Timers.Timer クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.timers.timer' },
            { label: 'Microsoft Learn: PeriodicTimer クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.threading.periodictimer' },
          ],
        },
      ],
    },
    {
      id: 'async-await',
      title: 'async/await と SynchronizationContext',
      lead: '`await` のあとのコードが、何も書かなくても UI スレッドで実行される。この「当たり前」を支えているのが SynchronizationContext だ。',
      blocks: [
        {
          type: 'code',
          lang: 'csharp',
          title: 'await の前後で、スレッドはどうなっているか',
          excerpt: true,
          code: `private async void OnLoadClick(object sender, RoutedEventArgs e)
{
    // ── ここは UI スレッド ──
    LoadButton.IsEnabled = false;

    // 重い処理はスレッドプールで実行する。UI スレッドは「待たずに」ループへ戻る
    string text = await Task.Run(() => File.ReadAllText(_path));

    // ── ここも UI スレッド ──
    // await が「続きは元の場所で」と覚えていて、Dispatcher に積んでくれた
    ResultText.Text = text;
    LoadButton.IsEnabled = true;
}`,
        },
        {
          type: 'p',
          text: '仕組みはこうだ。WPF は UI スレッドに `DispatcherSynchronizationContext` という [[sync-context]] を設定している。`await` は、待ち始めるときに現在の SynchronizationContext を覚えておき、待っていた処理が終わると、**続きのコードをそこへ投稿する**。WPF の場合、投稿先は Dispatcher のキュー（優先度 `Normal`）だ。つまり `await` は、「終わったら `Dispatcher.BeginInvoke` で続きを実行する」を自動でやってくれている。',
        },
        { type: 'h3', text: 'ConfigureAwait(false) を UI 層で使うべきでない理由' },
        {
          type: 'compare',
          left: {
            label: 'UI 層で ConfigureAwait(false)',
            tone: 'bad',
            lang: 'csharp',
            code: `private async void OnLoadClick(object sender, RoutedEventArgs e)
{
    string text = await LoadTextAsync()
        .ConfigureAwait(false);

    // 「元の場所に戻らなくてよい」と宣言したので、
    // ここはスレッドプールのスレッドかもしれない
    ResultText.Text = text;   // → InvalidOperationException
}`,
            points: [
              '`ConfigureAwait(false)` は「続きを元の文脈に戻さなくてよい」という指定',
              '続きで UI に触ると、別スレッドからのアクセスになり例外になる',
              '待っていた処理がたまたま完了済みだと、スレッドが変わらず動いてしまう。**「手元では動くのに、ときどき落ちる」**不具合になる',
            ],
          },
          right: {
            label: 'UI 層では何も付けない',
            tone: 'good',
            lang: 'csharp',
            code: `private async void OnLoadClick(object sender, RoutedEventArgs e)
{
    // UI 層: 続きで UI に触るので、既定のまま
    string text = await LoadTextAsync();
    ResultText.Text = text;
}

// ライブラリ層: UI に触らないので、戻る必要がない
public async Task<string> LoadTextAsync()
{
    using var reader = new StreamReader(_path);
    return await reader.ReadToEndAsync()
        .ConfigureAwait(false);
}`,
            points: [
              'イベントハンドラー、コードビハインド、UI に見えるプロパティを更新する ViewModel のメソッドは「UI 層」',
              'UI を知らないライブラリやデータアクセスの層では、`ConfigureAwait(false)` を付けると無駄な往復が減り、次の節のデッドロックも起きにくくなる',
            ],
          },
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: 'async void はイベントハンドラーだけに',
          text: '`async void` のメソッドは、呼び出し側が完了を待つことも、例外を受け取ることもできない。例外は UI スレッドの未処理例外として扱われる（第 3 章）。イベントハンドラーは `void` を返す決まりなので仕方がないが、それ以外のメソッドは必ず `async Task` にする。ハンドラーの中は `try/catch` で囲み、処理の本体は `Task` を返すメソッドに出すとよい。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: DispatcherSynchronizationContext クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.threading.dispatchersynchronizationcontext' },
            { label: '.NET Blog: ConfigureAwait FAQ（Stephen Toub）', url: 'https://devblogs.microsoft.com/dotnet/configureawait-faq/' },
            { label: 'Microsoft Learn: 非同期プログラミングのベスト プラクティス（MSDN Magazine 2013 年 3 月）', url: 'https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming' },
          ],
        },
      ],
    },
    {
      id: 'deadlock',
      title: 'デッドロックの作り方と回避',
      lead: '`async` メソッドの結果を、UI スレッドで `.Result` や `.Wait()` を使って待つ。たったこれだけで、アプリは二度と動かなくなる。仕組みを知っておけば、二度と踏まない。',
      blocks: [
        {
          type: 'figure',
          demo: 'DeadlockVideo',
          kind: 'video',
          title: '.Result によるデッドロック（42 秒）',
          caption: '上が UI スレッド、下がタイマーとスレッドプール。黄色の札は「await の続き」。最後の場面で、await に直すとなぜ解けるのかを見せる。',
        },
        {
          type: 'compare',
          left: {
            label: 'パターン 1: .Result / .Wait() で待つ',
            tone: 'bad',
            lang: 'csharp',
            code: `private void OnLoadClick(object sender, RoutedEventArgs e)
{
    // UI スレッドを止めて、完了を待つ
    string text = LoadAsync().Result;
    ResultText.Text = text;
}

private async Task<string> LoadAsync()
{
    await Task.Delay(1000);
    // ↑ の続き（次の行）は UI スレッドで実行されようとするが、
    //   UI スレッドは .Result で止まっている
    return "done";
}`,
          },
          right: {
            label: '回避: 最後まで await でつなぐ',
            tone: 'good',
            lang: 'csharp',
            code: `private async void OnLoadClick(object sender, RoutedEventArgs e)
{
    LoadButton.IsEnabled = false;
    try
    {
        // UI スレッドは待たずにループへ戻る
        ResultText.Text = await LoadAsync();
    }
    catch (Exception ex)
    {
        ResultText.Text = $"失敗しました: {ex.Message}";
    }
    finally
    {
        LoadButton.IsEnabled = true;
    }
}`,
          },
        },
        {
          type: 'compare',
          left: {
            label: 'パターン 2: Wait() と Dispatcher.Invoke の組み合わせ',
            tone: 'bad',
            lang: 'csharp',
            code: `private void OnStartClick(object sender, RoutedEventArgs e)
{
    Task work = Task.Run(() =>
    {
        // ワーカーから UI スレッドへ「同期的に」依頼する。
        // UI スレッドが処理してくれるまで、ここで待つ
        Dispatcher.Invoke(() => StatusText.Text = "処理中…");
        DoHeavyWork();
    });

    // UI スレッドは work の完了を待つ → お互いに待ち続ける
    work.Wait();
}`,
          },
          right: {
            label: '回避: 待たない + IProgress<T> で進捗を届ける',
            tone: 'good',
            lang: 'csharp',
            code: `private async void OnStartClick(object sender, RoutedEventArgs e)
{
    StatusText.Text = "処理中…";

    // Progress<T> は、作られたスレッド（UI スレッド）へ Report を届けてくれる
    var progress = new Progress<int>(p => Bar.Value = p);

    await Task.Run(() => DoHeavyWork(progress));

    StatusText.Text = "完了";
}

private static void DoHeavyWork(IProgress<int> progress)
{
    for (int i = 1; i <= 100; i++)
    {
        Thread.Sleep(30);        // 重い計算のつもり
        progress.Report(i);      // Dispatcher を直接触らない
    }
}`,
          },
        },
        {
          type: 'table',
          caption: 'デッドロックを避ける 4 つの原則',
          head: ['原則', '具体的には'],
          rows: [
            ['UI スレッドで `Task` を同期的に待たない', '`.Result`、`.Wait()`、`.GetAwaiter().GetResult()` を UI スレッドで呼ばない'],
            ['最初から最後まで `async` でつなぐ', 'イベントハンドラーを `async void` にし、そこから `await` を連鎖させる'],
            ['ワーカーから UI へは「待たない」依頼にする', '`Invoke` ではなく `InvokeAsync`、または `IProgress<T>`'],
            ['コンストラクターで非同期処理を待たない', '初期化は `Loaded` イベントや、明示的な `InitializeAsync()` メソッドで行う'],
          ],
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'ConfigureAwait(false) で解ける理由と、それに頼らない理由',
          text: 'パターン 1 は、`LoadAsync` の中の `await` に `ConfigureAwait(false)` を付けると解ける。続きが UI スレッドを必要としなくなるからだ。ただし、呼び出している経路のすべての `await` に付いていなければならず、1 つでも漏れると再発する。ライブラリ側の作法としては有効だが、**呼び出し側が「同期的に待たない」ことが根本の対策**だ。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: 非同期プログラミングのベスト プラクティス（デッドロックの解説）', url: 'https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming' },
            { label: 'Microsoft Learn: Progress<T> クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.progress-1' },
          ],
        },
      ],
    },
    {
      id: 'collections',
      title: '別スレッドからのコレクション更新',
      lead: 'ログの表示や受信データの一覧のように、別スレッドで届いたデータをリストに追加したい場面は多い。`ObservableCollection` をそのまま別スレッドから触ると、例外になる。',
      blocks: [
        {
          type: 'p',
          text: '発生するのは `NotSupportedException`（「この型の CollectionView は、Dispatcher スレッドとは異なるスレッドからその SourceCollection への変更をサポートしません」）だ。対処は 2 つある。',
        },
        {
          type: 'compare',
          left: {
            label: '方法 A: UI スレッドに戻ってから追加する',
            tone: 'good',
            lang: 'csharp',
            code: `public class LogViewModel
{
    public ObservableCollection<string> Lines { get; } = new();

    // UI スレッドから呼ぶ
    public async Task StartAsync(CancellationToken token)
    {
        while (!token.IsCancellationRequested)
        {
            // 受信は別スレッドで待つ
            string line = await Task.Run(ReadNextLine, token);

            // await の続きは UI スレッドなので、そのまま追加できる
            Lines.Add(line);
        }
    }

    private static string ReadNextLine()
    {
        Thread.Sleep(200);   // 受信待ちのつもり
        return DateTime.Now.ToString("HH:mm:ss.fff");
    }
}`,
            points: ['いちばん単純で、WPF 固有の API に依存しない', '追加が非常に高頻度だと、UI スレッドへの往復がボトルネックになる'],
          },
          right: {
            label: '方法 B: EnableCollectionSynchronization',
            tone: 'good',
            lang: 'csharp',
            code: `public class LogViewModel
{
    private readonly object _lock = new();

    public ObservableCollection<string> Lines { get; } = new();

    public LogViewModel()
    {
        // UI スレッドで 1 回呼ぶ。以後 WPF は、
        // コレクションを読むときにこのロックを取るようになる
        BindingOperations.EnableCollectionSynchronization(Lines, _lock);
    }

    // どのスレッドから呼んでもよい
    public void Append(string line)
    {
        lock (_lock)   // 変更する側も、必ず同じロックを取る
        {
            Lines.Add(line);
        }
    }
}`,
            points: ['.NET Framework 4.5 で追加された仕組み', '「WPF が読むとき」と「自分が書くとき」を同じロックで守る約束', '自分のコードがロックを取り忘れると、まれに壊れる不具合になる'],
          },
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '高頻度の更新は、まとめてから渡す',
          text: '毎秒何千件も届くデータを 1 件ずつ `Add` すると、どちらの方法でも UI が追いつかない。別スレッド側でバッファーに溜め、`DispatcherTimer` などで 100 ミリ秒ごとにまとめて追加する形にすると、画面は滑らかなまま保てる。表示件数に上限を設け、古い行を捨てることも忘れずに。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: BindingOperations.EnableCollectionSynchronization', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.data.bindingoperations.enablecollectionsynchronization' },
            { label: "Microsoft Learn: What's new in WPF version 4.5（非 UI スレッドでのコレクションへのアクセス）", url: 'https://learn.microsoft.com/en-us/dotnet/framework/wpf/getting-started/whats-new' },
          ],
        },
      ],
    },
    {
      id: 'freezable',
      title: 'Freezable と Freeze()',
      lead: 'ブラシ、ペン、ジオメトリ、ビットマップ。これらは [[freezable]] という種類のオブジェクトで、「凍結」すると 2 つの良いことが起きる。',
      blocks: [
        {
          type: 'table',
          caption: '凍結の効果',
          head: ['', '凍結前', '凍結後（`Freeze()`）'],
          rows: [
            ['変更', 'できる。変更すると、使っている要素が自動で再描画される', 'できない（変更しようとすると例外）'],
            ['スレッド', '作ったスレッドからしか触れない', '**どのスレッドからでも触れる**'],
            ['コスト', '変更を監視する仕組みを持つ', '監視が不要になり、軽くなる。同じものを共有しやすい'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: '画像を別スレッドで読み込み、凍結して UI スレッドへ渡す',
          excerpt: true,
          code: `private static BitmapSource LoadThumbnail(string path)
{
    var image = new BitmapImage();
    image.BeginInit();
    image.UriSource = new Uri(path);
    image.DecodePixelWidth = 200;                  // 表示サイズに縮小してデコード（メモリの節約）
    image.CacheOption = BitmapCacheOption.OnLoad;  // この場で読み切る（ファイルを掴み続けない）
    image.EndInit();

    image.Freeze();                                // 凍結 → ほかのスレッドへ渡せるようになる
    return image;
}

private async void OnOpenClick(object sender, RoutedEventArgs e)
{
    // デコードはスレッドプールで行い、結果だけを UI スレッドで受け取る
    Thumbnail.Source = await Task.Run(() => LoadThumbnail(_path));
}`,
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '凍結し忘れると',
          text: '上のコードから `image.Freeze()` を消すと、`Thumbnail.Source = …` の行で「呼び出しスレッドは、異なるスレッドがこのオブジェクトを所有しているため…」の例外になる。画像は別スレッドで作られ、そのスレッドに所属したままだからだ。',
        },
        {
          type: 'code',
          lang: 'csharp',
          title: '自分で作ったブラシを凍結する',
          excerpt: true,
          code: `var brush = new SolidColorBrush(Color.FromRgb(0x52, 0x35, 0xC9));
if (brush.CanFreeze)
{
    brush.Freeze();
}

// 凍結済みかどうかは IsFrozen でわかる。Brushes.Red などの既定のブラシは最初から凍結済み。
// 凍結したものを変更したくなったら、Clone() で変更可能なコピーを作る
SolidColorBrush editable = brush.Clone();
editable.Opacity = 0.5;`,
        },
        {
          type: 'callout',
          kind: 'tip',
          title: 'XAML のリソースを凍結する',
          text: '`xmlns:po="http://schemas.microsoft.com/winfx/2006/xaml/presentation/options"` を宣言し、`<SolidColorBrush x:Key="AccentBrush" Color="#5235C9" po:Freeze="True" />` と書くと、リソースを凍結した状態で定義できる。大量の要素から参照されるブラシでは、メモリと描画の負荷が下がる（第 7 章）。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: Freezable オブジェクトの概要', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/freezable-objects-overview' },
            { label: 'Microsoft Learn: BitmapImage クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.media.imaging.bitmapimage' },
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: 'd1',
      q: '`Task.Run` の中（ワーカースレッド）から `StatusText.Text = "完了";` と書くと、どうなるか。',
      choices: [
        '問題なく表示が変わる',
        '`InvalidOperationException` が発生する',
        '値は変わるが、画面には反映されない',
        'コンパイルエラーになる',
      ],
      answer: 1,
      explain: 'UI 要素（`DispatcherObject`）は、作られたスレッドからしか触れない。別スレッドからのアクセスは実行時に検査され、例外になる。`Dispatcher.InvokeAsync` で UI スレッドに依頼するか、`await` のあと（UI スレッドに戻ってから）で触る。',
    },
    {
      id: 'd2',
      q: 'Dispatcher のキューに、Background → Render → Normal の順で 3 つの作業を積んだ。実行される順番はどれか。',
      choices: ['Background → Render → Normal（積んだ順）', 'Normal → Render → Background', 'Render → Normal → Background', '同時に実行される'],
      answer: 1,
      explain: '優先度の値が大きいものから実行される（Normal = 9、Render = 7、Background = 4）。同じ優先度の中では、先に積んだものが先。そして一度に実行されるのは 1 件だけ。',
    },
    {
      id: 'd3',
      q: '`Dispatcher.Invoke` と `Dispatcher.InvokeAsync` の違いとして正しいものはどれか。',
      choices: [
        '`Invoke` は別スレッドで実行し、`InvokeAsync` は UI スレッドで実行する',
        '`Invoke` は処理が終わるまで呼び出し側を待たせ、`InvokeAsync` は待たせない',
        '`InvokeAsync` は .NET 8 以降でしか使えない',
        '違いはない',
      ],
      answer: 1,
      explain: 'どちらも UI スレッドで実行するが、`Invoke` は同期（終わるまで待つ）、`InvokeAsync` は非同期（積んだら戻る。必要なら `await` で待てる）。同期で待つ `Invoke` は、UI スレッド側が自分を待っているとデッドロックする。',
    },
    {
      id: 'd4',
      q: '次のコードをボタンのクリックで実行すると、どうなるか。',
      code: {
        lang: 'csharp',
        code: `private void OnClick(object sender, RoutedEventArgs e)
{
    ResultText.Text = GetTextAsync().Result;
}

private async Task<string> GetTextAsync()
{
    await Task.Delay(1000);
    return "done";
}`,
      },
      choices: ['1 秒後に "done" と表示される', '画面が固まったまま、二度と応答しなくなる', 'すぐに空文字が表示される', '`InvalidOperationException` が発生する'],
      answer: 1,
      explain: '`.Result` が UI スレッドを止める。`await Task.Delay` の続き（`return "done"`）は UI スレッドで実行されようとするが、UI スレッドは `.Result` で待っているので実行できない。お互いを待つデッドロックになる。ハンドラーを `async void` にして `await GetTextAsync()` と書けば解決する。',
    },
    {
      id: 'd5',
      q: 'イベントハンドラーの中で `await SomethingAsync().ConfigureAwait(false);` と書いた。その次の行で UI 要素に触るとき、何が問題になるか。',
      choices: [
        '何も問題はない',
        '続きが UI スレッドで実行される保証がなくなり、例外になることがある',
        '必ずデッドロックする',
        '`await` が無視され、同期的に実行される',
      ],
      answer: 1,
      explain: '`ConfigureAwait(false)` は「続きを元の文脈（UI スレッド）に戻さなくてよい」という指定。続きはスレッドプールで実行されうるので、UI に触ると例外になる。待っていた処理が完了済みだとスレッドが変わらないため、再現したりしなかったりする厄介な不具合になる。',
    },
    {
      id: 'd6',
      q: '別スレッドで `BitmapImage` を作り、UI スレッドの `Image.Source` に設定したい。必要な手順はどれか。',
      choices: ['何もしなくてよい', '作った `BitmapImage` に対して `Freeze()` を呼んでから渡す', '`Dispatcher.Invoke` で `BitmapImage` を複製する', '`ConfigureAwait(false)` を付ける'],
      answer: 1,
      explain: '`BitmapImage` は `Freezable` で、凍結するとスレッドに縛られなくなる。凍結せずに別スレッドから渡すと、「異なるスレッドがこのオブジェクトを所有している」という例外になる。',
    },
    {
      id: 'd7',
      q: '`DispatcherTimer` の `Tick` イベントについて正しい説明はどれか。',
      choices: [
        'スレッドプールのスレッドで呼ばれるので、UI に触るには Dispatcher が必要',
        'UI スレッドで呼ばれるので UI を直接触れるが、重い処理を書くと画面が固まる',
        '指定した間隔ちょうどに、必ず正確に呼ばれる',
        'ウィンドウを閉じると自動的に止まり、解放される',
      ],
      answer: 1,
      explain: '`DispatcherTimer` は Dispatcher のキュー経由で UI スレッド上で呼ばれる。UI を直接触れる反面、ハンドラーが重いと UI が止まる。呼ばれるのは「指定時間以降で順番が来たとき」で、正確さは保証されない。動かしたままだと解放されないので、不要になったら `Stop()` する。',
    },
  ],
  exercises: [
    {
      id: 'ex-disp-async',
      title: 'デッドロックするコードを直す',
      lang: 'csharp',
      level: 2,
      prompt:
        '次のハンドラーは、押した瞬間に画面が固まって二度と戻らない。**`.Result` を使わず、`await` で待つ形**に書き直そう。処理中はボタンを無効にし、例外が起きても必ず有効に戻すこと（`try` / `finally`）。',
      starter: `private void OnSearchClick(object sender, RoutedEventArgs e)
{
    SearchButton.IsEnabled = false;

    var items = _service.SearchAsync(QueryBox.Text).Result;
    ResultList.ItemsSource = items;

    SearchButton.IsEnabled = true;
}`,
      solution: `private async void OnSearchClick(object sender, RoutedEventArgs e)
{
    SearchButton.IsEnabled = false;
    try
    {
        var items = await _service.SearchAsync(QueryBox.Text);
        ResultList.ItemsSource = items;
    }
    finally
    {
        SearchButton.IsEnabled = true;
    }
}`,
      solutionNote:
        'イベントハンドラーは `async void` にしてよい唯一の場所。`await` の続きは UI スレッドで実行されるので、`ResultList` にそのまま触れる。実際には `catch` で利用者にエラーを伝える処理も入れる。',
      hints: ['メソッドの宣言を `private async void` にする。', '`.Result` を消して、呼び出しの前に `await` を付ける。', 'ボタンを有効に戻す行を `finally` ブロックに入れる。'],
      checks: [
        { label: 'ハンドラーが async void になっている', test: (c) => c.has(/private\s+async\s+void\s+OnSearchClick\s*\(/) },
        { label: 'SearchAsync の結果を await で待っている', test: (c) => c.has(/await\s+_service\.SearchAsync\s*\(/) },
        { label: '.Result / .Wait() / GetResult() を使っていない', test: (c) => !c.has(/\.Result\b|\.Wait\s*\(|GetResult\s*\(/) },
        { label: 'ConfigureAwait(false) を付けていない（続きで UI に触るため）', test: (c) => !c.has(/ConfigureAwait\s*\(\s*false\s*\)/) },
        { label: 'try / finally で、ボタンを必ず有効に戻している', test: (c) => c.has(/try\s*\{[\s\S]*\}\s*(catch[\s\S]*\})?\s*finally\s*\{[^}]*SearchButton\.IsEnabled\s*=\s*true/) },
      ],
    },
    {
      id: 'ex-disp-progress',
      title: '別スレッドの進捗を UI に届ける',
      lang: 'csharp',
      level: 3,
      prompt:
        '重い処理 `Convert(IProgress<int> progress)` を **`Task.Run` でスレッドプールに逃がし**、進捗を `ProgressBar`（名前は `Bar`）に表示しよう。進捗の受け渡しには **`Progress<int>`** を使い、`Dispatcher.Invoke` は使わないこと。',
      starter: `private void OnConvertClick(object sender, RoutedEventArgs e)
{
    // このままだと UI スレッドで実行され、画面が固まる
    Convert(null);
    StatusText.Text = "完了";
}

private static void Convert(IProgress<int>? progress)
{
    for (int i = 1; i <= 100; i++)
    {
        Thread.Sleep(30);
        progress?.Report(i);
    }
}`,
      solution: `private async void OnConvertClick(object sender, RoutedEventArgs e)
{
    // UI スレッドで作る。Report された値は、このスレッドに届けられる
    var progress = new Progress<int>(percent => Bar.Value = percent);

    await Task.Run(() => Convert(progress));

    StatusText.Text = "完了";
}

private static void Convert(IProgress<int>? progress)
{
    for (int i = 1; i <= 100; i++)
    {
        Thread.Sleep(30);
        progress?.Report(i);
    }
}`,
      solutionNote:
        '`Progress<T>` は、生成されたときの SynchronizationContext を覚えている。UI スレッドで `new` すれば、ワーカーからの `Report` が UI スレッドで実行される。`Convert` 側は UI のことを何も知らずに済む。',
      hints: ['`new Progress<int>(p => Bar.Value = p)` を、`Task.Run` の**外**（UI スレッド）で作る。', '`await Task.Run(() => Convert(progress));`', 'ハンドラーは `async void` にする。'],
      checks: [
        { label: 'ハンドラーが async void になっている', test: (c) => c.has(/private\s+async\s+void\s+OnConvertClick\s*\(/) },
        { label: 'Progress<int> を作り、Bar.Value を更新している', test: (c) => c.has(/new\s+Progress<int>\s*\([^;]*Bar\.Value\s*=/) },
        { label: 'Convert を Task.Run で実行し、await で待っている', test: (c) => c.has(/await\s+Task\.Run\s*\(\s*\(\s*\)\s*=>\s*\{?\s*Convert\s*\(/) },
        { label: 'Convert に progress を渡している（null ではない）', test: (c) => c.has(/Task\.Run\s*\([^;]*Convert\s*\(\s*(?!null)\w+\s*\)/) },
        { label: 'Dispatcher.Invoke を使っていない', test: (c) => !c.has(/Dispatcher\s*\.\s*(Invoke|BeginInvoke)\b/) },
      ],
    },
  ],
}

export default chapter
