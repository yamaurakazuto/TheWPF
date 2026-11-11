<script setup lang="ts">
import { computed, ref } from 'vue'
import { flow, flowStart, type FlowNode, type FlowQuestion } from '@/content/tradeoffs'
import UiIcon from '@/components/content/UiIcon.vue'

/**
 * 「WPF を選ぶべきか」の判断フローチャート。
 * 質問に答えると経路が下へ伸び、最後に結論が出る。答えた質問を押すと、そこからやり直せる。
 */
const byId = new Map<string, FlowNode>(flow.map((n) => [n.id, n]))

/** これまでの回答（質問 ID と yes/no） */
const answers = ref<{ id: string; yes: boolean }[]>([])

const path = computed(() => {
  const steps: { node: FlowQuestion; yes: boolean }[] = []
  let cur = byId.get(flowStart)!
  for (const a of answers.value) {
    if (cur.kind !== 'q' || cur.id !== a.id) break
    steps.push({ node: cur, yes: a.yes })
    cur = byId.get(a.yes ? cur.yes : cur.no)!
  }
  return { steps, current: cur }
})

function answer(yes: boolean) {
  const cur = path.value.current
  if (cur.kind === 'q') answers.value = [...answers.value, { id: cur.id, yes }]
}
function rewind(i: number) {
  answers.value = answers.value.slice(0, i)
}
function reset() {
  answers.value = []
}

const VERDICT = {
  wpf: { label: 'WPF が向いている', icon: 'check' },
  maybe: { label: '条件付き', icon: 'info' },
  other: { label: 'ほかの選択肢を', icon: 'right' },
} as const

const questionCount = flow.filter((n) => n.kind === 'q').length

/** 全体図: 木を深さ優先でたどって、インデント付きの一覧にする */
interface Row {
  key: string
  depth: number
  branch: string | null
  node: FlowNode
}
const outline = computed(() => {
  const rows: Row[] = []
  const walk = (id: string, depth: number, branch: string | null, key: string) => {
    const node = byId.get(id)!
    rows.push({ key, depth, branch, node })
    if (node.kind === 'q') {
      walk(node.yes, depth + 1, node.yesLabel ?? 'はい', `${key}y`)
      walk(node.no, depth + 1, node.noLabel ?? 'いいえ', `${key}n`)
    }
  }
  walk(flowStart, 0, null, 'r')
  return rows
})
const onPath = computed(() => new Set([...path.value.steps.map((s) => s.node.id), path.value.current.id]))
</script>

<template>
  <div class="df">
    <ol class="df__path" aria-label="これまでの回答">
      <li v-for="(s, i) in path.steps" :key="s.node.id" class="df__step">
        <button type="button" class="df__answered" :title="'この質問からやり直す'" @click="rewind(i)">
          <span class="df__q">Q{{ i + 1 }}</span>
          <span class="df__text">{{ s.node.text }}</span>
          <span class="df__ans" :class="s.yes ? 'is-yes' : 'is-no'">{{ s.yes ? (s.node.yesLabel ?? 'はい') : (s.node.noLabel ?? 'いいえ') }}</span>
        </button>
        <span class="df__line" aria-hidden="true" />
      </li>
    </ol>

    <section v-if="path.current.kind === 'q'" class="df__current" aria-live="polite">
      <p class="df__count">質問 {{ path.steps.length + 1 }}（全 {{ questionCount }} 問のうち、経路上の数問だけに答えます）</p>
      <h4>{{ path.current.text }}</h4>
      <p class="df__help">{{ path.current.help }}</p>
      <div class="controls">
        <button class="btn btn--primary" type="button" @click="answer(true)">{{ path.current.yesLabel ?? 'はい' }}</button>
        <button class="btn" type="button" @click="answer(false)">{{ path.current.noLabel ?? 'いいえ' }}</button>
      </div>
    </section>

    <section v-else class="df__result" :class="`df__result--${path.current.verdict}`" aria-live="polite">
      <p class="df__verdict"><UiIcon :name="VERDICT[path.current.verdict].icon" :size="16" /> {{ VERDICT[path.current.verdict].label }}</p>
      <h4>{{ path.current.title }}</h4>
      <p>{{ path.current.text }}</p>
      <template v-if="path.current.alternatives?.length">
        <p class="df__alt-head">あわせて比較するもの</p>
        <ul>
          <li v-for="a in path.current.alternatives" :key="a">{{ a }}</li>
        </ul>
      </template>
      <button class="btn btn--sm" type="button" @click="reset"><UiIcon name="restart" :size="14" /> 最初からやり直す</button>
    </section>

    <details class="df__map">
      <summary>フロー全体を見る</summary>
      <ul>
        <li v-for="r in outline" :key="r.key" :style="{ '--d': r.depth }" :class="[`is-${r.node.kind}`, r.node.kind === 'r' ? `is-${r.node.verdict}` : '', { 'is-on': onPath.has(r.node.id) }]">
          <span v-if="r.branch" class="df__branch">{{ r.branch }} →</span>
          <span>{{ r.node.kind === 'q' ? r.node.text : r.node.title }}</span>
        </li>
      </ul>
    </details>

    <p class="small muted">
      これは考える順序を示すための簡略なフローで、結論を機械的に決めるものではない。チームの経験、既存資産、保守期間、利用するサードパーティ製品などを合わせて判断する。答えた質問を押すと、そこからやり直せる。
    </p>
  </div>
</template>

<style scoped>
.df {
  display: grid;
  gap: var(--sp-2);
  max-width: 640px;
  margin: 0 auto;
}
.df__path {
  list-style: none;
  margin: 0;
  padding: 0;
}
.df__step {
  display: grid;
  justify-items: center;
}
.df__answered {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-m);
  background: var(--bg);
  text-align: left;
  font-size: var(--fs-sm);
  line-height: 1.5;
}
.df__answered:hover {
  border-color: var(--accent);
}
.df__q {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
}
.df__ans {
  padding: 1px 10px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-weight: 700;
  white-space: nowrap;
}
.df__ans.is-yes {
  background: var(--c-data-soft);
  color: var(--c-data);
}
.df__ans.is-no {
  background: var(--c-mute-soft);
  color: var(--ink-2);
}
.df__line {
  width: 2px;
  height: 18px;
  background: var(--line-strong);
}
.df__current,
.df__result {
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-4);
  border-radius: var(--radius-l);
  border: 2px solid var(--accent);
  background: var(--accent-soft);
}
.df__count {
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.df__current h4,
.df__result h4 {
  font-size: var(--fs-lg);
}
.df__help {
  font-size: var(--fs-sm);
  color: var(--ink-2);
}
.df__current .btn {
  min-height: 42px;
}
.df__result {
  justify-items: start;
  font-size: 0.9375rem;
  line-height: 1.8;
}
.df__result--wpf {
  border-color: var(--c-data);
  background: var(--c-data-soft);
}
.df__result--maybe {
  border-color: var(--c-warn);
  background: var(--c-warn-soft);
}
.df__result--other {
  border-color: var(--c-render);
  background: var(--c-render-soft);
}
.df__verdict {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-xs);
  font-weight: 700;
  padding: 1px 10px;
  border-radius: 999px;
  background: var(--bg-raised);
}
.df__alt-head {
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-2);
}
.df__result ul {
  margin: 0;
  padding-left: 1.3em;
  font-size: var(--fs-sm);
}
.df__map {
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  padding: 6px 12px;
  background: var(--bg);
  font-size: var(--fs-sm);
}
.df__map summary {
  cursor: pointer;
  font-weight: 700;
}
.df__map ul {
  list-style: none;
  margin: 8px 0 4px;
  padding: 0;
  display: grid;
  gap: 3px;
}
.df__map li {
  margin-left: calc(var(--d) * 14px);
  padding: 3px 8px;
  border-left: 3px solid var(--line-strong);
  border-radius: 0 5px 5px 0;
  line-height: 1.5;
  font-size: var(--fs-xs);
}
.df__map li.is-r {
  font-weight: 700;
}
.df__map li.is-wpf {
  border-left-color: var(--c-data);
}
.df__map li.is-maybe {
  border-left-color: var(--c-warn);
}
.df__map li.is-other {
  border-left-color: var(--c-render);
}
.df__map li.is-on {
  background: var(--accent-soft);
}
.df__branch {
  color: var(--ink-3);
  margin-right: 6px;
  font-weight: 400;
}
@media (max-width: 520px) {
  .df__answered {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .df__ans {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
