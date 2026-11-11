<script setup lang="ts">
import { computed, ref } from 'vue'
import { glossary } from '@/content/glossary'
import { chapterMetas } from '@/content/meta'

const q = ref('')

const groups = computed(() => {
  const needle = q.value.trim().toLowerCase()
  const hit = glossary.filter(
    (g) => !needle || [g.term, g.alt ?? '', g.desc].some((s) => s.toLowerCase().includes(needle)),
  )
  return chapterMetas
    .map((c) => ({ chapter: c, items: hit.filter((g) => g.chapter === c.slug).sort((a, b) => a.term.localeCompare(b.term, 'ja')) }))
    .filter((g) => g.items.length)
})
const total = computed(() => groups.value.reduce((n, g) => n + g.items.length, 0))
</script>

<template>
  <div class="gl">
    <header>
      <h1>用語集</h1>
      <p class="gl__lead">本文で点線の下線が付いている語は、ここに載っている用語です。章ごとに、その章で初めて詳しく扱う語をまとめています。</p>
      <label class="field gl__search">
        用語を絞り込む
        <input v-model="q" type="text" class="input" placeholder="例: Dispatcher / テンプレート" />
      </label>
      <p class="muted small" aria-live="polite">{{ total }} 件</p>
    </header>

    <section v-for="g in groups" :key="g.chapter.slug" :aria-labelledby="`gl-${g.chapter.slug}`">
      <h2 :id="`gl-${g.chapter.slug}`">
        <RouterLink :to="`/chapters/${g.chapter.slug}`">第{{ g.chapter.no }}章 {{ g.chapter.title }}</RouterLink>
      </h2>
      <dl>
        <div v-for="it in g.items" :key="it.id">
          <dt>
            {{ it.term }} <small v-if="it.alt">{{ it.alt }}</small>
          </dt>
          <dd>{{ it.desc }}</dd>
        </div>
      </dl>
    </section>
    <p v-if="!total" class="muted">該当する用語がありません。</p>
  </div>
</template>

<style scoped>
.gl {
  max-width: 880px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5) var(--sp-8);
  display: grid;
  gap: var(--sp-6);
}
h1 {
  font-size: var(--fs-3xl);
}
.gl__lead {
  margin-top: var(--sp-2);
  color: var(--ink-2);
}
.gl__search {
  margin-top: var(--sp-4);
  max-width: 360px;
}
h2 {
  font-size: var(--fs-lg);
  margin-bottom: var(--sp-3);
}
dl {
  margin: 0;
  display: grid;
  gap: 1px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  overflow: hidden;
  background: var(--line);
}
dl > div {
  display: grid;
  grid-template-columns: minmax(0, 15em) minmax(0, 1fr);
  gap: var(--sp-3);
  padding: 10px 14px;
  background: var(--bg-raised);
}
dt {
  font-weight: 700;
  line-height: 1.5;
}
dt small {
  display: block;
  font-weight: 400;
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
dd {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--ink-2);
  line-height: 1.7;
}
@media (max-width: 640px) {
  .gl {
    padding: var(--sp-5) var(--sp-4) var(--sp-7);
  }
  dl > div {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
}
</style>
