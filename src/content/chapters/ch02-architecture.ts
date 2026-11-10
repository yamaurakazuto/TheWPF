import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'
import { a } from '@/lib/exercise'

const chapter: Chapter = {
  ...metaOf('architecture'),
  goals: [
    'WPF の描画が「UI スレッド」と「レンダースレッド」の 2 本立てで動くことを説明できる',
    '論理ツリーとビジュアルツリーの違いと、それぞれが何に使われるかがわかる',
    '依存関係プロパティの値が、どの供給元から決まるか（優先順位）を追える',
    'ルーティングイベントのトンネル / バブルと、`Handled` の意味がわかる',
    'Measure → Arrange → Render の流れと、DIP による解像度非依存の考え方がわかる',
  ],
  sections: [
    {
      id: 'layers',
      title: '全体像 — WPF を構成する層',
      lead: 'WPF は 1 つの巨大な部品ではなく、役割の違う層の重なりでできている。上の 3 つは .NET のコード（マネージド）、その下に描画専用のネイティブ部品がある。',
      blocks: [
        {
          type: 'figure',
          demo: 'ArchitectureLayers',
          kind: 'figure',
          title: 'WPF の層構造',
          caption: '層にカーソルを合わせる（またはタップ / Tab で選ぶ）と役割が出る。開発者が普段触るのは PresentationFramework で、下の層はその土台。',
        },
        {
          type: 'p',
          text: 'ポイントは、**コントロールの見た目を OS に描かせていない**ことだ。User32 から借りているのは「ウィンドウという枠」と「入力の通知」だけで、枠の中身はすべて WPF が DirectX で描く。第 1 章で触れた「ボタンは WPF が描いた絵」という話は、この構造から来ている。',
        },
        {
          type: 'sources',
          items: [{ label: 'Microsoft Learn: WPF アーキテクチャ', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/wpf-architecture' }],
        },
      ],
    },
    {
      id: 'rendering',
      title: '描画の仕組み — retained mode と 2 つのスレッド',
      lead: 'WPF では「画面を描くコード」を自分で書くことはほとんどない。描きたい内容を伝えると、フレームワークがそれを覚えておき、必要なときに描いてくれる。',
      blocks: [
        {
          type: 'figure',
          demo: 'RenderPipelineVideo',
          kind: 'video',
          title: '1 フレームができるまで（60 秒）',
          caption: '赤い丸が「ボタンの背景を赤にする」という 1 つの変更。UI スレッドで記録され、レンダースレッドへ渡り、画面に出るまでを追う。',
        },
        {
          type: 'table',
          caption: '2 つの描画モデル',
          head: ['', 'immediate mode（即時モード）', 'retained mode（保持モード）'],
          rows: [
            ['代表例', 'GDI、WinForms の `OnPaint`', 'WPF'],
            ['アプリの役割', '「描け」と言われるたびに、自分で全部描く', '「何を描くか」を一度伝える。変わったところだけ更新する'],
            ['再描画', 'ウィンドウが隠れて現れるたびにアプリのコードが走る', 'フレームワークが保持した内容から描き直す。アプリは関与しない'],
            ['得意なこと', '単純で、メモリが少なくて済む', '拡大縮小・変形・アニメーション・重ね合わせ'],
            ['代償', '複雑な UI ほど描画コードが増える', '描画内容を保持する分のメモリを使う'],
          ],
        },
        {
          type: 'p',
          text: 'UI スレッドが持つ「描く内容の木」と、[[render-thread]]が持つそのコピー（合成ツリー）は別物で、両者はスレッド間の通信で同期される。この分離のおかげで、描画そのものは GPU に任せて滑らかに行える。',
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '「レンダースレッドが別なら、UI スレッドは塞いでも平気」ではない',
          text: 'アニメーションの進行も、入力への反応も、レイアウトも、すべて UI スレッドの仕事だ。UI スレッドで 2 秒かかる処理をすれば、画面は 2 秒固まる。重い処理を UI スレッドから追い出す方法は第 5 章で扱う。',
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'GPU が使えないとき',
          text: 'リモートデスクトップや仮想マシンなど GPU を使えない環境では、WPF はソフトウェア描画に切り替わる。動きはするが、エフェクトやアニメーションの多い画面は重くなる。実行時に `RenderCapability.Tier` を調べると、どの水準で描画されているかを確認できる。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: WPF アーキテクチャ（Visual と合成）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/wpf-architecture' },
            { label: 'Microsoft Learn: WPF グラフィックス レンダリングの概要', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/wpf-graphics-rendering-overview' },
            { label: 'Microsoft Learn: グラフィックスの描画層（RenderCapability.Tier）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/graphics-rendering-tiers' },
          ],
        },
      ],
    },
    {
      id: 'trees',
      title: '論理ツリーとビジュアルツリー',
      lead: 'WPF の要素は木構造になっている。ただし木は 1 本ではない。XAML に書いたとおりの木と、テンプレートが展開されたあとの木の 2 本がある。',
      blocks: [
        {
          type: 'figure',
          demo: 'TreeViewer',
          kind: 'demo',
          title: '同じ XAML を 2 つのツリーで見る',
          caption: 'ノードにカーソルを合わせると、もう一方のツリーの対応するノードが強調される。ビジュアルツリーは既定テーマ（Aero2）の場合の例。',
        },
        {
          type: 'p',
          text: 'XAML に書いた要素は 4 つなのに、ビジュアルツリーには 11 個の要素がある。増えた分は、`Window` と `Button` の [[control-template]]（見た目の定義）が展開されたものだ。**コントロールとは「動作」であり、見た目はテンプレートが作る別の要素群**だということが、この図からわかる。',
        },
        {
          type: 'table',
          caption: 'どちらのツリーが何に使われるか',
          head: ['仕組み', '主に使うツリー', '補足'],
          rows: [
            ['リソースの検索（`StaticResource` など）', '論理ツリー', '親をたどって `Resources` を探す'],
            ['プロパティ値の継承（`FontSize`、`DataContext`）', '論理ツリー', '論理的な親がないときはビジュアルの親も使う'],
            ['描画・ヒットテスト（どこがクリックされたか）', 'ビジュアルツリー', '実際に描かれた要素で判定する'],
            ['[[routed-event]] の経路', '両方', 'ビジュアルの親をたどり、なければ論理の親をたどる'],
            ['`ElementName` バインディング', '名前スコープ', 'ツリーではなく、XAML ファイル単位の名前の登録簿を引く'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'TreeExtensions.cs — ビジュアルツリーの子孫を列挙する',
          code: `using System.Collections.Generic;
using System.Windows;
using System.Windows.Media;

public static class TreeExtensions
{
    /// <summary>ビジュアルツリーの子孫を深さ優先で列挙する。</summary>
    /// <remarks>root は Visual（または Visual3D）であること。</remarks>
    public static IEnumerable<DependencyObject> VisualDescendants(this DependencyObject root)
    {
        int count = VisualTreeHelper.GetChildrenCount(root);
        for (int i = 0; i < count; i++)
        {
            DependencyObject child = VisualTreeHelper.GetChild(root, i);
            yield return child;

            foreach (DependencyObject descendant in child.VisualDescendants())
            {
                yield return descendant;
            }
        }
    }
}`,
        },
        {
          type: 'callout',
          kind: 'tip',
          title: '実物を見るのがいちばん早い',
          text: 'Visual Studio でデバッグ実行中に「ライブ ビジュアル ツリー」を開くと、いま動いているアプリのビジュアルツリーをそのまま見られる（第 7 章）。「なぜここに余白があるのか」「このボタンの中身は何でできているのか」は、ほとんどこれで解決する。',
        },
        {
          type: 'sources',
          items: [{ label: 'Microsoft Learn: WPF のツリー', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/trees-in-wpf' }],
        },
      ],
    },
    {
      id: 'dependency-property',
      title: '依存関係プロパティ',
      lead: '`Button.Width` も `TextBlock.Text` も、見た目は普通のプロパティだが、中身は WPF 独自の仕組みで管理されている。これがバインディング・スタイル・アニメーションを可能にしている。',
      blocks: [
        {
          type: 'p',
          text: '普通の C# のプロパティは、値をフィールドに 1 つ持つだけだ。[[dp]] は違い、**値を「誰が設定したか」ごとに管理し、その中でいちばん優先度の高いものを現在の値として返す**。スタイルが決めた色を、マウスが乗っている間だけトリガーが上書きし、マウスが離れたら元に戻る、という動きは、この仕組みがあるから書かずに済む。',
        },
        {
          type: 'figure',
          demo: 'DpPrecedence',
          kind: 'demo',
          title: '値の優先順位を確かめる',
          caption: 'チェックを切り替えて、どの供給元の値が採用されるかを見る。「例を試す」のボタンで典型的な状況を再現できる。',
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: 'ローカル値を書くと、スタイルのトリガーが効かなくなる',
          text: '`<Button Background="Red">` のように要素へ直接書いた値（ローカル値）は、スタイルの Setter にもトリガーにも勝つ。「ホバーで色が変わるはずなのに変わらない」ときは、まずその要素に直接値を書いていないかを疑う。既定の値はローカル値ではなく、**スタイルの Setter** に書くのが正しい。',
        },
        { type: 'h3', text: '定義のしかた' },
        {
          type: 'code',
          lang: 'csharp',
          title: 'RatingControl.cs — 依存関係プロパティの定義',
          highlight: [9, 10, 22, 23, 24, 25, 26],
          code: `using System;
using System.Windows;
using System.Windows.Controls;

public class RatingControl : Control
{
    // ① プロパティを「登録」する。フィールド名は「プロパティ名 + Property」にする決まり
    public static readonly DependencyProperty ValueProperty =
        DependencyProperty.Register(
            nameof(Value),                 // プロパティ名
            typeof(int),                   // 値の型
            typeof(RatingControl),         // 所有するクラス
            new FrameworkPropertyMetadata(
                0,                                                   // 既定値
                FrameworkPropertyMetadataOptions.AffectsRender       // 変わったら描き直す
                | FrameworkPropertyMetadataOptions.BindsTwoWayByDefault,
                OnValueChanged,                                      // 変更通知
                CoerceRating));                                      // 値の補正

    // ② 普通のプロパティに見せるための包み（CLR ラッパー）。
    //    ここには GetValue / SetValue 以外のコードを書かない
    public int Value
    {
        get => (int)GetValue(ValueProperty);
        set => SetValue(ValueProperty, value);
    }

    private static void OnValueChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        var control = (RatingControl)d;
        // e.OldValue / e.NewValue で変更前後の値がわかる。
        // 値が変わったときの処理は、ラッパーではなくここに書く
        control.ToolTip = $"評価: {e.NewValue}";
    }

    private static object CoerceRating(DependencyObject d, object baseValue)
        => Math.Clamp((int)baseValue, 0, 5);   // 0〜5 に収める
}`,
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: 'ラッパーにロジックを書いてはいけない理由',
          text: 'XAML やバインディング、スタイル、アニメーションは、ラッパーのプロパティを通らずに `SetValue` を直接呼ぶ。つまり `set { ... }` の中に検証や通知を書いても、**XAML から設定されたときには実行されない**。変更時の処理は必ずコールバック（`PropertyChangedCallback`）に書く。',
        },
        { type: 'h3', text: 'プロパティ値の継承' },
        {
          type: 'p',
          text: '`Window` に `FontSize="16"` と書くと、中の `TextBlock` も `Button` も 16 になる。これは優先順位の 10 番目「継承」によるもので、親の値がツリーを伝って子に届く。すべてのプロパティが継承されるわけではなく、`FontSize`、`FontFamily`、`Foreground`、`DataContext`、`FlowDirection` など、登録時に「継承する」と指定されたものだけが対象になる。',
        },
        { type: 'h3', text: '添付プロパティ' },
        {
          type: 'p',
          text: '`<Button Grid.Row="1" />` の `Grid.Row` は、`Button` のプロパティではない。`Grid` が定義し、他の要素に「貼り付ける」ことができる[[attached]]だ。値は貼り付けられた側（`Button`）に保存され、読むのは定義した側（`Grid`）という分担になっている。',
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'Watermark.cs — 添付プロパティの定義',
          code: `using System.Windows;

public static class Watermark
{
    public static readonly DependencyProperty TextProperty =
        DependencyProperty.RegisterAttached(
            "Text",
            typeof(string),
            typeof(Watermark),
            new PropertyMetadata(string.Empty));

    // 添付プロパティのアクセサーは「Get + 名前」「Set + 名前」の静的メソッドにする決まり。
    // XAML パーサーはこの名前を頼りに <TextBox local:Watermark.Text="..."/> を解釈する
    public static string GetText(DependencyObject obj) => (string)obj.GetValue(TextProperty);

    public static void SetText(DependencyObject obj, string value) => obj.SetValue(TextProperty, value);
}`,
        },
        {
          type: 'code',
          lang: 'xaml',
          title: '使う側',
          excerpt: true,
          code: `<!-- xmlns:local="clr-namespace:MyApp" を宣言済みとする -->
<TextBox local:Watermark.Text="キーワードで検索" />`,
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: 依存関係プロパティの概要', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/properties/dependency-properties-overview' },
            { label: 'Microsoft Learn: 依存関係プロパティ値の優先順位', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/properties/dependency-property-value-precedence' },
            { label: 'Microsoft Learn: プロパティ値の継承', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/properties/property-value-inheritance' },
            { label: 'Microsoft Learn: 添付プロパティの概要', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/properties/attached-properties-overview' },
          ],
        },
      ],
    },
    {
      id: 'routed-events',
      title: 'ルーティングイベント',
      lead: 'ボタンの中の文字をクリックしたとき、「クリックされた」のは文字か、ボタンか、それを含むパネルか。WPF の答えは「全部に順番に知らせる」だ。',
      blocks: [
        {
          type: 'figure',
          demo: 'RoutedEventDemo',
          kind: 'demo',
          title: 'トンネルとバブルの伝播',
          caption: '入れ子の箱は要素の親子関係を表す。どこかを押すと、まず Preview イベントが外から内へ、続いて通常のイベントが内から外へ伝わる。',
        },
        {
          type: 'table',
          caption: 'ルーティングの 3 方式',
          head: ['方式', '向き', 'イベント名の例', '使いどころ'],
          rows: [
            ['[[tunneling]]', 'ルート → 発生元', '`PreviewMouseDown`、`PreviewKeyDown`、`PreviewTextInput`', '子が処理する前に、親が先回りして止める / 加工する'],
            ['[[bubbling]]', '発生元 → ルート', '`MouseDown`、`KeyDown`、`Click`', '子で起きたことを、親でまとめて受ける'],
            ['Direct（直接）', '発生元のみ', '`MouseEnter`、`Loaded`', '伝播しない。普通の .NET イベントに近い'],
          ],
        },
        {
          type: 'p',
          text: '入力イベントの多くは、`Preview〜`（トンネル）と通常版（バブル）の**ペア**になっている。2 つは同じイベントデータを共有しているので、トンネル側で `e.Handled = true` にすると、バブル側のハンドラーも呼ばれなくなる。上のデモで「Grid の PreviewMouseDown で Handled」を選ぶと、それ以降がすべて止まるのはこのためだ。',
        },
        {
          type: 'code',
          lang: 'xaml',
          title: '親でまとめて受ける（XAML）',
          excerpt: true,
          code: `<!-- 個々の Button ではなく、親の StackPanel に 1 つだけハンドラーを付ける -->
<StackPanel ButtonBase.Click="OnAnyButtonClick">
    <Button Content="保存" Tag="save" />
    <Button Content="複製" Tag="copy" />
    <Button Content="削除" Tag="delete" />
</StackPanel>`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: '親でまとめて受ける（コードビハインド）',
          excerpt: true,
          code: `private void OnAnyButtonClick(object sender, RoutedEventArgs e)
{
    // sender           : ハンドラーを付けた要素（ここでは StackPanel）
    // e.Source         : イベントを発生させた要素（押された Button）
    // e.OriginalSource : 最初の発生元。MouseDown などの入力イベントでは、
    //                    ボタンの中の TextBlock などテンプレート内部の要素になることがある
    if (e.Source is Button { Tag: string action })
    {
        StatusText.Text = $"{action} が押されました";
    }
}`,
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'Button の MouseLeftButtonDown が親に届かない理由',
          text: '`Button` は自分の中でマウスの押下を処理して `Handled = true` にし、代わりに `Click` という別のバブルイベントを発生させる。そのため、親で `MouseLeftButtonDown` を待っていてもボタン上のクリックは届かない。親で受けたいなら `Click` を使うか、トンネル側の `PreviewMouseLeftButtonDown` を使う。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: ルーティングイベントの概要', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/events/routed-events-overview' },
            { label: 'Microsoft Learn: Preview イベント', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/events/preview-events' },
            { label: 'Microsoft Learn: ルーティングイベントを処理済みとしてマークする', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/events/marking-routed-events-as-handled-and-class-handling' },
          ],
        },
      ],
    },
    {
      id: 'layout',
      title: 'レイアウトパス — Measure → Arrange → Render',
      lead: '「この要素はどこに、どの大きさで置かれるのか」は、親と子の 2 往復の対話で決まる。',
      blocks: [
        {
          type: 'figure',
          demo: 'LayoutPassDemo',
          kind: 'demo',
          title: 'レイアウトをステップ実行する',
          caption: '「次へ」で 1 手ずつ進む。破線は親から与えられた枠、実線は要素が実際に使う大きさ。',
        },
        {
          type: 'steps',
          items: [
            { title: 'Measure（測定）', text: '親が子に「これだけ使ってよい」と伝え、子が「これだけ欲しい」（`DesiredSize`）と答える。木の上から下へ、再帰的に行われる。' },
            { title: 'Arrange（配置）', text: '親が子に最終的な枠（位置と大きさ）を与える。子はその枠の中で、`HorizontalAlignment` などに従って自分の実際の大きさを決める。' },
            { title: 'Render（描画）', text: '大きさが決まった要素が、描画命令を記録する。記録された内容がレンダースレッドへ送られる。' },
          ],
        },
        {
          type: 'p',
          text: 'この対話のルールを決めているのがパネルだ。`StackPanel` は「積む方向には無限に使ってよい」と子に伝え、`Grid` は行と列の定義に従って枠を配り、`Canvas` は「好きな大きさでどうぞ」と伝える。**「`StackPanel` の中の `ListBox` が延々と伸びてスクロールしない」**という定番の問題は、Measure で高さ ∞ を渡されることが原因だ（第 7 章の仮想化でもう一度出てくる）。',
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'SimpleStackPanel.cs — 最小の自作パネル',
          code: `using System;
using System.Windows;
using System.Windows.Controls;

/// <summary>子を縦に積むだけのパネル（StackPanel の簡易版）。</summary>
public class SimpleStackPanel : Panel
{
    protected override Size MeasureOverride(Size availableSize)
    {
        double width = 0;
        double height = 0;

        foreach (UIElement child in InternalChildren)
        {
            // 縦方向は「いくらでも使ってよい」と伝える
            child.Measure(new Size(availableSize.Width, double.PositiveInfinity));

            width = Math.Max(width, child.DesiredSize.Width);
            height += child.DesiredSize.Height;
        }

        return new Size(width, height);   // これが自分の DesiredSize になる
    }

    protected override Size ArrangeOverride(Size finalSize)
    {
        double y = 0;

        foreach (UIElement child in InternalChildren)
        {
            // 幅は自分の幅いっぱい、高さは子の希望どおりの枠を渡す
            child.Arrange(new Rect(0, y, finalSize.Width, child.DesiredSize.Height));
            y += child.DesiredSize.Height;
        }

        return finalSize;
    }
}`,
        },
        {
          type: 'callout',
          kind: 'tip',
          title: 'レイアウトは「必要になったとき」だけ走る',
          text: '`Width` や `Margin` のようにレイアウトに影響するプロパティを変えると、その要素は「測り直しが必要」と印が付けられ、次の描画の前にまとめて再計算される。プロパティを 10 個続けて変えても、レイアウトは 1 回しか走らない。自作コントロールで手動で印を付けるには `InvalidateMeasure()` / `InvalidateArrange()` / `InvalidateVisual()` を使う。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: レイアウト', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/layout' },
            { label: 'Microsoft Learn: パネルの概要（カスタムパネル）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/controls/panels-overview' },
          ],
        },
      ],
    },
    {
      id: 'dip',
      title: '解像度非依存（DIP）と HiDPI',
      lead: 'WPF の `Width="100"` は「100 ピクセル」ではない。「100 ÷ 96 インチ」だ。',
      blocks: [
        {
          type: 'p',
          text: 'WPF の長さの単位は [[dip]]（デバイス非依存ピクセル）で、1 DIP は 1/96 インチと定義されている。画面の表示倍率が 100%（96 DPI）なら 1 DIP = 1 物理ピクセルだが、150% なら 1.5 ピクセル、200% なら 2 ピクセルになる。描画はベクタなので、倍率が上がっても線や文字はぼやけず、単に細かく描かれる。',
        },
        {
          type: 'figure',
          demo: 'DipDemo',
          kind: 'demo',
          title: 'DIP が物理ピクセルに写る様子',
          caption: '倍率を 125% や 150% にすると、端がピクセルの途中に来てにじむ。`UseLayoutRounding` を有効にすると、端が最も近いピクセル境界に丸められる。',
        },
        {
          type: 'table',
          caption: 'にじみ対策に使うプロパティ',
          head: ['プロパティ', '効く場面', '何をするか'],
          rows: [
            ['`UseLayoutRounding`', 'レイアウト（位置と大きさ）', 'Measure / Arrange の結果を、物理ピクセルの整数境界に丸める。ルート要素に付ければ子に継承される'],
            ['`SnapsToDevicePixels`', '描画（線や枠）', '描画時に、端をピクセル境界に合わせる。こちらも継承される'],
            ['`RenderOptions.BitmapScalingMode`', '画像', '拡大縮小時の補間方法を選ぶ。くっきり重視か、滑らかさ重視か'],
            ['`TextOptions.TextFormattingMode`', '小さな文字', '`Display` にすると、文字の配置をピクセルに合わせて読みやすくする'],
          ],
        },
        { type: 'h3', text: 'モニターごとに倍率が違う環境' },
        {
          type: 'p',
          text: 'ノート PC（150%）と外部モニター（100%）をつないだ環境では、ウィンドウを移動した瞬間に倍率が変わる。.NET Framework 4.6.2 以降の WPF はこれに対応しており、アプリが「モニターごとの DPI に対応している」と宣言していれば、移動先の倍率で描き直す。宣言はアプリケーションマニフェスト（第 3 章）で行う。',
        },
        {
          type: 'code',
          lang: 'xml',
          title: 'app.manifest — モニターごとの DPI 対応を宣言する',
          excerpt: true,
          code: `<application xmlns="urn:schemas-microsoft-com:asm.v3">
  <windowsSettings>
    <!-- Windows 10 1703 以降: モニターごとの DPI（V2）。古い OS 向けに PerMonitor も併記する -->
    <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2, PerMonitor</dpiAwareness>
    <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware>
  </windowsSettings>
</application>`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: '現在の倍率を調べる / 変化を受け取る',
          excerpt: true,
          code: `// Window や UserControl の中で
DpiScale dpi = VisualTreeHelper.GetDpi(this);
double pixelsPerDip = dpi.PixelsPerDip;        // 150% なら 1.5
double physicalWidth = ActualWidth * dpi.DpiScaleX;

// 別の倍率のモニターへ移動したときに呼ばれる
protected override void OnDpiChanged(DpiScale oldDpi, DpiScale newDpi)
{
    base.OnDpiChanged(oldDpi, newDpi);
    // ビットマップを倍率別に持っている場合は、ここで差し替える
}`,
        },
        {
          type: 'sources',
          items: [
            { label: "Microsoft Learn: What's new in .NET Framework（4.6.2: Per-monitor DPI）", url: 'https://learn.microsoft.com/en-us/dotnet/framework/whats-new/' },
            { label: 'GitHub: microsoft/WPF-Samples — PerMonitorDPI', url: 'https://github.com/microsoft/WPF-Samples/tree/main/PerMonitorDPI' },
            { label: 'Microsoft Learn: Windows での高 DPI デスクトップ アプリケーション開発', url: 'https://learn.microsoft.com/en-us/windows/win32/hidpi/high-dpi-desktop-application-development-on-windows' },
            { label: 'Microsoft Learn: VisualTreeHelper.GetDpi', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.media.visualtreehelper.getdpi' },
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: 'a1',
      q: 'WPF の描画方式「retained mode（保持モード）」の説明として正しいものはどれか。',
      choices: [
        'アプリが、再描画を求められるたびに自分で全ピクセルを描く',
        'フレームワークが描画内容を保持し、必要に応じて描き直す',
        '描画結果をビットマップとしてディスクに保存しておく',
        'OS のコントロールに描画を任せる',
      ],
      answer: 1,
      explain: 'WPF は「何を描くか」をツリーとして保持する。ウィンドウが隠れて再び現れたときも、アプリのコードは呼ばれず、保持された内容から描き直される。A は immediate mode（GDI / WinForms の `OnPaint`）の説明。',
    },
    {
      id: 'a2',
      q: '`<Button Content="OK" />` と書いたとき、ビジュアルツリーにだけ現れる（論理ツリーには現れない）要素はどれか。',
      choices: ['Button 自身', 'Button のテンプレート内の Border と ContentPresenter', '"OK" という文字列', 'Button の親の StackPanel'],
      answer: 1,
      explain: 'ControlTemplate が展開されて作られる要素（Border、ContentPresenter、文字列表示用の TextBlock）はビジュアルツリーにだけ現れる。文字列 "OK" は Content として論理ツリー側に現れる。',
    },
    {
      id: 'a3',
      q: 'スタイルで `IsMouseOver` のとき背景を青にするトリガーを書いたが、あるボタンだけ色が変わらない。最も疑うべき原因はどれか。',
      code: { lang: 'xaml', code: `<Button Content="送信" Background="LightGray" />` },
      choices: [
        'トリガーはスタイルの Setter より優先度が低いから',
        '要素に直接書いた値（ローカル値）が、スタイルのトリガーより優先されるから',
        '`Background` は依存関係プロパティではないから',
        'トリガーは `Window` にしか書けないから',
      ],
      answer: 1,
      explain: '優先順位は「ローカル値 > スタイルのトリガー > スタイルの Setter」。`Background="LightGray"` と直接書くとトリガーに勝ってしまう。既定の色はスタイルの Setter に移すのが正しい。（なお、既定テンプレートのままの Button では、ホバー時の色はテンプレート側のトリガーが決めるため、別の理由でも変わらない。第 3 章で扱う。）',
    },
    {
      id: 'a4',
      q: '`PreviewKeyDown` と `KeyDown` の関係として正しいものはどれか。',
      choices: [
        '`PreviewKeyDown` はルートから発生元へ降り、その後 `KeyDown` が発生元からルートへ昇る',
        '`KeyDown` が先に発生し、その後 `PreviewKeyDown` が発生する',
        '2 つは無関係で、どちらか一方しか発生しない',
        '`PreviewKeyDown` は発生元の要素にしか届かない',
      ],
      answer: 0,
      explain: 'Preview が付くのはトンネルイベントで、先にルートから降りてくる。続いてバブルイベントが昇る。2 つはイベントデータを共有するので、Preview 側で `Handled = true` にすると `KeyDown` のハンドラーも呼ばれなくなる。',
    },
    {
      id: 'a5',
      q: 'レイアウトの Measure パスで、縦方向の `StackPanel` が子に渡す「使ってよい高さ」はどれか。',
      choices: ['自分の高さと同じ', '自分の高さを子の数で割った値', '無限大', '0'],
      answer: 2,
      explain: '`StackPanel` は積む方向に無限大を渡す。そのため中の `ListBox` などは「全項目を表示できる高さ」を希望し、スクロールも仮想化も働かなくなる。リストを置くなら `Grid` や `DockPanel` を使う。',
    },
    {
      id: 'a6',
      q: '表示倍率 150% のモニターで、`Width="200"` の要素は物理的に何ピクセルの幅になるか。',
      choices: ['133 px', '200 px', '300 px', '400 px'],
      answer: 2,
      explain: '1 DIP = 1/96 インチで、150%（144 DPI）では 1 DIP = 1.5 px。200 × 1.5 = 300 px になる。WPF の数値は物理ピクセルではなく DIP である、というのが解像度非依存の要点。',
    },
  ],
  exercises: [
    {
      id: 'ex-arch-grid',
      title: 'Grid と添付プロパティで 2×2 に配置する',
      lang: 'xaml',
      level: 1,
      preview: true,
      prompt:
        '`Grid` に 2 行 2 列を定義し、次のように配置しよう。**1 行目の左**に `TextBlock`、**1 行目の右**に `TextBox`、**2 行目**は 2 列にまたがる `Button`。1 列目の幅は `Auto`（中身に合わせる）、2 列目は `*`（残り全部）にすること。',
      starter: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="検索" Width="320" Height="150">
    <Grid Margin="12">
        <!-- 行と列を定義する -->

        <!-- TextBlock / TextBox / Button を置く -->

    </Grid>
</Window>`,
      solution: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="検索" Width="320" Height="150">
    <Grid Margin="12">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="Auto" />
            <ColumnDefinition Width="*" />
        </Grid.ColumnDefinitions>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="Auto" />
        </Grid.RowDefinitions>

        <TextBlock Grid.Row="0" Grid.Column="0" Text="キーワード" VerticalAlignment="Center" Margin="0,0,8,0" />
        <TextBox Grid.Row="0" Grid.Column="1" />
        <Button Grid.Row="1" Grid.Column="0" Grid.ColumnSpan="2" Content="検索" Margin="0,12,0,0" />
    </Grid>
</Window>`,
      solutionNote:
        '`Grid.Row` などは `Grid` が定義する添付プロパティで、値は子要素の側に保存される。行・列の番号は 0 から始まり、省略すると 0 になる。',
      hints: [
        '列は `<Grid.ColumnDefinitions>` の中に `<ColumnDefinition Width="..." />` を 2 つ、行は `<Grid.RowDefinitions>` の中に `<RowDefinition />` を 2 つ書く。',
        '2 列にまたがらせるには `Grid.ColumnSpan="2"` を使う。',
      ],
      checks: [
        {
          label: '列が 2 つ定義され、1 列目が Auto、2 列目が *',
          test: (c) => {
            const cols = c.els('ColumnDefinition')
            return cols.length === 2 && a(cols[0], 'Width') === 'Auto' && /^\d*\*$/.test(a(cols[1], 'Width') ?? '*')
          },
        },
        { label: '行が 2 つ定義されている', test: (c) => c.els('RowDefinition').length === 2 },
        {
          label: 'TextBlock が 1 行目・1 列目にある',
          test: (c) => c.els('TextBlock').some((n) => (a(n, 'Grid.Row') ?? '0') === '0' && (a(n, 'Grid.Column') ?? '0') === '0'),
        },
        {
          label: 'TextBox が 1 行目・2 列目にある',
          test: (c) => c.els('TextBox').some((n) => (a(n, 'Grid.Row') ?? '0') === '0' && a(n, 'Grid.Column') === '1'),
        },
        {
          label: 'Button が 2 行目にあり、2 列にまたがっている',
          test: (c) => c.els('Button').some((n) => a(n, 'Grid.Row') === '1' && a(n, 'Grid.ColumnSpan') === '2'),
        },
      ],
    },
    {
      id: 'ex-arch-dp',
      title: '依存関係プロパティを定義する',
      lang: 'csharp',
      level: 2,
      prompt:
        '`Badge` コントロールに、`int` 型の依存関係プロパティ `Count` を追加しよう。既定値は `0`。**登録用の静的フィールド**（`CountProperty`）と、**`GetValue` / `SetValue` を呼ぶだけの CLR ラッパー**の両方が必要だ。',
      starter: `using System.Windows;
using System.Windows.Controls;

public class Badge : Control
{
    // ① CountProperty を DependencyProperty.Register で登録する


    // ② Count プロパティ（CLR ラッパー）を書く

}`,
      solution: `using System.Windows;
using System.Windows.Controls;

public class Badge : Control
{
    public static readonly DependencyProperty CountProperty =
        DependencyProperty.Register(
            nameof(Count),
            typeof(int),
            typeof(Badge),
            new PropertyMetadata(0));

    public int Count
    {
        get => (int)GetValue(CountProperty);
        set => SetValue(CountProperty, value);
    }
}`,
      solutionNote:
        '既定値の `0` は `int` として渡すこと。`new PropertyMetadata(0.0)` のように型が合わないと、型の初期化時に例外になる（コンパイルは通ってしまうので気づきにくい）。',
      hints: [
        'フィールドは `public static readonly DependencyProperty CountProperty = DependencyProperty.Register(...)` の形。',
        '`Register` の引数は順に、プロパティ名・値の型・所有クラスの型・メタデータ。',
        'ラッパーの getter は `(int)GetValue(CountProperty)`、setter は `SetValue(CountProperty, value)`。',
      ],
      checks: [
        { label: 'public static readonly な CountProperty フィールドがある', test: (c) => c.has(/public static readonly DependencyProperty CountProperty\b/) },
        { label: 'DependencyProperty.Register で登録している', test: (c) => c.has(/CountProperty\s*=\s*DependencyProperty\.Register\s*\(/) },
        { label: 'プロパティ名が "Count"（または nameof(Count)）', test: (c) => c.has(/Register\s*\(\s*(nameof\s*\(\s*Count\s*\)|"Count")/) },
        { label: '値の型が int、所有クラスが Badge', test: (c) => c.has(/typeof\s*\(\s*int\s*\)\s*,\s*typeof\s*\(\s*Badge\s*\)/) },
        { label: 'getter が GetValue(CountProperty) を使っている', test: (c) => c.has(/\(\s*int\s*\)\s*GetValue\s*\(\s*CountProperty\s*\)/) },
        { label: 'setter が SetValue(CountProperty, value) を使っている', test: (c) => c.has(/SetValue\s*\(\s*CountProperty\s*,\s*value\s*\)/) },
      ],
    },
  ],
}

export default chapter
