<script setup lang="ts">
import { computed, nextTick, provide, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Block, Chapter } from '@/types/content'
import { loadChapter } from '@/content'
import BlockRenderer from '@/components/content/BlockRenderer.vue'
import RichText from '@/components/content/RichText'
import UiIcon from '@/components/content/UiIcon.vue'
import PageToc from '@/components/layout/PageToc.vue'
import ChapterNav from '@/components/layout/ChapterNav.vue'
import ChapterQuiz from '@/components/quiz/ChapterQuiz.vue'
import ExerciseRunner from '@/components/editor/ExerciseRunner.vue'

const props = defineProps<{ slug: string }>()
const route = useRoute()

const chapter = shallowRef<Chapter | null>(null)
const state = ref<'loading' | 'ready' | 'missing'>('loading')

// 図ブロック → 「章-連番」。BlockRenderer が inject して FigureFrame に渡す
const figureNo = new Map<Block, string>()
provide('figureNo', figureNo)

function scrollToHash() {
  const id = route.hash.slice(1)
  if (!id) return
  document.getElementById(id)?.scrollIntoView({ block: 'start' })
}

watch(
  () => props.slug,
  async (slug) => {
    state.value = 'loading'
    chapter.value = null
    const c = await loadChapter(slug)
    if (slug !== props.slug) return
    if (!c) {
      state.value = 'missing'
      return
    }
    figureNo.clear()
    let n = 0
    for (const s of c.sections) for (const b of s.blocks) if (b.type === 'figure') figureNo.set(b, `${c.no}-${++n}`)
    chapter.value = c
    state.value = 'ready'
    document.title = `第${c.no}章 ${c.title} — theWPF`
    await nextTick()
    if (route.hash) {
      scrollToHash()
      // デモの遅延ロードで高さが変わるので、少し待ってもう一度合わせる
      setTimeout(scrollToHash, 450)
    }
  },
  { immediate: true },
)

const toc = computed(() => {
  const c = chapter.value
  if (!c) return []
  return [
    ...c.sections.map((s) => ({ id: s.id, title: s.title })),
    ...(c.quiz.length ? [{ id: 'quiz', title: '理解度クイズ' }] : []),
    ...(c.exercises.length ? [{ id: 'exercises', title: 'コード演習' }] : []),
  ]
})
const tocOpen = ref(false)
</script>

<template>
  <div v-if="state === 'loading'" class="ch-state" aria-busy="true">読み込み中…</div>

  <div v-else-if="state === 'missing'" class="ch-state">
    <p>この章は見つかりませんでした。</p>
    <RouterLink to="/" class="btn">トップへ戻る</RouterLink>
  </div>

  <article v-else-if="chapter" class="ch">
    <header class="ch__hero">
      <p class="ch__kicker">
        <span class="ch__no">第 {{ chapter.no }} 章</span>
        <span class="chip"><UiIcon name="clock" :size="13" /> 約 {{ chapter.minutes }} 分</span>
      </p>
      <h1>{{ chapter.title }}</h1>
      <p class="ch__sub">{{ chapter.subtitle }}</p>
      <p class="ch__summary">{{ chapter.summary }}</p>
      <section class="ch__goals" aria-label="この章でわかること">
        <h2>この章でわかること</h2>
        <ul>
          <RichText v-for="(g, i) in chapter.goals" :key="i" tag="li" :text="g" />
        </ul>
      </section>
    </header>

    <div class="ch__layout">
      <div class="ch__body">
        <details class="ch__toc-m" :open="tocOpen" @toggle="tocOpen = ($event.target as HTMLDetailsElement).open">
          <summary><UiIcon name="list" :size="16" /> この章の目次</summary>
          <PageToc :items="toc" @navigate="tocOpen = false" />
        </details>

        <section v-for="s in chapter.sections" :id="s.id" :key="s.id" class="ch__sec" :aria-labelledby="`${s.id}-h`">
          <h2 :id="`${s.id}-h`">{{ s.title }}</h2>
          <RichText v-if="s.lead" tag="p" class="ch__lead" :text="s.lead" />
          <BlockRenderer :blocks="s.blocks" />
        </section>

        <section v-if="chapter.quiz.length" id="quiz" class="ch__sec" aria-labelledby="quiz-h">
          <h2 id="quiz-h">理解度クイズ</h2>
          <p class="ch__lead">選ぶとその場で正誤と解説が出ます。結果はこのブラウザに保存され、サイドバーに正解数が表示されます。</p>
          <ChapterQuiz :slug="chapter.slug" :questions="chapter.quiz" />
        </section>

        <section v-if="chapter.exercises.length" id="exercises" class="ch__sec" aria-labelledby="exercises-h">
          <h2 id="exercises-h">コード演習</h2>
          <p class="ch__lead">エディターに直接書いて「チェックする」を押すと、条件を満たしているかを確認できます。途中経過は自動保存されます。</p>
          <div class="ch__exercises">
            <ExerciseRunner v-for="(ex, i) in chapter.exercises" :key="ex.id" :exercise="ex" :number="`${chapter.no}-${i + 1}`" />
          </div>
        </section>

        <ChapterNav :slug="chapter.slug" />
      </div>

      <aside class="ch__toc" aria-label="ページ内目次">
        <p class="ch__toc-label">この章の目次</p>
        <PageToc :items="toc" />
      </aside>
    </div>
  </article>
</template>

<style scoped>
.ch-state {
  padding: var(--sp-8) var(--sp-5);
  color: var(--ink-3);
  display: grid;
  gap: var(--sp-3);
  justify-items: start;
}
.ch {
  padding: var(--sp-6) var(--sp-5) var(--sp-8);
  max-width: calc(var(--content-w) + var(--toc-w) + 40px + 48px);
  margin: 0 auto;
}
.ch__hero {
  max-width: var(--content-w);
  padding-bottom: var(--sp-5);
  border-bottom: 1px solid var(--line);
  margin-bottom: var(--sp-6);
}
.ch__kicker {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}
.ch__no {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.08em;
}
.ch__hero h1 {
  font-size: var(--fs-3xl);
  letter-spacing: 0.01em;
}
.ch__sub {
  margin-top: 4px;
  font-size: var(--fs-lg);
  color: var(--ink-2);
}
.ch__summary {
  margin-top: var(--sp-3);
  color: var(--ink-2);
}
.ch__goals {
  margin-top: var(--sp-4);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--radius-m);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
}
.ch__goals h2 {
  font-size: var(--fs-sm);
  color: var(--accent);
}
.ch__goals ul {
  margin: 6px 0 0;
  padding-left: 1.3em;
  font-size: 0.9375rem;
  line-height: 1.75;
  display: grid;
  gap: 2px;
}

.ch__layout {
  display: grid;
  grid-template-columns: minmax(0, var(--content-w));
  gap: 40px;
}
.ch__body {
  display: grid;
  gap: var(--sp-7);
  min-width: 0;
}
.ch__sec {
  display: grid;
  gap: var(--sp-4);
  min-width: 0;
}
.ch__sec > h2 {
  font-size: var(--fs-2xl);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--ink);
}
.ch__lead {
  color: var(--ink-2);
}
.ch__exercises {
  display: grid;
  gap: var(--sp-4);
}

.ch__toc {
  display: none;
}
.ch__toc-m {
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg-raised);
  padding: 0 var(--sp-3);
}
.ch__toc-m summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 2px;
  font-weight: 700;
  font-size: var(--fs-sm);
  cursor: pointer;
}
.ch__toc-m[open] {
  padding-bottom: var(--sp-3);
}

@media (min-width: 1280px) {
  .ch__layout {
    grid-template-columns: minmax(0, var(--content-w)) var(--toc-w);
  }
  .ch__toc {
    display: block;
    position: sticky;
    top: calc(var(--header-h) + 24px);
    align-self: start;
    max-height: calc(100vh - var(--header-h) - 48px);
    overflow-y: auto;
    scrollbar-width: thin;
  }
  .ch__toc-label {
    font-size: var(--fs-xs);
    font-weight: 700;
    color: var(--ink-3);
    letter-spacing: 0.1em;
    margin-bottom: var(--sp-2);
  }
  .ch__toc-m {
    display: none;
  }
}
@media (max-width: 640px) {
  .ch {
    padding: var(--sp-5) var(--sp-4) var(--sp-7);
  }
  .ch__sec > h2 {
    font-size: var(--fs-xl);
  }
}
</style>
