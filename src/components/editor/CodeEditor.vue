<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { xml } from '@codemirror/lang-xml'
import { HighlightStyle, StreamLanguage, indentUnit, syntaxHighlighting } from '@codemirror/language'
import { csharp } from '@codemirror/legacy-modes/mode/clike'
import { tags as t } from '@lezer/highlight'

/**
 * CodeMirror 6 を包んだコードエディター。v-model で文字列をやり取りする。
 * 色はすべて CSS 変数経由なので、サイトのライト / ダーク切り替えにそのまま追従する。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    lang: 'xaml' | 'xml' | 'csharp'
    label: string
    minHeight?: string
    maxHeight?: string
  }>(),
  { minHeight: '180px', maxHeight: '460px' },
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const host = ref<HTMLElement | null>(null)
let view: EditorView | null = null

const theme = EditorView.theme({
  '&': { color: 'var(--ink)', backgroundColor: 'var(--bg-code)', fontSize: '13px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65', minHeight: props.minHeight, maxHeight: props.maxHeight },
  '.cm-content': { caretColor: 'var(--accent)', padding: '10px 0' },
  '.cm-gutters': { backgroundColor: 'var(--bg-code)', color: 'var(--ink-3)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--accent-soft) 45%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--accent)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'color-mix(in srgb, var(--accent) 28%, transparent)' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'var(--accent-soft)',
    outline: '1px solid var(--accent-line)',
  },
  '.cm-tooltip': { backgroundColor: 'var(--bg-raised)', border: '1px solid var(--line-strong)', color: 'var(--ink)' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' },
  '.cm-panels': { backgroundColor: 'var(--bg-raised)', color: 'var(--ink)' },
  '.cm-foldPlaceholder': { backgroundColor: 'var(--bg-sunken)', border: '1px solid var(--line)', color: 'var(--ink-3)' },
  '&.cm-focused': { outline: 'none' },
})

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword], color: 'var(--syn-keyword)' },
  { tag: [t.string, t.attributeValue, t.character], color: 'var(--syn-string)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.typeName, t.className, t.tagName, t.namespace], color: 'var(--syn-type)' },
  { tag: [t.attributeName, t.propertyName], color: 'var(--syn-attr)' },
  { tag: [t.number, t.bool, t.atom, t.null], color: 'var(--syn-number)' },
  { tag: [t.meta, t.processingInstruction], color: 'var(--syn-comment)' },
  { tag: [t.angleBracket, t.bracket], color: 'var(--ink-3)' },
])

onMounted(() => {
  if (!host.value) return
  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        indentUnit.of('    '),
        EditorState.tabSize.of(4),
        props.lang === 'csharp' ? StreamLanguage.define(csharp) : xml(),
        theme,
        syntaxHighlighting(highlight),
        EditorView.contentAttributes.of({ 'aria-label': props.label, spellcheck: 'false' }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) emit('update:modelValue', u.state.doc.toString())
        }),
      ],
    }),
  })
})

// 外から値が差し替えられたとき（リセット・解答例の読み込み）だけ反映する
watch(
  () => props.modelValue,
  (v) => {
    if (!view) return
    const cur = view.state.doc.toString()
    if (v !== cur) view.dispatch({ changes: { from: 0, to: cur.length, insert: v } })
  },
)

onBeforeUnmount(() => view?.destroy())
</script>

<template>
  <div class="editor">
    <div ref="host" class="editor__host" />
    <p class="editor__hint"><kbd>Tab</kbd> はインデント。エディターから抜けるには <kbd>Esc</kbd> → <kbd>Tab</kbd></p>
  </div>
</template>

<style scoped>
.editor {
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-m);
  overflow: hidden;
  background: var(--bg-code);
  min-width: 0;
}
.editor:focus-within {
  border-color: var(--focus);
  box-shadow: 0 0 0 1px var(--focus);
}
.editor__host {
  min-width: 0;
}
.editor__hint {
  padding: 3px 10px;
  border-top: 1px solid var(--line);
  background: var(--bg-raised);
  font-size: 0.6875rem;
  color: var(--ink-3);
  line-height: 1.8;
}
</style>
