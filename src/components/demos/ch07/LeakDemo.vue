<script setup lang="ts">
import { computed, ref } from 'vue'
import CodeBlock from '@/components/content/CodeBlock.vue'

/**
 * イベントハンドラーによるメモリリークを体験するデモ。
 * 長生きするオブジェクト（ThemeService）のイベントを、短命なウィンドウが購読する。
 * 購読を解除しないまま閉じると、ThemeService がウィンドウを参照し続け、GC しても回収されない。
 */
type Mode = 'leak' | 'unsubscribe' | 'weak'
const MODES: { id: Mode; label: string }[] = [
  { id: 'leak', label: '解除しない' },
  { id: 'unsubscribe', label: '閉じるときに -= で解除' },
  { id: 'weak', label: 'WeakEventManager で購読' },
]

interface Win {
  id: number
  open: boolean
  /** ThemeService から強い参照で握られているか */
  strong: boolean
  /** 弱い参照で購読しているか */
  weak: boolean
}

const mode = ref<Mode>('leak')
const wins = ref<Win[]>([])
const lastFire = ref<{ alive: number; ghosts: number } | null>(null)
let seq = 0
const MAX = 8

function openWindow() {
  if (wins.value.length >= MAX) return
  wins.value.push({ id: ++seq, open: true, strong: mode.value !== 'weak', weak: mode.value === 'weak' })
  lastFire.value = null
}
function closeWindow() {
  const w = wins.value.find((x) => x.open)
  if (!w) return
  w.open = false
  if (mode.value === 'unsubscribe') w.strong = false
  lastFire.value = null
}
function collect() {
  // 閉じていて、強い参照が残っていないものだけが回収される
  wins.value = wins.value.filter((w) => w.open || w.strong)
  lastFire.value = null
}
function fire() {
  const targets = wins.value.filter((w) => w.strong || w.weak)
  lastFire.value = { alive: targets.filter((w) => w.open).length, ghosts: targets.filter((w) => !w.open).length }
}
function setMode(m: Mode) {
  mode.value = m
  wins.value = []
  lastFire.value = null
  seq = 0
}

const openCount = computed(() => wins.value.filter((w) => w.open).length)
const leaked = computed(() => wins.value.filter((w) => !w.open && w.strong).length)
const collectable = computed(() => wins.value.filter((w) => !w.open && !w.strong).length)

const pos = (i: number) => ({ x: 262 + (i % 4) * 94, y: 34 + Math.floor(i / 4) * 112 })

const CODE: Record<Mode, string> = {
  leak: `public DetailWindow(ThemeService theme)
{
    InitializeComponent();
    // ThemeService（長生き）が、このウィンドウ（短命）のメソッドを覚える。
    // = ThemeService からウィンドウへの参照ができる
    theme.ThemeChanged += OnThemeChanged;
}
// 閉じても -= していないので、参照は残り続ける`,
  unsubscribe: `public DetailWindow(ThemeService theme)
{
    InitializeComponent();
    _theme = theme;
    _theme.ThemeChanged += OnThemeChanged;
    // 閉じるときに、必ず対で解除する
    Closed += (_, _) => _theme.ThemeChanged -= OnThemeChanged;
}`,
  weak: `public DetailWindow(ThemeService theme)
{
    InitializeComponent();
    // 弱い参照で購読する。ThemeService はウィンドウを生かし続けない
    WeakEventManager<ThemeService, EventArgs>.AddHandler(
        theme, nameof(ThemeService.ThemeChanged), OnThemeChanged);
}`,
}
</script>

<template>
  <div class="lk">
    <div class="seg" role="group" aria-label="購読のしかた">
      <button v-for="m in MODES" :key="m.id" type="button" :aria-pressed="mode === m.id" @click="setMode(m.id)">{{ m.label }}</button>
    </div>

    <svg viewBox="0 0 640 260" role="img" :aria-label="`開いているウィンドウ ${openCount} 個、リークしているウィンドウ ${leaked} 個`">
      <!-- 長生きするオブジェクト -->
      <rect x="14" y="70" width="170" height="112" rx="12" fill="var(--c-ui-soft)" stroke="var(--c-ui)" stroke-width="2" />
      <text x="99" y="98" text-anchor="middle" class="svg-mono svg-b">ThemeService</text>
      <text x="99" y="118" text-anchor="middle" class="svg-t2">アプリ終了まで生きる</text>
      <rect x="30" y="134" width="138" height="32" rx="6" fill="var(--bg-raised)" stroke="var(--c-ui)" />
      <text x="99" y="155" text-anchor="middle" class="svg-mono" style="font-size: 11.5px">event ThemeChanged</text>

      <!-- 参照の線 -->
      <g v-for="(w, i) in wins" :key="`l${w.id}`">
        <line
          v-if="w.strong || w.weak"
          x1="170"
          y1="150"
          :x2="pos(i).x"
          :y2="pos(i).y + 40"
          :stroke="w.strong ? (w.open ? 'var(--c-ui)' : 'var(--c-danger)') : 'var(--c-mute)'"
          :stroke-width="w.strong ? 2.2 : 1.5"
          :stroke-dasharray="w.strong ? undefined : '3 5'"
        />
      </g>

      <!-- ウィンドウ -->
      <g v-for="(w, i) in wins" :key="w.id" :transform="`translate(${pos(i).x} ${pos(i).y})`">
        <rect
          width="80"
          height="84"
          rx="8"
          :fill="w.open ? 'var(--bg-raised)' : w.strong ? 'var(--c-danger-soft)' : 'var(--c-mute-soft)'"
          :stroke="w.open ? 'var(--c-data)' : w.strong ? 'var(--c-danger)' : 'var(--c-mute)'"
          stroke-width="2"
          :stroke-dasharray="w.open ? undefined : '5 4'"
        />
        <path v-if="w.open" d="M0 20H80" stroke="var(--c-data)" />
        <text x="40" y="15" text-anchor="middle" class="svg-t2" style="font-size: 11px">Window {{ w.id }}</text>
        <text x="40" y="48" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: w.open ? 'var(--c-data)' : w.strong ? 'var(--c-danger)' : 'var(--ink-3)' }">
          {{ w.open ? '表示中' : w.strong ? '閉じた' : '閉じた' }}
        </text>
        <text x="40" y="66" text-anchor="middle" class="svg-t2" style="font-size: 11px">{{ w.open ? '' : w.strong ? '解放されない' : 'GC 待ち' }}</text>
      </g>
      <text v-if="!wins.length" x="440" y="130" text-anchor="middle" class="svg-t2">「ウィンドウを開く」を何度か押す</text>

      <!-- 凡例 -->
      <g transform="translate(14 232)">
        <line x1="0" y1="0" x2="26" y2="0" stroke="var(--c-ui)" stroke-width="2.2" />
        <text x="32" y="4" class="svg-t2" style="font-size: 11px">強い参照</text>
        <line x1="100" y1="0" x2="126" y2="0" stroke="var(--c-mute)" stroke-width="1.5" stroke-dasharray="3 5" />
        <text x="132" y="4" class="svg-t2" style="font-size: 11px">弱い参照（GC を妨げない）</text>
      </g>
    </svg>

    <div class="controls">
      <button class="btn btn--sm btn--primary" type="button" :disabled="wins.length >= MAX" @click="openWindow">ウィンドウを開く</button>
      <button class="btn btn--sm" type="button" :disabled="!openCount" @click="closeWindow">1 つ閉じる</button>
      <button class="btn btn--sm" type="button" :disabled="!wins.some((w) => !w.open)" @click="collect">GC を実行</button>
      <button class="btn btn--sm" type="button" :disabled="!wins.length" @click="fire">ThemeChanged を発生</button>
    </div>

    <dl class="lk__stats" aria-live="polite">
      <div>
        <dt>表示中</dt>
        <dd>{{ openCount }}</dd>
      </div>
      <div>
        <dt>閉じたが GC 待ち</dt>
        <dd>{{ collectable }}</dd>
      </div>
      <div :class="{ 'is-bad': leaked }">
        <dt>リーク（GC しても残る）</dt>
        <dd>{{ leaked }}</dd>
      </div>
    </dl>
    <p v-if="lastFire" class="lk__fire" :class="{ 'is-bad': lastFire.ghosts }">
      ハンドラーが呼ばれたウィンドウ: 表示中 {{ lastFire.alive }} 個<template v-if="lastFire.ghosts">、<b>閉じたはずのウィンドウ {{ lastFire.ghosts }} 個</b>（見えないまま処理が走り続けている）</template>
    </p>

    <CodeBlock :code="CODE[mode]" lang="csharp" excerpt :title="MODES.find((m) => m.id === mode)!.label" />
  </div>
</template>

<style scoped>
.lk {
  display: grid;
  gap: var(--sp-3);
}
.lk > svg {
  width: 100%;
  height: auto;
  max-width: 680px;
  justify-self: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg);
}
.lk__stats {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-2);
}
.lk__stats > div {
  padding: 6px 10px;
  border-radius: var(--radius-s);
  border: 1px solid var(--line);
  background: var(--bg);
}
.lk__stats > div.is-bad {
  border-color: var(--c-danger);
  background: var(--c-danger-soft);
}
.lk__stats dt {
  font-size: var(--fs-xs);
  color: var(--ink-2);
  line-height: 1.4;
}
.lk__stats dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
}
.lk__fire {
  padding: 8px 12px;
  border-radius: var(--radius-s);
  border: 1px solid var(--line);
  font-size: var(--fs-sm);
}
.lk__fire.is-bad {
  border-color: var(--c-danger);
  background: var(--c-danger-soft);
}
</style>
