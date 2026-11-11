<script setup lang="ts">
import { useTheme } from '@/stores/theme'
import UiIcon from '@/components/content/UiIcon.vue'

defineProps<{ navOpen: boolean }>()
defineEmits<{ toggleNav: [] }>()

const theme = useTheme()
</script>

<template>
  <header class="hdr">
    <button
      class="hdr__menu btn btn--ghost"
      type="button"
      :aria-expanded="navOpen"
      aria-controls="site-nav"
      @click="$emit('toggleNav')"
    >
      <UiIcon :name="navOpen ? 'close' : 'menu'" :size="20" />
      <span class="sr-only">目次を{{ navOpen ? '閉じる' : '開く' }}</span>
    </button>

    <RouterLink to="/" class="hdr__logo" aria-label="theWPF トップへ">
      <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--accent)" />
        <path
          d="M14 20l8 24 10-18 10 18 8-24"
          fill="none"
          stroke="var(--accent-ink)"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="hdr__word">the<b>WPF</b></span>
    </RouterLink>

    <nav class="hdr__links" aria-label="サイト内リンク">
      <RouterLink to="/playground"><UiIcon name="code" :size="16" /> 演習場</RouterLink>
      <RouterLink to="/glossary"><UiIcon name="book" :size="16" /> 用語集</RouterLink>
    </nav>

    <button class="btn btn--ghost hdr__theme" type="button" @click="theme.toggle()">
      <UiIcon :name="theme.theme === 'dark' ? 'sun' : 'moon'" :size="18" />
      <span class="sr-only">{{ theme.theme === 'dark' ? 'ライトモード' : 'ダークモード' }}に切り替える</span>
    </button>
  </header>
</template>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 40;
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 0 var(--sp-4);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.hdr__menu {
  display: none;
  padding: 6px 8px;
}
.hdr__logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  text-decoration: none;
  margin-right: auto;
}
.hdr__word {
  font-size: 1.15rem;
  letter-spacing: 0.02em;
  font-weight: 400;
}
.hdr__word b {
  font-weight: 800;
}
.hdr__links {
  display: flex;
  gap: var(--sp-1);
}
.hdr__links a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-s);
  color: var(--ink-2);
  font-size: var(--fs-sm);
  font-weight: 600;
  text-decoration: none;
}
.hdr__links a:hover,
.hdr__links a.router-link-active {
  background: var(--accent-soft);
  color: var(--accent);
}
.hdr__theme {
  padding: 6px 8px;
}

@media (max-width: 960px) {
  .hdr {
    padding: 0 var(--sp-2);
  }
  .hdr__menu {
    display: inline-flex;
  }
}
@media (max-width: 520px) {
  .hdr__links {
    display: none;
  }
}
</style>
