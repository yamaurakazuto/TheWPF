<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import type { Chapter } from '@/types/content'
import { loadAllChapters } from '@/content'
import { useProgress } from '@/stores/progress'
import XamlPlayground from '@/components/editor/XamlPlayground.vue'
import ExerciseRunner from '@/components/editor/ExerciseRunner.vue'

const chapters = shallowRef<Chapter[]>([])
const progress = useProgress()

onMounted(async () => {
  chapters.value = (await loadAllChapters()).filter((c) => c.exercises.length)
})

const total = computed(() => chapters.value.reduce((n, c) => n + c.exercises.length, 0))
const done = computed(
  () => chapters.value.flatMap((c) => c.exercises).filter((e) => progress.state.exercises[e.id]?.done).length,
)
</script>

<template>
  <div class="play">
    <header>
      <h1>演習場</h1>
      <p class="play__lead">
        XAML を自由に書いて、その場で見た目を確かめられます。下には全章のコード演習をまとめてあります。
      </p>
    </header>

    <section aria-labelledby="pg-h">
      <h2 id="pg-h">XAML プレイグラウンド</h2>
      <XamlPlayground />
    </section>

    <section aria-labelledby="all-h">
      <h2 id="all-h">全章のコード演習</h2>
      <p v-if="total" class="play__lead">{{ total }} 問中 {{ done }} 問を達成済み。</p>
      <p v-else class="muted" aria-busy="true">読み込み中…</p>

      <div v-for="c in chapters" :key="c.slug" class="play__chapter">
        <h3>
          <RouterLink :to="`/chapters/${c.slug}`">第{{ c.no }}章 {{ c.title }}</RouterLink>
        </h3>
        <ExerciseRunner v-for="(ex, i) in c.exercises" :key="ex.id" :exercise="ex" :number="`${c.no}-${i + 1}`" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.play {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5) var(--sp-8);
  display: grid;
  gap: var(--sp-7);
}
.play > section {
  display: grid;
  gap: var(--sp-4);
  min-width: 0;
}
h1 {
  font-size: var(--fs-3xl);
}
h2 {
  font-size: var(--fs-2xl);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--ink);
}
.play__lead {
  color: var(--ink-2);
}
.play__chapter {
  display: grid;
  gap: var(--sp-3);
  min-width: 0;
}
.play__chapter h3 {
  font-size: var(--fs-lg);
  margin-top: var(--sp-3);
}
@media (max-width: 640px) {
  .play {
    padding: var(--sp-5) var(--sp-4) var(--sp-7);
  }
}
</style>
