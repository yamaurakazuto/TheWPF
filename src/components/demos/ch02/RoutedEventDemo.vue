<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import UiIcon from '@/components/content/UiIcon.vue'
import { prefersReducedMotion } from '@/lib/anim'

/**
 * ルーティングイベントの伝播デモ。
 * 入れ子になった要素のどれかを押すと、PreviewMouseDown がルートから降り（トンネル）、
 * 続いて MouseDown が発生元から昇る（バブル）様子を 1 ステップずつ再生する。
 */
const ELEMENTS = ['Window', 'Grid', 'StackPanel', 'Button', 'TextBlock'] as const
type El = (typeof ELEMENTS)[number]
const DESC: Record<El, string> = {
  Window: 'ルート',
  Grid: 'レイアウト用',
  StackPanel: 'ボタンの親',
  Button: 'コントロール',
  TextBlock: 'ボタンの中の文字',
}

interface Step {
  el: El
  phase: 'tunnel' | 'bubble'
  event: string
  /** このステップで Handled = true にする */
  marks: boolean
  /** 既に Handled 済みのため、通常のハンドラーは呼ばれない */
  skipped: boolean
}

const target = ref<El>('TextBlock')
const handledAt = ref<string>('none')
const cursor = ref(-1) // 実行済みの最後のステップ
const playing = ref(false)

const HANDLED_OPTIONS = [
  { value: 'none', label: 'どこでも Handled にしない' },
  { value: 'tunnel:Grid', label: 'Grid の PreviewMouseDown で Handled = true' },
  { value: 'bubble:Button', label: 'Button の MouseDown で Handled = true' },
  { value: 'bubble:StackPanel', label: 'StackPanel の MouseDown で Handled = true' },
]

const steps = computed<Step[]>(() => {
  const path = ELEMENTS.slice(0, ELEMENTS.indexOf(target.value) + 1)
  const seq: Omit<Step, 'marks' | 'skipped'>[] = [
    ...path.map((el) => ({ el, phase: 'tunnel' as const, event: 'PreviewMouseDown' })),
    ...[...path].reverse().map((el) => ({ el, phase: 'bubble' as const, event: 'MouseDown' })),
  ]
  let handled = false
  return seq.map((s) => {
    const skipped = handled
    const marks = !handled && handledAt.value === `${s.phase}:${s.el}`
    if (marks) handled = true
    return { ...s, marks, skipped }
  })
})

const current = computed(() => (cursor.value >= 0 ? steps.value[cursor.value] : null))
const finished = computed(() => cursor.value >= steps.value.length - 1)

let timer = 0
function stop() {
  playing.value = false
  clearInterval(timer)
}
function reset() {
  stop()
  cursor.value = -1
}
function step() {
  if (finished.value) return stop()
  cursor.value++
  if (finished.value) stop()
}
function play() {
  if (finished.value) cursor.value = -1
  if (prefersReducedMotion()) {
    cursor.value = steps.value.length - 1
    return
  }
  playing.value = true
  step()
  timer = window.setInterval(step, 750)
}
function click(el: El) {
  target.value = el
  reset()
  play()
}
onBeforeUnmount(stop)

const stateOf = (el: El) => {
  const c = current.value
  if (!c || c.el !== el) return ''
  return c.skipped ? 'is-skipped' : c.phase === 'tunnel' ? 'is-tunnel' : 'is-bubble'
}
</script>

<template>
  <div class="re">
    <div class="re__stage">
      <p class="re__hint"><UiIcon name="hand" :size="14" /> 好きな要素をクリック（または Tab で選んで Enter）。そこが「イベントの発生元」になります。</p>
      <!-- 入れ子の箱 = 要素の親子関係 -->
      <div
        class="re__box"
        :class="[stateOf('Window'), { 'is-target': target === 'Window' }]"
        role="button"
        tabindex="0"
        aria-label="Window をクリック"
        @click.stop="click('Window')"
        @keydown.enter.stop.prevent="click('Window')"
      >
        <span class="re__label">Window <small>{{ DESC.Window }}</small></span>
        <div class="re__box" :class="[stateOf('Grid'), { 'is-target': target === 'Grid' }]" role="button" tabindex="0" aria-label="Grid をクリック" @click.stop="click('Grid')" @keydown.enter.stop.prevent="click('Grid')">
          <span class="re__label">Grid <small>{{ DESC.Grid }}</small></span>
          <div class="re__box" :class="[stateOf('StackPanel'), { 'is-target': target === 'StackPanel' }]" role="button" tabindex="0" aria-label="StackPanel をクリック" @click.stop="click('StackPanel')" @keydown.enter.stop.prevent="click('StackPanel')">
            <span class="re__label">StackPanel <small>{{ DESC.StackPanel }}</small></span>
            <div class="re__box re__box--button" :class="[stateOf('Button'), { 'is-target': target === 'Button' }]" role="button" tabindex="0" aria-label="Button をクリック" @click.stop="click('Button')" @keydown.enter.stop.prevent="click('Button')">
              <span class="re__label">Button <small>{{ DESC.Button }}</small></span>
              <div class="re__box re__box--text" :class="[stateOf('TextBlock'), { 'is-target': target === 'TextBlock' }]" role="button" tabindex="0" aria-label="TextBlock をクリック" @click.stop="click('TextBlock')" @keydown.enter.stop.prevent="click('TextBlock')">
                <span class="re__label">TextBlock <small>{{ DESC.TextBlock }}</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="re__side">
      <label class="field">
        <span>途中で止めてみる（<code>e.Handled = true</code>）</span>
        <select v-model="handledAt" class="input" @change="reset">
          <option v-for="o in HANDLED_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
      <div class="controls">
        <button class="btn btn--sm btn--primary" type="button" @click="playing ? stop() : play()">
          <UiIcon :name="playing ? 'pause' : 'play'" :size="14" /> {{ playing ? '一時停止' : finished ? 'もう一度' : '再生' }}
        </button>
        <button class="btn btn--sm" type="button" :disabled="finished" @click="(stop(), step())"><UiIcon name="next" :size="14" /> 1 ステップ</button>
        <button class="btn btn--sm btn--ghost" type="button" @click="reset"><UiIcon name="restart" :size="14" /> 最初に戻す</button>
      </div>

      <ol class="re__log" aria-label="ハンドラーの呼び出し順" aria-live="polite">
        <li v-for="(s, i) in steps" :key="i" :class="[`re__log--${s.phase}`, { 'is-done': i <= cursor, 'is-now': i === cursor, 'is-skipped': s.skipped }]">
          <span class="re__dir" aria-hidden="true">{{ s.phase === 'tunnel' ? '↓' : '↑' }}</span>
          <span class="mono">{{ s.el }}.{{ s.event }}</span>
          <span v-if="s.marks" class="re__mark">Handled = true</span>
          <span v-else-if="s.skipped" class="re__mark re__mark--skip">呼ばれない</span>
        </li>
      </ol>
      <p class="small muted">
        <span class="re__key re__key--tunnel">↓ トンネル</span> ルート → 発生元
        <span class="re__key re__key--bubble">↑ バブル</span> 発生元 → ルート
      </p>
    </div>
  </div>
</template>

<style scoped>
.re {
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: minmax(0, 1fr);
  container-type: inline-size;
}
@container (min-width: 700px) {
  .re {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: start;
  }
}
.re__hint {
  font-size: var(--fs-xs);
  color: var(--ink-3);
  margin-bottom: var(--sp-2);
}
.re__box {
  position: relative;
  padding: 30px 12px 12px;
  border: 2px solid var(--line-strong);
  border-radius: var(--radius-m);
  background: var(--bg);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}
.re__box .re__box {
  background: var(--bg-raised);
}
.re__box .re__box .re__box {
  background: var(--bg);
}
.re__box--button {
  background: var(--bg-sunken) !important;
}
.re__box--text {
  min-height: 56px;
  background: var(--bg-raised) !important;
}
.re__label {
  position: absolute;
  top: 5px;
  left: 10px;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-weight: 700;
  pointer-events: none;
}
.re__label small {
  font-family: var(--font-sans);
  font-weight: 400;
  color: var(--ink-3);
  margin-left: 6px;
}
.re__box.is-target > .re__label::after {
  content: '← 発生元';
  margin-left: 8px;
  font-family: var(--font-sans);
  font-size: var(--fs-xs);
  color: var(--c-danger);
}
.re__box.is-tunnel {
  border-color: var(--c-render);
  box-shadow: 0 0 0 4px var(--c-render-soft);
}
.re__box.is-bubble {
  border-color: var(--c-warn);
  box-shadow: 0 0 0 4px var(--c-warn-soft);
}
.re__box.is-skipped {
  border-style: dashed;
  border-color: var(--c-mute);
}
.re__side {
  display: grid;
  gap: var(--sp-3);
  align-content: start;
}
.re__log {
  list-style: none;
  margin: 0;
  padding: 6px;
  display: grid;
  gap: 2px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg);
  font-size: var(--fs-sm);
}
.re__log li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  padding: 3px 8px;
  border-radius: 5px;
  opacity: 0.35;
  transition:
    opacity 0.2s,
    background 0.2s;
}
.re__log li.is-done {
  opacity: 1;
}
.re__log li.is-now.re__log--tunnel {
  background: var(--c-render-soft);
}
.re__log li.is-now.re__log--bubble {
  background: var(--c-warn-soft);
}
.re__dir {
  width: 1.2em;
  font-weight: 700;
  text-align: center;
}
.re__log--tunnel .re__dir {
  color: var(--c-render);
}
.re__log--bubble .re__dir {
  color: var(--c-warn);
}
.re__log li.is-skipped .mono {
  text-decoration: line-through;
  color: var(--ink-3);
}
.re__mark {
  font-size: var(--fs-xs);
  font-weight: 700;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.re__mark--skip {
  background: var(--c-mute-soft);
  color: var(--ink-3);
}
.re__key {
  font-weight: 700;
  margin-right: 2px;
}
.re__key--tunnel {
  color: var(--c-render);
}
.re__key--bubble {
  color: var(--c-warn);
  margin-left: 10px;
}
</style>
