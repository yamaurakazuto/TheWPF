<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { xamlSamples } from '@/content/xamlSamples'
import { plainTokens, tokenize, type Tok } from '@/composables/useHighlighter'
import XamlPreview from '@/components/editor/XamlPreview.vue'
import UiIcon from '@/components/content/UiIcon.vue'

/**
 * XAML と見た目の対応ビューア。
 * コードの行にカーソルを合わせると対応する要素が、要素に合わせると対応する行が強調される。
 */
const current = ref(xamlSamples[0].id)
const sample = computed(() => xamlSamples.find((s) => s.id === current.value) ?? xamlSamples[0])

const toks = ref<Tok[][]>([])
watch(
  sample,
  async (s) => {
    toks.value = plainTokens(s.xaml)
    const t = await tokenize(s.xaml, 'xaml')
    if (s.id === current.value) toks.value = t
  },
  { immediate: true },
)

const hoverLine = ref<number | null>(null)
const range = ref<{ from: number; to: number } | null>(null)
const inRange = (n: number) => !!range.value && n >= range.value.from && n <= range.value.to
</script>

<template>
  <div class="xv">
    <div class="seg" role="group" aria-label="サンプルを選ぶ">
      <button v-for="s in xamlSamples" :key="s.id" type="button" :aria-pressed="current === s.id" @click="current = s.id">
        {{ s.label }}
      </button>
    </div>
    <p class="xv__point">{{ sample.point }}</p>

    <div class="xv__grid">
      <div class="xv__code scroll-x" tabindex="0" role="group" aria-label="XAML ソース" @mouseleave="hoverLine = null">
        <div class="xv__lines">
          <div
            v-for="(line, i) in toks"
            :key="i"
            class="xv__line"
            :class="{ 'is-hl': inRange(i + 1), 'is-hover': hoverLine === i + 1 }"
            @mouseenter="hoverLine = i + 1"
          >
            <span class="xv__n" aria-hidden="true">{{ i + 1 }}</span>
            <span><span v-for="(t, j) in line" :key="j" class="tok" :style="t.style">{{ t.content }}</span></span>
          </div>
        </div>
      </div>
      <XamlPreview :source="sample.xaml" :hover-line="hoverLine" @hover="range = $event" />
    </div>

    <p class="xv__foot">
      <UiIcon name="hand" :size="14" /> コードの行、またはプレビューの要素にカーソルを合わせると対応箇所が赤枠 / 色帯で示されます。
      <RouterLink :to="{ path: '/playground', query: { sample: sample.id } }">このサンプルを編集する →</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.xv {
  display: grid;
  gap: var(--sp-3);
  container-type: inline-size;
  min-width: 0;
}
.xv__point {
  font-size: var(--fs-sm);
  color: var(--ink-2);
}
.xv__grid {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: minmax(0, 1fr);
}
.xv__grid > * {
  min-width: 0;
}
@container (min-width: 760px) {
  .xv__grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    align-items: start;
  }
}
.xv__code {
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg-code);
  padding: 10px 0;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.7;
  max-height: 460px;
  overflow: auto;
}
.xv__lines {
  width: max-content;
  min-width: 100%;
}
.xv__line {
  display: flex;
  white-space: pre;
  padding-right: 12px;
  border-left: 3px solid transparent;
}
.xv__line.is-hl {
  background: var(--c-danger-soft);
  border-left-color: var(--c-danger);
}
.xv__line.is-hover {
  background: var(--accent-soft);
  border-left-color: var(--accent);
}
.xv__n {
  flex: none;
  width: 2.6em;
  padding-right: 0.8em;
  text-align: right;
  color: var(--ink-3);
  user-select: none;
}
.xv__foot {
  font-size: var(--fs-xs);
  color: var(--ink-3);
  line-height: 1.7;
}
.xv__foot a {
  margin-left: 6px;
  white-space: nowrap;
}
</style>
