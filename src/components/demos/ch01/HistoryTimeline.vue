<script setup lang="ts">
import { computed, ref } from 'vue'
import { eras, timeline, type Era } from '@/content/timeline'
import RichText from '@/components/content/RichText'
import UiIcon from '@/components/content/UiIcon.vue'

/** インタラクティブ年表。ノードを押すと詳細と出典が開く。時代で絞り込める */
const filter = ref<Era['id'] | 'all'>('all')
const open = ref<Set<string>>(new Set([timeline[0].id]))

const eraOf = (id: Era['id']) => eras.find((e) => e.id === id)!
const nodes = computed(() => timeline.filter((n) => filter.value === 'all' || n.era === filter.value))
const allOpen = computed(() => nodes.value.every((n) => open.value.has(n.id)))

function toggle(id: string) {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}
function toggleAll() {
  open.value = allOpen.value ? new Set() : new Set(nodes.value.map((n) => n.id))
}
/** 時代の最初のノードか（時代見出しを出す位置） */
const isEraHead = (i: number) => i === 0 || nodes.value[i - 1].era !== nodes.value[i].era
</script>

<template>
  <div class="tl">
    <div class="controls">
      <div class="seg" role="group" aria-label="時代で絞り込む">
        <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">すべて</button>
        <button v-for="e in eras" :key="e.id" type="button" :aria-pressed="filter === e.id" @click="filter = e.id">
          <span class="tl__dot" :style="{ background: `var(--c-${e.color})` }" aria-hidden="true" />{{ e.label }}
        </button>
      </div>
      <button class="btn btn--sm" type="button" @click="toggleAll">{{ allOpen ? 'すべて閉じる' : 'すべて開く' }}</button>
    </div>

    <ol class="tl__list">
      <li v-for="(n, i) in nodes" :key="n.id" class="tl__item" :style="{ '--era': `var(--c-${eraOf(n.era).color})`, '--era-soft': `var(--c-${eraOf(n.era).color}-soft)` }">
        <div v-if="isEraHead(i)" class="tl__era">
          <b>{{ eraOf(n.era).label }}</b>
          <span class="mono">{{ eraOf(n.era).range }}</span>
          <span class="tl__era-note">{{ eraOf(n.era).note }}</span>
        </div>
        <div class="tl__row">
          <span class="tl__rail" aria-hidden="true"><span class="tl__node" :class="{ 'is-open': open.has(n.id) }" /></span>
          <div class="tl__card" :class="{ 'is-open': open.has(n.id) }">
            <button type="button" class="tl__head" :aria-expanded="open.has(n.id)" :aria-controls="`tl-${n.id}`" @click="toggle(n.id)">
              <span class="tl__date mono">{{ n.date }}</span>
              <span class="tl__title">{{ n.title }}</span>
              <UiIcon name="down" :size="16" class="tl__chev" />
            </button>
            <RichText tag="p" class="tl__summary" :text="n.summary" />
            <div v-if="open.has(n.id)" :id="`tl-${n.id}`" class="tl__detail">
              <ul>
                <RichText v-for="(d, k) in n.details" :key="k" tag="li" :text="d" />
              </ul>
              <p v-if="n.uncertain" class="tl__uncertain">
                <b><UiIcon name="warn" :size="14" /> 諸説あり / 未確定</b>
                <RichText :text="n.uncertain" />
              </p>
              <p class="tl__src-head"><UiIcon name="link" :size="13" /> 出典</p>
              <ul class="tl__src">
                <li v-for="(s, k) in n.sources" :key="k">
                  <a :href="s.url" target="_blank" rel="noopener noreferrer">{{ s.label }}</a>
                  <span v-if="s.note" class="muted"> — {{ s.note }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.tl {
  display: grid;
  gap: var(--sp-4);
}
.tl__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.tl__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.tl__era {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  margin: var(--sp-4) 0 var(--sp-2);
  padding: 6px 12px;
  border-radius: var(--radius-s);
  background: var(--era-soft);
  border-left: 4px solid var(--era);
  font-size: var(--fs-sm);
}
.tl__item:first-child .tl__era {
  margin-top: 0;
}
.tl__era b {
  color: var(--era);
}
.tl__era-note {
  color: var(--ink-2);
  font-size: var(--fs-xs);
}
.tl__row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: var(--sp-2);
}
.tl__rail {
  position: relative;
  display: flex;
  justify-content: center;
}
.tl__rail::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--line);
}
.tl__node {
  position: relative;
  margin-top: 16px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--bg-raised);
  border: 3px solid var(--era);
}
.tl__node.is-open {
  background: var(--era);
}
.tl__card {
  margin-bottom: var(--sp-2);
  padding: 8px 12px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg);
  min-width: 0;
}
.tl__card.is-open {
  border-color: var(--era);
  background: var(--bg-raised);
}
.tl__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0 8px;
  width: 100%;
  padding: 2px 0;
  border: 0;
  background: transparent;
  text-align: left;
  line-height: 1.45;
}
.tl__date {
  grid-column: 1 / -1;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--era);
}
.tl__title {
  font-weight: 700;
}
.tl__head:hover .tl__title {
  text-decoration: underline;
}
.tl__chev {
  align-self: center;
  color: var(--ink-3);
  transition: transform 0.2s var(--ease);
}
.tl__head[aria-expanded='true'] .tl__chev {
  transform: rotate(180deg);
}
.tl__summary {
  margin-top: 2px;
  font-size: var(--fs-sm);
  color: var(--ink-2);
  line-height: 1.7;
}
.tl__detail {
  margin-top: var(--sp-2);
  padding-top: var(--sp-2);
  border-top: 1px dashed var(--line-strong);
  font-size: var(--fs-sm);
  line-height: 1.75;
}
.tl__detail ul {
  margin: 0;
  padding-left: 1.3em;
  display: grid;
  gap: 4px;
}
.tl__uncertain {
  margin-top: var(--sp-2);
  padding: 8px 12px;
  border-radius: var(--radius-s);
  background: var(--c-warn-soft);
  border: 1px solid var(--c-warn);
  display: grid;
  gap: 2px;
}
.tl__uncertain b {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--c-warn);
  font-size: var(--fs-xs);
}
.tl__src-head {
  margin-top: var(--sp-2);
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
}
.tl__src {
  font-size: var(--fs-xs);
}
</style>
