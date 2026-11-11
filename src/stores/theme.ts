import { ref } from 'vue'
import { defineStore } from 'pinia'

type Theme = 'light' | 'dark'
const KEY = 'thewpf:theme'

export const useTheme = defineStore('theme', () => {
  const theme = ref<Theme>((document.documentElement.dataset.theme as Theme | undefined) ?? 'light')

  function set(next: Theme) {
    theme.value = next
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* プライベートモード等では保存しない */
    }
  }
  const toggle = () => set(theme.value === 'dark' ? 'light' : 'dark')

  return { theme, set, toggle }
})
