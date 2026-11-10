<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** ページ内目次。スクロール位置に連動して現在の節を示す */
const props = defineProps<{ items: { id: string; title: string; sub?: boolean }[] }>()
const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const router = useRouter()
const active = ref<string>('')

let io: IntersectionObserver | null = null
const visible = new Set<string>()

function observe() {
  io?.disconnect()
  visible.clear()
  if (typeof IntersectionObserver === 'undefined') return
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id)
        else visible.delete(e.target.id)
      }
      // 見えている節のうち、目次で最も上にあるものを現在地とする
      const first = props.items.find((it) => visible.has(it.id))
      if (first) active.value = first.id
    },
    { rootMargin: '-64px 0px -55% 0px' },
  )
  for (const it of props.items) {
    const el = document.getElementById(it.id)
    if (el) io.observe(el)
  }
}

watch(
  () => props.items,
  async () => {
    await nextTick()
    observe()
  },
  { immediate: true, flush: 'post' },
)
onBeforeUnmount(() => io?.disconnect())

const href = (id: string) => router.resolve({ path: route.path, hash: `#${id}` }).href

function go(id: string) {
  document.getElementById(id)?.scrollIntoView({ block: 'start' })
  void router.replace({ path: route.path, hash: `#${id}` })
  active.value = id
  emit('navigate')
}
</script>

<template>
  <nav class="toc" aria-label="このページの目次">
    <ol>
      <li v-for="it in items" :key="it.id" :class="{ 'toc__sub': it.sub }">
        <a :href="href(it.id)" :class="{ 'is-active': active === it.id }" :aria-current="active === it.id ? 'location' : undefined" @click.prevent="go(it.id)">
          {{ it.title }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.toc ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1px;
  border-left: 1px solid var(--line);
}
.toc a {
  display: block;
  margin-left: -1px;
  padding: 4px 12px;
  border-left: 2px solid transparent;
  color: var(--ink-3);
  font-size: var(--fs-sm);
  line-height: 1.5;
  text-decoration: none;
}
.toc a:hover {
  color: var(--ink);
}
.toc a.is-active {
  color: var(--accent);
  border-left-color: var(--accent);
  font-weight: 700;
}
.toc__sub a {
  padding-left: 24px;
  font-size: var(--fs-xs);
}
</style>
