import type { GlossaryEntry } from '@/types/content'

/**
 * 用語集。本文から [[id]] で参照するとツールチップになる。
 * desc は「初めて見た人が 1 行で意味をつかめる」ことを基準に書く。
 */
export const glossary: GlossaryEntry[] = [
  // ── 基本 ──
  { id: 'xaml', term: 'XAML', alt: 'Extensible Application Markup Language（ザムル）', desc: 'オブジェクトの生成とプロパティ設定を XML で書くための言語。WPF では画面定義に使う。', chapter: 'history' },
  { id: 'baml', term: 'BAML', alt: 'Binary Application Markup Language', desc: 'XAML をビルド時にバイナリ化したもの。アセンブリに埋め込まれ、実行時に読み込まれる。', chapter: 'foundation' },
  { id: 'code-behind', term: 'コードビハインド', alt: 'code-behind', desc: 'XAML と対になる .xaml.cs ファイル。x:Class で同じクラスの片割れ（partial）として結合される。', chapter: 'foundation' },
  { id: 'sdk-style', term: 'SDK スタイル', alt: 'SDK-style project', desc: '<Project Sdk="..."> で始まる簡潔な csproj 形式。.NET Core 以降の標準。', chapter: 'foundation' },
  { id: 'build-action', term: 'ビルドアクション', alt: 'Build Action', desc: 'ファイルをビルド時にどう扱うかの指定（Page / Resource / Content など）。csproj の項目種別に対応する。', chapter: 'foundation' },
  { id: 'tfm', term: 'TFM', alt: 'Target Framework Moniker', desc: '対象フレームワークを表す短い名前。WPF なら net10.0-windows のように -windows が付く。', chapter: 'foundation' },

  // ── 描画・アーキテクチャ ──
  { id: 'retained-mode', term: 'retained mode', alt: '保持モード', desc: '「何を描くか」の情報をフレームワークが保持し、再描画をフレームワークが行う方式。対義は immediate mode。', chapter: 'architecture' },
  { id: 'milcore', term: 'milcore', alt: 'Media Integration Layer', desc: 'WPF の描画を担うネイティブ（アンマネージド）コンポーネント。DirectX を使って合成する。', chapter: 'architecture' },
  { id: 'render-thread', term: 'レンダースレッド', alt: 'Composition / Render thread', desc: 'UI スレッドとは別に動く描画専用スレッド。アプリのコードはここでは走らない。', chapter: 'architecture' },
  { id: 'dip', term: 'DIP', alt: 'Device Independent Pixel（デバイス非依存ピクセル）', desc: 'WPF の長さの単位。1 DIP = 1/96 インチ。画面の DPI に応じて実ピクセル数へ換算される。', chapter: 'architecture' },
  { id: 'hwnd', term: 'HWND', alt: 'ウィンドウハンドル', desc: 'Win32 がウィンドウを識別する値。WPF はウィンドウ 1 枚につき基本 1 つだけ HWND を持つ。', chapter: 'architecture' },
  { id: 'airspace', term: 'エアスペース問題', alt: 'airspace', desc: '1 つの画面領域は 1 つの描画技術しか所有できないという制約。WPF の上に WinForms を重ねると回り込みや透過ができない。', chapter: 'tradeoffs' },

  // ── ツリー ──
  { id: 'logical-tree', term: '論理ツリー', alt: 'Logical Tree', desc: 'XAML に書いたとおりの親子関係。リソース検索やプロパティ値継承の経路になる。', chapter: 'architecture' },
  { id: 'visual-tree', term: 'ビジュアルツリー', alt: 'Visual Tree', desc: 'テンプレートが展開された後の、実際に描画される要素すべての親子関係。', chapter: 'architecture' },
  { id: 'adorner', term: 'Adorner', alt: '装飾レイヤー', desc: '要素の上に重ねて描く装飾（検証エラーの赤枠、ドラッグハンドルなど）。AdornerLayer に載る。', chapter: 'architecture' },

  // ── プロパティ・イベント ──
  { id: 'dp', term: '依存関係プロパティ', alt: 'DependencyProperty', desc: 'WPF のプロパティシステムが値を管理するプロパティ。バインディング・スタイル・アニメーション・継承の対象になれる。', chapter: 'architecture' },
  { id: 'dependency-object', term: 'DependencyObject', desc: '依存関係プロパティを持てるオブジェクトの基底クラス。GetValue / SetValue を提供する。', chapter: 'architecture' },
  { id: 'attached', term: '添付プロパティ', alt: 'Attached Property', desc: '定義したクラス以外の要素に設定できる依存関係プロパティ。Grid.Row や DockPanel.Dock が代表例。', chapter: 'architecture' },
  { id: 'routed-event', term: 'ルーティングイベント', alt: 'Routed Event', desc: '発生した要素だけでなく、ツリーの親子に沿って伝わっていくイベント。', chapter: 'architecture' },
  { id: 'tunneling', term: 'トンネリング', alt: 'Tunneling', desc: 'ルートから発生元へ「降りていく」伝播。イベント名は Preview で始まる。', chapter: 'architecture' },
  { id: 'bubbling', term: 'バブリング', alt: 'Bubbling', desc: '発生元からルートへ「昇っていく」伝播。Click や MouseDown など多くのイベントがこれ。', chapter: 'architecture' },

  // ── レイアウト ──
  { id: 'measure', term: 'Measure', alt: '測定パス', desc: 'レイアウトの第 1 段階。親が「使える大きさ」を伝え、子が「欲しい大きさ（DesiredSize）」を答える。', chapter: 'architecture' },
  { id: 'arrange', term: 'Arrange', alt: '配置パス', desc: 'レイアウトの第 2 段階。親が各子に最終的な位置と大きさを与える。', chapter: 'architecture' },

  // ── リソース・スタイル ──
  { id: 'resource-dictionary', term: 'ResourceDictionary', desc: 'キーと値（ブラシ、スタイル、テンプレートなど）を入れておく辞書。要素・ウィンドウ・アプリの各階層に持てる。', chapter: 'foundation' },
  { id: 'static-resource', term: 'StaticResource', desc: 'リソースを読み込み時に 1 回だけ検索して値を埋め込む参照。あとで辞書を差し替えても追従しない。', chapter: 'foundation' },
  { id: 'dynamic-resource', term: 'DynamicResource', desc: 'リソースをキーで結び付けておき、辞書の変更に追従する参照。テーマ切り替えに使う。', chapter: 'foundation' },
  { id: 'pack-uri', term: 'pack URI', desc: 'アセンブリに埋め込んだファイルや配置したファイルを指す WPF 用の URI 書式。pack://application:,,,/… の形。', chapter: 'foundation' },
  { id: 'style', term: 'Style', desc: 'プロパティ設定（Setter）と条件付き設定（Trigger）をまとめて、複数の要素に適用する仕組み。', chapter: 'foundation' },
  { id: 'control-template', term: 'ControlTemplate', desc: 'コントロールの見た目（ビジュアルツリー）そのものを定義するテンプレート。動作は変えずに外観だけ差し替えられる。', chapter: 'foundation' },
  { id: 'data-template', term: 'DataTemplate', desc: 'データオブジェクトをどんな UI で表示するかを定義するテンプレート。リストの 1 行の見た目などに使う。', chapter: 'foundation' },
  { id: 'template-binding', term: 'TemplateBinding', desc: 'ControlTemplate の中から、適用先コントロール自身のプロパティ値を参照する軽量なバインディング。', chapter: 'foundation' },
  { id: 'trigger', term: 'Trigger', desc: 'プロパティ値やデータの状態が条件を満たす間だけ、Setter を適用する仕組み。', chapter: 'foundation' },
  { id: 'content-presenter', term: 'ContentPresenter', desc: 'ControlTemplate の中で「Content をここに表示する」という差し込み口になる要素。', chapter: 'foundation' },
  { id: 'user-control', term: 'UserControl', desc: '既存のコントロールを XAML で組み合わせて作る再利用部品。見た目の差し替えは想定しない。', chapter: 'practice' },
  { id: 'custom-control', term: 'カスタムコントロール', alt: 'Custom Control', desc: 'Control を継承し、見た目を Themes/Generic.xaml の既定スタイルで与える部品。テンプレート差し替えに対応できる。', chapter: 'practice' },

  // ── バインディング・MVVM ──
  { id: 'binding', term: 'データバインディング', alt: 'Data Binding', desc: 'UI のプロパティ（ターゲット）とデータのプロパティ（ソース）を結び、値を自動で同期する仕組み。', chapter: 'binding-mvvm' },
  { id: 'datacontext', term: 'DataContext', desc: 'バインディングの既定のソースになるオブジェクト。親から子へプロパティ値継承で引き継がれる。', chapter: 'binding-mvvm' },
  { id: 'inpc', term: 'INotifyPropertyChanged', alt: 'INPC', desc: '「このプロパティが変わった」を PropertyChanged イベントで知らせるインターフェイス。ソース→UI の更新に必要。', chapter: 'binding-mvvm' },
  { id: 'observable-collection', term: 'ObservableCollection<T>', desc: '要素の追加・削除を CollectionChanged イベントで通知するコレクション。リスト表示の自動更新に使う。', chapter: 'binding-mvvm' },
  { id: 'icommand', term: 'ICommand', desc: '「実行する処理」と「いま実行できるか」をひとまとめにしたインターフェイス。Button.Command にバインドする。', chapter: 'binding-mvvm' },
  { id: 'converter', term: '値コンバーター', alt: 'IValueConverter', desc: 'バインディングの途中でソースの値をターゲット用に変換する（逆変換もできる）クラス。', chapter: 'binding-mvvm' },
  { id: 'collection-view', term: 'コレクションビュー', alt: 'ICollectionView', desc: 'コレクションと UI の間に入り、並べ替え・絞り込み・グループ化・現在項目を管理する層。', chapter: 'binding-mvvm' },
  { id: 'mvvm', term: 'MVVM', alt: 'Model-View-ViewModel', desc: '画面（View）と画面用の状態・操作（ViewModel）をバインディングでつなぎ、ロジックを UI から切り離す設計パターン。', chapter: 'binding-mvvm' },
  { id: 'viewmodel', term: 'ViewModel', desc: '画面に出す状態とコマンドを公開するクラス。View の型を知らないので単体テストしやすい。', chapter: 'binding-mvvm' },
  { id: 'di', term: 'DI', alt: 'Dependency Injection（依存性の注入）', desc: '必要な部品を自分で new せず、外から渡してもらう設計。差し替えとテストが容易になる。', chapter: 'binding-mvvm' },
  { id: 'generic-host', term: '汎用ホスト', alt: 'Generic Host / IHost', desc: 'DI・設定・ログ・ライフサイクル管理をまとめて提供する .NET の仕組み。Microsoft.Extensions.Hosting。', chapter: 'binding-mvvm' },

  // ── スレッド ──
  { id: 'dispatcher', term: 'Dispatcher', desc: 'スレッドごとの作業キューを管理し、優先度順に 1 件ずつ実行するオブジェクト。WPF の UI スレッドの心臓部。', chapter: 'dispatcher' },
  { id: 'dispatcher-object', term: 'DispatcherObject', desc: '生成されたスレッド（の Dispatcher）に結び付くオブジェクトの基底クラス。別スレッドから触ると例外になる。', chapter: 'dispatcher' },
  { id: 'sta', term: 'STA', alt: 'Single-Threaded Apartment', desc: 'COM のスレッドモデルの 1 つ。WPF の UI スレッドは STA でなければならない（クリップボードや IME などが要求する）。', chapter: 'dispatcher' },
  { id: 'message-pump', term: 'メッセージポンプ', alt: 'メッセージループ', desc: 'OS から届くウィンドウメッセージを 1 件ずつ取り出して処理し続けるループ。UI スレッドの本体。', chapter: 'dispatcher' },
  { id: 'sync-context', term: 'SynchronizationContext', desc: '「元の場所に戻って続きを実行する」方法を抽象化したもの。await の後に UI スレッドへ戻れるのはこれのおかげ。', chapter: 'dispatcher' },
  { id: 'freezable', term: 'Freezable', desc: 'Freeze() で変更不可にできるオブジェクト（ブラシ、ジオメトリ、ビットマップなど）。凍結するとスレッド間で共有でき、軽くなる。', chapter: 'dispatcher' },
  { id: 'thread-affinity', term: 'スレッドアフィニティ', alt: 'thread affinity', desc: 'オブジェクトが特定のスレッドに所属し、そのスレッドからしか操作できないという性質。', chapter: 'dispatcher' },

  // ── 性能・配布 ──
  { id: 'ui-virtualization', term: 'UI 仮想化', alt: 'UI Virtualization', desc: '画面に見えている項目の分だけ UI 要素を作る仕組み。10 万件のリストでも要素は数十個で済む。', chapter: 'practice' },
  { id: 'container-recycling', term: 'コンテナリサイクル', alt: 'VirtualizationMode.Recycling', desc: '画面外に出た項目コンテナを捨てずに、次に表示する項目へ使い回す仕組み。', chapter: 'practice' },
  { id: 'weak-event', term: '弱いイベントパターン', alt: 'Weak Event Pattern', desc: 'イベント購読が購読者を生かし続けないようにする仕組み。WeakEventManager で実現する。', chapter: 'practice' },
  { id: 'msix', term: 'MSIX', desc: 'Windows のアプリパッケージ形式。クリーンなインストール / アンインストールと自動更新、ストア配布に対応する。', chapter: 'practice' },
  { id: 'clickonce', term: 'ClickOnce', desc: 'Web や共有フォルダーから 1 クリックでインストールでき、起動時に自動更新できる配布方式。', chapter: 'practice' },
  { id: 'self-contained', term: '自己完結型', alt: 'self-contained', desc: '.NET ランタイムごとアプリに同梱する発行方式。利用者の PC にランタイムが不要になる。', chapter: 'practice' },
  { id: 'framework-dependent', term: 'フレームワーク依存', alt: 'framework-dependent', desc: 'PC にインストール済みの .NET ランタイムを使う発行方式。配布物は小さいが、ランタイムの導入が前提。', chapter: 'practice' },
  { id: 'r2r', term: 'ReadyToRun', alt: 'R2R', desc: 'IL に加えて事前コンパイルしたネイティブコードも同梱し、起動時の JIT を減らす発行オプション。', chapter: 'practice' },
  { id: 'native-aot', term: 'Native AOT', desc: 'アプリ全体を事前にネイティブコードへコンパイルする発行方式。WPF は対応していない。', chapter: 'tradeoffs' },
  { id: 'trimming', term: 'トリミング', alt: 'IL trimming', desc: '使われていないコードを発行時に削って配布サイズを減らす機能。WPF では無効化されている。', chapter: 'tradeoffs' },

  // ── 周辺フレームワーク ──
  { id: 'silverlight', term: 'Silverlight', desc: 'ブラウザープラグインとして動いた XAML ベースの UI 技術。WPF のサブセットに近い。2021 年にサポート終了。', chapter: 'history' },
  { id: 'winrt', term: 'WinRT', alt: 'Windows Runtime', desc: 'Windows 8 で導入されたアプリ向け API 群。XAML UI を持つが WPF とは別実装。', chapter: 'history' },
  { id: 'uwp', term: 'UWP', alt: 'Universal Windows Platform', desc: 'Windows 10 のアプリモデル。サンドボックス上で動き、WinRT の XAML UI を使う。', chapter: 'history' },
  { id: 'winui3', term: 'WinUI 3', desc: 'Windows App SDK に含まれる、Microsoft の現行ネイティブ UI フレームワーク。Windows 10 / 11 向け。', chapter: 'history' },
  { id: 'maui', term: '.NET MAUI', alt: 'Multi-platform App UI', desc: 'Android / iOS / macOS / Windows 向けアプリを 1 つのコードで作る Microsoft のフレームワーク。Xamarin.Forms の後継。', chapter: 'history' },
  { id: 'avalonia', term: 'Avalonia', desc: 'WPF に近い書き味の、コミュニティ主導のクロスプラットフォーム XAML フレームワーク。独自レンダラーで描画する。', chapter: 'history' },
  { id: 'lts', term: 'LTS / STS', alt: 'Long / Standard Term Support', desc: '.NET のサポート種別。偶数バージョンが LTS（3 年）、奇数が STS（2 年）。', chapter: 'history' },
]

export const glossaryMap = new Map(glossary.map((g) => [g.id, g]))
