<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import UiIcon from '@/components/content/UiIcon.vue'

/**
 * StaticResource と DynamicResource の違いを確かめるデモ。
 * 同じキー "AccentBrush" を 2 つのボタンが参照する。辞書を差し替えると、
 * DynamicResource 側だけが追従し、StaticResource 側は読み込み時の値のまま残る。
 * あわせて「近い階層から順に探す」リソース検索の経路も見せる。
 */
interface Level {
  id: 'panel' | 'window' | 'app'
  name: string
  where: string
}
const LEVELS: Level[] = [
  { id: 'panel', name: 'StackPanel.Resources', where: 'ボタンのすぐ外側' },
  { id: 'window', name: 'Window.Resources', where: 'ウィンドウ全体' },
  { id: 'app', name: 'Application.Resources', where: 'アプリ全体（App.xaml）' },
]
const THEMES = {
  light: { label: 'Light.xaml', color: '#5235c9' },
  dark: { label: 'Dark.xaml', color: '#0a7f96' },
}
const defined = reactive({ panel: false, window: false, app: true })
const theme = ref<keyof typeof THEMES>('light')
const COLORS = computed(() => ({ panel: '#d9480f', window: '#2f9e44', app: THEMES[theme.value].color }))

/** いま検索したら見つかる階層（近い順） */
const hit = computed(() => LEVELS.find((l) => defined[l.id]) ?? null)
const liveColor = computed(() => (hit.value ? COLORS.value[hit.value.id] : null))

// StaticResource は「読み込み時」に 1 回だけ解決される
const staticColor = ref<string | null>(liveColor.value)
const staticFrom = ref<string | null>(hit.value?.name ?? null)
const loads = ref(1)
function reload() {
  staticColor.value = liveColor.value
  staticFrom.value = hit.value?.name ?? null
  loads.value++
}
const stale = computed(() => staticColor.value !== liveColor.value)
</script>

<template>
  <div class="rl">
    <div class="rl__grid">
      <!-- 検索経路 -->
      <section class="rl__chain" aria-label="リソースの検索経路">
        <h4>検索経路（近い順に探す）</h4>
        <ol>
          <li class="rl__start"><span class="mono">Button</span> がキー <code>AccentBrush</code> を探す</li>
          <li v-for="l in LEVELS" :key="l.id" :class="{ 'is-hit': hit?.id === l.id, 'is-defined': defined[l.id], 'is-skipped': hit && LEVELS.indexOf(l) > LEVELS.indexOf(hit) }">
            <label class="check">
              <input v-model="defined[l.id]" type="checkbox" />
              <span>
                <b class="mono">{{ l.name }}</b>
                <small>{{ l.where }}</small>
              </span>
            </label>
            <span v-if="defined[l.id]" class="rl__swatch" :style="{ background: COLORS[l.id] }" aria-hidden="true" />
            <span v-if="hit?.id === l.id" class="rl__found"><UiIcon name="check" :size="13" /> ここで発見</span>
            <span v-else-if="defined[l.id]" class="rl__shadow">手前で見つかるので使われない</span>
          </li>
          <li class="rl__end" :class="{ 'is-hit': !hit }">テーマ / システムのリソース<span v-if="!hit" class="rl__notfound">どこにもない</span></li>
        </ol>
        <p class="small muted">チェックで「その階層に AccentBrush を定義する / しない」を切り替えられる。</p>
      </section>

      <!-- 2 つのボタン -->
      <section class="rl__preview" aria-label="参照の結果">
        <div class="rl__win">
          <div class="rl__case">
            <code>Background="{StaticResource AccentBrush}"</code>
            <span class="rl__btn" :style="{ background: staticColor ?? '#ddd', color: staticColor ? '#fff' : '#333' }">Static</span>
            <small>読み込み時（{{ loads }} 回目）に <b>{{ staticFrom ?? '見つからず' }}</b> から取得した値のまま</small>
            <small v-if="stale" class="rl__stale"><UiIcon name="warn" :size="13" /> 辞書は変わったが、追従していない</small>
          </div>
          <div class="rl__case">
            <code>Background="{DynamicResource AccentBrush}"</code>
            <span class="rl__btn" :style="{ background: liveColor ?? '#ddd', color: liveColor ? '#fff' : '#333' }">Dynamic</span>
            <small>いまの検索結果: <b>{{ hit?.name ?? '見つからず（既定の見た目）' }}</b></small>
          </div>
        </div>
        <div class="controls">
          <button class="btn btn--sm btn--primary" type="button" @click="theme = theme === 'light' ? 'dark' : 'light'">
            テーマ切り替え（{{ THEMES[theme].label }} を差し替える）
          </button>
          <button class="btn btn--sm" type="button" @click="reload"><UiIcon name="restart" :size="14" /> ウィンドウを開き直す</button>
        </div>
        <p class="small muted">
          「テーマ切り替え」は <code>Application.Resources</code> の辞書を入れ替える操作。「開き直す」と XAML が読み込み直され、StaticResource も改めて解決される。
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.rl {
  container-type: inline-size;
}
.rl__grid {
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: minmax(0, 1fr);
}
@container (min-width: 700px) {
  .rl__grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
h4 {
  font-size: var(--fs-sm);
  margin-bottom: var(--sp-2);
}
.rl__chain ol {
  list-style: none;
  margin: 0 0 var(--sp-2);
  padding: 0;
  display: grid;
  gap: 0;
}
.rl__chain li {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  padding: 8px 10px;
  margin-bottom: 14px;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-m);
  background: var(--bg);
  font-size: var(--fs-sm);
  line-height: 1.5;
}
.rl__chain li:not(:last-child)::after {
  content: '↓';
  position: absolute;
  left: 22px;
  bottom: -17px;
  font-size: 13px;
  line-height: 1;
  color: var(--ink-3);
}
.rl__chain li small {
  display: block;
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.rl__start,
.rl__end {
  border-style: dashed !important;
  color: var(--ink-2);
}
.rl__chain li.is-hit {
  border-color: var(--c-data);
  background: var(--c-data-soft);
}
.rl__chain li.is-skipped {
  opacity: 0.55;
}
.rl__swatch {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  margin-left: auto;
}
.rl__found {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--c-data);
}
.rl__shadow,
.rl__notfound {
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.rl__notfound {
  margin-left: auto;
  color: var(--c-danger);
  font-weight: 700;
}
.rl__preview {
  display: grid;
  gap: var(--sp-3);
  align-content: start;
}
.rl__win {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border-radius: var(--radius-m);
  border: 1px solid #c8c8d0;
  background: #fff;
  color: #17171f;
}
.rl__case {
  display: grid;
  gap: 4px;
  justify-items: start;
}
.rl__case code {
  background: #f1f1f6;
  border-color: #dcdce6;
  color: #17171f;
  font-size: 0.75rem;
}
.rl__case small {
  font-size: var(--fs-xs);
  color: #55556a;
  line-height: 1.5;
}
.rl__btn {
  display: inline-block;
  padding: 7px 26px;
  border-radius: 4px;
  font-weight: 700;
  font-size: var(--fs-sm);
  transition: background 0.25s;
}
.rl__stale {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #a15c00 !important;
  font-weight: 700;
}
</style>
