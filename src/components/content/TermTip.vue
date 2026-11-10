<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'
import { glossaryMap } from '@/content/glossary'

/** 用語ツールチップ。ホバー / フォーカス / タップで 1 行説明を出す */
const props = defineProps<{ id: string; label?: string }>()

const entry = computed(() => glossaryMap.get(props.id))
const open = ref(false)
const pinned = ref(false)
const anchor = ref<HTMLElement | null>(null)
const tip = ref<HTMLElement | null>(null)
const pos = ref({ left: 0, top: 0 })
const tipId = useId()

async function show() {
  if (!entry.value) return
  open.value = true
  await nextTick()
  place()
  window.addEventListener('scroll', hide, { passive: true, once: true })
}
function hide() {
  open.value = false
  pinned.value = false
}
function place() {
  const a = anchor.value?.getBoundingClientRect()
  const t = tip.value
  if (!a || !t) return
  const w = t.offsetWidth
  const h = t.offsetHeight
  const m = 8
  let left = a.left + a.width / 2 - w / 2
  left = Math.max(m, Math.min(left, window.innerWidth - w - m))
  let top = a.bottom + 8
  if (top + h > window.innerHeight - m) top = a.top - h - 8
  pos.value = { left, top }
}
function onClick() {
  if (open.value && pinned.value) hide()
  else {
    pinned.value = true
    void show()
  }
}
function onLeave() {
  if (!pinned.value) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') hide()
}
onBeforeUnmount(() => window.removeEventListener('scroll', hide))
</script>

<template>
  <span
    v-if="entry"
    ref="anchor"
    class="term"
    role="button"
    tabindex="0"
    :aria-describedby="open ? tipId : undefined"
    @mouseenter="show"
    @mouseleave="onLeave"
    @focus="show"
    @blur="hide"
    @click="onClick"
    @keydown="onKey"
    >{{ label ?? entry.term }}</span
  ><span v-else class="term term--missing">{{ label ?? id }}</span>
  <Teleport to="body">
    <span
      v-if="open && entry"
      :id="tipId"
      ref="tip"
      class="term-tip"
      role="tooltip"
      :style="{ left: pos.left + 'px', top: pos.top + 'px' }"
    >
      <b>{{ entry.term }}</b>
      <span v-if="entry.alt" class="term-tip__alt">{{ entry.alt }}</span>
      <span class="term-tip__desc">{{ entry.desc }}</span>
    </span>
  </Teleport>
</template>

<style scoped>
.term {
  text-decoration: underline dotted var(--accent);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
  cursor: help;
}
.term:hover,
.term:focus-visible {
  background: var(--accent-soft);
  border-radius: 3px;
}
.term--missing {
  text-decoration: none;
  cursor: inherit;
}
</style>

<style>
.term-tip {
  position: fixed;
  z-index: 80;
  width: max-content;
  max-width: min(340px, calc(100vw - 16px));
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border-radius: var(--radius-m);
  background: var(--ink);
  color: var(--bg);
  font-size: var(--fs-sm);
  line-height: 1.6;
  box-shadow: var(--shadow-2);
  pointer-events: none;
}
.term-tip__alt {
  font-size: var(--fs-xs);
  opacity: 0.75;
}
.term-tip__desc {
  margin-top: 2px;
}
</style>
