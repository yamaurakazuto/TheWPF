/** 第 8 章の学習ロードマップ。段階ごとの到達目標・チェックリスト・課題 */
export interface Stage {
  id: string
  no: number
  title: string
  /** 目安の期間 */
  span: string
  goal: string
  /** できるようになったら印を付ける項目（id は localStorage のキーになるので変えない） */
  checks: { id: string; text: string }[]
  /** 手元で作る小さな課題 */
  task: string
  chapters: { slug: string; label: string }[]
  /** つまずきやすい点 */
  trap: string
}

export const stages: Stage[] = [
  {
    id: 'touch',
    no: 1,
    title: '触ってみる',
    span: '1〜2 週',
    goal: 'XAML で画面を組み、ボタンを押したら何かが起きるアプリを自力で作れる。',
    checks: [
      { id: 'touch-1', text: '`dotnet new wpf` またはVisual Studio で新規プロジェクトを作り、実行できる' },
      { id: 'touch-2', text: '`Grid` / `StackPanel` / `DockPanel` を使い分けて画面を配置できる' },
      { id: 'touch-3', text: '`Margin`・`Padding`・`HorizontalAlignment` の効き方を説明できる' },
      { id: 'touch-4', text: 'コードビハインドで `Click` イベントを処理できる' },
      { id: 'touch-5', text: 'csproj の各行と、`App.xaml` の役割を説明できる' },
    ],
    task: '単位変換ツール（例: 摂氏 ⇄ 華氏）を、コードビハインドだけで作る。入力欄 1 つ、ボタン 1 つ、結果表示 1 つ。',
    chapters: [
      { slug: 'history', label: '第 1 章' },
      { slug: 'foundation', label: '第 3 章' },
    ],
    trap: '最初から MVVM で作ろうとしない。まず「動くもの」を 1 つ作り、コードビハインドの不便さを体験してから次へ進むと、MVVM の意味がわかる。',
  },
  {
    id: 'mechanism',
    no: 2,
    title: '仕組みを知る',
    span: '2〜3 週',
    goal: '「なぜそう動くのか」を、ツリー・プロパティ・イベント・レイアウトの言葉で説明できる。',
    checks: [
      { id: 'mech-1', text: 'Live Visual Tree で、実行中のアプリのビジュアルツリーを調べられる' },
      { id: 'mech-2', text: '依存関係プロパティの値の優先順位（ローカル値 > トリガー > Setter）を説明できる' },
      { id: 'mech-3', text: 'トンネルとバブルの違い、`e.Handled` の効果を説明できる' },
      { id: 'mech-4', text: '`StackPanel` の中のリストがスクロールしない理由を説明できる' },
      { id: 'mech-5', text: 'リソースを定義し、`StaticResource` / `DynamicResource` を使い分けられる' },
      { id: 'mech-6', text: '暗黙スタイルと `BasedOn` で、アプリ全体の見た目を揃えられる' },
    ],
    task: '第 1 段階のツールに、ライト / ダークのテーマ切り替えを付ける（色を ResourceDictionary に出し、DynamicResource で参照する）。',
    chapters: [
      { slug: 'architecture', label: '第 2 章' },
      { slug: 'foundation', label: '第 3 章' },
    ],
    trap: 'ここを飛ばして先へ進むと、あとで「なぜか効かない」に何時間も使うことになる。地味だが、いちばん元が取れる段階。',
  },
  {
    id: 'mvvm',
    no: 3,
    title: 'MVVM で組む',
    span: '3〜4 週',
    goal: 'コードビハインドをほぼ空にしたまま、入力・一覧・検証のある画面を作れる。',
    checks: [
      { id: 'mvvm-1', text: '`INotifyPropertyChanged` を自分で実装でき、ライブラリが何を省いてくれるかがわかる' },
      { id: 'mvvm-2', text: '`Mode` と `UpdateSourceTrigger` を、目的に応じて指定できる' },
      { id: 'mvvm-3', text: '`ICommand` と `CanExecute` で、ボタンの有効 / 無効を制御できる' },
      { id: 'mvvm-4', text: '`ObservableCollection` と `DataTemplate` で一覧を表示できる' },
      { id: 'mvvm-5', text: '`INotifyDataErrorInfo`（`ObservableValidator`）で入力検証を付けられる' },
      { id: 'mvvm-6', text: '出力ウィンドウのバインディングエラーから原因を特定できる' },
      { id: 'mvvm-7', text: 'DI コンテナーで ViewModel とサービスを組み立てられる' },
    ],
    task: 'ToDo アプリを MVVM で作る（この章の最後に完成形のコードがある）。そのあと、項目の絞り込み（未完了のみ表示）を自力で足す。',
    chapters: [{ slug: 'binding-mvvm', label: '第 4 章' }],
    trap: '「コードビハインドに 1 行も書いてはいけない」と思い込まない。フォーカス移動のような見た目だけの処理は、コードビハインドに書いてよい。',
  },
  {
    id: 'responsive',
    no: 4,
    title: '止まらないアプリにする',
    span: '2〜3 週',
    goal: '重い処理や大量のデータがあっても、画面が固まらないアプリを作れる。',
    checks: [
      { id: 'resp-1', text: '`async` / `await` で、UI を止めずにファイルやネットワークの処理を呼べる' },
      { id: 'resp-2', text: '`.Result` でデッドロックする理由を説明できる' },
      { id: 'resp-3', text: '`IProgress<T>` で進捗を表示し、`CancellationToken` で中断できる' },
      { id: 'resp-4', text: '`DispatcherPriority` を、`Normal` / `Loaded` / `Background` で使い分けられる' },
      { id: 'resp-5', text: 'UI 仮想化が効いているかを確認でき、外れる原因を挙げられる' },
      { id: 'resp-6', text: 'イベント購読によるメモリリークを見つけて直せる' },
    ],
    task: 'フォルダー内の画像のサムネイル一覧を作る。画像の読み込みは別スレッドで行い（`Freeze()`）、数千枚でもスクロールが滑らかなことを確かめる。',
    chapters: [
      { slug: 'dispatcher', label: '第 5 章' },
      { slug: 'practice', label: '第 7 章' },
    ],
    trap: '「とりあえず Dispatcher.Invoke で包む」「とりあえず Task.Run に入れる」で済ませない。いまどのスレッドにいるのかを、常に言えるようにする。',
  },
  {
    id: 'ship',
    no: 5,
    title: '届けて、保守する',
    span: '継続',
    goal: 'テストがあり、配布でき、他人が保守できるアプリにする。技術選定の判断材料を説明できる。',
    checks: [
      { id: 'ship-1', text: 'ViewModel の単体テストを書ける' },
      { id: 'ship-2', text: '要件に合わせて、配布方式（自己完結型 / MSIX / ClickOnce）を選べる' },
      { id: 'ship-3', text: '`ControlTemplate` を書いて、標準コントロールの見た目を作り変えられる' },
      { id: 'ship-4', text: 'UserControl とカスタムコントロールを使い分けられる' },
      { id: 'ship-5', text: 'WPF に依存しない層を分け、依存の向きを保てる' },
      { id: 'ship-6', text: 'WPF の強みと弱みを、根拠とともに説明できる' },
    ],
    task: 'これまでに作ったアプリに、ViewModel のテストを 5 件足し、自己完結型の単一ファイルで発行して、別の PC で動かしてみる。',
    chapters: [
      { slug: 'tradeoffs', label: '第 6 章' },
      { slug: 'practice', label: '第 7 章' },
    ],
    trap: '配布は最後にまとめてやろうとすると、必ず何かが動かない。早い段階で一度、別の PC にインストールしてみる。',
  },
]
