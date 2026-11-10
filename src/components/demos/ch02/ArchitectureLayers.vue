<script setup lang="ts">
import { ref } from 'vue'

/** WPF を構成する層の図。層を選ぶと役割の説明が出る */
interface Layer {
  id: string
  name: string
  kind: 'app' | 'managed' | 'native' | 'os'
  short: string
  desc: string
}
const layers: Layer[] = [
  { id: 'app', name: 'あなたのアプリ', kind: 'app', short: 'XAML + C#', desc: 'あなたが書く XAML と C#。下の 3 つのマネージドアセンブリが公開する型（Window、Button、Binding など）を使って作る。' },
  { id: 'pf', name: 'PresentationFramework', kind: 'managed', short: 'コントロール・レイアウト・バインディング・スタイル', desc: '開発者が直接触れる層。Window、各種コントロール、パネル、データバインディング、スタイルとテンプレート、アニメーションの高レベル API がここにある。' },
  { id: 'pc', name: 'PresentationCore', kind: 'managed', short: 'Visual・入力・描画命令', desc: '描画の基本単位である Visual、UIElement、入力（マウス・キーボード・タッチ）、ブラシやジオメトリ、画像などの基礎。milcore との橋渡しもここが担う。' },
  { id: 'wb', name: 'WindowsBase', kind: 'managed', short: 'Dispatcher・DependencyObject', desc: 'UI に限らない土台。スレッドを管理する Dispatcher / DispatcherObject、依存関係プロパティの仕組み（DependencyObject / DependencyProperty）がここにある。' },
  { id: 'mil', name: 'milcore', kind: 'native', short: '合成エンジン（ネイティブ）', desc: 'Media Integration Layer。描画内容のコピー（合成ツリー）を持ち、専用のレンダースレッドで DirectX を使って 1 フレームを合成する。性能のためにネイティブコードで書かれている。' },
  { id: 'dx', name: 'DirectX', kind: 'os', short: 'GPU で描く', desc: 'Windows のグラフィックス API。WPF の描画は最終的にすべて DirectX を通る。GPU が使えない環境ではソフトウェア描画に切り替わる。' },
  { id: 'u32', name: 'User32', kind: 'os', short: 'ウィンドウとメッセージ', desc: 'ウィンドウ（HWND）の作成と、入力などのウィンドウメッセージを担当する Win32 の基本部品。WPF は「画面のどこを誰が所有するか」と「入力の受け取り」にだけ User32 を使う。' },
]
const active = ref('pf')
const current = () => layers.find((l) => l.id === active.value)!

const COLOR = { app: 'warn', managed: 'ui', native: 'render', os: 'mute' } as const
/** SVG 上の配置 */
const BOX: Record<string, { x: number; y: number; w: number; h: number }> = {
  app: { x: 60, y: 14, w: 520, h: 44 },
  pf: { x: 60, y: 82, w: 520, h: 48 },
  pc: { x: 60, y: 136, w: 520, h: 48 },
  wb: { x: 60, y: 190, w: 520, h: 48 },
  mil: { x: 60, y: 272, w: 520, h: 48 },
  dx: { x: 60, y: 344, w: 254, h: 46 },
  u32: { x: 326, y: 344, w: 254, h: 46 },
}
</script>

<template>
  <div class="arch">
    <svg viewBox="0 0 640 400" role="group" aria-label="WPF を構成する層">
      <!-- マネージド / ネイティブの境界 -->
      <rect x="44" y="70" width="552" height="178" rx="12" fill="none" stroke="var(--c-ui)" stroke-dasharray="5 5" />
      <text x="34" y="160" class="svg-t2 svg-b" text-anchor="middle" transform="rotate(-90 34 160)" :style="{ fill: 'var(--c-ui)' }">マネージド（.NET）</text>
      <rect x="44" y="260" width="552" height="72" rx="12" fill="none" stroke="var(--c-render)" stroke-dasharray="5 5" />
      <text x="34" y="296" class="svg-t2 svg-b" text-anchor="middle" transform="rotate(-90 34 296)" :style="{ fill: 'var(--c-render)' }">ネイティブ</text>
      <text x="34" y="368" class="svg-t2 svg-b" text-anchor="middle" transform="rotate(-90 34 368)">OS</text>

      <g
        v-for="l in layers"
        :key="l.id"
        class="arch__layer"
        :class="{ 'is-active': active === l.id }"
        role="button"
        tabindex="0"
        :aria-pressed="active === l.id"
        :aria-label="`${l.name}: ${l.short}`"
        @click="active = l.id"
        @mouseenter="active = l.id"
        @focus="active = l.id"
        @keydown.enter.prevent="active = l.id"
        @keydown.space.prevent="active = l.id"
      >
        <rect
          :x="BOX[l.id].x"
          :y="BOX[l.id].y"
          :width="BOX[l.id].w"
          :height="BOX[l.id].h"
          rx="8"
          :fill="`var(--c-${COLOR[l.kind]}-soft)`"
          :stroke="`var(--c-${COLOR[l.kind]})`"
          :stroke-width="active === l.id ? 3 : 1.5"
        />
        <text :x="BOX[l.id].x + 14" :y="BOX[l.id].y + BOX[l.id].h / 2 - 2" class="svg-t svg-b" :style="{ fontFamily: l.kind === 'app' ? undefined : 'var(--font-mono)' }">{{ l.name }}</text>
        <text :x="BOX[l.id].x + 14" :y="BOX[l.id].y + BOX[l.id].h / 2 + 15" class="svg-t2">{{ l.short }}</text>
      </g>
    </svg>
    <p class="arch__desc" aria-live="polite">
      <b :style="{ color: `var(--c-${COLOR[current().kind]})` }">{{ current().name }}</b>
      {{ current().desc }}
    </p>
  </div>
</template>

<style scoped>
.arch {
  display: grid;
  gap: var(--sp-3);
}
.arch svg {
  width: 100%;
  height: auto;
  max-width: 640px;
  justify-self: center;
}
.arch__layer {
  cursor: pointer;
  outline: none;
}
.arch__layer:focus-visible rect {
  stroke: var(--focus);
  stroke-width: 3;
}
.arch__desc {
  min-height: 5.4em;
  padding: 10px 14px;
  border-radius: var(--radius-m);
  background: var(--bg);
  border: 1px solid var(--line);
  font-size: var(--fs-sm);
  line-height: 1.75;
}
.arch__desc b {
  display: block;
  font-family: var(--font-mono);
}
</style>
