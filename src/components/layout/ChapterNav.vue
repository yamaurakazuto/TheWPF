<script setup lang="ts">
import { computed } from 'vue'
import { chapterMetas } from '@/content/meta'
import UiIcon from '@/components/content/UiIcon.vue'

const props = defineProps<{ slug: string }>()

const idx = computed(() => chapterMetas.findIndex((c) => c.slug === props.slug))
const prev = computed(() => chapterMetas[idx.value - 1] ?? null)
const next = computed(() => chapterMetas[idx.value + 1] ?? null)
</script>

<template>
  <nav class="cnav" aria-label="前後の章">
    <RouterLink v-if="prev" :to="`/chapters/${prev.slug}`" class="cnav__link">
      <UiIcon name="left" />
      <span>
        <small>前の章</small>
        <b>第{{ prev.no }}章 {{ prev.title }}</b>
      </span>
    </RouterLink>
    <span v-else />
    <RouterLink v-if="next" :to="`/chapters/${next.slug}`" class="cnav__link cnav__link--next">
      <span>
        <small>次の章</small>
        <b>第{{ next.no }}章 {{ next.title }}</b>
      </span>
      <UiIcon name="right" />
    </RouterLink>
    <RouterLink v-else to="/playground" class="cnav__link cnav__link--next">
      <span>
        <small>読み終えたら</small>
        <b>演習場で手を動かす</b>
      </span>
      <UiIcon name="right" />
    </RouterLink>
  </nav>
</template>

<style scoped>
.cnav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-3);
}
.cnav__link {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--bg-raised);
  color: var(--ink);
  text-decoration: none;
  line-height: 1.4;
}
.cnav__link:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.cnav__link--next {
  justify-content: flex-end;
  text-align: right;
}
.cnav__link span {
  display: grid;
  min-width: 0;
}
.cnav__link small {
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.cnav__link b {
  font-size: var(--fs-sm);
}
@media (max-width: 520px) {
  .cnav {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
