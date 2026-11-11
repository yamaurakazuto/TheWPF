<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * UI 仮想化のデモ。
 * 「データの件数」と「実際に作られる UI コンテナの数」の関係を、スクロールしながら確かめる。
 * 仮想化 ON では、表示範囲とその前後のキャッシュ分だけコンテナが作られる。
 * Recycling モードでは、画面外に出たコンテナが次の項目に使い回される（コンテナ番号が再利用される）。
 */
const COUNTS = [1_000, 10_000, 100_000]
const VISIBLE = 8 // 画面に見える行数
const CACHE = 8 // 前後に余分に作っておく行数（既定の CacheLength は 1 ページ分）
/** 1 行あたりのビジュアル要素数の仮定（ListBoxItem + Border + ContentPresenter + 行テンプレートの中身） */
const VISUALS_PER_ROW = 12

const count = ref(10_000)
const virtualizing = ref(true)
const mode = ref<'Standard' | 'Recycling'>('Standard')
const first = ref(0)

const maxFirst = computed(() => count.value - VISIBLE)
const range = computed(() => ({
  from: Math.max(0, first.value - CACHE),
  to: Math.min(count.value - 1, first.value + VISIBLE - 1 + CACHE),
}))

// index → コンテナ番号
const realized = ref(new Map<number, number>())
const created = ref(0)
let free: number[] = []

function reset() {
  realized.value = new Map()
  created.value = 0
  free = []
  first.value = 0
  sync()
}

function sync() {
  if (!virtualizing.value) return
  const { from, to } = range.value
  const next = new Map<number, number>()
  // 範囲外に出たコンテナを回収する
  for (const [index, id] of realized.value) {
    if (index >= from && index <= to) next.set(index, id)
    else if (mode.value === 'Recycling') free.push(id)
  }
  // 新しく範囲に入った項目にコンテナを割り当てる
  for (let i = from; i <= to; i++) {
    if (next.has(i)) continue
    const reused = mode.value === 'Recycling' ? free.pop() : undefined
    next.set(i, reused ?? ++created.value)
  }
  realized.value = next
}

watch(first, sync)
watch([count, virtualizing, mode], reset, { immediate: true })

const containers = computed(() => (virtualizing.value ? realized.value.size : count.value))
const everCreated = computed(() => (virtualizing.value ? created.value : count.value))
const rows = computed(() => Array.from({ length: VISIBLE }, (_, k) => first.value + k))
const fmt = (n: number) => n.toLocaleString('ja-JP')

// ミニマップ（全件に対する、コンテナが存在する範囲）
const mapTop = computed(() => (range.value.from / count.value) * 100)
const mapHeight = computed(() => Math.max(1.2, ((range.value.to - range.value.from + 1) / count.value) * 100))
const viewTop = computed(() => (first.value / count.value) * 100)
</script>

<template>
  <div class="vz">
    <div class="controls">
      <div class="seg" role="group" aria-label="データの件数">
        <button v-for="c in COUNTS" :key="c" type="button" :aria-pressed="count === c" @click="count = c">{{ fmt(c) }} 件</button>
      </div>
      <label class="check"><input v-model="virtualizing" type="checkbox" /> UI 仮想化</label>
      <div class="seg" role="group" aria-label="VirtualizationMode" :class="{ 'is-disabled': !virtualizing }">
        <button type="button" :disabled="!virtualizing" :aria-pressed="mode === 'Standard'" @click="mode = 'Standard'">Standard</button>
        <button type="button" :disabled="!virtualizing" :aria-pressed="mode === 'Recycling'" @click="mode = 'Recycling'">Recycling</button>
      </div>
    </div>

    <div class="vz__grid">
      <div class="vz__list" aria-label="リストの表示範囲">
        <div class="vz__viewport">
          <div v-for="i in rows" :key="i" class="vz__row">
            <span class="mono">項目 {{ fmt(i + 1) }}</span>
            <span v-if="virtualizing" class="vz__cid" :title="'この行を表示している UI コンテナの通し番号'">コンテナ #{{ realized.get(i) }}</span>
          </div>
        </div>
        <label class="vz__scroll">
          <span>スクロール位置（{{ fmt(first + 1) }} 件目〜）</span>
          <input v-model.number="first" type="range" min="0" :max="maxFirst" step="1" />
        </label>
        <div class="controls">
          <button class="btn btn--sm" type="button" :disabled="first >= maxFirst" @click="first = Math.min(maxFirst, first + 1)">1 行送る</button>
          <button class="btn btn--sm" type="button" :disabled="first >= maxFirst" @click="first = Math.min(maxFirst, first + VISIBLE)">1 ページ送る</button>
          <button class="btn btn--sm btn--ghost" type="button" @click="reset">先頭に戻す</button>
        </div>
      </div>

      <div class="vz__map" aria-hidden="true">
        <div class="vz__bar" :class="{ 'is-all': !virtualizing }">
          <span v-if="virtualizing" class="vz__realized" :style="{ top: mapTop + '%', height: mapHeight + '%' }" />
          <span class="vz__view" :style="{ top: viewTop + '%' }" />
        </div>
        <small>全 {{ fmt(count) }} 件</small>
      </div>

      <dl class="vz__stats" aria-live="polite">
        <div :class="{ 'is-bad': !virtualizing }">
          <dt>いま存在する UI コンテナ</dt>
          <dd>{{ fmt(containers) }} <small>個</small></dd>
        </div>
        <div :class="{ 'is-bad': !virtualizing }">
          <dt>ビジュアル要素の概算</dt>
          <dd>{{ fmt(containers * VISUALS_PER_ROW) }} <small>個（1 行 {{ VISUALS_PER_ROW }} 個と仮定）</small></dd>
        </div>
        <div>
          <dt>これまでに生成したコンテナの累計</dt>
          <dd>{{ fmt(everCreated) }} <small>個</small></dd>
        </div>
        <p v-if="!virtualizing" class="vz__msg is-bad">
          全件分のコンテナが、表示の瞬間にまとめて作られる。件数に比例して、起動時間もメモリも増える。
        </p>
        <p v-else-if="mode === 'Standard'" class="vz__msg">
          件数を増やしても、存在するコンテナは最大 {{ VISIBLE + CACHE * 2 }} 個のまま。ただしスクロールのたびに新しいコンテナを作っては捨てるので、累計は増え続ける。
        </p>
        <p v-else class="vz__msg is-good">
          画面外に出たコンテナを次の項目に使い回すので、累計も増えない。行の「コンテナ #」が同じ番号の繰り返しになっているのがその証拠。
        </p>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.vz {
  display: grid;
  gap: var(--sp-3);
  container-type: inline-size;
}
.seg.is-disabled {
  opacity: 0.5;
}
.vz__grid {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: minmax(0, 1fr) 46px;
}
@container (min-width: 700px) {
  .vz__grid {
    grid-template-columns: minmax(0, 1fr) 46px minmax(0, 1fr);
  }
}
.vz__list {
  display: grid;
  gap: var(--sp-2);
  min-width: 0;
}
.vz__viewport {
  border: 1px solid #abadb3;
  background: #fff;
  color: #17171f;
  display: grid;
}
.vz__row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 10px;
  font-size: var(--fs-sm);
  border-bottom: 1px solid #ececf2;
}
.vz__row:last-child {
  border-bottom: 0;
}
.vz__cid {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: #5235c9;
  background: #ebe7fb;
  border-radius: 999px;
  padding: 0 8px;
}
.vz__scroll {
  display: grid;
  gap: 2px;
  font-size: var(--fs-xs);
  color: var(--ink-2);
}
.vz__map {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 4px;
  justify-items: center;
  font-size: 0.625rem;
  color: var(--ink-3);
  text-align: center;
  line-height: 1.3;
}
.vz__bar {
  position: relative;
  width: 22px;
  min-height: 220px;
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  background: var(--bg-sunken);
  overflow: hidden;
}
.vz__bar.is-all {
  background: var(--c-danger);
}
.vz__realized {
  position: absolute;
  left: 0;
  right: 0;
  background: var(--c-data);
}
.vz__view {
  position: absolute;
  left: -2px;
  right: -2px;
  height: 3px;
  background: var(--ink);
}
.vz__stats {
  margin: 0;
  display: grid;
  gap: var(--sp-2);
  align-content: start;
  grid-column: 1 / -1;
}
@container (min-width: 700px) {
  .vz__stats {
    grid-column: auto;
  }
}
.vz__stats > div {
  padding: 8px 12px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  background: var(--bg);
}
.vz__stats > div.is-bad {
  border-color: var(--c-danger);
  background: var(--c-danger-soft);
}
.vz__stats dt {
  font-size: var(--fs-xs);
  color: var(--ink-2);
}
.vz__stats dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
}
.vz__stats dd small {
  font-family: var(--font-sans);
  font-size: var(--fs-xs);
  font-weight: 400;
  color: var(--ink-3);
}
.vz__msg {
  font-size: var(--fs-sm);
  line-height: 1.7;
  padding-left: 10px;
  border-left: 3px solid var(--line-strong);
}
.vz__msg.is-bad {
  border-left-color: var(--c-danger);
}
.vz__msg.is-good {
  border-left-color: var(--c-data);
}
</style>
