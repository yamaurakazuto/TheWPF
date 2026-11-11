<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/lib/anim'
import UiIcon from '@/components/content/UiIcon.vue'

/**
 * 「動画」プレイヤー。中身は slot に渡す SVG / HTML で、現在時刻 t（秒）を受け取って描く。
 * 再生 / 一時停止 / ステップ送り / シーク / 速度変更 / 字幕（cue）を提供する。
 *
 *   <AnimationPlayer :duration="60" :cues="cues" label="…" v-slot="{ t, cue }"> <svg>…</svg> </AnimationPlayer>
 *
 * ステップ送りは「いまの場面を最後まで再生して、次の場面の頭で止まる」動作。
 * 動きを減らす設定（prefers-reduced-motion）のときは、アニメーションせず場面の最終状態へ飛ぶ。
 */
export interface Cue {
  /** 場面の開始時刻（秒） */
  t: number
  title: string
  /** 字幕。場面の間ずっと表示される */
  text: string
}

const props = defineProps<{ duration: number; cues: Cue[]; label: string }>()

const t = ref(0)
const playing = ref(false)
const speed = ref(1)
const root = ref<HTMLElement | null>(null)

let raf = 0
let last = 0
/** この時刻に達したら自動で止まる（ステップ送り用） */
let stopAt = Infinity

const cue = computed(() => {
  let idx = 0
  for (let i = 0; i < props.cues.length; i++) if (props.cues[i].t <= t.value + 1e-6) idx = i
  return idx
})
const cueEnd = (i: number) => props.cues[i + 1]?.t ?? props.duration

function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  let next = t.value + dt * speed.value
  if (next >= stopAt) {
    next = stopAt
    t.value = next
    pause()
    return
  }
  if (next >= props.duration) {
    t.value = props.duration
    pause()
    return
  }
  t.value = next
  raf = requestAnimationFrame(frame)
}

function play(until = Infinity) {
  if (t.value >= props.duration - 1e-6) t.value = 0
  stopAt = until
  if (playing.value) return
  playing.value = true
  last = performance.now()
  raf = requestAnimationFrame(frame)
}
function pause() {
  playing.value = false
  stopAt = Infinity
  cancelAnimationFrame(raf)
}
function toggle() {
  if (playing.value) pause()
  else play()
}
function seek(v: number) {
  pause()
  t.value = Math.max(0, Math.min(props.duration, v))
}
/** 次の場面へ: いまの場面を再生し切って止まる */
function stepNext() {
  const end = cueEnd(cue.value)
  if (t.value >= props.duration - 1e-6) return
  if (prefersReducedMotion()) {
    // 動きを出さず、いまの場面の「終わりの状態」を見せてから次へ進めるようにする
    seek(Math.abs(t.value - (end - 0.01)) < 0.02 ? end : end - 0.01)
    return
  }
  pause()
  play(end)
}
/** 前の場面の頭へ */
function stepPrev() {
  const i = cue.value
  const start = props.cues[i].t
  seek(t.value - start > 0.6 || i === 0 ? start : props.cues[i - 1].t)
}
function jump(i: number) {
  seek(props.cues[i].t)
}
function restart() {
  seek(0)
  play()
}

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON') return
  if (e.key === ' ' || e.key === 'k') {
    e.preventDefault()
    toggle()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    stepNext()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    stepPrev()
  }
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

// 画面外に出たら止める（見ていないアニメーションを回し続けない）
let io: IntersectionObserver | null = null
onMounted(() => {
  if (!root.value || typeof IntersectionObserver === 'undefined') return
  io = new IntersectionObserver((entries) => {
    if (entries.some((en) => !en.isIntersecting) && playing.value) pause()
  })
  io.observe(root.value)
})
onBeforeUnmount(() => {
  pause()
  io?.disconnect()
})
</script>

<template>
  <div ref="root" class="player" tabindex="0" role="group" :aria-label="`${label}（アニメーション。スペースで再生、左右キーで場面送り）`" @keydown="onKey">
    <div class="player__stage">
      <slot :t="t" :cue="cue" :playing="playing" />
      <button v-if="!playing && t === 0" class="player__big" type="button" :aria-label="`${label} を再生`" @click="play()">
        <UiIcon name="play" :size="30" />
      </button>
    </div>

    <div class="player__cap" aria-live="polite">
      <span class="player__cap-n">{{ cue + 1 }} / {{ cues.length }}</span>
      <b>{{ cues[cue].title }}</b>
      <span class="player__cap-text">{{ cues[cue].text }}</span>
    </div>

    <ol class="player__cues" aria-label="場面">
      <li v-for="(c, i) in cues" :key="i">
        <button
          type="button"
          class="player__cue"
          :class="{ 'is-current': i === cue, 'is-done': i < cue }"
          :aria-current="i === cue ? 'step' : undefined"
          :title="c.title"
          @click="jump(i)"
        >
          <span class="sr-only">場面 {{ i + 1 }}: {{ c.title }}</span>
        </button>
      </li>
    </ol>

    <div class="player__bar">
      <button class="btn btn--sm" type="button" aria-label="前の場面" @click="stepPrev"><UiIcon name="prev" :size="15" /></button>
      <button class="btn btn--sm btn--primary player__play" type="button" @click="toggle">
        <UiIcon :name="playing ? 'pause' : 'play'" :size="15" />
        {{ playing ? '一時停止' : t >= duration ? 'もう一度' : '再生' }}
      </button>
      <button class="btn btn--sm" type="button" aria-label="次の場面まで再生" @click="stepNext">
        <UiIcon name="next" :size="15" /> <span class="player__step-label">ステップ</span>
      </button>
      <input
        class="player__seek"
        type="range"
        min="0"
        :max="duration"
        step="0.1"
        :value="t"
        aria-label="再生位置"
        :aria-valuetext="`${fmt(t)} / ${fmt(duration)}`"
        @input="seek(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="player__time mono">{{ fmt(t) }} / {{ fmt(duration) }}</span>
      <label class="player__speed">
        <span class="sr-only">再生速度</span>
        <select v-model.number="speed" class="input">
          <option :value="0.5">0.5×</option>
          <option :value="1">1×</option>
          <option :value="1.5">1.5×</option>
          <option :value="2">2×</option>
        </select>
      </label>
      <button class="btn btn--sm btn--ghost" type="button" aria-label="最初から再生" @click="restart"><UiIcon name="restart" :size="15" /></button>
    </div>
  </div>
</template>

<style scoped>
.player {
  display: grid;
  gap: var(--sp-2);
  min-width: 0;
  border-radius: var(--radius-m);
}
.player__stage {
  position: relative;
  border-radius: var(--radius-m);
  background: var(--bg-sunken);
  border: 1px solid var(--line);
  overflow: hidden;
  line-height: 0;
}
.player__stage :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
.player__big {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 0;
  background: var(--accent);
  color: var(--accent-ink);
  box-shadow: var(--shadow-2);
  padding-left: 4px;
}
.player__big:hover {
  filter: brightness(1.12);
}
.player__cap {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0 var(--sp-2);
  align-items: baseline;
  min-height: 4.6em;
  padding: 8px 12px;
  border-radius: var(--radius-s);
  background: var(--bg);
  border: 1px solid var(--line);
  font-size: var(--fs-sm);
  line-height: 1.65;
}
.player__cap-n {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.player__cap-text {
  grid-column: 1 / -1;
  color: var(--ink-2);
}
.player__cues {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 4px;
}
.player__cues li {
  flex: 1;
}
.player__cue {
  display: block;
  width: 100%;
  height: 14px;
  padding: 4px 0;
  border: 0;
  background: transparent;
}
.player__cue::before {
  content: '';
  display: block;
  height: 6px;
  border-radius: 3px;
  background: var(--line);
}
.player__cue.is-done::before {
  background: var(--accent-line);
}
.player__cue.is-current::before {
  background: var(--accent);
}
.player__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.player__play {
  min-width: 96px;
}
.player__seek {
  flex: 1 1 120px;
  min-width: 80px;
}
.player__time {
  font-size: var(--fs-xs);
  color: var(--ink-2);
  white-space: nowrap;
}
.player__speed select {
  min-height: 30px;
  padding: 2px 6px;
  font-size: var(--fs-xs);
}
@media (max-width: 520px) {
  .player__step-label {
    display: none;
  }
}
</style>
