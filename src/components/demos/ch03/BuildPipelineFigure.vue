<script setup lang="ts">
import { ref } from 'vue'

/** XAML がビルドで何に変わるかの図。ノードを選ぶと説明が出る */
interface NodeDef {
  id: string
  x: number
  y: number
  w: number
  h: number
  title: string
  sub: string
  color: 'ui' | 'render' | 'warn' | 'data'
  desc: string
}
const nodes: NodeDef[] = [
  { id: 'xaml', x: 14, y: 52, w: 168, h: 50, title: 'MainWindow.xaml', sub: 'x:Class="MyApp.MainWindow"', color: 'ui', desc: 'あなたが書く XAML。ビルドアクションは Page。先頭の x:Class が「この XAML はどのクラスの片割れか」を指定している。' },
  { id: 'cs', x: 14, y: 250, w: 168, h: 50, title: 'MainWindow.xaml.cs', sub: 'partial class MainWindow', color: 'ui', desc: 'コードビハインド。partial class なので、自動生成される MainWindow.g.cs と合わさって 1 つのクラスになる。コンストラクターで InitializeComponent() を呼ぶのが決まり。' },
  { id: 'baml', x: 236, y: 52, w: 168, h: 50, title: 'MainWindow.baml', sub: 'バイナリ化した XAML', color: 'warn', desc: 'XAML を解析済みのバイナリ形式に変換したもの。実行時にテキストの XAML を解析し直さなくて済むので読み込みが速い。obj フォルダーに出力される中間ファイル。' },
  { id: 'gcs', x: 236, y: 150, w: 168, h: 50, title: 'MainWindow.g.cs', sub: 'partial class MainWindow', color: 'warn', desc: '自動生成される C#。InitializeComponent()（BAML を読み込む）、x:Name を付けた要素に対応するフィールド、XAML に書いたイベントハンドラーの接続コードが入っている。手で編集してはいけない。' },
  { id: 'dll', x: 458, y: 120, w: 168, h: 132, title: 'MyApp.dll', sub: '', color: 'data', desc: '最終的なアセンブリ。C# をコンパイルした MainWindow クラスと、MyApp.g.resources というリソースに埋め込まれた BAML の両方が入っている。実行時、InitializeComponent() がこの BAML を読んで要素の木を組み立てる。' },
]
const active = ref('gcs')
const cur = () => nodes.find((n) => n.id === active.value)!
</script>

<template>
  <div class="bp">
    <svg viewBox="0 0 640 316" role="group" aria-label="XAML のビルドの流れ">
      <defs>
        <marker id="bp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="var(--ink-3)" />
        </marker>
      </defs>

      <text x="14" y="26" class="svg-t2 svg-b">あなたが書く</text>
      <rect x="224" y="34" width="192" height="180" rx="10" fill="none" stroke="var(--c-warn)" stroke-dasharray="5 5" />
      <text x="236" y="26" class="svg-t2 svg-b" :style="{ fill: 'var(--c-warn)' }">obj/ に自動生成（中間ファイル）</text>
      <text x="458" y="108" class="svg-t2 svg-b" :style="{ fill: 'var(--c-data)' }">bin/ に出力</text>

      <!-- 矢印 -->
      <g fill="none" stroke="var(--ink-3)" stroke-width="1.6" marker-end="url(#bp-arrow)">
        <path d="M184 77H232" />
        <path d="M150 104C150 150 190 175 232 175" />
        <path d="M406 77C440 77 440 140 454 150" />
        <path d="M406 175H454" />
        <path d="M184 275C340 275 420 262 468 254" />
      </g>
      <text x="208" y="68" text-anchor="middle" class="svg-t2">①</text>
      <text x="186" y="150" text-anchor="middle" class="svg-t2">①</text>
      <text x="430" y="166" text-anchor="middle" class="svg-t2">②</text>
      <text x="330" y="292" text-anchor="middle" class="svg-t2">②</text>
      <text x="436" y="92" text-anchor="middle" class="svg-t2">③</text>

      <g
        v-for="n in nodes"
        :key="n.id"
        class="bp__node"
        role="button"
        tabindex="0"
        :aria-pressed="active === n.id"
        :aria-label="n.title"
        @click="active = n.id"
        @mouseenter="active = n.id"
        @focus="active = n.id"
      >
        <rect :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="8" :fill="`var(--c-${n.color}-soft)`" :stroke="`var(--c-${n.color})`" :stroke-width="active === n.id ? 3 : 1.5" />
        <text :x="n.x + 10" :y="n.y + 21" class="svg-mono svg-b">{{ n.title }}</text>
        <text v-if="n.sub" :x="n.x + 10" :y="n.y + 39" class="svg-t2" style="font-size: 11px; font-family: var(--font-mono)">{{ n.sub }}</text>
        <template v-if="n.id === 'dll'">
          <rect :x="n.x + 10" :y="n.y + 32" :width="n.w - 20" height="38" rx="5" fill="var(--bg-raised)" stroke="var(--c-data)" />
          <text :x="n.x + 18" :y="n.y + 48" class="svg-t2" style="font-size: 11px">クラス</text>
          <text :x="n.x + 18" :y="n.y + 63" class="svg-mono" style="font-size: 11.5px">MyApp.MainWindow</text>
          <rect :x="n.x + 10" :y="n.y + 78" :width="n.w - 20" height="44" rx="5" fill="var(--bg-raised)" stroke="var(--c-data)" />
          <text :x="n.x + 18" :y="n.y + 94" class="svg-mono" style="font-size: 11.5px">MyApp.g.resources</text>
          <text :x="n.x + 18" :y="n.y + 112" class="svg-mono" style="font-size: 11.5px">└ mainwindow.baml</text>
        </template>
      </g>
    </svg>

    <ol class="bp__legend">
      <li><b>①</b> XAML コンパイル（マークアップ コンパイル）</li>
      <li><b>②</b> C# コンパイル</li>
      <li><b>③</b> リソースとして埋め込み</li>
    </ol>
    <p class="bp__desc" aria-live="polite">
      <b class="mono">{{ cur().title }}</b>
      {{ cur().desc }}
    </p>
  </div>
</template>

<style scoped>
.bp {
  display: grid;
  gap: var(--sp-2);
}
.bp > svg {
  width: 100%;
  height: auto;
  max-width: 680px;
  justify-self: center;
}
.bp__node {
  cursor: pointer;
  outline: none;
}
.bp__node:focus-visible > rect:first-child {
  stroke: var(--focus);
  stroke-width: 3;
}
.bp__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 2px 18px;
  font-size: var(--fs-xs);
  color: var(--ink-2);
}
.bp__desc {
  min-height: 5.4em;
  padding: 10px 14px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  background: var(--bg);
  font-size: var(--fs-sm);
  line-height: 1.75;
}
.bp__desc b {
  display: block;
}
</style>
