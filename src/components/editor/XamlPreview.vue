<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { tryParseXaml } from '@/lib/xaml/parse'
import { renderXaml } from '@/lib/xaml/preview'
import '@/styles/xaml-preview.css'

/**
 * XAML 文字列を簡易プレビューとして描画する。
 * hoverLine を渡すと、その行を含む最も内側の要素を枠で示す。
 * プレビュー上で要素にカーソルを合わせると、その要素のソース範囲を emit する。
 */
const props = defineProps<{ source: string; hoverLine?: number | null }>()
const emit = defineEmits<{ hover: [range: { from: number; to: number } | null] }>()

const mount = ref<HTMLElement | null>(null)
const warnings = ref<string[]>([])

const parsed = computed(() => tryParseXaml(props.source))

watch(
  [parsed, mount],
  ([p, el]) => {
    if (!el) return
    el.replaceChildren()
    warnings.value = []
    if (!p.root) return
    try {
      const r = renderXaml(p.root)
      el.append(r.el)
      warnings.value = r.warnings
    } catch (e) {
      warnings.value = [`プレビューの生成に失敗しました: ${(e as Error).message}`]
    }
  },
  { immediate: true, flush: 'post' },
)

function clearHl() {
  mount.value?.querySelectorAll('.xp-hl').forEach((x) => x.classList.remove('xp-hl'))
}

watch(
  () => props.hoverLine,
  (line) => {
    clearHl()
    if (!line || !mount.value) return
    let best: HTMLElement | null = null
    let bestSpan = Infinity
    mount.value.querySelectorAll<HTMLElement>('[data-xl]').forEach((el) => {
      const from = Number(el.dataset.xl)
      const to = Number(el.dataset.xe)
      if (line >= from && line <= to && to - from < bestSpan) {
        best = el
        bestSpan = to - from
      }
    })
    ;(best as HTMLElement | null)?.classList.add('xp-hl')
  },
)

function onOver(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-xl]')
  clearHl()
  if (!target) return emit('hover', null)
  target.classList.add('xp-hl')
  emit('hover', { from: Number(target.dataset.xl), to: Number(target.dataset.xe) })
}
function onLeave() {
  clearHl()
  emit('hover', null)
}
</script>

<template>
  <div class="xprev">
    <div v-if="parsed.error" class="xprev__error" role="alert">
      <b>XAML を解釈できません（{{ parsed.error.line }} 行目）</b>
      <span>{{ parsed.error.message }}</span>
    </div>
    <div v-show="!parsed.error" ref="mount" class="xprev__stage scroll-x" @mouseover="onOver" @mouseleave="onLeave" />
    <ul v-if="warnings.length" class="xprev__warn">
      <li v-for="(w, i) in warnings" :key="i">{{ w }}</li>
    </ul>
    <p class="xprev__note">
      簡易プレビュー（ブラウザ上の近似）です。実際の WPF の描画・レイアウトとは細部が異なり、バインディングやテンプレートは評価されません。
    </p>
  </div>
</template>

<style scoped>
.xprev {
  display: grid;
  gap: var(--sp-2);
  min-width: 0;
}
.xprev__stage {
  padding: 18px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  /* デスクトップの壁紙に見立てた下地 */
  background:
    radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--ink) 12%, transparent) 1px, transparent 0) 0 0 / 14px 14px,
    var(--bg-sunken);
  min-height: 120px;
  display: grid;
  justify-items: center;
  align-items: start;
}
.xprev__error {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--radius-m);
  border: 1px solid var(--c-danger);
  background: var(--c-danger-soft);
  font-size: var(--fs-sm);
}
.xprev__error b {
  color: var(--c-danger);
}
.xprev__warn {
  margin: 0;
  padding: 8px 12px 8px 28px;
  border-radius: var(--radius-s);
  background: var(--c-warn-soft);
  border: 1px solid var(--c-warn);
  font-size: var(--fs-xs);
  line-height: 1.7;
}
.xprev__note {
  font-size: 0.6875rem;
  color: var(--ink-3);
  line-height: 1.6;
}
</style>
