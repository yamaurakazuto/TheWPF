<script setup lang="ts">
import { computed, ref } from 'vue'
import CodeBlock from '@/components/content/CodeBlock.vue'

/**
 * 同じ XAML を「論理ツリー」と「ビジュアルツリー」で並べて見せる。
 * ビジュアルツリーは既定テーマ（Aero2）のテンプレートを展開した結果。
 */
type Origin = 'xaml' | 'template' | 'generated' | 'value'
interface Node {
  key: string
  name: string
  depth: number
  origin: Origin
  note: string
}

const XAML = `<Window>
    <StackPanel>
        <TextBlock Text="お名前" />
        <Button Content="OK" />
    </StackPanel>
</Window>`

const logical: Node[] = [
  { key: 'window', name: 'Window', depth: 0, origin: 'xaml', note: 'XAML のルート要素。' },
  { key: 'stack', name: 'StackPanel', depth: 1, origin: 'xaml', note: 'Window.Content に入っているパネル。' },
  { key: 'text', name: 'TextBlock', depth: 2, origin: 'xaml', note: 'StackPanel.Children の 1 つ目。' },
  { key: 'button', name: 'Button', depth: 2, origin: 'xaml', note: 'StackPanel.Children の 2 つ目。' },
  { key: 'ok', name: '"OK"（String）', depth: 3, origin: 'value', note: 'Button.Content に入れた文字列。論理ツリーには、UI 要素ではないただのオブジェクトも子として現れる。' },
]

const visual: Node[] = [
  { key: 'window', name: 'Window', depth: 0, origin: 'xaml', note: 'ここは論理ツリーと同じ。' },
  { key: 'w-border', name: 'Border', depth: 1, origin: 'template', note: 'Window の ControlTemplate の一部。ウィンドウの背景を塗っている。XAML には書いていない。' },
  { key: 'w-adorner', name: 'AdornerDecorator', depth: 2, origin: 'template', note: 'Window のテンプレートの一部。装飾用のレイヤー（AdornerLayer）を用意する役目。' },
  { key: 'w-cp', name: 'ContentPresenter', depth: 3, origin: 'template', note: 'Window のテンプレート内の「Content をここに表示する」差し込み口。この下に、XAML に書いた中身がぶら下がる。' },
  { key: 'stack', name: 'StackPanel', depth: 4, origin: 'xaml', note: 'XAML に書いた要素。論理ツリーでは Window の直下だったが、ビジュアルツリーでは 3 階層深い。' },
  { key: 'text', name: 'TextBlock', depth: 5, origin: 'xaml', note: 'TextBlock はテンプレートを持たない要素なので、中身は展開されない。' },
  { key: 'button', name: 'Button', depth: 5, origin: 'xaml', note: 'Button はコントロールなので、テンプレートが展開される。' },
  { key: 'b-border', name: 'Border', depth: 6, origin: 'template', note: 'Button の ControlTemplate の一部。ボタンの背景と枠線を描いている。ホバー時に色が変わるのはこの Border。' },
  { key: 'b-cp', name: 'ContentPresenter', depth: 7, origin: 'template', note: 'Button のテンプレート内の差し込み口。Button.Content をここに表示する。' },
  { key: 'ok', name: 'TextBlock', depth: 8, origin: 'generated', note: 'Content が文字列だったので、ContentPresenter が表示用の TextBlock を自動で作った。論理ツリーの "OK" に対応する。' },
  { key: 'w-layer', name: 'AdornerLayer', depth: 3, origin: 'generated', note: 'AdornerDecorator が作る装飾用のレイヤー。入力検証の赤枠やフォーカス枠はここに描かれるので、他の要素より必ず手前に出る。' },
]

const ORIGIN: Record<Origin, { label: string; cls: string }> = {
  xaml: { label: 'XAML に書いた', cls: 'o-xaml' },
  template: { label: 'テンプレート由来', cls: 'o-template' },
  generated: { label: '自動生成', cls: 'o-generated' },
  value: { label: '値', cls: 'o-value' },
}

const view = ref<'both' | 'logical' | 'visual'>('both')
const hover = ref<string | null>(null)
const picked = ref<{ tree: 'logical' | 'visual'; key: string }>({ tree: 'visual', key: 'w-cp' })

const pickedNode = computed(() => (picked.value.tree === 'logical' ? logical : visual).find((n) => n.key === picked.value.key))
const trees = computed(() =>
  [
    { id: 'logical' as const, title: '論理ツリー', sub: 'XAML に書いた構造そのもの', nodes: logical, color: 'ui' },
    { id: 'visual' as const, title: 'ビジュアルツリー', sub: 'テンプレート展開後。実際に描かれる要素すべて', nodes: visual, color: 'render' },
  ].filter((t) => view.value === 'both' || view.value === t.id),
)
</script>

<template>
  <div class="tv">
    <CodeBlock :code="XAML" lang="xaml" title="この XAML が…" />

    <div class="controls">
      <div class="seg" role="group" aria-label="表示するツリー">
        <button type="button" :aria-pressed="view === 'both'" @click="view = 'both'">並べて表示</button>
        <button type="button" :aria-pressed="view === 'logical'" @click="view = 'logical'">論理ツリー</button>
        <button type="button" :aria-pressed="view === 'visual'" @click="view = 'visual'">ビジュアルツリー</button>
      </div>
      <ul class="tv__legend" aria-label="凡例">
        <li><span class="tv__tag o-xaml" />XAML に書いた</li>
        <li><span class="tv__tag o-template" />テンプレート由来</li>
        <li><span class="tv__tag o-generated" />自動生成</li>
      </ul>
    </div>

    <div class="tv__grid" :class="{ 'tv__grid--one': trees.length === 1 }">
      <section v-for="t in trees" :key="t.id" class="tv__tree" :style="{ '--tc': `var(--c-${t.color})`, '--tcs': `var(--c-${t.color}-soft)` }">
        <h4>
          {{ t.title }} <span class="tv__count">{{ t.nodes.length }} 個</span>
        </h4>
        <p class="tv__sub">{{ t.sub }}</p>
        <ul role="tree" :aria-label="t.title">
          <li
            v-for="n in t.nodes"
            :key="n.key"
            role="treeitem"
            :aria-level="n.depth + 1"
            :aria-selected="picked.tree === t.id && picked.key === n.key"
            tabindex="0"
            class="tv__node"
            :class="[ORIGIN[n.origin].cls, { 'is-linked': hover === n.key, 'is-picked': picked.tree === t.id && picked.key === n.key }]"
            :style="{ '--d': n.depth }"
            @mouseenter="hover = n.key"
            @mouseleave="hover = null"
            @focus="((hover = n.key), (picked = { tree: t.id, key: n.key }))"
            @blur="hover = null"
            @click="picked = { tree: t.id, key: n.key }"
          >
            <span class="tv__name">{{ n.name }}</span>
            <span v-if="n.origin !== 'xaml'" class="tv__chip">{{ ORIGIN[n.origin].label }}</span>
          </li>
        </ul>
      </section>
    </div>

    <p v-if="pickedNode" class="tv__note" aria-live="polite">
      <b>{{ pickedNode.name }}</b>（{{ picked.tree === 'logical' ? '論理ツリー' : 'ビジュアルツリー' }}）: {{ pickedNode.note }}
    </p>
  </div>
</template>

<style scoped>
.tv {
  display: grid;
  gap: var(--sp-3);
  container-type: inline-size;
}
.tv__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: var(--fs-xs);
  color: var(--ink-2);
}
.tv__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tv__tag {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 2px solid;
}
.tv__grid {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: minmax(0, 1fr);
}
@container (min-width: 640px) {
  .tv__grid:not(.tv__grid--one) {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  }
}
.tv__tree {
  border: 1px solid var(--tc);
  border-radius: var(--radius-m);
  padding: 12px;
  background: var(--bg);
  min-width: 0;
}
.tv__tree h4 {
  color: var(--tc);
  font-size: var(--fs-md);
}
.tv__count {
  margin-left: 6px;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--tcs);
}
.tv__sub {
  font-size: var(--fs-xs);
  color: var(--ink-3);
  margin-bottom: 8px;
}
.tv__tree ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 3px;
}
.tv__node {
  --indent: 16px;
  margin-left: calc(var(--d) * var(--indent));
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1.5px solid var(--line-strong);
  border-left-width: 4px;
  background: var(--bg-raised);
  font-size: var(--fs-sm);
  line-height: 1.5;
  cursor: pointer;
  position: relative;
}
/* 親とつなぐ線 */
.tv__node:not([aria-level='1'])::before {
  content: '';
  position: absolute;
  left: -13px;
  top: -4px;
  width: 9px;
  height: calc(50% + 4px);
  border-left: 1.5px solid var(--line-strong);
  border-bottom: 1.5px solid var(--line-strong);
  border-bottom-left-radius: 5px;
}
.tv__name {
  font-family: var(--font-mono);
  font-weight: 700;
}
.tv__chip {
  font-size: 0.6875rem;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--bg-sunken);
  color: var(--ink-2);
  white-space: nowrap;
}
.o-xaml {
  border-color: var(--c-ui);
}
.o-template {
  border-color: var(--c-warn);
  border-style: dashed;
  border-left-style: solid;
}
.o-generated {
  border-color: var(--c-render);
  border-style: dotted;
  border-left-style: solid;
}
.o-value {
  border-color: var(--c-mute);
}
.tv__node.is-linked {
  background: var(--accent-soft);
  box-shadow: 0 0 0 2px var(--accent);
}
.tv__node.is-picked {
  background: var(--accent-soft);
}
.tv__note {
  padding: 10px 14px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  background: var(--bg);
  font-size: var(--fs-sm);
  line-height: 1.75;
  min-height: 4.5em;
}
.tv__note b {
  font-family: var(--font-mono);
}
@container (max-width: 420px) {
  .tv__node {
    --indent: 9px;
  }
  .tv__node:not([aria-level='1'])::before {
    display: none;
  }
}
</style>
