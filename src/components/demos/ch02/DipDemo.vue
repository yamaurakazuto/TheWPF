<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * DIP と物理ピクセルの関係を、ピクセル格子の拡大図で確かめるデモ。
 * 四角形（左上 2,1 DIP・幅 5 DIP・高さ 3 DIP）を、表示倍率ごとに物理ピクセルへ写す。
 * 端がピクセルの途中に来ると、その画素は「半分だけ」塗られてにじんで見える。
 */
const SCALES = [1, 1.25, 1.5, 2]
const scale = ref(1.25)
const rounding = ref(false)

const RECT = { x: 2, y: 1, w: 5, h: 3 } // DIP
const COLS = 16
const ROWS = 9
const CELL = 36

const edges = computed(() => {
  const snap = (v: number) => (rounding.value ? Math.round(v) : v)
  const s = scale.value
  return {
    l: snap(RECT.x * s),
    t: snap(RECT.y * s),
    r: snap((RECT.x + RECT.w) * s),
    b: snap((RECT.y + RECT.h) * s),
  }
})

const overlap = (cellStart: number, a: number, b: number) => Math.max(0, Math.min(cellStart + 1, b) - Math.max(cellStart, a))

const cells = computed(() => {
  const e = edges.value
  const out: { x: number; y: number; cover: number }[] = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cover = overlap(x, e.l, e.r) * overlap(y, e.t, e.b)
      if (cover > 0) out.push({ x, y, cover })
    }
  }
  return out
})

const blurry = computed(() => cells.value.some((c) => c.cover < 0.999))
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''))
const dpi = computed(() => Math.round(96 * scale.value))
</script>

<template>
  <div class="dip">
    <div class="controls">
      <div class="seg" role="group" aria-label="表示倍率">
        <button v-for="s in SCALES" :key="s" type="button" :aria-pressed="scale === s" @click="scale = s">{{ s * 100 }}%</button>
      </div>
      <label class="check"><input v-model="rounding" type="checkbox" /> <code>UseLayoutRounding="True"</code></label>
    </div>

    <p class="dip__formula">
      物理ピクセル = DIP × (DPI ÷ 96)
      <span>いまは {{ dpi }} DPI なので 1 DIP = <b>{{ fmt(scale) }}</b> px。<code>Width="100"</code> は <b>{{ fmt(100 * scale) }}</b> px になる。</span>
    </p>

    <svg :viewBox="`0 0 ${COLS * CELL + 2} ${ROWS * CELL + 30}`" role="img" :aria-label="`ピクセル格子の拡大図。倍率 ${scale * 100}%。${blurry ? '端がにじんでいる' : '端はくっきりしている'}`">
      <g transform="translate(1 1)">
        <!-- 塗られる画素（濃さ = 覆われた割合） -->
        <rect v-for="c in cells" :key="`${c.x}-${c.y}`" :x="c.x * CELL" :y="c.y * CELL" :width="CELL" :height="CELL" fill="var(--accent)" :opacity="c.cover" />
        <!-- 物理ピクセルの格子 -->
        <g stroke="var(--line)" stroke-width="1">
          <line v-for="x in COLS + 1" :key="`v${x}`" :x1="(x - 1) * CELL" :x2="(x - 1) * CELL" y1="0" :y2="ROWS * CELL" />
          <line v-for="y in ROWS + 1" :key="`h${y}`" x1="0" :x2="COLS * CELL" :y1="(y - 1) * CELL" :y2="(y - 1) * CELL" />
        </g>
        <!-- 理論上の四角形の輪郭 -->
        <rect :x="edges.l * CELL" :y="edges.t * CELL" :width="(edges.r - edges.l) * CELL" :height="(edges.b - edges.t) * CELL" fill="none" stroke="var(--c-danger)" stroke-width="2" stroke-dasharray="6 4" />
        <text x="0" :y="ROWS * CELL + 20" class="svg-t2">1 マス = 物理ピクセル 1 個　／　赤い破線 = 計算上の四角形の位置</text>
      </g>
    </svg>

    <dl class="dip__calc">
      <div>
        <dt>左端</dt>
        <dd>{{ RECT.x }} DIP × {{ fmt(scale) }} = <b>{{ fmt(RECT.x * scale) }}</b> px<template v-if="rounding && !Number.isInteger(RECT.x * scale)"> → 丸めて {{ edges.l }}</template></dd>
      </div>
      <div>
        <dt>右端</dt>
        <dd>{{ RECT.x + RECT.w }} DIP × {{ fmt(scale) }} = <b>{{ fmt((RECT.x + RECT.w) * scale) }}</b> px<template v-if="rounding && !Number.isInteger((RECT.x + RECT.w) * scale)"> → 丸めて {{ edges.r }}</template></dd>
      </div>
      <div>
        <dt>結果</dt>
        <dd :class="blurry ? 'is-ng' : 'is-ok'">
          {{ blurry ? '端がピクセルの途中にあり、半端に塗られた画素が出る（にじみ）' : 'すべての端がピクセル境界に乗っている（くっきり）' }}
        </dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.dip {
  display: grid;
  gap: var(--sp-3);
}
.dip__formula {
  padding: 10px 14px;
  border-radius: var(--radius-m);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  font-family: var(--font-mono);
  font-weight: 700;
  line-height: 1.6;
}
.dip__formula span {
  display: block;
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: var(--fs-sm);
}
.dip svg {
  width: 100%;
  height: auto;
  max-width: 580px;
  background: var(--bg);
}
.dip__calc {
  margin: 0;
  display: grid;
  gap: 4px;
  font-size: var(--fs-sm);
}
.dip__calc div {
  display: grid;
  grid-template-columns: 3.5em minmax(0, 1fr);
  gap: 8px;
}
.dip__calc dt {
  font-weight: 700;
  color: var(--ink-3);
}
.dip__calc dd {
  margin: 0;
}
.is-ng {
  color: var(--c-danger);
  font-weight: 700;
}
.is-ok {
  color: var(--c-data);
  font-weight: 700;
}
</style>
