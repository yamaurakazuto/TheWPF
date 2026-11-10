<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import UiIcon from '@/components/content/UiIcon.vue'
import { prefersReducedMotion } from '@/lib/anim'

/**
 * Dispatcher の優先度付きキューのシミュレータ。
 * 作業を好きな優先度で積み、1 件ずつ処理させて「実行される順番」を確かめる。
 * ルールは本物と同じ: ① 優先度の高いものから ② 同じ優先度なら先に積んだものから ③ 一度に 1 件だけ。
 */
interface Priority {
  value: number
  name: string
  use: string
  color: string
}
const PRIORITIES: Priority[] = [
  { value: 10, name: 'Send', use: '最優先。他のすべてより先に処理', color: 'danger' },
  { value: 9, name: 'Normal', use: 'BeginInvoke / InvokeAsync の既定。await の続きもここ', color: 'ui' },
  { value: 8, name: 'DataBind', use: 'データバインディングの処理', color: 'ui' },
  { value: 7, name: 'Render', use: 'レイアウトと描画', color: 'render' },
  { value: 6, name: 'Loaded', use: 'レイアウトと描画が済んだ直後（Loaded イベント）', color: 'render' },
  { value: 5, name: 'Input', use: 'マウスやキーボードの入力', color: 'warn' },
  { value: 4, name: 'Background', use: '入力より後。UI を止めたくない作業', color: 'data' },
  { value: 3, name: 'ContextIdle', use: 'Background の処理が済んだ後', color: 'data' },
  { value: 2, name: 'ApplicationIdle', use: 'アプリが暇になったとき', color: 'mute' },
  { value: 1, name: 'SystemIdle', use: 'システム全体が暇になったとき', color: 'mute' },
]
const byName = (n: string) => PRIORITIES.find((p) => p.name === n)!

interface Op {
  id: number
  label: string
  priority: Priority
}
let seq = 0
const queue = ref<Op[]>([])
const done = ref<Op[]>([])
const running = ref<Op | null>(null)
const playing = ref(false)

function add(label: string, priorityName: string) {
  queue.value.push({ id: ++seq, label, priority: byName(priorityName) })
}

/** 次に実行される 1 件（優先度が最も高く、その中で最も古いもの） */
const next = computed(() => {
  let best: Op | null = null
  for (const op of queue.value) if (!best || op.priority.value > best.priority.value) best = op
  return best
})

function step() {
  const op = next.value
  if (!op) {
    running.value = null
    return stop()
  }
  queue.value = queue.value.filter((o) => o.id !== op.id)
  running.value = op
  done.value.push(op)
}
let timer = 0
function stop() {
  playing.value = false
  clearInterval(timer)
}
function play() {
  if (!queue.value.length) return
  if (prefersReducedMotion()) {
    while (next.value) step()
    running.value = null
    return
  }
  playing.value = true
  step()
  timer = window.setInterval(step, 650)
}
function clear() {
  stop()
  queue.value = []
  done.value = []
  running.value = null
  seq = 0
}
onBeforeUnmount(stop)

const ADDERS = [
  { label: 'キー入力', priority: 'Input' },
  { label: '描画', priority: 'Render' },
  { label: 'BeginInvoke', priority: 'Normal' },
  { label: '裏の作業', priority: 'Background' },
  { label: '描画後の処理', priority: 'Loaded' },
  { label: '暇なとき', priority: 'ApplicationIdle' },
]

const SCENARIOS = [
  {
    label: 'A: 重い処理を Normal で 5 分割',
    note: '作業を 5 つに分けて Normal で積んだあと、利用者がキーを 2 回押した。入力は Normal より優先度が低いので、5 件すべてが終わるまで待たされる。',
    ops: [...Array.from({ length: 5 }, (_, i) => [`計算 ${i + 1}/5`, 'Normal']), ['キー入力 ①', 'Input'], ['キー入力 ②', 'Input'], ['描画', 'Render']],
  },
  {
    label: 'B: 同じ処理を Background で',
    note: '同じ作業を Background で積むと、あとから来たキー入力と描画が先に処理される。画面は反応し続け、作業はその合間に進む。',
    ops: [...Array.from({ length: 5 }, (_, i) => [`計算 ${i + 1}/5`, 'Background']), ['キー入力 ①', 'Input'], ['キー入力 ②', 'Input'], ['描画', 'Render']],
  },
  {
    label: 'C: 描画が終わってから実行したい',
    note: 'リストに項目を追加した直後に「追加した行へスクロール」を Normal で積むと、描画より先に走ってしまい、まだ存在しない行を探すことになる。Loaded 以下で積めば、描画のあとに実行される。',
    ops: [['項目を追加（バインディング更新）', 'DataBind'], ['スクロール ✗（Normal）', 'Normal'], ['描画', 'Render'], ['スクロール ✓（Loaded）', 'Loaded']],
  },
] as const
const scenarioNote = ref('')
function load(i: number) {
  clear()
  for (const [label, p] of SCENARIOS[i].ops) add(label, p)
  scenarioNote.value = SCENARIOS[i].note
}
load(0)
</script>

<template>
  <div class="ds">
    <div class="controls">
      <span class="small muted">シナリオ:</span>
      <button v-for="(s, i) in SCENARIOS" :key="i" class="btn btn--sm" type="button" @click="load(i)">{{ s.label }}</button>
    </div>
    <p v-if="scenarioNote" class="ds__note">{{ scenarioNote }}</p>

    <div class="ds__grid">
      <section aria-label="Dispatcher のキュー">
        <h4>Dispatcher のキュー <small>上ほど優先度が高い</small></h4>
        <ol class="ds__lanes">
          <li v-for="p in PRIORITIES" :key="p.name" class="ds__lane" :class="{ 'is-next': next?.priority.name === p.name }" :style="{ '--pc': `var(--c-${p.color})`, '--pcs': `var(--c-${p.color}-soft)` }">
            <span class="ds__pname" :title="p.use"><span class="mono">{{ p.value }}</span> {{ p.name }}</span>
            <span class="ds__ops">
              <span v-for="op in queue.filter((o) => o.priority.name === p.name)" :key="op.id" class="ds__op" :class="{ 'is-next': next?.id === op.id }">
                <span class="ds__seq">#{{ op.id }}</span>{{ op.label }}
              </span>
            </span>
          </li>
        </ol>
        <div class="controls ds__adders">
          <span class="small muted">積む:</span>
          <button v-for="a in ADDERS" :key="a.label" class="btn btn--sm btn--ghost ds__add" type="button" @click="add(a.label, a.priority)">+ {{ a.label }}<small>{{ a.priority }}</small></button>
        </div>
      </section>

      <section aria-label="実行結果">
        <h4>UI スレッド <small>一度に 1 件だけ実行する</small></h4>
        <p class="ds__running" :class="{ 'is-busy': running }" aria-live="polite">
          <template v-if="running"><span class="ds__seq">#{{ running.id }}</span> {{ running.label }} <small>（{{ running.priority.name }}）を実行中</small></template>
          <template v-else>待機中（キューが空なら、ここで OS からのメッセージを待つ）</template>
        </p>
        <div class="controls">
          <button class="btn btn--sm btn--primary" type="button" :disabled="!queue.length && !playing" @click="playing ? stop() : play()">
            <UiIcon :name="playing ? 'pause' : 'play'" :size="14" /> {{ playing ? '一時停止' : '自動実行' }}
          </button>
          <button class="btn btn--sm" type="button" :disabled="!queue.length" @click="(stop(), step())"><UiIcon name="next" :size="14" /> 1 件処理</button>
          <button class="btn btn--sm btn--ghost" type="button" @click="(clear(), (scenarioNote = ''))"><UiIcon name="restart" :size="14" /> 空にする</button>
        </div>
        <h4 class="ds__h">実行された順番</h4>
        <ol class="ds__done" aria-live="polite">
          <li v-for="(op, i) in done" :key="op.id" :style="{ '--pc': `var(--c-${op.priority.color})`, '--pcs': `var(--c-${op.priority.color}-soft)` }">
            <span class="ds__n">{{ i + 1 }}</span>
            <span><span class="ds__seq">#{{ op.id }}</span>{{ op.label }}</span>
            <small>{{ op.priority.name }}</small>
          </li>
          <li v-if="!done.length" class="ds__empty">まだ何も実行されていない。「自動実行」か「1 件処理」を押す。</li>
        </ol>
        <p class="small muted">#番号は「積まれた順」。実行順と見比べると、優先度による追い越しがわかる。</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.ds {
  display: grid;
  gap: var(--sp-3);
  container-type: inline-size;
}
.ds__note {
  padding: 8px 12px;
  border-radius: var(--radius-s);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  font-size: var(--fs-sm);
  line-height: 1.7;
}
.ds__grid {
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: minmax(0, 1fr);
}
@container (min-width: 720px) {
  .ds__grid {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    align-items: start;
  }
}
.ds__grid > section {
  display: grid;
  gap: var(--sp-2);
  min-width: 0;
}
h4 {
  font-size: var(--fs-sm);
}
h4 small {
  font-weight: 400;
  color: var(--ink-3);
  margin-left: 6px;
}
.ds__lanes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 3px;
}
.ds__lane {
  display: grid;
  grid-template-columns: 9.4em minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 2px 6px;
  border-radius: var(--radius-s);
  border: 1px solid var(--line);
  border-left: 4px solid var(--pc);
  background: var(--bg);
}
.ds__lane.is-next {
  background: var(--pcs);
}
.ds__pname {
  font-size: var(--fs-xs);
  font-weight: 700;
  white-space: nowrap;
}
.ds__pname .mono {
  display: inline-block;
  width: 1.5em;
  color: var(--ink-3);
  text-align: right;
  margin-right: 2px;
}
.ds__ops {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}
.ds__op {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1.5px solid var(--pc);
  background: var(--bg-raised);
  font-size: var(--fs-xs);
  line-height: 1.6;
}
.ds__op.is-next {
  background: var(--pc);
  color: var(--bg-raised);
  font-weight: 700;
}
.ds__seq {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  opacity: 0.75;
  margin-right: 3px;
}
.ds__add {
  border: 1px dashed var(--line-strong);
  flex-direction: column;
  gap: 0;
  line-height: 1.25;
  padding: 3px 8px;
}
.ds__add small {
  font-size: 0.625rem;
  font-weight: 400;
  color: var(--ink-3);
}
.ds__running {
  min-height: 3.3em;
  padding: 8px 12px;
  border-radius: var(--radius-m);
  border: 2px dashed var(--line-strong);
  font-size: var(--fs-sm);
  line-height: 1.5;
  color: var(--ink-3);
}
.ds__running.is-busy {
  border-style: solid;
  border-color: var(--c-ui);
  background: var(--c-ui-soft);
  color: var(--ink);
  font-weight: 700;
}
.ds__running small {
  font-weight: 400;
}
.ds__h {
  margin-top: var(--sp-2);
}
.ds__done {
  list-style: none;
  margin: 0;
  padding: 6px;
  min-height: 9em;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  background: var(--bg);
  display: grid;
  gap: 3px;
  align-content: start;
  font-size: var(--fs-xs);
}
.ds__done li {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 2px 8px 2px 4px;
  border-radius: 5px;
  background: var(--pcs);
  border-left: 3px solid var(--pc);
}
.ds__n {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--bg-raised);
  font-family: var(--font-mono);
  font-weight: 700;
}
.ds__done small {
  color: var(--ink-2);
}
.ds__done .ds__empty {
  display: block;
  background: transparent;
  border: 0;
  color: var(--ink-3);
  padding: 6px;
}
@container (max-width: 460px) {
  .ds__lane {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
}
</style>
