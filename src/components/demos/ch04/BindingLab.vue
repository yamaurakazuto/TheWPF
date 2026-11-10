<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CodeBlock from '@/components/content/CodeBlock.vue'
import UiIcon from '@/components/content/UiIcon.vue'

/**
 * Binding の Mode / UpdateSourceTrigger / 変更通知の有無を切り替えて、
 * 値が「いつ・どちら向きに」流れるかを手で確かめる実験台。
 * 左が TextBox.Text（ターゲット）、右が ViewModel.Name（ソース）。
 */
type Mode = 'OneWay' | 'TwoWay' | 'OneTime' | 'OneWayToSource'
type Trigger = 'PropertyChanged' | 'LostFocus' | 'Explicit'

const MODES: { id: Mode; desc: string }[] = [
  { id: 'OneWay', desc: 'ソース → ターゲットのみ。表示専用の項目に使う' },
  { id: 'TwoWay', desc: '双方向。入力欄（TextBox.Text の既定）' },
  { id: 'OneTime', desc: '最初の 1 回だけソース → ターゲット。以後は追従しない' },
  { id: 'OneWayToSource', desc: 'ターゲット → ソースのみ。使う場面は少ない' },
]
const TRIGGERS: { id: Trigger; when: string }[] = [
  { id: 'PropertyChanged', when: '1 文字入力するたび' },
  { id: 'LostFocus', when: 'フォーカスが外れたとき（TextBox.Text の既定）' },
  { id: 'Explicit', when: 'UpdateSource() を呼んだときだけ' },
]

const mode = ref<Mode>('TwoWay')
const trigger = ref<Trigger>('LostFocus')
const inpc = ref(true)

const source = ref('WPF') // ViewModel.Name の実際の値
const target = ref('WPF') // TextBox に表示されている文字
const draft = ref('WPF') // 「コードから代入する値」の入力欄

const toSource = computed(() => mode.value === 'TwoWay' || mode.value === 'OneWayToSource')
const toTarget = computed(() => mode.value === 'OneWay' || mode.value === 'TwoWay')

const log = ref<{ text: string; kind: 'ok' | 'ng' | 'info' }[]>([])
const flash = ref<'toSource' | 'toTarget' | null>(null)
let flashTimer = 0
function note(text: string, kind: 'ok' | 'ng' | 'info', dir: 'toSource' | 'toTarget' | null = null) {
  log.value = [{ text, kind }, ...log.value].slice(0, 5)
  flash.value = dir
  clearTimeout(flashTimer)
  if (dir) flashTimer = window.setTimeout(() => (flash.value = null), 700)
}

/** バインディングを作り直したときの初期転送 */
function rebind() {
  if (mode.value === 'OneWayToSource') {
    source.value = target.value
    note(`バインディング確立: ターゲットの値 "${target.value}" がソースへ書き込まれた`, 'info', 'toSource')
  } else {
    target.value = source.value
    note(`バインディング確立: ソースの値 "${source.value}" がターゲットへコピーされた`, 'info', 'toTarget')
  }
  draft.value = source.value
}
watch([mode, trigger, inpc], rebind)

function pushToSource(reason: string) {
  if (!toSource.value) return
  if (source.value === target.value) return
  source.value = target.value
  draft.value = source.value
  note(`${reason} → ソースを "${target.value}" に更新`, 'ok', 'toSource')
}
function onInput() {
  if (!toSource.value) return note(`入力したが、Mode=${mode.value} なのでソースへは書き込まれない`, 'ng')
  if (trigger.value === 'PropertyChanged') pushToSource('入力')
}
function onBlur() {
  if (toSource.value && trigger.value === 'LostFocus') pushToSource('フォーカスが外れた')
}
function explicitUpdate() {
  pushToSource('UpdateSource() を呼んだ')
}

/** ViewModel 側で Name = draft を実行 */
function assign() {
  source.value = draft.value
  if (!toTarget.value) return note(`ソースを "${draft.value}" にしたが、Mode=${mode.value} なのでターゲットは変わらない`, 'ng')
  if (!inpc.value) return note(`ソースを "${draft.value}" にしたが、PropertyChanged を出していないのでターゲットは古いまま`, 'ng')
  target.value = source.value
  note(`PropertyChanged("Name") → ターゲットを "${source.value}" に更新`, 'ok', 'toTarget')
}

const xaml = computed(() => {
  const parts = ['Name']
  if (mode.value !== 'TwoWay') parts.push(`Mode=${mode.value}`)
  if (toSource.value && trigger.value !== 'LostFocus') parts.push(`UpdateSourceTrigger=${trigger.value}`)
  return `<TextBox Text="{Binding ${parts.join(', ')}}" />`
})
const vmCode = computed(() =>
  inpc.value
    ? `public string Name\n{\n    get => _name;\n    set => SetProperty(ref _name, value);   // 変更を通知する\n}`
    : `public string Name { get; set; }   // 通知なしの普通のプロパティ`,
)
const out = computed(() => source.value !== target.value)
</script>

<template>
  <div class="bl">
    <div class="bl__opts">
      <fieldset>
        <legend>Mode</legend>
        <label v-for="m in MODES" :key="m.id" class="check"><input v-model="mode" type="radio" name="bl-mode" :value="m.id" /> <span class="mono">{{ m.id }}</span></label>
        <p>{{ MODES.find((m) => m.id === mode)!.desc }}</p>
      </fieldset>
      <fieldset :disabled="!toSource">
        <legend>UpdateSourceTrigger</legend>
        <label v-for="t in TRIGGERS" :key="t.id" class="check"><input v-model="trigger" type="radio" name="bl-trigger" :value="t.id" /> <span class="mono">{{ t.id }}</span></label>
        <p>{{ toSource ? TRIGGERS.find((t) => t.id === trigger)!.when : 'ターゲット → ソースの流れがない Mode では意味を持たない' }}</p>
      </fieldset>
      <fieldset>
        <legend>ソース側の変更通知</legend>
        <label class="check"><input v-model="inpc" type="checkbox" /> <span class="mono">INotifyPropertyChanged</span> を実装する</label>
        <p>{{ inpc ? 'setter で PropertyChanged を発生させる' : '値を変えても、誰にも知らせない' }}</p>
      </fieldset>
    </div>

    <div class="bl__stage">
      <section class="bl__card bl__card--target">
        <h4>ターゲット <small>View の TextBox.Text</small></h4>
        <label class="sr-only" for="bl-target">TextBox に入力する</label>
        <input id="bl-target" v-model="target" class="bl__textbox" type="text" spellcheck="false" autocomplete="off" @input="onInput" @blur="onBlur" />
        <p class="small muted">ここに入力してみる（利用者の操作）</p>
        <button v-if="toSource && trigger === 'Explicit'" class="btn btn--sm" type="button" @click="explicitUpdate">UpdateSource() を呼ぶ</button>
      </section>

      <div class="bl__wires" aria-hidden="true">
        <div class="bl__wire" :class="{ 'is-off': !toSource, 'is-flash': flash === 'toSource' }">
          <span>{{ toSource ? TRIGGERS.find((t) => t.id === trigger)!.when.replace(/（.*）/, '') : '流れない' }}</span>
          <b>→</b>
        </div>
        <div class="bl__wire bl__wire--back" :class="{ 'is-off': !toTarget || !inpc, 'is-flash': flash === 'toTarget' }">
          <b>←</b>
          <span>{{ !toTarget ? (mode === 'OneTime' ? '最初の 1 回だけ' : '流れない') : inpc ? 'PropertyChanged のたび' : '通知がないので流れない' }}</span>
        </div>
      </div>

      <section class="bl__card bl__card--source">
        <h4>ソース <small>ViewModel の Name</small></h4>
        <p class="bl__value mono" aria-live="polite">"{{ source }}"</p>
        <div class="bl__assign">
          <label class="sr-only" for="bl-draft">コードから代入する値</label>
          <span class="mono">Name =</span>
          <input id="bl-draft" v-model="draft" class="input mono" type="text" spellcheck="false" autocomplete="off" @keydown.enter="assign" />
          <button class="btn btn--sm" type="button" @click="assign">代入</button>
        </div>
        <p class="small muted">コードから値を変えてみる（プログラムの操作）</p>
      </section>
    </div>

    <p v-if="out" class="bl__out"><UiIcon name="warn" :size="15" /> ターゲットとソースの値がずれている（画面の表示 ≠ データ）</p>

    <ol class="bl__log" aria-label="直近の出来事" aria-live="polite">
      <li v-for="(l, i) in log" :key="i" :class="`is-${l.kind}`">{{ l.text }}</li>
      <li v-if="!log.length" class="is-info">設定を変えたり、入力したりすると、ここに何が起きたかが出る。</li>
    </ol>

    <div class="bl__codes">
      <CodeBlock :code="xaml" lang="xaml" title="この設定の XAML" excerpt />
      <CodeBlock :code="vmCode" lang="csharp" title="ViewModel 側" excerpt />
    </div>
  </div>
</template>

<style scoped>
.bl {
  display: grid;
  gap: var(--sp-3);
  container-type: inline-size;
}
.bl__opts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: var(--sp-2);
}
fieldset {
  margin: 0;
  padding: 6px 12px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  display: grid;
  gap: 3px;
  align-content: start;
  min-width: 0;
}
fieldset:disabled {
  opacity: 0.5;
}
legend {
  padding: 0 6px;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
}
fieldset p {
  margin-top: 4px;
  font-size: var(--fs-xs);
  color: var(--ink-2);
  line-height: 1.55;
  min-height: 3.1em;
}
.bl__stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--sp-2);
  align-items: stretch;
}
@container (min-width: 680px) {
  .bl__stage {
    grid-template-columns: minmax(0, 1fr) 170px minmax(0, 1fr);
  }
}
.bl__card {
  display: grid;
  gap: 6px;
  align-content: start;
  padding: 12px 14px;
  border-radius: var(--radius-m);
  border: 2px solid var(--line-strong);
  background: var(--bg);
  min-width: 0;
}
.bl__card--target {
  border-color: var(--c-render);
}
.bl__card--source {
  border-color: var(--c-ui);
}
.bl__card h4 {
  font-size: var(--fs-sm);
}
.bl__card h4 small {
  font-weight: 400;
  color: var(--ink-3);
  margin-left: 4px;
}
.bl__textbox {
  width: 100%;
  min-height: 38px;
  padding: 4px 8px;
  border: 1px solid #abadb3;
  background: #fff;
  color: #000;
  font-size: 1rem;
}
.bl__value {
  min-height: 38px;
  padding: 6px 10px;
  border-radius: var(--radius-s);
  background: var(--c-ui-soft);
  font-size: 1rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.bl__assign {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-sm);
}
.bl__assign input {
  flex: 1;
  min-width: 0;
  min-height: 30px;
}
.bl__wires {
  display: grid;
  gap: 8px;
  align-content: center;
}
.bl__wire {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 2px solid var(--c-data);
  background: var(--c-data-soft);
  font-size: 0.6875rem;
  line-height: 1.35;
  transition:
    transform 0.2s var(--ease),
    box-shadow 0.2s;
}
.bl__wire b {
  font-size: 1.1rem;
  color: var(--c-data);
}
.bl__wire.is-off {
  border-color: var(--line-strong);
  border-style: dashed;
  background: transparent;
  color: var(--ink-3);
}
.bl__wire.is-off b {
  color: var(--ink-3);
}
.bl__wire.is-flash {
  transform: scale(1.06);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--c-data) 35%, transparent);
}
.bl__out {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-s);
  background: var(--c-warn-soft);
  border: 1px solid var(--c-warn);
  color: var(--c-warn);
  font-size: var(--fs-sm);
  font-weight: 700;
}
.bl__log {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
  min-height: 8.6em;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  background: var(--bg);
  font-size: var(--fs-sm);
  line-height: 1.6;
  display: grid;
  gap: 2px;
  align-content: start;
}
.bl__log li {
  padding-left: 1.2em;
  position: relative;
  opacity: 0.6;
}
.bl__log li:first-child {
  opacity: 1;
  font-weight: 700;
}
.bl__log li::before {
  position: absolute;
  left: 0;
}
.bl__log li.is-ok::before {
  content: '✓';
  color: var(--c-data);
}
.bl__log li.is-ng::before {
  content: '✗';
  color: var(--c-danger);
}
.bl__log li.is-info::before {
  content: '·';
}
.bl__codes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--sp-2);
}
.bl__codes > * {
  min-width: 0;
}
</style>
