import { reactive, watch } from 'vue'
import { defineStore } from 'pinia'

const KEY = 'thewpf:progress:v1'

export interface QuizResult {
  /** 設問 ID → 選んだ選択肢 */
  answers: Record<string, number>
  correct: number
  total: number
}

interface State {
  quiz: Record<string, QuizResult>
  /** 演習 ID → 状態 */
  exercises: Record<string, { done: boolean; code?: string }>
  /** ロードマップのチェックリスト */
  checklist: Record<string, boolean>
}

function load(): State {
  const empty: State = { quiz: {}, exercises: {}, checklist: {} }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    return { ...empty, ...(JSON.parse(raw) as Partial<State>) }
  } catch {
    return empty
  }
}

/** クイズ結果・演習の進捗・チェックリストを localStorage に保存するストア */
export const useProgress = defineStore('progress', () => {
  const state = reactive<State>(load())

  watch(
    state,
    (s) => {
      try {
        localStorage.setItem(KEY, JSON.stringify(s))
      } catch {
        /* 保存できない環境では黙って続行する */
      }
    },
    { deep: true },
  )

  function saveQuiz(slug: string, result: QuizResult) {
    state.quiz[slug] = result
  }
  function resetQuiz(slug: string) {
    delete state.quiz[slug]
  }
  function saveExercise(id: string, patch: { done?: boolean; code?: string }) {
    const cur = state.exercises[id] ?? { done: false }
    state.exercises[id] = { ...cur, ...patch }
  }
  function resetExercise(id: string) {
    delete state.exercises[id]
  }
  function toggleCheck(id: string) {
    state.checklist[id] = !state.checklist[id]
  }
  function resetAll() {
    state.quiz = {}
    state.exercises = {}
    state.checklist = {}
  }

  return { state, saveQuiz, resetQuiz, saveExercise, resetExercise, toggleCheck, resetAll }
})
