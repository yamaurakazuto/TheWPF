<script setup lang="ts">
import { computed, ref } from 'vue'
import { stages } from '@/content/roadmap'
import { useProgress } from '@/stores/progress'
import RichText from '@/components/content/RichText'
import UiIcon from '@/components/content/UiIcon.vue'

/**
 * 学習ロードマップ。5 つの段階を道のりとして描き、段階を選ぶとチェックリストと課題が出る。
 * チェックの状態は localStorage に保存される。
 */
const progress = useProgress()
const active = ref(stages[0].id)
const stage = computed(() => stages.find((s) => s.id === active.value)!)

const doneCount = (id: string) => stages.find((s) => s.id === id)!.checks.filter((c) => progress.state.checklist[c.id]).length
const ratio = (id: string) => doneCount(id) / stages.find((s) => s.id === id)!.checks.length
const total = computed(() => stages.reduce((n, s) => n + s.checks.length, 0))
const totalDone = computed(() => stages.reduce((n, s) => n + doneCount(s.id), 0))

// 道のりの上の、各段階の位置
const P = [
  { x: 70, y: 150 },
  { x: 195, y: 62 },
  { x: 320, y: 150 },
  { x: 445, y: 62 },
  { x: 570, y: 150 },
]
const PATH = `M${P[0].x} ${P[0].y} C${P[0].x + 60} ${P[0].y} ${P[1].x - 60} ${P[1].y} ${P[1].x} ${P[1].y} S${P[2].x - 60} ${P[2].y} ${P[2].x} ${P[2].y} S${P[3].x - 60} ${P[3].y} ${P[3].x} ${P[3].y} S${P[4].x - 60} ${P[4].y} ${P[4].x} ${P[4].y}`
const R = 26
const C = 2 * Math.PI * (R + 5)
</script>

<template>
  <div class="rm">
    <p class="rm__total" aria-live="polite">
      全体の進み具合: <b>{{ totalDone }} / {{ total }}</b> 項目
      <span class="rm__meter" aria-hidden="true"><span :style="{ width: (totalDone / total) * 100 + '%' }" /></span>
    </p>

    <svg viewBox="0 0 640 234" role="group" aria-label="学習の 5 段階">
      <path :d="PATH" fill="none" stroke="var(--line-strong)" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 12" />
      <g
        v-for="(s, i) in stages"
        :key="s.id"
        class="rm__node"
        role="button"
        tabindex="0"
        :aria-pressed="active === s.id"
        :aria-label="`第 ${s.no} 段階: ${s.title}。${doneCount(s.id)} / ${s.checks.length} 項目達成`"
        :transform="`translate(${P[i].x} ${P[i].y})`"
        @click="active = s.id"
        @keydown.enter.prevent="active = s.id"
        @keydown.space.prevent="active = s.id"
      >
        <!-- 達成率のリング -->
        <circle :r="R + 5" fill="none" stroke="var(--line)" stroke-width="5" />
        <circle :r="R + 5" fill="none" stroke="var(--c-data)" stroke-width="5" stroke-linecap="round" :stroke-dasharray="`${C * ratio(s.id)} ${C}`" transform="rotate(-90)" />
        <circle :r="R" :fill="active === s.id ? 'var(--accent)' : 'var(--bg-raised)'" :stroke="active === s.id ? 'var(--accent)' : 'var(--line-strong)'" stroke-width="2" />
        <text y="8" text-anchor="middle" font-size="22" font-weight="800" font-family="var(--font-mono)" :fill="active === s.id ? 'var(--accent-ink)' : 'var(--ink)'">{{ s.no }}</text>
        <text :y="R + 28" text-anchor="middle" class="svg-t svg-b" :style="{ fill: active === s.id ? 'var(--accent)' : undefined }">{{ s.title }}</text>
        <text :y="R + 45" text-anchor="middle" class="svg-t2" style="font-size: 11.5px">{{ s.span }}</text>
      </g>
    </svg>

    <section class="rm__detail" :aria-label="`第 ${stage.no} 段階の詳細`">
      <header>
        <span class="rm__badge">第 {{ stage.no }} 段階</span>
        <h4>{{ stage.title }}</h4>
        <span class="chip"><UiIcon name="clock" :size="12" /> 目安 {{ stage.span }}</span>
      </header>
      <p class="rm__goal">{{ stage.goal }}</p>

      <p class="rm__h">できるようになったら、印を付ける</p>
      <ul class="rm__checks">
        <li v-for="c in stage.checks" :key="c.id">
          <label class="check">
            <input type="checkbox" :checked="!!progress.state.checklist[c.id]" @change="progress.toggleCheck(c.id)" />
            <RichText :text="c.text" />
          </label>
        </li>
      </ul>

      <div class="rm__cols">
        <div>
          <p class="rm__h">この段階の課題</p>
          <p>{{ stage.task }}</p>
        </div>
        <div>
          <p class="rm__h">つまずきやすい点</p>
          <p>{{ stage.trap }}</p>
        </div>
      </div>

      <p class="rm__links">
        読む章:
        <RouterLink v-for="ch in stage.chapters" :key="ch.slug" :to="`/chapters/${ch.slug}`" class="chip">{{ ch.label }}</RouterLink>
      </p>
    </section>
  </div>
</template>

<style scoped>
.rm {
  display: grid;
  gap: var(--sp-3);
}
.rm__total {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  font-size: var(--fs-sm);
}
.rm__meter {
  flex: 1 1 160px;
  max-width: 280px;
  height: 8px;
  border-radius: 4px;
  background: var(--line);
  overflow: hidden;
}
.rm__meter span {
  display: block;
  height: 100%;
  background: var(--c-data);
  transition: width 0.3s var(--ease);
}
.rm > svg {
  width: 100%;
  height: auto;
  max-width: 680px;
  justify-self: center;
}
.rm__node {
  cursor: pointer;
  outline: none;
}
.rm__node:focus-visible circle:nth-of-type(3) {
  stroke: var(--focus);
  stroke-width: 4;
}
.rm__detail {
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-4);
  border-radius: var(--radius-m);
  border: 1px solid var(--accent-line);
  background: var(--bg);
  font-size: 0.9375rem;
  line-height: 1.75;
}
.rm__detail header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}
.rm__detail h4 {
  font-size: var(--fs-lg);
  margin-right: auto;
}
.rm__badge {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 1px 8px;
  border-radius: 6px;
}
.rm__goal {
  font-weight: 700;
}
.rm__h {
  margin-top: var(--sp-2);
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
  letter-spacing: 0.04em;
}
.rm__checks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}
.rm__checks .check {
  align-items: flex-start;
  font-size: 0.9375rem;
  line-height: 1.6;
}
.rm__checks input {
  margin-top: 5px;
  flex: none;
}
.rm__checks input:checked + span {
  color: var(--ink-3);
}
.rm__cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 0 var(--sp-5);
  font-size: var(--fs-sm);
}
.rm__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-sm);
  margin-top: var(--sp-2);
}
.rm__links .chip {
  text-decoration: none;
  color: var(--accent);
  border-color: var(--accent-line);
}
</style>
