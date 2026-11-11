<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Exercise } from '@/types/content'
import { runChecks, type CheckOutcome } from '@/lib/exercise'
import { useProgress } from '@/stores/progress'
import RichText from '@/components/content/RichText'
import CodeBlock from '@/components/content/CodeBlock.vue'
import UiIcon from '@/components/content/UiIcon.vue'
import CodeEditor from './CodeEditor.vue'
import XamlPreview from './XamlPreview.vue'

/** コード演習 1 問分。エディター・（XAML なら）プレビュー・構造チェック・ヒント・解答例 */
const props = defineProps<{ exercise: Exercise; number?: string }>()

const progress = useProgress()
const saved = computed(() => progress.state.exercises[props.exercise.id])

const code = ref(saved.value?.code ?? props.exercise.starter)
const outcome = ref<CheckOutcome | null>(null)
const hintsShown = ref(0)
const showSolution = ref(false)

watch(
  () => props.exercise.id,
  () => {
    code.value = saved.value?.code ?? props.exercise.starter
    outcome.value = null
    hintsShown.value = 0
    showSolution.value = false
  },
)

let saveTimer = 0
watch(code, (v) => {
  outcome.value = null
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    if (v !== props.exercise.starter || saved.value) progress.saveExercise(props.exercise.id, { code: v })
  }, 400)
})

function check() {
  const r = runChecks(props.exercise, code.value)
  outcome.value = r
  if (r.passed) progress.saveExercise(props.exercise.id, { done: true, code: code.value })
}
function reset() {
  code.value = props.exercise.starter
  outcome.value = null
  showSolution.value = false
  hintsShown.value = 0
  progress.resetExercise(props.exercise.id)
}
function loadSolution() {
  code.value = props.exercise.solution
}

const LANG = { xaml: 'XAML', csharp: 'C#', xml: 'XML（csproj）' } as const
const hints = computed(() => props.exercise.hints ?? [])
</script>

<template>
  <article class="ex" :class="{ 'ex--done': saved?.done }">
    <header class="ex__head">
      <span class="ex__no">演習{{ number ? ' ' + number : '' }}</span>
      <h3>{{ exercise.title }}</h3>
      <span class="chip">{{ LANG[exercise.lang] }}</span>
      <span class="chip" :aria-label="`難易度 ${exercise.level}（3 段階）`">{{ '★'.repeat(exercise.level) }}{{ '☆'.repeat(3 - exercise.level) }}</span>
      <span v-if="saved?.done" class="chip ex__donechip"><UiIcon name="check" :size="13" /> 達成済み</span>
    </header>

    <RichText tag="p" class="ex__prompt" :text="exercise.prompt" />

    <div class="ex__work" :class="{ 'ex__work--split': exercise.preview }">
      <CodeEditor v-model="code" :lang="exercise.lang" :label="`${exercise.title} の解答欄`" />
      <XamlPreview v-if="exercise.preview" :source="code" />
    </div>

    <div class="controls">
      <button class="btn btn--primary" type="button" @click="check"><UiIcon name="check" :size="15" /> チェックする</button>
      <button v-if="hints.length" class="btn" type="button" :disabled="hintsShown >= hints.length" @click="hintsShown++">
        <UiIcon name="bulb" :size="15" /> ヒント（{{ hintsShown }} / {{ hints.length }}）
      </button>
      <button class="btn" type="button" :aria-expanded="showSolution" @click="showSolution = !showSolution">
        <UiIcon name="eye" :size="15" /> 解答例を{{ showSolution ? '隠す' : '見る' }}
      </button>
      <button class="btn btn--ghost" type="button" @click="reset"><UiIcon name="restart" :size="15" /> 最初の状態に戻す</button>
    </div>

    <ul v-if="hintsShown" class="ex__hints">
      <li v-for="(h, i) in hints.slice(0, hintsShown)" :key="i"><RichText :text="h" /></li>
    </ul>

    <div v-if="outcome" class="ex__result" :class="outcome.passed ? 'is-pass' : 'is-fail'" role="status">
      <p v-if="outcome.parseError" class="ex__parse">
        <b>{{ outcome.parseError.line }} 行目で構文エラー:</b> {{ outcome.parseError.message }}
      </p>
      <p v-else class="ex__verdict">
        <b>{{ outcome.passed ? 'すべての条件を満たしています。' : 'まだ満たしていない条件があります。' }}</b>
      </p>
      <ul>
        <li v-for="(r, i) in outcome.results" :key="i" :class="r.ok ? 'ok' : 'ng'">
          <UiIcon :name="r.ok ? 'check' : 'cross'" :size="15" />
          <span><span class="sr-only">{{ r.ok ? '達成: ' : '未達成: ' }}</span>{{ r.label }}</span>
        </li>
      </ul>
    </div>

    <div v-if="showSolution" class="ex__solution">
      <CodeBlock :code="exercise.solution" :lang="exercise.lang" title="解答例" />
      <RichText v-if="exercise.solutionNote" tag="p" class="ex__solnote" :text="exercise.solutionNote" />
      <button class="btn btn--sm" type="button" @click="loadSolution">解答例をエディターに読み込む</button>
    </div>

    <p class="ex__disclaimer">
      判定はブラウザ内の<strong>構造チェック</strong>（要素・属性・構文パターンの検査）です。コンパイルは行わないため、合格してもビルドが通ることまでは保証しません。仕上げは実際のプロジェクトで確かめてください。
    </p>
  </article>
</template>

<style scoped>
.ex {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--bg-raised);
  min-width: 0;
  container-type: inline-size;
}
.ex--done {
  border-color: var(--c-data);
}
.ex__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px var(--sp-2);
}
.ex__head h3 {
  font-size: var(--fs-lg);
  margin-right: auto;
}
.ex__no {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--accent);
  padding: 1px 8px;
  border-radius: 6px;
  background: var(--accent-soft);
}
.ex__donechip {
  border-color: var(--c-data);
  color: var(--c-data);
  background: var(--c-data-soft);
}
.ex__prompt {
  font-size: 0.9375rem;
}
.ex__work {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: minmax(0, 1fr);
}
.ex__work > * {
  min-width: 0;
}
@container (min-width: 820px) {
  .ex__work--split {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: start;
  }
}
.ex__hints {
  margin: 0;
  padding: 10px 14px 10px 30px;
  border-radius: var(--radius-m);
  background: var(--c-warn-soft);
  border: 1px solid var(--c-warn);
  font-size: var(--fs-sm);
  line-height: 1.75;
}
.ex__result {
  padding: 12px 14px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line-strong);
  font-size: var(--fs-sm);
}
.ex__result.is-pass {
  border-color: var(--c-data);
  background: var(--c-data-soft);
}
.ex__result.is-fail {
  border-color: var(--c-warn);
}
.ex__parse b {
  color: var(--c-danger);
}
.ex__result ul {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: grid;
  gap: 4px;
}
.ex__result li {
  display: flex;
  gap: 8px;
  align-items: baseline;
  line-height: 1.6;
}
.ex__result li.ok {
  color: var(--c-data);
}
.ex__result li.ng {
  color: var(--c-danger);
}
.ex__result li span {
  color: var(--ink);
}
.ex__solution {
  display: grid;
  gap: var(--sp-2);
  justify-items: start;
}
.ex__solution > :first-child {
  justify-self: stretch;
}
.ex__solnote {
  font-size: var(--fs-sm);
  color: var(--ink-2);
}
.ex__disclaimer {
  font-size: var(--fs-xs);
  color: var(--ink-3);
  line-height: 1.65;
}
</style>
