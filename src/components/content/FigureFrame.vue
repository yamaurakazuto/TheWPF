<script setup lang="ts">
import RichText from './RichText'
import UiIcon, { type IconName } from './UiIcon.vue'

/** 図・デモ・動画に共通の枠。番号、種別、タイトル、キャプションを揃える */
const props = defineProps<{
  kind: 'figure' | 'demo' | 'video'
  title: string
  number?: string
  caption?: string
}>()

const KIND: Record<typeof props.kind, { label: string; icon: IconName; hint: string }> = {
  figure: { label: '図', icon: 'image', hint: '' },
  demo: { label: 'デモ', icon: 'hand', hint: '触って確かめられます' },
  video: { label: '動画', icon: 'film', hint: '再生・一時停止・ステップ送りができます' },
}
</script>

<template>
  <figure class="fig" :class="`fig--${kind}`">
    <div class="fig__head">
      <span class="fig__kind">
        <UiIcon :name="KIND[kind].icon" :size="14" />
        {{ KIND[kind].label }}<template v-if="number"> {{ number }}</template>
      </span>
      <span class="fig__title">{{ title }}</span>
      <span v-if="KIND[kind].hint" class="fig__hint">{{ KIND[kind].hint }}</span>
    </div>
    <div class="fig__body">
      <slot />
    </div>
    <figcaption v-if="caption" class="fig__cap">
      <RichText :text="caption" />
    </figcaption>
  </figure>
</template>

<style scoped>
.fig {
  margin: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--bg-raised);
  box-shadow: var(--shadow-1);
  min-width: 0;
  overflow: hidden;
}
.fig__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px var(--sp-3);
  padding: 10px var(--sp-4);
  border-bottom: 1px solid var(--line);
}
.fig__kind {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 10px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-weight: 700;
  background: var(--c-mute-soft);
  color: var(--ink-2);
}
.fig--demo .fig__kind {
  background: var(--accent-soft);
  color: var(--accent);
}
.fig--video .fig__kind {
  background: var(--c-render-soft);
  color: var(--c-render);
}
.fig__title {
  font-weight: 700;
  font-size: var(--fs-sm);
}
.fig__hint {
  margin-left: auto;
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.fig__body {
  padding: var(--sp-4);
  min-width: 0;
}
.fig__cap {
  padding: 10px var(--sp-4) 12px;
  border-top: 1px solid var(--line);
  background: var(--bg);
  font-size: var(--fs-sm);
  color: var(--ink-2);
  line-height: 1.7;
}
@media (max-width: 520px) {
  .fig__body {
    padding: var(--sp-3);
  }
  .fig__hint {
    display: none;
  }
}
</style>
