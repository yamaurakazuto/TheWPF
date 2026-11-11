<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { chapterMetas } from '@/content/meta'
import { useProgress } from '@/stores/progress'
import UiIcon from '@/components/content/UiIcon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const progress = useProgress()

const items = computed(() =>
  chapterMetas.map((c) => {
    const q = progress.state.quiz[c.slug]
    return { ...c, quiz: q ? `${q.correct}/${q.total}` : null, perfect: !!q && q.correct === q.total }
  }),
)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
watch(
  () => props.open,
  (v) => {
    if (v) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
  },
)
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="open" class="scrim" @click="emit('close')" />
  <aside id="site-nav" class="side" :class="{ 'side--open': open }" aria-label="章の目次">
    <nav>
      <p class="side__label">章</p>
      <ol class="side__list">
        <li v-for="c in items" :key="c.slug">
          <RouterLink :to="`/chapters/${c.slug}`" class="side__link">
            <span class="side__no" aria-hidden="true">{{ c.no }}</span>
            <span class="side__text">
              <span class="side__title"><span class="sr-only">第{{ c.no }}章 </span>{{ c.title }}</span>
              <span class="side__sub">{{ c.subtitle }}</span>
            </span>
            <span v-if="c.quiz" class="side__score" :class="{ 'side__score--ok': c.perfect }">
              <span class="sr-only">クイズ正解数</span>{{ c.quiz }}
            </span>
          </RouterLink>
        </li>
      </ol>

      <p class="side__label">道具</p>
      <ul class="side__list">
        <li>
          <RouterLink to="/playground" class="side__link side__link--tool">
            <UiIcon name="code" /> <span>演習場（XAML プレビュー）</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/glossary" class="side__link side__link--tool">
            <UiIcon name="book" /> <span>用語集</span>
          </RouterLink>
        </li>
      </ul>
    </nav>
    <p class="side__foot">執筆時点: 2026-11-10<br />内容は各節の出典で確認できます</p>
  </aside>
</template>

<style scoped>
.side {
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  overflow-y: auto;
  padding: var(--sp-4) var(--sp-3) var(--sp-5);
  border-right: 1px solid var(--line);
  background: var(--bg);
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
}
.side__label {
  margin: var(--sp-3) var(--sp-2) var(--sp-1);
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
  letter-spacing: 0.12em;
}
.side__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
}
.side__link {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--ink-2);
  text-decoration: none;
  line-height: 1.4;
}
.side__link:hover {
  background: var(--bg-sunken);
  color: var(--ink);
}
.side__link.router-link-active {
  background: var(--accent-soft);
  color: var(--ink);
}
.side__no {
  flex: none;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  border: 1px solid var(--line-strong);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  font-weight: 700;
}
.router-link-active .side__no {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}
.side__text {
  display: grid;
  min-width: 0;
  flex: 1;
}
.side__title {
  font-size: var(--fs-sm);
  font-weight: 700;
}
.side__sub {
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.side__score {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--ink-3);
}
.side__score--ok {
  border-color: var(--c-data);
  color: var(--c-data);
  background: var(--c-data-soft);
}
.side__link--tool {
  align-items: center;
  font-size: var(--fs-sm);
  font-weight: 600;
}
.side__foot {
  margin-top: auto;
  padding: var(--sp-5) var(--sp-2) 0;
  font-size: var(--fs-xs);
  color: var(--ink-3);
  line-height: 1.6;
}

.scrim {
  display: none;
}

@media (max-width: 960px) {
  .side {
    position: fixed;
    z-index: 35;
    top: var(--header-h);
    left: 0;
    width: min(86vw, 320px);
    transform: translateX(-102%);
    transition: transform 0.22s var(--ease);
    box-shadow: var(--shadow-2);
    visibility: hidden;
  }
  .side--open {
    transform: none;
    visibility: visible;
  }
  .scrim {
    display: block;
    position: fixed;
    inset: var(--header-h) 0 0 0;
    z-index: 30;
    background: rgb(0 0 0 / 0.45);
  }
}
</style>
