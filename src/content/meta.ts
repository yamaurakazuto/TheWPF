import type { ChapterMeta } from '@/types/content'

/** 章のメタ情報。サイドバーとトップページはこれだけで描ける（本文は遅延ロード） */
export const chapterMetas: ChapterMeta[] = [
  {
    slug: 'history',
    no: 1,
    title: 'WPF の歴史',
    subtitle: 'Avalon 構想から .NET 10 / 11 まで',
    summary: 'WPF がなぜ生まれ、なぜ「停滞」と言われ、なぜ今も使われ続けているのかを年表でたどる。',
    minutes: 20,
    keywords: ['Avalon', '.NET Framework 3.0', 'Silverlight', 'オープンソース化'],
  },
  {
    slug: 'architecture',
    no: 2,
    title: 'WPF の仕組み',
    subtitle: '描画・ツリー・プロパティ・イベント・レイアウト',
    summary:
      '2 スレッド構成の描画、2 つのツリー、依存関係プロパティ、ルーティングイベント、レイアウトパスを図で理解する。',
    minutes: 35,
    keywords: ['retained mode', 'Visual Tree', 'DependencyProperty', 'Measure / Arrange'],
  },
  {
    slug: 'foundation',
    no: 3,
    title: '開発の土台',
    subtitle: 'csproj・App.xaml・リソース・スタイル・構成',
    summary: 'プロジェクトを開いたとき目に入るファイルと設定を、1 行ずつ意味がわかる状態にする。',
    minutes: 50,
    keywords: ['csproj', 'App.xaml', 'ResourceDictionary', 'ControlTemplate'],
  },
  {
    slug: 'binding-mvvm',
    no: 4,
    title: 'データバインディングと MVVM',
    subtitle: 'Binding の全要素から DI 統合まで',
    summary: 'Binding の動きを手で確かめ、通知・コマンド・検証・MVVM ライブラリ・デバッグ手順までを押さえる。',
    minutes: 40,
    keywords: ['Binding', 'INotifyPropertyChanged', 'ICommand', 'CommunityToolkit.Mvvm'],
  },
  {
    slug: 'dispatcher',
    no: 5,
    title: 'Dispatcher とスレッドモデル',
    subtitle: 'UI スレッドの上で起きていること',
    summary: 'メッセージポンプと優先度付きキューの動きを可視化し、async/await とデッドロックの理屈を理解する。',
    minutes: 40,
    keywords: ['Dispatcher', 'DispatcherPriority', 'async/await', 'Freezable'],
  },
  {
    slug: 'tradeoffs',
    no: 6,
    title: 'WPF の強み・弱み',
    subtitle: '根拠付きで、フェアに',
    summary: '強みと弱みを左右に並べ、最後に「選ぶべきか」を判断するフローで締める。',
    minutes: 20,
    keywords: ['技術選定', 'WinUI 3', 'Avalonia', '.NET MAUI'],
  },
  {
    slug: 'practice',
    no: 7,
    title: '実践ノウハウ',
    subtitle: '性能・デバッグ・テスト・配布・アンチパターン',
    summary: '現場で効く具体策。仮想化、メモリリーク、UI テストの現実、配布方式の選び方。',
    minutes: 45,
    keywords: ['UI 仮想化', 'Live Visual Tree', 'FlaUI', 'MSIX / ClickOnce'],
  },
  {
    slug: 'roadmap',
    no: 8,
    title: '学習ロードマップ',
    subtitle: '段階別の進め方と演習課題',
    summary: 'どの順で何を身につけるか。各段階のチェックリストと、手を動かす演習。',
    minutes: 25,
    keywords: ['学習順序', '演習', 'チェックリスト'],
  },
]

export function metaOf(slug: string): ChapterMeta {
  const m = chapterMetas.find((c) => c.slug === slug)
  if (!m) throw new Error(`unknown chapter: ${slug}`)
  return m
}
