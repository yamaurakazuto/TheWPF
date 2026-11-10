<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { QuizQuestion } from '@/types/content'
import { useProgress } from '@/stores/progress'
import RichText from '@/components/content/RichText'
import CodeBlock from '@/components/content/CodeBlock.vue'
import UiIcon from '@/components/content/UiIcon.vue'

/** 章末クイズ。選ぶとその場で正誤と解説が出る。結果は localStorage に保存される */
const props = defineProps<{ slug: string; questions: QuizQuestion[] }>()

const progress = useProgress()
const answers = reactive<Record<string, number>>({})

watch(
  () => props.slug,
  (slug) => {
    for (const k of Object.keys(answers)) delete answers[k]
    Object.assign(answers, progress.state.quiz[slug]?.answers ?? {})
  },
  { immediate: true },
)

const answered = computed(() => props.questions.filter((q) => answers[q.id] !== undefined).length)
const correct = computed(() => props.questions.filter((q) => answers[q.id] === q.answer).length)
const done = computed(() => answered.value === props.questions.length)

function choose(q: QuizQuestion, i: number) {
  if (answers[q.id] !== undefined) return
  answers[q.id] = i
  progress.saveQuiz(props.slug, { answers: { ...answers }, correct: correct.value, total: props.questions.length })
}
function reset() {
  for (const k of Object.keys(answers)) delete answers[k]
  progress.resetQuiz(props.slug)
}
const LETTER = ['A', 'B', 'C', 'D', 'E']
</script>

<template>
  <div class="quiz">
    <p class="quiz__status" aria-live="polite">
      <span class="quiz__meter" aria-hidden="true"><span :style="{ width: (answered / questions.length) * 100 + '%' }" /></span>
      <span>{{ answered }} / {{ questions.length }} 問に回答</span>
      <b v-if="answered">正解 {{ correct }} 問</b>
      <button v-if="answered" class="btn btn--sm btn--ghost" type="button" @click="reset">
        <UiIcon name="restart" :size="14" /> やり直す
      </button>
    </p>

    <ol class="quiz__list">
      <li v-for="(q, qi) in questions" :key="q.id" class="quiz__q">
        <fieldset :disabled="answers[q.id] !== undefined">
          <legend>
            <span class="quiz__n">Q{{ qi + 1 }}</span>
            <RichText :text="q.q" />
          </legend>
          <CodeBlock v-if="q.code" :code="q.code.code" :lang="q.code.lang" class="quiz__code" />
          <div class="quiz__choices">
            <button
              v-for="(c, i) in q.choices"
              :key="i"
              type="button"
              class="quiz__choice"
              :class="{
                'is-correct': answers[q.id] !== undefined && i === q.answer,
                'is-wrong': answers[q.id] === i && i !== q.answer,
                'is-picked': answers[q.id] === i,
              }"
              :aria-pressed="answers[q.id] === i"
              @click="choose(q, i)"
            >
              <span class="quiz__letter" aria-hidden="true">{{ LETTER[i] }}</span>
              <RichText :text="c" />
              <span v-if="answers[q.id] !== undefined && i === q.answer" class="quiz__mark"><UiIcon name="check" :size="16" /><span class="sr-only">正解</span></span>
              <span v-else-if="answers[q.id] === i" class="quiz__mark"><UiIcon name="cross" :size="16" /><span class="sr-only">不正解</span></span>
            </button>
          </div>
        </fieldset>
        <div v-if="answers[q.id] !== undefined" class="quiz__explain" :class="answers[q.id] === q.answer ? 'is-ok' : 'is-ng'" role="status">
          <b>{{ answers[q.id] === q.answer ? '正解です。' : `不正解。正解は ${LETTER[q.answer]} です。` }}</b>
          <RichText tag="p" :text="q.explain" />
        </div>
      </li>
    </ol>

    <p v-if="done" class="quiz__result" role="status">
      <b>{{ correct }} / {{ questions.length }} 問正解。</b>
      {{ correct === questions.length ? '全問正解です。次の章へ進みましょう。' : '間違えた設問の解説を読み直してから、もう一度挑戦できます。' }}
    </p>
  </div>
</template>

<style scoped>
.quiz {
  display: grid;
  gap: var(--sp-4);
}
.quiz__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--ink-2);
}
.quiz__meter {
  width: 120px;
  height: 6px;
  border-radius: 3px;
  background: var(--line);
  overflow: hidden;
}
.quiz__meter span {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 0.3s var(--ease);
}
.quiz__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sp-4);
}
.quiz__q {
  padding: var(--sp-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--bg-raised);
  min-width: 0;
}
fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}
legend {
  padding: 0;
  font-weight: 700;
  line-height: 1.7;
  margin-bottom: var(--sp-3);
}
.quiz__n {
  display: inline-block;
  margin-right: 8px;
  padding: 0 8px;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}
.quiz__code {
  margin-bottom: var(--sp-3);
}
.quiz__choices {
  display: grid;
  gap: var(--sp-2);
}
.quiz__choice {
  display: flex;
  align-items: baseline;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line-strong);
  background: var(--bg);
  line-height: 1.6;
  font-size: 0.9375rem;
}
.quiz__choice:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.quiz__letter {
  flex: none;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--ink-3);
}
.quiz__mark {
  margin-left: auto;
  flex: none;
}
fieldset:disabled .quiz__choice {
  cursor: default;
  opacity: 0.7;
}
fieldset:disabled .quiz__choice.is-correct {
  opacity: 1;
  border-color: var(--c-data);
  background: var(--c-data-soft);
  color: var(--ink);
}
fieldset:disabled .quiz__choice.is-wrong {
  opacity: 1;
  border-color: var(--c-danger);
  background: var(--c-danger-soft);
}
.quiz__choice.is-correct .quiz__mark {
  color: var(--c-data);
}
.quiz__choice.is-wrong .quiz__mark {
  color: var(--c-danger);
}
.quiz__explain {
  margin-top: var(--sp-3);
  padding: 10px 14px;
  border-radius: var(--radius-m);
  border-left: 4px solid var(--c-data);
  background: var(--bg);
  font-size: 0.9375rem;
  line-height: 1.75;
}
.quiz__explain.is-ng {
  border-left-color: var(--c-danger);
}
.quiz__result {
  padding: 12px 16px;
  border-radius: var(--radius-m);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
}
</style>
