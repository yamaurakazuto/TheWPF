<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CodeLang } from '@/types/content'
import { plainTokens, tokenize, type Tok } from '@/composables/useHighlighter'
import UiIcon from './UiIcon.vue'

const props = withDefaults(
  defineProps<{
    code: string
    lang: CodeLang
    title?: string
    pseudo?: boolean
    excerpt?: boolean
    highlight?: number[]
    /** 行番号を出す */
    numbers?: boolean
  }>(),
  { numbers: false },
)

const LABEL: Record<CodeLang, string> = {
  csharp: 'C#',
  xaml: 'XAML',
  xml: 'XML',
  json: 'JSON',
  powershell: 'PowerShell',
  text: 'テキスト',
}

const source = computed(() => props.code.replace(/\n+$/, ''))
const lines = ref<Tok[][]>(plainTokens(source.value))

watch(
  [source, () => props.lang],
  async ([code, lang]) => {
    lines.value = plainTokens(code)
    const toks = await tokenize(code, lang)
    if (code === source.value) lines.value = toks
  },
  { immediate: true },
)

const hl = computed(() => new Set(props.highlight ?? []))

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(source.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="code">
    <div class="code__bar">
      <span class="code__lang">{{ LABEL[lang] }}</span>
      <span v-if="title" class="code__title">{{ title }}</span>
      <span v-if="pseudo" class="code__badge code__badge--warn">擬似コード</span>
      <span v-if="excerpt" class="code__badge">抜粋</span>
      <button class="code__copy" type="button" @click="copy">
        <UiIcon :name="copied ? 'check' : 'copy'" :size="14" />
        <span aria-live="polite">{{ copied ? 'コピーしました' : 'コピー' }}</span>
      </button>
    </div>
    <pre
      class="code__pre scroll-x"
      tabindex="0"
      :aria-label="`${LABEL[lang]} のコード${title ? '：' + title : ''}`"
    ><code><span
      v-for="(line, i) in lines"
      :key="i"
      class="code__line"
      :class="{ 'code__line--hl': hl.has(i + 1), 'code__line--num': numbers }"
      :data-n="i + 1"
    ><span v-for="(t, j) in line" :key="j" class="tok" :style="t.style">{{ t.content }}</span>{{ '\n' }}</span></code></pre>
  </div>
</template>

<style scoped>
.code {
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg-code);
  overflow: hidden;
  min-width: 0;
}
.code__bar {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  min-height: 34px;
  padding: 2px 6px 2px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-raised);
  font-size: var(--fs-xs);
}
.code__lang {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--accent);
}
.code__title {
  color: var(--ink-2);
  font-family: var(--font-mono);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.code__badge {
  flex: none;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--ink-2);
  font-weight: 700;
}
.code__badge--warn {
  border-color: var(--c-warn);
  color: var(--c-warn);
  background: var(--c-warn-soft);
}
.code__copy {
  margin-left: auto;
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--ink-2);
  font-size: var(--fs-xs);
  font-weight: 600;
}
.code__copy:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}
.code__pre {
  margin: 0;
  padding: 12px 0;
  font-size: 0.8125rem;
  line-height: 1.7;
  tab-size: 4;
}
.code__pre code {
  display: block;
  width: max-content;
  min-width: 100%;
}
.code__line {
  display: block;
  padding: 0 14px;
  white-space: pre;
}
.code__line--num::before {
  content: attr(data-n);
  display: inline-block;
  width: 2.2em;
  margin-right: 1em;
  text-align: right;
  color: var(--ink-3);
  user-select: none;
}
.code__line--hl {
  background: var(--accent-soft);
  box-shadow: inset 3px 0 0 var(--accent);
}
</style>
