import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'
import { a, bindsTo, hasOption } from '@/lib/exercise'

const chapter: Chapter = {
  ...metaOf('binding-mvvm'),
  goals: [
    'バインディングの「ターゲット」「ソース」「DataContext」の関係を説明できる',
    '`Mode`・`UpdateSourceTrigger`・`Converter`・`StringFormat`・`FallbackValue` を目的に応じて指定できる',
    '`INotifyPropertyChanged`・`ObservableCollection`・`ICommand` がそれぞれ何を通知するのかがわかる',
    '入力検証の 3 方式の違いと、MVVM ライブラリ・DI の組み込み方がわかる',
    'バインディングが効かないときに、出力ウィンドウのエラーから原因をたどれる',
  ],
  sections: [
    {
      id: 'binding-basics',
      title: 'バインディングとは — 値を運ぶ仕組み',
      lead: '`textBox.Text = customer.Name;` と `customer.Name = textBox.Text;` を、変更のたびに手で書く代わりに、「この 2 つは同じ値」と宣言しておく。それが[[binding]]だ。',
      blocks: [
        {
          type: 'figure',
          demo: 'BindingRoundTripVideo',
          kind: 'video',
          title: '1 文字の入力が、別の表示に届くまで（48 秒）',
          caption: '赤い札は「入力された値」、緑の札は「通知を受けて取り直した値」。途中の丸い箱は、値が通過する処理。',
        },
        {
          type: 'table',
          caption: 'バインディングの登場人物',
          head: ['用語', '意味', '例'],
          rows: [
            ['ターゲット', '値を受け取る側。UI 要素の[[dp]]でなければならない', '`TextBox.Text`、`Button.IsEnabled`'],
            ['ソース', '値の出どころ。どんなオブジェクトのプロパティでもよい', '`CustomerViewModel.Name`'],
            ['[[datacontext]]', 'ソースを省略したときに使われる既定のオブジェクト。親から子へ継承される', '`Window.DataContext = new CustomerViewModel()`'],
            ['Path', 'ソースのどのプロパティを見るか', '`Name`、`Address.City`、`Items[0].Price`'],
          ],
        },
        {
          type: 'code',
          lang: 'xaml',
          title: 'いちばん基本の形',
          excerpt: true,
          code: `<!-- Window の DataContext に CustomerViewModel が入っているとする -->
<StackPanel>
    <!-- Path= は省略できる。{Binding Name} と {Binding Path=Name} は同じ -->
    <TextBox Text="{Binding Name}" />

    <!-- DataContext は親から子へ継承されるので、どの子からも同じソースが見える -->
    <TextBlock Text="{Binding Address.City}" />
</StackPanel>`,
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'DataContext 以外をソースにする 3 つの方法',
          text: '`ElementName=NameBox`（同じ XAML 内の別の要素）、`RelativeSource={RelativeSource AncestorType=Window}`（自分から見た相対位置の要素）、`Source={StaticResource Settings}`（特定のオブジェクト）。どれも指定しなければ DataContext が使われる。',
        },
        {
          type: 'sources',
          items: [{ label: 'Microsoft Learn: データ バインディングの概要（WPF）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/data/' }],
        },
      ],
    },
    {
      id: 'binding-anatomy',
      title: 'Binding の全要素',
      lead: '`{Binding ...}` の中に書けるものを一通り押さえる。特に `Mode` と `UpdateSourceTrigger` は、動きを見ないと腑に落ちにくいので、まず手で試そう。',
      blocks: [
        {
          type: 'figure',
          demo: 'BindingLab',
          kind: 'demo',
          title: 'Mode と UpdateSourceTrigger の実験台',
          caption: '左の入力欄が TextBox、右が ViewModel のプロパティ。設定を変えながら両側から値を変えて、いつ・どちら向きに流れるかを確かめる。「変更通知」を外すと、ソースを変えても画面が変わらなくなる。',
        },
        {
          type: 'table',
          caption: 'Binding の主なプロパティ',
          head: ['プロパティ', '役割', '覚えておくこと'],
          rows: [
            ['`Path`', 'ソースのどのプロパティか', '`A.B.C` と書くと途中のどれが変わっても追従する（各段が通知していれば）'],
            ['`Mode`', '値の流れる向き', '既定値はプロパティごとに違う。`TextBox.Text` は `TwoWay`、`TextBlock.Text` は `OneWay`'],
            ['`UpdateSourceTrigger`', 'ターゲット → ソースへ書き込むタイミング', '`TextBox.Text` の既定は `LostFocus`。入力中に反映したいなら `PropertyChanged`'],
            ['`Converter` / `ConverterParameter`', '値を別の型・別の表現に変換する', '`IValueConverter` を実装したクラスをリソースに置いて参照する'],
            ['`StringFormat`', '文字列に整形する', 'ターゲットが `string` 型のプロパティのときだけ効く'],
            ['`FallbackValue`', 'バインディングが値を得られないときに使う値', 'パスの間違い、DataContext が null、変換の失敗など'],
            ['`TargetNullValue`', 'ソースの値が null のときに使う値', '`FallbackValue` とは別物。「未設定」と表示したいときはこちら'],
            ['`Delay`', 'ソースへの書き込みを指定ミリ秒遅らせる', '検索ボックスで、打鍵のたびに検索が走るのを防ぐ'],
            ['`ValidatesOnDataErrors` など', '検証の仕組みを有効にする', 'このあとの「入力検証」で扱う'],
          ],
        },
        { type: 'h3', text: 'StringFormat' },
        {
          type: 'code',
          lang: 'xaml',
          title: 'StringFormat の書き方',
          excerpt: true,
          code: `<!-- 書式だけなら、先頭の {} で「これはマークアップ拡張ではない」と伝える -->
<TextBlock Text="{Binding Price, StringFormat={}{0:N0} 円}" />

<!-- 文字で始まるなら {} は不要 -->
<TextBlock Text="{Binding UpdatedAt, StringFormat=更新日: {0:yyyy/MM/dd}}" />

<!-- Button.Content は object 型なので StringFormat は効かない。ContentStringFormat を使う -->
<Button Content="{Binding Count}" ContentStringFormat="{}{0} 件を削除" />`,
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: '日付や通貨が英語（米国）の書式で表示される',
          text: 'バインディングの `StringFormat` とコンバーターは、OS の地域設定ではなく、要素の `Language` プロパティ（既定は `en-US`）の書式を使う。日本語環境で `{0:C}` が `$1,234.00` になるのはこのため。アプリの起動時に 1 度、下のコードで既定値を現在の文化圏に合わせておく。',
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'App.xaml.cs の OnStartup の先頭に入れる',
          excerpt: true,
          code: `// using System.Globalization; using System.Windows; using System.Windows.Markup;
FrameworkElement.LanguageProperty.OverrideMetadata(
    typeof(FrameworkElement),
    new FrameworkPropertyMetadata(
        XmlLanguage.GetLanguage(CultureInfo.CurrentCulture.IetfLanguageTag)));`,
        },
        { type: 'h3', text: 'Converter' },
        {
          type: 'code',
          lang: 'csharp',
          title: 'BoolToVisibilityConverter.cs',
          code: `using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

[ValueConversion(typeof(bool), typeof(Visibility))]
public sealed class BoolToVisibilityConverter : IValueConverter
{
    /// <summary>true にすると、false のときに表示する（意味を反転する）。</summary>
    public bool Invert { get; set; }

    // ソース → ターゲット
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        bool flag = value is true;
        if (Invert)
        {
            flag = !flag;
        }

        return flag ? Visibility.Visible : Visibility.Collapsed;
    }

    // ターゲット → ソース。表示専用なら「何もしない」を返す
    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => Binding.DoNothing;
}`,
        },
        {
          type: 'code',
          lang: 'xaml',
          title: '使う側',
          excerpt: true,
          code: `<Window.Resources>
    <local:BoolToVisibilityConverter x:Key="BoolToVisibility" />
    <local:BoolToVisibilityConverter x:Key="InverseBoolToVisibility" Invert="True" />
</Window.Resources>

<ProgressBar IsIndeterminate="True"
             Visibility="{Binding IsBusy, Converter={StaticResource BoolToVisibility}}" />
<TextBlock Text="データがありません"
           Visibility="{Binding HasItems, Converter={StaticResource InverseBoolToVisibility}}" />`,
        },
        {
          type: 'callout',
          kind: 'tip',
          title: 'コンバーターを増やしすぎない',
          text: '単純な bool → Visibility なら、標準の `BooleanToVisibilityConverter` がある。また、表示用の変換が複雑になってきたら、コンバーターを重ねるより ViewModel に表示用のプロパティ（`StatusText` など）を足すほうが、テストしやすく読みやすい。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: バインディング宣言の概要', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/data/binding-declarations-overview' },
            { label: 'Microsoft Learn: Binding クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.data.binding' },
            { label: 'Microsoft Learn: BindingBase.StringFormat', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.data.bindingbase.stringformat' },
            { label: 'Microsoft Learn: UpdateSourceTrigger 列挙型', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.data.updatesourcetrigger' },
          ],
        },
      ],
    },
    {
      id: 'notification',
      title: '変更通知とコレクション',
      lead: 'バインディングは、ソースが変わったことを自分では検知できない。ソースの側が「変わった」と声を上げる必要がある。その声の上げ方が 2 種類ある。',
      blocks: [
        {
          type: 'table',
          caption: '2 つの通知インターフェイス',
          head: ['インターフェイス', '知らせる内容', '実装するもの'],
          rows: [
            ['[[inpc]]', '「このオブジェクトの、このプロパティの値が変わった」', 'ViewModel、表示する Model'],
            ['`INotifyCollectionChanged`', '「このコレクションに要素が追加・削除・移動された」', '[[observable-collection]] が実装済み。自分で書くことはまずない'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'ViewModelBase.cs — 自前で書く場合の最小実装',
          code: `using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;

public abstract class ViewModelBase : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    // [CallerMemberName] により、呼び出し元のプロパティ名が自動で入る
    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));

    /// <summary>値が変わったときだけフィールドを更新し、通知する。</summary>
    protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value))
        {
            return false;
        }

        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: '使う側',
          code: `using System.Collections.ObjectModel;

public class CustomerViewModel : ViewModelBase
{
    private string _firstName = string.Empty;
    private string _lastName = string.Empty;

    public string FirstName
    {
        get => _firstName;
        set
        {
            if (SetProperty(ref _firstName, value))
            {
                // FullName は FirstName から計算されるので、こちらも「変わった」と知らせる
                OnPropertyChanged(nameof(FullName));
            }
        }
    }

    public string LastName
    {
        get => _lastName;
        set
        {
            if (SetProperty(ref _lastName, value))
            {
                OnPropertyChanged(nameof(FullName));
            }
        }
    }

    public string FullName => $"{LastName} {FirstName}";

    // コレクションは get のみにして、中身を Add / Remove で変える
    public ObservableCollection<string> Tags { get; } = new();
}`,
        },
        {
          type: 'callout',
          kind: 'pitfall',
          title: 'ObservableCollection でよくある 3 つの誤解',
          text: '① **要素のプロパティの変更は通知されない**。`Items[0].Name = "..."` で画面を変えるには、要素のクラス自身が `INotifyPropertyChanged` を実装している必要がある。② **コレクションを丸ごと入れ替えたら、プロパティの通知が要る**。`Items = new ObservableCollection<T>(...)` と代入するなら、`Items` プロパティ自体が変更を通知しなければならない。③ **UI スレッド以外から変更すると例外になる**（第 5 章）。',
        },
        { type: 'h3', text: 'CollectionViewSource — 並べ替え・絞り込み・グループ化' },
        {
          type: 'p',
          text: 'WPF は、コレクションを直接表示しているのではなく、間に[[collection-view]]という層を挟んでいる。並べ替えや絞り込みは、元のコレクションを触らずに、このビューに対して指示する。',
        },
        {
          type: 'code',
          lang: 'xaml',
          title: 'XAML で並べ替えとグループ化を宣言する',
          excerpt: true,
          code: `<!-- xmlns:scm="clr-namespace:System.ComponentModel;assembly=WindowsBase" を宣言しておく -->
<Window.Resources>
    <CollectionViewSource x:Key="CustomersView" Source="{Binding Customers}">
        <CollectionViewSource.SortDescriptions>
            <scm:SortDescription PropertyName="Name" Direction="Ascending" />
        </CollectionViewSource.SortDescriptions>
        <CollectionViewSource.GroupDescriptions>
            <PropertyGroupDescription PropertyName="Prefecture" />
        </CollectionViewSource.GroupDescriptions>
    </CollectionViewSource>
</Window.Resources>

<!-- ビューを表示するときは Source= で参照する -->
<ListBox ItemsSource="{Binding Source={StaticResource CustomersView}}" DisplayMemberPath="Name" />`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'コードから絞り込む',
          excerpt: true,
          code: `// コレクションの「既定のビュー」を取得する。ItemsSource に直接バインドしたときに使われるのもこれ
ICollectionView view = CollectionViewSource.GetDefaultView(viewModel.Customers);

view.Filter = item => item is Customer c
    && c.Name.Contains(keyword, StringComparison.CurrentCultureIgnoreCase);

// 絞り込み条件（keyword）が変わったら、評価し直すよう明示的に頼む
view.Refresh();`,
        },
        {
          type: 'callout',
          kind: 'note',
          text: '`ICollectionView` と `CollectionViewSource` は WPF のアセンブリにある。ViewModel を WPF 非依存に保ちたい場合は、並べ替えの宣言を上のように XAML 側へ置くか、ViewModel が絞り込み済みのコレクションを公開する形にする。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: プロパティ変更通知を実装する方法', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/data/how-to-implement-property-change-notification' },
            { label: 'Microsoft Learn: ObservableCollection<T>', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.collections.objectmodel.observablecollection-1' },
            { label: 'Microsoft Learn: データ バインディングの概要（コレクション ビュー）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/data/#binding-to-collections' },
          ],
        },
      ],
    },
    {
      id: 'commands',
      title: 'ICommand — 操作をバインドする',
      lead: '値はプロパティでバインドできる。では「ボタンが押された」という操作はどうするか。その答えが [[icommand]] だ。',
      blocks: [
        {
          type: 'p',
          text: '`ICommand` は、「実行する処理（`Execute`）」と「いま実行できるか（`CanExecute`）」を 1 つにまとめたインターフェイスだ。`Button.Command` にバインドすると、クリックで `Execute` が呼ばれ、`CanExecute` が `false` を返す間は**ボタンが自動的に無効**になる。`IsEnabled` を自分で切り替える必要がない。',
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'RelayCommand.cs — 自前で書く場合の最小実装',
          code: `using System;
using System.Windows.Input;

public sealed class RelayCommand : ICommand
{
    private readonly Action<object?> _execute;
    private readonly Predicate<object?>? _canExecute;

    public RelayCommand(Action<object?> execute, Predicate<object?>? canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public event EventHandler? CanExecuteChanged;

    public bool CanExecute(object? parameter) => _canExecute?.Invoke(parameter) ?? true;

    public void Execute(object? parameter) => _execute(parameter);

    /// <summary>実行可否が変わったことを知らせる。ボタンが CanExecute を問い合わせ直す。</summary>
    public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'ViewModel でコマンドを公開する',
          code: `public class CounterViewModel : ViewModelBase
{
    private int _count;

    public CounterViewModel()
    {
        IncrementCommand = new RelayCommand(_ => Count++, _ => Count < 10);
        ResetCommand = new RelayCommand(_ => Count = 0);
    }

    public RelayCommand IncrementCommand { get; }
    public RelayCommand ResetCommand { get; }

    public int Count
    {
        get => _count;
        private set
        {
            if (SetProperty(ref _count, value))
            {
                // Count が変わると「増やせるか」も変わるので、問い合わせ直してもらう
                IncrementCommand.RaiseCanExecuteChanged();
            }
        }
    }
}`,
        },
        {
          type: 'code',
          lang: 'xaml',
          title: 'View からバインドする',
          excerpt: true,
          code: `<StackPanel>
    <TextBlock Text="{Binding Count, StringFormat=現在の値: {0}}" />

    <!-- Count が 10 になると、このボタンは自動で無効になる -->
    <Button Content="+1" Command="{Binding IncrementCommand}" />
    <Button Content="リセット" Command="{Binding ResetCommand}" />

    <!-- 引数を渡したいときは CommandParameter -->
    <Button Content="削除" Command="{Binding DeleteCommand}" CommandParameter="{Binding SelectedItem}" />
</StackPanel>`,
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'Click イベントがないコントロールはどうするか',
          text: '`Command` プロパティを持つのは `Button`、`MenuItem`、`Hyperlink` など一部のコントロールだけだ。キー操作は `<KeyBinding Key="F5" Command="{Binding RefreshCommand}" />` でバインドできる。`Loaded` や `SelectionChanged` のようなイベントをコマンドにつなぎたい場合は、`Microsoft.Xaml.Behaviors.Wpf` パッケージの `InvokeCommandAction` を使うのが定番。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: コマンド実行の概要', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/commanding-overview' },
            { label: 'Microsoft Learn: ICommand インターフェイス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.windows.input.icommand' },
            { label: 'GitHub: microsoft/XamlBehaviorsWpf', url: 'https://github.com/microsoft/XamlBehaviorsWpf' },
          ],
        },
      ],
    },
    {
      id: 'validation',
      title: '入力検証',
      lead: '「年齢に文字が入力された」「必須項目が空」をどこで検査し、どう画面に出すか。WPF には 3 つの仕組みがあり、検査が走る場所とタイミングが違う。',
      blocks: [
        {
          type: 'figure',
          demo: 'ValidationDemo',
          kind: 'demo',
          title: '3 方式の違い — どこで止まり、ソースに何が入るか',
          caption: '方式を切り替えて、同じ入力（150 や abc）で処理がどこまで進むかを比べる。`ValidationRule` は不正な値をソースに入れないが、ほかの 2 つは入れてからエラーを報告する。',
        },
        {
          type: 'table',
          caption: '3 つの検証方式',
          head: ['', '`ValidationRule`', '`IDataErrorInfo`', '`INotifyDataErrorInfo`'],
          rows: [
            ['検査を書く場所', 'View（XAML にルールを並べる）', 'ViewModel / Model', 'ViewModel / Model'],
            ['検査のタイミング', 'ソースへ書き込む**前**', '書き込んだ**後**', '書き込んだ**後**（好きなタイミングで再通知できる）'],
            ['1 プロパティのエラー数', 'ルールごとに 1 つ', '1 つ', '複数'],
            ['非同期の検査', '不可', '不可', '可（サーバーへの重複確認など）'],
            ['バインディング側の指定', '`Binding.ValidationRules`', '`ValidatesOnDataErrors=True`', '不要（既定で有効）'],
            ['WPF での対応', '.NET Framework 3.0 から', '.NET Framework 3.5 から', '.NET Framework 4.5 から'],
            ['向いている場面', '形式チェックを View で完結させたいとき', '既存コードの維持', '**新規開発の標準**'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'CommunityToolkit.Mvvm の ObservableValidator を使う例',
          code: `using System.ComponentModel.DataAnnotations;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

// ObservableValidator が INotifyDataErrorInfo を実装している
public partial class SignUpViewModel : ObservableValidator
{
    [ObservableProperty]
    [NotifyDataErrorInfo]                       // 値が変わるたびに検証する
    [NotifyCanExecuteChangedFor(nameof(RegisterCommand))]
    [Required(ErrorMessage = "名前を入力してください")]
    [MaxLength(20, ErrorMessage = "20 文字以内で入力してください")]
    private string _name = string.Empty;

    [ObservableProperty]
    [NotifyDataErrorInfo]
    [NotifyCanExecuteChangedFor(nameof(RegisterCommand))]
    [Range(0, 120, ErrorMessage = "0〜120 の範囲で入力してください")]
    private int _age;

    [RelayCommand(CanExecute = nameof(CanRegister))]
    private void Register()
    {
        ValidateAllProperties();                // 未入力のまま押された場合に備えて全項目を検証
        if (HasErrors)
        {
            return;
        }

        // 登録処理…
    }

    private bool CanRegister() => !HasErrors;
}`,
        },
        {
          type: 'code',
          lang: 'xaml',
          title: 'エラーを画面に出す',
          excerpt: true,
          code: `<StackPanel>
    <TextBox x:Name="NameBox" Text="{Binding Name, UpdateSourceTrigger=PropertyChanged}" />

    <!-- (Validation.Errors)/ErrorContent の「/」は「現在の項目」を指す。
         [0] と書くと、エラーがないときにバインディングエラーが出るので避ける -->
    <TextBlock Foreground="Crimson"
               Text="{Binding ElementName=NameBox, Path=(Validation.Errors)/ErrorContent}" />
</StackPanel>`,
        },
        {
          type: 'callout',
          kind: 'note',
          title: '赤い枠はどこに描かれているか',
          text: 'エラーのあるコントロールを囲む赤い枠は、コントロール自身ではなく、ウィンドウ最前面の装飾レイヤー（[[adorner]]）に描かれている。見た目を変えるには `Validation.ErrorTemplate` を差し替える。タブを切り替えたのに赤枠だけ残る、という現象はこの構造が原因で、`AdornerDecorator` で囲むと解決する。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: データ バインディングの概要（データ検証）', url: 'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/data/#data-validation' },
            { label: 'Microsoft Learn: INotifyDataErrorInfo インターフェイス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.componentmodel.inotifydataerrorinfo' },
            { label: 'Microsoft Learn: CommunityToolkit.Mvvm — ObservableValidator', url: 'https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/observablevalidator' },
          ],
        },
      ],
    },
    {
      id: 'mvvm',
      title: 'MVVM と実装の選択肢',
      lead: 'ここまでの部品（バインディング、通知、コマンド）を組み合わせると、画面のロジックを UI から切り離せる。その設計に付いた名前が [[mvvm]] だ。',
      blocks: [
        {
          type: 'figure',
          demo: 'MvvmDiagram',
          kind: 'figure',
          title: 'MVVM の 3 層と、その間を流れるもの',
          caption: '箱と矢印にカーソルを合わせる（またはタップ / Tab で選ぶ）と説明が出る。実線は「呼ぶ」、破線は「知らせる」。',
        },
        {
          type: 'p',
          text: '要点は**依存の向き**にある。View は ViewModel を知っているが、[[viewmodel]] は View を知らない。ViewModel は `TextBox` も `MessageBox` も参照しないので、画面を 1 つも開かずにテストできる。「ボタンを押したら保存される」は、「`SaveCommand.Execute()` を呼んだら、リポジトリの `Save` が呼ばれる」というテストに置き換えられる。',
        },
        {
          type: 'table',
          caption: 'MVVM の実装手段',
          head: ['手段', '特徴', '向いている場面'],
          rows: [
            ['自前（`ViewModelBase` + `RelayCommand`）', '50 行ほどで書ける。依存が増えない', '小さなツール、仕組みを学ぶとき'],
            ['CommunityToolkit.Mvvm', '`[ObservableProperty]` や `[RelayCommand]` からコードを自動生成する。画面遷移などの機能は持たない', '**現在の標準的な選択**。必要な部品だけを足していける'],
            ['Prism', '画面領域（Region）、モジュール分割、ダイアログ、画面遷移まで含む総合フレームワーク', '大規模で、画面構成自体を枠組みに任せたいとき。バージョン 9 以降はライセンス形態が変わっているので、採用前に必ず公式サイトで確認する'],
            ['ReactiveUI など', 'Rx（リアクティブ拡張）を軸にした書き方', 'チームが Rx に慣れているとき'],
          ],
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'CommunityToolkit.Mvvm で書いた ViewModel',
          code: `using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

// partial が必須（ソースジェネレーターが残りを生成する）
public partial class CustomerEditViewModel : ObservableObject
{
    private readonly ICustomerRepository _repository;

    public CustomerEditViewModel(ICustomerRepository repository)
    {
        _repository = repository;
    }

    // → 変更通知つきの public プロパティ Name が生成される
    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SaveCommand))]
    private string _name = string.Empty;

    [ObservableProperty]
    private bool _isBusy;

    // → SaveCommand（IAsyncRelayCommand）が生成される。実行中は自動で二重実行を防ぐ
    [RelayCommand(CanExecute = nameof(CanSave))]
    private async Task SaveAsync()
    {
        IsBusy = true;
        try
        {
            await _repository.SaveAsync(Name);
        }
        finally
        {
            IsBusy = false;
        }
    }

    private bool CanSave() => !string.IsNullOrWhiteSpace(Name);
}

public interface ICustomerRepository
{
    Task SaveAsync(string name);
}`,
        },
        { type: 'h3', text: 'DI と IHost の組み込み' },
        {
          type: 'p',
          text: 'ViewModel がコンストラクターでサービスを受け取るようになると、「誰がそれを渡すのか」が問題になる。答えは [[di]] コンテナーで、.NET 標準の[[generic-host]]を使うと、設定ファイルやログの仕組みも同時に手に入る。WPF では、`App.xaml` の `StartupUri` を消し、`App.xaml.cs` で自分でウィンドウを作るのがポイントだ。',
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'App.xaml.cs — 汎用ホストを組み込む（App.xaml から StartupUri を削除しておく）',
          code: `using System;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace MyApp;

public partial class App : Application
{
    private readonly IHost _host;

    public App()
    {
        HostApplicationBuilder builder = Host.CreateApplicationBuilder();

        // サービス: アプリ全体で 1 つ
        builder.Services.AddSingleton<ICustomerRepository, CustomerRepository>();

        // ViewModel と Window: 要求されるたびに新しく作る
        builder.Services.AddTransient<MainViewModel>();
        builder.Services.AddTransient<MainWindow>();

        _host = builder.Build();
    }

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        _host.Start();

        // MainWindow のコンストラクター引数（MainViewModel）と、
        // さらにその引数（ICustomerRepository）が、自動で解決されて渡される
        var window = _host.Services.GetRequiredService<MainWindow>();
        window.Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        // 終了処理は同期的に待つ。UI スレッドの文脈を引き継がないよう Task.Run で包む
        Task.Run(() => _host.StopAsync(TimeSpan.FromSeconds(5))).GetAwaiter().GetResult();
        _host.Dispose();
        base.OnExit(e);
    }
}`,
        },
        {
          type: 'code',
          lang: 'csharp',
          title: 'MainWindow.xaml.cs — コードビハインドに書くのはこれだけ',
          code: `using System.Windows;

namespace MyApp;

public partial class MainWindow : Window
{
    public MainWindow(MainViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}`,
        },
        {
          type: 'callout',
          kind: 'tip',
          title: 'ViewModel からダイアログを出したいとき',
          text: 'ViewModel で `MessageBox.Show` を直接呼ぶと、テストのたびにダイアログが開いてしまう。`IDialogService` のようなインターフェイスを定義して ViewModel はそれを呼び、WPF 側の実装（中で `MessageBox.Show` を呼ぶ）を DI で渡す。テストでは「常に はい を返す」偽物に差し替える。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: CommunityToolkit.Mvvm の概要', url: 'https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/' },
            { label: 'Microsoft Learn: .NET 汎用ホスト', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/generic-host' },
            { label: 'Microsoft Learn: .NET での依存関係の挿入', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection' },
            { label: 'Prism Library 公式サイト（ライセンスの確認）', url: 'https://prismlibrary.com/' },
          ],
        },
      ],
    },
    {
      id: 'debugging',
      title: 'バインディングエラーのデバッグ手順',
      lead: 'バインディングの失敗は例外にならない。画面が空欄のまま、何事もなかったように動き続ける。だから「どこを見ればわかるか」を知っていることが大事になる。',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: '出力ウィンドウ / XAML バインド エラー ウィンドウを見る', text: 'デバッグ実行中、失敗したバインディングは Visual Studio の「出力」ウィンドウに `System.Windows.Data Error` として記録される。新しい Visual Studio には、これを一覧にする「XAML バインド エラー」ウィンドウもある。' },
            { title: 'エラー文を読む', text: '下の注釈付きの例のとおり、エラー文には「どのパスが」「どの型のオブジェクトに対して」「どの要素のどのプロパティ向けに」失敗したかがすべて書いてある。' },
            { title: 'DataContext を確かめる', text: '「ライブ ビジュアル ツリー」で対象の要素を選び、「ライブ プロパティ エクスプローラー」で `DataContext` に何が入っているかを見る。想定と違う型が入っていることが、いちばん多い原因。' },
            { title: '1 つのバインディングを詳しく追う', text: 'それでもわからなければ、`PresentationTraceSources.TraceLevel=High` をそのバインディングに付ける。ソースの解決から値の転送までの全ステップが出力される。' },
            { title: 'コンバーターで止める', text: '値が来ているのに表示がおかしいなら、コンバーターの `Convert` にブレークポイントを置き、渡された値と型を確認する。' },
          ],
        },
        {
          type: 'annotated',
          lang: 'text',
          title: '出力ウィンドウのバインディングエラー',
          hint: '印の付いた行を選ぶと、エラー文のどこに何が書いてあるかがわかります',
          lines: [
            { code: 'System.Windows.Data Error: 40 :', note: { title: 'エラーの種類', body: '`System.Windows.Data` はデータバインディングのトレースであることを示す。`Error` のほかに `Warning` や `Information` もある。番号は種類を表し、40 はパスの解決失敗でよく見かける。' } },
            { code: "  BindingExpression path error: 'Nmae' property not found", note: { title: '何が起きたか', body: '`Nmae` というプロパティが見つからなかった。**つづり間違い**（Name → Nmae）が最も多い。次に多いのは、プロパティが `public` でない、プロパティではなくフィールドになっている、というケース。' } },
            { code: "  on 'object' ''CustomerViewModel' (HashCode=31423778)'.", note: { title: 'どのオブジェクトに対してか', body: 'バインディングのソース（多くの場合 DataContext）に入っていたオブジェクトの型。ここが**想定と違う型**なら、つづりではなく DataContext の問題。`DataTemplate` の中では DataContext が「リストの 1 項目」に変わることに注意。' } },
            { code: '  BindingExpression:Path=Nmae;', note: { title: 'XAML に書いたパス', body: '`{Binding Nmae}` の `Nmae`。このまま XAML を検索すれば、該当箇所が見つかる。' } },
            { code: "  DataItem='CustomerViewModel' (HashCode=31423778);", note: { title: 'ソースの実体', body: '`DataItem=null` と出ていたら、DataContext がまだ設定されていない（または null）。その場合はエラーではなく、単に値がないだけのこともある。' } },
            { code: "  target element is 'TextBlock' (Name='');", note: { title: 'どの要素か', body: 'バインディングが設定されている要素の型と名前。同じ型が画面にたくさんあるときは、`x:Name` を一時的に付けると特定しやすい。' } },
            { code: "  target property is 'Text' (type 'String')", note: { title: 'どのプロパティか', body: 'バインディングのターゲット。型も書かれているので、「`int` を `Brush` に入れようとしている」といった型の不一致もここで気づける。' } },
          ],
        },
        {
          type: 'code',
          lang: 'xaml',
          title: '1 つのバインディングを詳細に追う',
          excerpt: true,
          code: `<Window xmlns:diag="clr-namespace:System.Diagnostics;assembly=WindowsBase" ...>
    <!-- このバインディングの解決過程が、出力ウィンドウに逐一表示される。調査が済んだら外す -->
    <TextBlock Text="{Binding Name, diag:PresentationTraceSources.TraceLevel=High}" />
</Window>`,
        },
        {
          type: 'code',
          lang: 'xaml',
          title: 'デザイン時の DataContext を教えて、入力中に間違いに気づく',
          excerpt: true,
          code: `<Window x:Class="MyApp.Views.CustomerWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:vm="clr-namespace:MyApp.ViewModels"
        mc:Ignorable="d"
        d:DataContext="{d:DesignInstance Type=vm:CustomerViewModel}">
    <!-- d: で始まる属性は実行時には無視される。
         エディターがソースの型を知るので、{Binding の後に候補が出て、存在しない名前には波線が付く -->
    <TextBlock Text="{Binding Name}" />
</Window>`,
        },
        {
          type: 'table',
          caption: '「表示されない / 更新されない」ときの原因と見分け方',
          head: ['症状', 'よくある原因', '見分け方'],
          rows: [
            ['最初から何も表示されない', 'パスのつづり間違い / DataContext が想定と違う', '出力ウィンドウに path error が出ている'],
            ['最初は表示されるが、値を変えても更新されない', 'ソースが `PropertyChanged` を出していない', 'エラーは出ない。setter にブレークポイントを置くと、値は変わっている'],
            ['リストに追加しても画面に出ない', '`List<T>` を使っている / コレクションを丸ごと入れ替えている', '`ObservableCollection<T>` にする。入れ替えるならプロパティの変更通知を出す'],
            ['入力してもソースに反映されない', '`Mode` が `OneWay` / `UpdateSourceTrigger` が `LostFocus` のまま', 'フォーカスを外すと反映されるなら後者'],
            ['`ElementName` や `RelativeSource` が効かない', '対象がビジュアルツリーの外にある（`ContextMenu`、`ToolTip`、`DataGridColumn` など）', '出力ウィンドウに「Cannot find source for binding」が出ている'],
            ['型名がそのまま表示される', '`DataTemplate` も `DisplayMemberPath` もない', '`MyApp.Models.Customer` のような文字が並ぶ'],
          ],
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'WPF にコンパイル時のバインディング検査はない',
          text: 'UWP や WinUI 3 の `{x:Bind}`（コンパイル時に型を検査するバインディング）は、WPF には存在しない。WPF の `{Binding}` は実行時に名前で解決されるため、プロパティ名を変えたときに XAML 側の直し漏れが起きやすい。上の `d:DataContext` と、出力ウィンドウを見る習慣が、その穴を埋める。',
        },
        {
          type: 'sources',
          items: [
            { label: 'Microsoft Learn: Visual Studio の XAML データ バインディング診断', url: 'https://learn.microsoft.com/en-us/visualstudio/xaml-tools/xaml-data-binding-diagnostics' },
            { label: 'Microsoft Learn: PresentationTraceSources クラス', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.presentationtracesources' },
            { label: 'Microsoft Learn: 実行中の XAML レイアウトを検査する（ライブ ビジュアル ツリー）', url: 'https://learn.microsoft.com/en-us/visualstudio/xaml-tools/inspect-xaml-properties-while-debugging' },
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: 'b1',
      q: '`<TextBox Text="{Binding Name}" />` と書いた。利用者が文字を入力したとき、ViewModel の `Name` が更新されるのは既定ではいつか。',
      choices: ['1 文字入力するたび', 'TextBox からフォーカスが外れたとき', 'Enter キーを押したとき', '更新されない（OneWay だから）'],
      answer: 1,
      explain: '`TextBox.Text` の既定は `Mode=TwoWay`、`UpdateSourceTrigger=LostFocus`。入力のたびに反映したいなら `UpdateSourceTrigger=PropertyChanged` を指定する。',
    },
    {
      id: 'b2',
      q: 'ViewModel のプロパティをコードから変更したのに、画面の表示が変わらない。出力ウィンドウにエラーは出ていない。最も可能性が高い原因はどれか。',
      choices: [
        'バインディングのパスのつづりが間違っている',
        'プロパティの setter が `PropertyChanged` イベントを発生させていない',
        '`DataContext` が null になっている',
        '`StaticResource` を使っているから',
      ],
      answer: 1,
      explain: '最初の値は表示され、エラーも出ないのに更新されない、というのは変更通知がない典型的な症状。パスの間違いや DataContext の問題なら、最初から表示されず、出力ウィンドウにエラーが出る。',
    },
    {
      id: 'b3',
      q: '`ObservableCollection<Customer>` を `ListBox` に表示している。画面が**自動では更新されない**操作はどれか（`Customer` は `INotifyPropertyChanged` を実装していないものとする）。',
      choices: ['`Customers.Add(newCustomer)`', '`Customers.RemoveAt(0)`', '`Customers[0].Name = "新しい名前"`', '`Customers.Clear()`'],
      answer: 2,
      explain: '`ObservableCollection` が通知するのは要素の追加・削除・移動・置換だけで、要素のプロパティの変更は通知しない。`Customer` 自身が `INotifyPropertyChanged` を実装する必要がある。',
    },
    {
      id: 'b4',
      q: '`Button.Command` にバインドしたコマンドの `CanExecute` が `false` を返すと、どうなるか。',
      choices: ['クリックすると例外が発生する', 'ボタンが自動的に無効（押せない状態）になる', 'ボタンが非表示になる', '何も変わらない。`IsEnabled` を自分で切り替える必要がある'],
      answer: 1,
      explain: '`Button` は `CanExecute` の結果に応じて自分の有効 / 無効を切り替える。状態が変わったことは `CanExecuteChanged` イベントで知らせる必要がある（CommunityToolkit なら `[NotifyCanExecuteChangedFor]`）。',
    },
    {
      id: 'b5',
      q: '`<TextBlock Text="{Binding Price, StringFormat={}{0:C}}" />` が、日本語の Windows で `$1,234.00` と表示された。原因はどれか。',
      choices: [
        '`StringFormat` は通貨書式に対応していない',
        'バインディングは OS の地域設定ではなく、要素の `Language`（既定は en-US）の書式を使うから',
        '`Price` が `string` 型だから',
        '先頭の `{}` が余分だから',
      ],
      answer: 1,
      explain: 'バインディングの書式は `FrameworkElement.Language`（既定値 en-US）に従う。起動時に `LanguageProperty.OverrideMetadata` で現在の文化圏を既定値にしておくのが定番の対処。',
    },
    {
      id: 'b6',
      q: '新規開発で、ViewModel 側に入力検証を実装したい。サーバーへの問い合わせ（非同期）も含めたい場合、適切な仕組みはどれか。',
      choices: ['`ValidationRule`', '`IDataErrorInfo`', '`INotifyDataErrorInfo`', '`IValueConverter`'],
      answer: 2,
      explain: '`INotifyDataErrorInfo` は、エラーの変化をイベントで通知する方式なので、非同期の検査結果をあとから反映でき、1 つのプロパティに複数のエラーも持てる。`IDataErrorInfo` は同期のみ・1 プロパティ 1 エラー。',
    },
    {
      id: 'b7',
      q: 'MVVM で、ViewModel が参照して**はいけない**ものはどれか。',
      choices: ['Model のクラス', 'サービスのインターフェイス（`ICustomerRepository` など）', '`ObservableCollection<T>`', '`TextBox` や `Window` などの View の型'],
      answer: 3,
      explain: 'ViewModel は View を知らない、というのが MVVM の核心。View の型を参照すると、画面なしでテストできなくなる。ダイアログ表示などが必要なら、インターフェイスを介して依頼する。',
    },
  ],
  exercises: [
    {
      id: 'ex-bind-xaml',
      title: '入力・表示・コマンドをバインドする',
      lang: 'xaml',
      level: 2,
      preview: true,
      prompt:
        'ViewModel に `Keyword`（string）、`ResultCount`（int）、`SearchCommand` があるとする。① `TextBox` の `Text` を `Keyword` に、**1 文字入力するたびに**ソースへ反映されるようバインドする。② `TextBlock` に `ResultCount` を「`12 件`」の形で表示する（`StringFormat`）。③ `Button` の `Command` を `SearchCommand` にバインドする。',
      starter: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="検索" Width="320" Height="170">
    <StackPanel Margin="16">
        <TextBox />
        <Button Content="検索" Margin="0,8,0,8" HorizontalAlignment="Left" Padding="16,4" />
        <TextBlock />
    </StackPanel>
</Window>`,
      solution: `<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="検索" Width="320" Height="170">
    <StackPanel Margin="16">
        <TextBox Text="{Binding Keyword, UpdateSourceTrigger=PropertyChanged}" />
        <Button Content="検索" Margin="0,8,0,8" HorizontalAlignment="Left" Padding="16,4"
                Command="{Binding SearchCommand}" />
        <TextBlock Text="{Binding ResultCount, StringFormat={}{0} 件}" />
    </StackPanel>
</Window>`,
      solutionNote:
        '`TextBox.Text` は既定で `TwoWay` なので `Mode` は書かなくてよい。`StringFormat` が `{` で始まるときは、先頭に `{}` を置いてマークアップ拡張と区別する。プレビューではバインディングは評価されず、式がそのまま表示される。',
      hints: ['入力のたびに反映するには `UpdateSourceTrigger=PropertyChanged`。', '`StringFormat={}{0} 件` のように、`{}` を先頭に置く。', 'コマンドは `Command="{Binding SearchCommand}"`。'],
      checks: [
        { label: 'TextBox.Text が Keyword にバインドされている', test: (c) => c.els('TextBox').some((n) => bindsTo(a(n, 'Text'), 'Keyword')) },
        { label: 'UpdateSourceTrigger=PropertyChanged が指定されている', test: (c) => c.els('TextBox').some((n) => hasOption(a(n, 'Text'), 'UpdateSourceTrigger', 'PropertyChanged')) },
        { label: 'TextBox の Mode が OneWay / OneTime になっていない', test: (c) => c.els('TextBox').every((n) => !/Mode\s*=\s*(OneWay\b|OneTime)/.test(a(n, 'Text') ?? '')) },
        { label: 'TextBlock.Text が ResultCount にバインドされ、StringFormat に {0} と「件」がある', test: (c) => c.els('TextBlock').some((n) => bindsTo(a(n, 'Text'), 'ResultCount') && /StringFormat\s*=.*\{0[^}]*\}.*件/.test(a(n, 'Text') ?? '')) },
        { label: 'Button.Command が SearchCommand にバインドされている', test: (c) => c.els('Button').some((n) => bindsTo(a(n, 'Command'), 'SearchCommand')) },
      ],
    },
    {
      id: 'ex-bind-inpc',
      title: 'INotifyPropertyChanged を実装する',
      lang: 'csharp',
      level: 2,
      prompt:
        '`TaskItem` クラスに `INotifyPropertyChanged` を実装しよう。`Title` プロパティは、**値が実際に変わったときだけ** `PropertyChanged` を発生させること。ライブラリは使わず、このクラスだけで完結させる。',
      starter: `using System.ComponentModel;

public class TaskItem
{
    private string _title = string.Empty;

    public string Title
    {
        get => _title;
        set => _title = value;
    }
}`,
      solution: `using System.ComponentModel;

public class TaskItem : INotifyPropertyChanged
{
    private string _title = string.Empty;

    public event PropertyChangedEventHandler? PropertyChanged;

    public string Title
    {
        get => _title;
        set
        {
            if (_title == value)
            {
                return;
            }

            _title = value;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Title)));
        }
    }
}`,
      solutionNote:
        '同じ値の代入で通知しないのは、無駄な再描画を防ぐためと、双方向バインディングで通知が行き来し続けるのを防ぐため。プロパティ名は文字列の直書きではなく `nameof` を使うと、名前を変えたときに追従する。',
      hints: ['クラス宣言に `: INotifyPropertyChanged` を付け、`public event PropertyChangedEventHandler? PropertyChanged;` を宣言する。', 'setter の先頭で `if (_title == value) return;` と比較する。', '`PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Title)));`'],
      checks: [
        { label: 'クラスが INotifyPropertyChanged を実装している', test: (c) => c.has(/class TaskItem\s*:\s*[^{]*\bINotifyPropertyChanged\b/) },
        { label: 'PropertyChanged イベントを宣言している', test: (c) => c.has(/public event PropertyChangedEventHandler\??\s+PropertyChanged\s*;/) },
        { label: 'setter で値が同じかどうかを比較している', test: (c) => c.has(/_title\s*(==|!=)\s*value|value\s*(==|!=)\s*_title|Equals\s*\(\s*_title\s*,\s*value\s*\)|Equals\s*\(\s*value\s*,\s*_title\s*\)|_title\.Equals\s*\(\s*value|string\.Equals\s*\(/) },
        { label: 'フィールドに値を代入している', test: (c) => c.has(/_title\s*=\s*value\s*;/) },
        { label: 'プロパティ名 Title を指定して PropertyChanged を発生させている', test: (c) => c.has(/PropertyChanged\s*\?\s*\.\s*Invoke\s*\(\s*this\s*,\s*new\s+PropertyChangedEventArgs\s*\(\s*(nameof\s*\(\s*Title\s*\)|"Title")\s*\)\s*\)/) || (c.has(/\[CallerMemberName\]/) && c.has(/PropertyChanged\s*\?\s*\.\s*Invoke/)) },
      ],
    },
    {
      id: 'ex-bind-toolkit',
      title: 'CommunityToolkit.Mvvm で書き直す',
      lang: 'csharp',
      level: 2,
      prompt:
        '手書きの ViewModel を、CommunityToolkit.Mvvm の属性を使って書き直そう。① クラスを `partial` にして `ObservableObject` を継承する、② `Query` プロパティを `[ObservableProperty]` 付きのフィールドに置き換える、③ `Search` メソッドに `[RelayCommand]` を付ける（`SearchCommand` が自動生成される）。',
      starter: `using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public class SearchViewModel
{
    public string Query { get; set; } = string.Empty;

    private void Search()
    {
        // 検索処理…
    }
}`,
      solution: `using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class SearchViewModel : ObservableObject
{
    [ObservableProperty]
    private string _query = string.Empty;

    [RelayCommand]
    private void Search()
    {
        // 検索処理…
    }
}`,
      solutionNote:
        'フィールド `_query` から、変更通知つきの `Query` プロパティが生成される（先頭の `_` を除き、頭文字を大文字にした名前）。XAML からは `{Binding Query}` と `{Binding SearchCommand}` でバインドできる。',
      hints: ['ソースジェネレーターが同じクラスの続きを生成するので、`partial` が必須。', 'フィールド名は `_query`（または `query`）。プロパティ名 `Query` は自動で決まる。'],
      checks: [
        { label: 'クラスが partial で、ObservableObject を継承している', test: (c) => c.has(/public\s+partial\s+class\s+SearchViewModel\s*:\s*ObservableObject\b/) },
        { label: '[ObservableProperty] が付いたフィールド（_query など）がある', test: (c) => c.has(/\[ObservableProperty\]\s*(\[[^\]]+\]\s*)*private\s+string\??\s+_?query\b/) },
        { label: '手書きの Query プロパティが残っていない', test: (c) => !c.has(/public\s+string\??\s+Query\s*\{/) },
        { label: 'Search メソッドに [RelayCommand] が付いている', test: (c) => c.has(/\[RelayCommand(\([^)]*\))?\]\s*private\s+(async\s+Task|void)\s+Search(Async)?\s*\(/) },
      ],
    },
  ],
}

export default chapter
