<script setup lang="ts">
import { computed, ref } from 'vue'

/** 推奨ディレクトリ構成のツリー。項目を選ぶと「何を置くか」が出る */
interface Item {
  path: string
  name: string
  depth: number
  kind: 'sln' | 'project' | 'folder' | 'file'
  desc: string
  tag?: string
}

const items: Item[] = [
  { path: 'sln', name: 'MyApp.sln', depth: 0, kind: 'sln', desc: 'ソリューション。下の 3 つのプロジェクトを束ねる。' },
  { path: 'app', name: 'src/MyApp/', depth: 0, kind: 'project', tag: 'WPF・net10.0-windows', desc: 'WPF アプリ本体。XAML と、XAML に近いコード（View、コンバーター、カスタムコントロール、ダイアログ表示などの UI サービス実装）を置く。WPF に依存してよいのはこのプロジェクトだけ、と決めると境界がはっきりする。' },
  { path: 'app/App.xaml', name: 'App.xaml / App.xaml.cs', depth: 1, kind: 'file', desc: 'アプリの入口。全体で共有するリソースの読み込み、DI コンテナーの構築、未処理例外の受け止めを行う。' },
  { path: 'app/csproj', name: 'MyApp.csproj / app.manifest', depth: 1, kind: 'file', desc: 'プロジェクト定義と、DPI 対応などを宣言するアプリケーションマニフェスト。' },
  { path: 'app/Views', name: 'Views/', depth: 1, kind: 'folder', desc: 'Window と UserControl（画面と画面の部品）。XAML とコードビハインドの組。コードビハインドには「見た目だけに関わる処理」しか書かない。' },
  { path: 'app/Controls', name: 'Controls/', depth: 1, kind: 'folder', desc: '複数の画面で使い回す自作コントロール。見た目を差し替えられる必要があるならカスタムコントロール、そうでなければ UserControl。' },
  { path: 'app/Converters', name: 'Converters/', depth: 1, kind: 'folder', desc: 'IValueConverter の実装。bool → Visibility のような、表示のための変換。' },
  { path: 'app/Themes', name: 'Themes/', depth: 1, kind: 'folder', desc: 'ResourceDictionary を置く。Colors.xaml（色）、Typography.xaml（文字）、Controls.xaml（コントロールのスタイル）のように役割で分け、App.xaml でマージする。カスタムコントロールの既定スタイルは Themes/Generic.xaml という決まった名前で置く。' },
  { path: 'app/Assets', name: 'Assets/', depth: 1, kind: 'folder', desc: '画像・アイコン・フォント。ビルドアクションは Resource にする。' },
  { path: 'app/Services', name: 'Services/', depth: 1, kind: 'folder', desc: 'UI に依存するサービスの実装。IDialogService の実装（MessageBox やファイルダイアログを出す）、画面遷移など。インターフェイスは Core 側に置く。' },
  { path: 'core', name: 'src/MyApp.Core/', depth: 0, kind: 'project', tag: 'クラスライブラリ・net10.0', desc: 'WPF を参照しないライブラリ。-windows の付かない net10.0 を対象にできるので、テストが速く、将来ほかの UI からも使える。ここに System.Windows.* の型が出てきたら設計を見直すサイン。' },
  { path: 'core/ViewModels', name: 'ViewModels/', depth: 1, kind: 'folder', desc: '画面の状態とコマンド。INotifyPropertyChanged と ICommand は WPF 固有ではない（System.ComponentModel / System.Windows.Input にあり、WPF なしで参照できる）ので、ここに置ける。' },
  { path: 'core/Models', name: 'Models/', depth: 1, kind: 'folder', desc: '業務データと業務ルール。UI のことは何も知らない。' },
  { path: 'core/Services', name: 'Services/', depth: 1, kind: 'folder', desc: 'データアクセスや外部 API 呼び出しなどのサービスと、そのインターフェイス。IDialogService のような「UI にお願いする」ためのインターフェイスもここに定義する。' },
  { path: 'tests', name: 'tests/MyApp.Core.Tests/', depth: 0, kind: 'project', tag: 'テスト・net10.0', desc: 'ViewModel と Model の単体テスト。Core が WPF に依存していないので、ウィンドウを 1 つも開かずに実行できる。' },
]

const active = ref('app/Themes')
const cur = computed(() => items.find((i) => i.path === active.value)!)
const ICON: Record<Item['kind'], string> = { sln: '◆', project: '▣', folder: '▸', file: '·' }
</script>

<template>
  <div class="ps">
    <ul class="ps__tree" role="listbox" aria-label="推奨ディレクトリ構成">
      <li v-for="it in items" :key="it.path" role="option" :aria-selected="active === it.path" tabindex="0" class="ps__item" :class="[`ps__item--${it.kind}`, { 'is-active': active === it.path }]" :style="{ '--d': it.depth }" @click="active = it.path" @mouseenter="active = it.path" @focus="active = it.path">
        <span class="ps__icon" aria-hidden="true">{{ ICON[it.kind] }}</span>
        <span class="ps__name">{{ it.name }}</span>
        <span v-if="it.tag" class="ps__tag">{{ it.tag }}</span>
      </li>
    </ul>
    <div class="ps__desc" aria-live="polite">
      <b class="mono">{{ cur.name }}</b>
      <p>{{ cur.desc }}</p>
    </div>
  </div>
</template>

<style scoped>
.ps {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  align-items: start;
}
.ps__tree {
  list-style: none;
  margin: 0;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg-code);
  display: grid;
  gap: 1px;
}
.ps__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  padding: 4px 8px 4px calc(8px + var(--d) * 22px);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  cursor: pointer;
  line-height: 1.5;
}
.ps__item:hover {
  background: var(--bg-sunken);
}
.ps__item.is-active {
  background: var(--accent-soft);
  box-shadow: inset 3px 0 0 var(--accent);
}
.ps__icon {
  width: 1em;
  color: var(--ink-3);
  text-align: center;
}
.ps__item--project {
  margin-top: 6px;
}
.ps__item--project .ps__name,
.ps__item--sln .ps__name {
  font-weight: 700;
}
.ps__item--project .ps__icon {
  color: var(--accent);
}
.ps__tag {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  padding: 0 7px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--ink-2);
  background: var(--bg-raised);
}
.ps__desc {
  position: sticky;
  top: calc(var(--header-h) + 12px);
  padding: 12px 16px;
  border-radius: var(--radius-m);
  border: 1px solid var(--accent-line);
  background: var(--bg);
  font-size: var(--fs-sm);
  line-height: 1.8;
  min-height: 9em;
}
.ps__desc b {
  color: var(--accent);
}
</style>
