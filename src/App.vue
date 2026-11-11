<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const navOpen = ref(false)
const route = useRoute()
const mainEl = ref<HTMLElement | null>(null)

// ページを移動したらモバイルのドロワーは閉じる
watch(
  () => route.path,
  () => (navOpen.value = false),
)

function skipToMain() {
  mainEl.value?.focus()
  mainEl.value?.scrollIntoView()
}
</script>

<template>
  <!-- hash ルーティングなので href="#main" は使えない。ボタンでフォーカスを移す -->
  <button class="skip" type="button" @click="skipToMain">本文へスキップ</button>
  <AppHeader :nav-open="navOpen" @toggle-nav="navOpen = !navOpen" />
  <div class="shell">
    <AppSidebar :open="navOpen" @close="navOpen = false" />
    <main id="main" ref="mainEl" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.skip {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 100;
  padding: 8px 14px;
  border-radius: var(--radius-s);
  border: 1px solid var(--accent);
  background: var(--bg-raised);
  color: var(--accent);
  font-weight: 700;
  transform: translateY(-200%);
}
.skip:focus-visible {
  transform: none;
}

.shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
  min-height: calc(100vh - var(--header-h));
}
main {
  min-width: 0;
  outline: none;
}

@media (max-width: 960px) {
  .shell {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
