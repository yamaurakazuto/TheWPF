<script setup lang="ts">
import { computed, ref } from 'vue'
import UiIcon from '@/components/content/UiIcon.vue'

/**
 * 入力検証の 3 方式で「どの段階で検査され、ソースに値が入るかどうか」を比べるデモ。
 * 題材は int 型の Age（0〜120 が有効）にバインドした TextBox。
 */
type Mech = 'rule' | 'idei' | 'indei'
const MECHS: { id: Mech; label: string; where: string }[] = [
  { id: 'rule', label: 'ValidationRule', where: 'View 側（XAML に書く）。ソースへ書き込む前に検査する' },
  { id: 'idei', label: 'IDataErrorInfo', where: 'ViewModel 側。ソースへ書き込んだ後に、インデクサーでエラー文字列を返す' },
  { id: 'indei', label: 'INotifyDataErrorInfo', where: 'ViewModel 側。ソースへ書き込んだ後に、イベントでエラー（複数可・非同期可）を知らせる' },
]

const mech = ref<Mech>('indei')
const text = ref('35')
const SAMPLES = ['35', '150', '-1', 'abc', '']

interface Step {
  label: string
  state: 'ok' | 'ng' | 'skip'
  note: string
}

const result = computed(() => {
  const raw = text.value.trim()
  const isInt = /^-?\d+$/.test(raw)
  const n = isInt ? Number(raw) : NaN
  const inRange = isInt && n >= 0 && n <= 120
  const steps: Step[] = []
  let source: string
  let errors: string[] = []

  if (mech.value === 'rule') {
    // ValidationRule は既定で「変換前の生の値」に対して最初に走る
    const ruleOk = inRange
    steps.push({ label: 'ValidationRule.Validate()', state: ruleOk ? 'ok' : 'ng', note: ruleOk ? '入力文字列を検査して合格' : '不合格。ここで処理が打ち切られる' })
    steps.push({ label: '型変換（string → int）', state: ruleOk ? 'ok' : 'skip', note: ruleOk ? `"${raw}" → ${n}` : '実行されない' })
    steps.push({ label: 'ソースの setter（Age = …）', state: ruleOk ? 'ok' : 'skip', note: ruleOk ? `Age に ${n} が入る` : '呼ばれない。ソースは前の値のまま' })
    source = ruleOk ? String(n) : '（前の値のまま）'
    if (!ruleOk) errors = [isInt ? '0〜120 の範囲で入力してください' : '数値を入力してください']
  } else {
    steps.push({ label: '型変換（string → int）', state: isInt ? 'ok' : 'ng', note: isInt ? `"${raw}" → ${n}` : '変換できない。Binding 自身がエラーにする' })
    steps.push({ label: 'ソースの setter（Age = …）', state: isInt ? 'ok' : 'skip', note: isInt ? `Age に ${n} が入る（範囲外でも入る）` : '呼ばれない。ソースは前の値のまま' })
    const check = mech.value === 'idei' ? 'this["Age"] を問い合わせる' : 'ErrorsChanged → GetErrors("Age")'
    steps.push({ label: check, state: !isInt ? 'skip' : inRange ? 'ok' : 'ng', note: !isInt ? '実行されない' : inRange ? 'エラーなし' : 'ViewModel がエラーを返す' })
    source = isInt ? String(n) : '（前の値のまま）'
    if (!isInt) errors = [`値 '${raw}' を変換できませんでした。`]
    else if (!inRange) errors = mech.value === 'indei' && n > 120 ? ['0〜120 の範囲で入力してください', '（同時に複数のエラーを返せる例）年齢が大きすぎます'] : ['0〜120 の範囲で入力してください']
  }
  return { steps, source, errors, invalidInSource: mech.value !== 'rule' && isInt && !inRange }
})
</script>

<template>
  <div class="vd">
    <div class="seg" role="group" aria-label="検証の方式">
      <button v-for="m in MECHS" :key="m.id" type="button" class="mono" :aria-pressed="mech === m.id" @click="mech = m.id">{{ m.label }}</button>
    </div>
    <p class="vd__where">{{ MECHS.find((m) => m.id === mech)!.where }}</p>

    <div class="vd__grid">
      <section class="vd__form" aria-label="入力欄">
        <label for="vd-age">年齢（0〜120）</label>
        <input id="vd-age" v-model="text" type="text" inputmode="numeric" autocomplete="off" :class="{ 'is-error': result.errors.length }" :aria-invalid="result.errors.length > 0" aria-describedby="vd-err" />
        <ul id="vd-err" class="vd__errors" aria-live="polite">
          <li v-for="(e, i) in result.errors" :key="i">{{ e }}</li>
        </ul>
        <div class="controls">
          <span class="small" style="color: #55556a">試す値:</span>
          <button v-for="s in SAMPLES" :key="s" class="vd__sample" type="button" @click="text = s">{{ s === '' ? '（空）' : s }}</button>
        </div>
      </section>

      <section class="vd__flow" aria-label="処理の流れ" aria-live="polite">
        <ol>
          <li v-for="(s, i) in result.steps" :key="i" :class="`is-${s.state}`">
            <span class="vd__icon"><UiIcon v-if="s.state === 'ok'" name="check" :size="14" /><UiIcon v-else-if="s.state === 'ng'" name="cross" :size="14" /><span v-else>–</span></span>
            <span>
              <b class="mono">{{ s.label }}</b>
              <small>{{ s.note }}</small>
            </span>
          </li>
        </ol>
        <p class="vd__source">
          ソースの <code>Age</code>: <b class="mono">{{ result.source }}</b>
          <span v-if="result.invalidInSource" class="vd__warn"><UiIcon name="warn" :size="13" /> 不正な値がソースに入っている。保存の前に <code>HasErrors</code> を確認する必要がある</span>
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.vd {
  display: grid;
  gap: var(--sp-3);
  container-type: inline-size;
}
.vd__where {
  font-size: var(--fs-sm);
  color: var(--ink-2);
}
.vd__grid {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: minmax(0, 1fr);
}
@container (min-width: 660px) {
  .vd__grid {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  }
}
.vd__form {
  display: grid;
  gap: 6px;
  align-content: start;
  padding: var(--sp-4);
  border-radius: var(--radius-m);
  border: 1px solid #c8c8d0;
  background: #fff;
  color: #17171f;
  font-size: var(--fs-sm);
}
.vd__form label {
  font-weight: 700;
}
.vd__form input {
  min-height: 34px;
  padding: 4px 8px;
  border: 1px solid #abadb3;
  background: #fff;
  color: #000;
  font-size: 1rem;
  max-width: 200px;
}
.vd__form input.is-error {
  border-color: #e00000;
  box-shadow: 0 0 0 1px #e00000;
}
.vd__errors {
  list-style: none;
  margin: 0;
  padding: 0;
  min-height: 2.9em;
  color: #c00000;
  font-size: var(--fs-xs);
  line-height: 1.5;
}
.vd__sample {
  min-width: 44px;
  min-height: 28px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid #b9b9c9;
  background: #f4f4f9;
  color: #17171f;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}
.vd__sample:hover {
  border-color: #5235c9;
}
.vd__flow ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.vd__flow li {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  border: 1.5px solid var(--line);
  background: var(--bg);
  line-height: 1.5;
}
.vd__flow li small {
  display: block;
  font-size: var(--fs-xs);
  color: var(--ink-2);
}
.vd__flow b {
  font-size: var(--fs-sm);
}
.vd__icon {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--c-mute-soft);
  color: var(--ink-3);
}
.vd__flow li.is-ok {
  border-color: var(--c-data);
}
.vd__flow li.is-ok .vd__icon {
  background: var(--c-data-soft);
  color: var(--c-data);
}
.vd__flow li.is-ng {
  border-color: var(--c-danger);
  background: var(--c-danger-soft);
}
.vd__flow li.is-ng .vd__icon {
  background: var(--c-danger);
  color: #fff;
}
.vd__flow li.is-skip {
  border-style: dashed;
  opacity: 0.6;
}
.vd__source {
  margin-top: var(--sp-2);
  padding: 8px 12px;
  border-radius: var(--radius-s);
  background: var(--c-ui-soft);
  font-size: var(--fs-sm);
  line-height: 1.6;
}
.vd__warn {
  display: block;
  margin-top: 2px;
  color: var(--c-warn);
  font-weight: 700;
  font-size: var(--fs-xs);
}
</style>
