<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AnnotatedLine, CodeLang } from '@/types/content'
import { plainTokens, tokenize, type Tok } from '@/composables/useHighlighter'
import RichText from './RichText'
import UiIcon from './UiIcon.vue'

/**
 * 行ごとに注釈が付くコードビューア。
 * 注釈のある行はホバー / フォーカス / クリックで選択でき、↑↓ キーで前後の注釈へ移動できる。
 * 幅が広いときは右に注釈パネル、狭いときは選択行の直下に注釈を出す。
 */
const props = defineProps<{
  lines: AnnotatedLine[]
  lang: CodeLang
  title: string
  hint?: string
}>()

const code = computed(() => props.lines.map((l) => l.code).join('\n'))
const toks = ref<Tok[][]>(plainTokens(code.value))
watch(
  code,
  async (c) => {
    toks.value = plainTokens(c)
    const t = await tokenize(c, props.lang)
    if (c === code.value && t.length === props.lines.length) toks.value = t
  },
  { immediate: true },
)

/** 注釈のある行インデックス */
const noted = computed(() => props.lines.map((l, i) => (l.note ? i : -1)).filter((i) => i >= 0))
const active = ref<number>(-1)
const pinned = ref(false)

watch(
  noted,
  (n) => {
    active.value = n[0] ?? -1
  },
  { immediate: true },
)

const activeNote = computed(() => (active.value >= 0 ? props.lines[active.value]?.note : undefined))
const order = computed(() => noted.value.indexOf(active.value))

const lineEls = ref<HTMLElement[]>([])

function select(i: number, pin = false) {
  if (!props.lines[i]?.note) return
  active.value = i
  if (pin) pinned.value = true
}
function hover(i: number) {
  if (!pinned.value) select(i)
}
function move(delta: number, focus = true) {
  const n = noted.value
  if (!n.length) return
  const next = n[(order.value + delta + n.length) % n.length]
  active.value = next
  pinned.value = true
  if (focus) lineEls.value[next]?.focus()
}
function onKey(e: KeyboardEvent, i: number) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    move(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    move(-1)
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    select(i, true)
  }
}
function setLineEl(el: unknown, i: number) {
  if (el instanceof HTMLElement) lineEls.value[i] = el
}
</script>

<template>
  <div class="anno">
    <div class="anno__bar">
      <span class="anno__file">{{ title }}</span>
      <span class="anno__hint">
        <UiIcon name="hand" :size="14" />
        {{ hint ?? '印の付いた行にカーソルを合わせる（またはタップ / ↑↓ キー）と注釈が出ます' }}
      </span>
    </div>
    <div class="anno__body">
      <div class="anno__code scroll-x" role="group" :aria-label="`${title} の注釈付きコード`">
        <div class="anno__lines">
          <template v-for="(line, i) in lines" :key="i">
            <div
              :ref="(el) => setLineEl(el, i)"
              class="anno__line"
              :class="{ 'anno__line--noted': !!line.note, 'anno__line--active': active === i && !!line.note }"
              :tabindex="line.note ? 0 : undefined"
              :role="line.note ? 'button' : undefined"
              :aria-pressed="line.note ? active === i : undefined"
              :aria-label="line.note ? `${i + 1} 行目: ${line.note.title} の注釈を表示` : undefined"
              @mouseenter="hover(i)"
              @focus="select(i)"
              @click="select(i, true)"
              @keydown="onKey($event, i)"
            >
              <span class="anno__num" aria-hidden="true">{{ i + 1 }}</span>
              <span class="anno__mark" aria-hidden="true">{{ line.note ? noted.indexOf(i) + 1 : '' }}</span>
              <span class="anno__src"
                ><span v-for="(t, j) in toks[i] ?? []" :key="j" class="tok" :style="t.style">{{ t.content }}</span
                >{{ (toks[i] ?? []).length ? '' : ' ' }}</span
              >
            </div>
            <div v-if="line.note && active === i" class="anno__inline">
              <b>{{ line.note.title }}</b>
              <RichText tag="p" :text="line.note.body" />
            </div>
          </template>
        </div>
      </div>

      <aside class="anno__panel" aria-live="polite">
        <template v-if="activeNote">
          <p class="anno__count">
            <span class="anno__badge">{{ order + 1 }}</span>
            <span>{{ active + 1 }} 行目</span>
            <span class="anno__nav">
              <button class="btn btn--sm btn--ghost" type="button" aria-label="前の注釈" @click="move(-1, false)">
                <UiIcon name="left" :size="14" />
              </button>
              <span class="muted">{{ order + 1 }} / {{ noted.length }}</span>
              <button class="btn btn--sm btn--ghost" type="button" aria-label="次の注釈" @click="move(1, false)">
                <UiIcon name="right" :size="14" />
              </button>
            </span>
          </p>
          <h4 class="anno__title">{{ activeNote.title }}</h4>
          <RichText tag="p" class="anno__text" :text="activeNote.body" />
        </template>
        <p v-else class="muted">注釈付きの行を選ぶと、ここに説明が出ます。</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.anno {
  container-type: inline-size;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg-code);
  overflow: hidden;
}
.anno__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px var(--sp-3);
  padding: 6px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-raised);
  font-size: var(--fs-xs);
}
.anno__file {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--accent);
}
.anno__hint {
  color: var(--ink-3);
  display: inline-flex;
  gap: 5px;
  align-items: center;
}
.anno__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.anno__code {
  padding: 10px 0;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.75;
  min-width: 0;
}
.anno__lines {
  width: max-content;
  min-width: 100%;
}
.anno__line {
  display: flex;
  align-items: baseline;
  padding-right: 14px;
  white-space: pre;
  border-left: 3px solid transparent;
}
.anno__num {
  flex: none;
  width: 2.6em;
  padding-right: 0.6em;
  text-align: right;
  color: var(--ink-3);
  user-select: none;
}
.anno__mark {
  flex: none;
  width: 1.5em;
  height: 1.5em;
  margin-right: 0.6em;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
  align-self: center;
}
.anno__line--noted {
  cursor: pointer;
}
.anno__line--noted .anno__mark {
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--accent-line);
}
.anno__line--noted:hover {
  background: color-mix(in srgb, var(--accent-soft) 55%, transparent);
}
.anno__line--active {
  background: var(--accent-soft);
  border-left-color: var(--accent);
}
.anno__line--active .anno__mark {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
}
.anno__line:focus-visible {
  outline-offset: -2px;
}

/* 狭いとき: 選択行の直下に注釈を出す */
.anno__inline {
  white-space: normal;
  font-family: var(--font-sans);
  font-size: var(--fs-sm);
  line-height: 1.7;
  margin: 4px 12px 8px 12px;
  padding: 10px 12px;
  border-radius: var(--radius-s);
  background: var(--bg-raised);
  border: 1px solid var(--accent-line);
  /* 横スクロールしても読めるよう、コード領域の表示幅に固定する */
  position: sticky;
  left: 12px;
  width: calc(100cqi - 24px);
  max-width: calc(100cqi - 24px);
}
.anno__inline b {
  display: block;
  color: var(--accent);
}
.anno__panel {
  display: none;
}

@container (min-width: 760px) {
  .anno__body {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
  .anno__inline {
    display: none;
  }
  .anno__panel {
    display: block;
    align-self: start;
    position: sticky;
    top: calc(var(--header-h) + 12px);
    margin: 12px;
    padding: 14px 16px 16px;
    border-radius: var(--radius-m);
    border: 1px solid var(--accent-line);
    background: var(--bg-raised);
    font-size: var(--fs-sm);
    line-height: 1.75;
    box-shadow: var(--shadow-1);
  }
}
.anno__count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.anno__badge {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}
.anno__nav {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.anno__title {
  margin: 8px 0 4px;
  font-size: var(--fs-md);
}
</style>
