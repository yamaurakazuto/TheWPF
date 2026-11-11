<script setup lang="ts">
import { ref } from 'vue'
import { strengths, weaknesses, type Point } from '@/content/tradeoffs'
import RichText from '@/components/content/RichText'
import UiIcon from '@/components/content/UiIcon.vue'

/** 強みと弱みの左右対比。カードを開くと「根拠」と「但し書き」が出る */
const open = ref<Set<string>>(new Set(['s-template', 'w-windows']))
function toggle(id: string) {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}
const all = [...strengths, ...weaknesses]
const allOpen = () => all.every((p) => open.value.has(p.id))
function toggleAll() {
  open.value = allOpen() ? new Set() : new Set(all.map((p) => p.id))
}
const COLS: { id: 'pro' | 'con'; title: string; sub: string; items: Point[]; caveat: string }[] = [
  { id: 'pro', title: '強み', sub: `${strengths.length} 項目`, items: strengths, caveat: 'ただし' },
  { id: 'con', title: '弱み', sub: `${weaknesses.length} 項目`, items: weaknesses, caveat: 'とはいえ' },
]
</script>

<template>
  <div class="pc">
    <div class="controls">
      <button class="btn btn--sm" type="button" @click="toggleAll">{{ allOpen() ? 'すべて閉じる' : 'すべて開く' }}</button>
      <span class="small muted">各項目を開くと、根拠と「反対側から見た但し書き」が出ます。</span>
    </div>
    <div class="pc__grid">
      <section v-for="col in COLS" :key="col.id" class="pc__col" :class="`pc__col--${col.id}`" :aria-label="col.title">
        <h4>
          <span class="pc__sign" aria-hidden="true">{{ col.id === 'pro' ? '＋' : '−' }}</span>
          {{ col.title }} <small>{{ col.sub }}</small>
        </h4>
        <ul>
          <li v-for="p in col.items" :key="p.id" class="pc__card" :class="{ 'is-open': open.has(p.id) }">
            <button type="button" class="pc__head" :aria-expanded="open.has(p.id)" :aria-controls="`pc-${p.id}`" @click="toggle(p.id)">
              <span>
                <b>{{ p.title }}</b>
                <span class="pc__summary">{{ p.summary }}</span>
              </span>
              <UiIcon name="down" :size="16" class="pc__chev" />
            </button>
            <div v-if="open.has(p.id)" :id="`pc-${p.id}`" class="pc__body">
              <p><span class="pc__tag">根拠</span><RichText :text="p.evidence" /></p>
              <p class="pc__caveat"><span class="pc__tag pc__tag--caveat">{{ col.caveat }}</span><RichText :text="p.caveat" /></p>
              <p v-if="p.chapter || p.sources" class="pc__links">
                <RouterLink v-if="p.chapter" :to="`/chapters/${p.chapter.slug}`">{{ p.chapter.label }}で詳しく</RouterLink>
                <a v-for="s in p.sources ?? []" :key="s.url" :href="s.url" target="_blank" rel="noopener noreferrer">{{ s.label }}</a>
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pc {
  display: grid;
  gap: var(--sp-3);
  container-type: inline-size;
}
.pc__grid {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: minmax(0, 1fr);
}
@container (min-width: 680px) {
  .pc__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}
.pc__col {
  --cc: var(--c-data);
  --ccs: var(--c-data-soft);
  border-radius: var(--radius-m);
  border: 1px solid var(--cc);
  border-top-width: 4px;
  padding: 12px;
  background: var(--bg);
  min-width: 0;
}
.pc__col--con {
  --cc: var(--c-warn);
  --ccs: var(--c-warn-soft);
}
.pc__col h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--cc);
  font-size: var(--fs-lg);
  margin-bottom: var(--sp-2);
}
.pc__col h4 small {
  font-size: var(--fs-xs);
  font-weight: 400;
  color: var(--ink-3);
}
.pc__sign {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--cc);
  color: var(--bg-raised);
  font-size: 1rem;
  line-height: 1;
}
.pc__col ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.pc__card {
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
  background: var(--bg-raised);
}
.pc__card.is-open {
  border-color: var(--cc);
}
.pc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  text-align: left;
  line-height: 1.45;
}
.pc__head b {
  display: block;
  font-size: var(--fs-sm);
}
.pc__summary {
  display: block;
  font-size: var(--fs-xs);
  color: var(--ink-2);
}
.pc__head:hover b {
  text-decoration: underline;
}
.pc__chev {
  color: var(--ink-3);
  transition: transform 0.2s var(--ease);
}
.pc__head[aria-expanded='true'] .pc__chev {
  transform: rotate(180deg);
}
.pc__body {
  display: grid;
  gap: 8px;
  padding: 2px 10px 12px;
  font-size: var(--fs-sm);
  line-height: 1.75;
}
.pc__tag {
  display: inline-block;
  margin-right: 8px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--ccs);
  color: var(--cc);
  font-size: 0.6875rem;
  font-weight: 700;
}
.pc__tag--caveat {
  background: var(--c-mute-soft);
  color: var(--ink-2);
}
.pc__caveat {
  color: var(--ink-2);
}
.pc__links {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 14px;
  font-size: var(--fs-xs);
}
</style>
