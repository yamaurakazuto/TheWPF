<script setup lang="ts">
/**
 * .NET の XAML 系 / デスクトップ UI フレームワークを「登場年」と「動く場所」で並べた図。
 * どちらの軸も事実（第 1 章の年表と同じ出典）で、優劣を表すものではない。
 */
const Y0 = 2000
const Y1 = 2026
const y = (year: number) => 50 + ((Y1 - year) / (Y1 - Y0)) * 250
const COLS = [
  { x: 150, label: 'Windows のみ' },
  { x: 330, label: 'デスクトップ複数 OS' },
  { x: 510, label: 'モバイルも含む' },
]
const items = [
  { name: 'WinForms', year: 2002, x: 112, w: 92, color: 'mute', note: '2002' },
  { name: 'WPF', year: 2006, x: 196, w: 70, color: 'ui', note: '2006', strong: true },
  { name: 'WinUI 3', year: 2021, x: 150, w: 86, color: 'render', note: '2021' },
  { name: 'Avalonia', year: 2013, x: 420, w: 270, color: 'data', note: '2013 開発開始 / 11 は 2023', wide: true },
  { name: '.NET MAUI', year: 2022, x: 510, w: 100, color: 'warn', note: '2022' },
]
const years = [2002, 2006, 2010, 2014, 2018, 2022, 2026]
</script>

<template>
  <div class="fm">
    <svg viewBox="0 0 640 340" role="img" aria-label="フレームワークの登場年と動く場所。WPF は 2006 年登場で Windows のみ。Windows Forms は 2002 年で Windows のみ。WinUI 3 は 2021 年で Windows のみ。Avalonia は 2013 年開発開始で複数 OS とモバイル。.NET MAUI は 2022 年でモバイルを含む複数 OS。">
      <!-- 列 -->
      <g v-for="(c, i) in COLS" :key="c.label">
        <rect :x="60 + i * 190" y="34" width="180" height="278" rx="8" :fill="i === 0 ? 'var(--c-ui-soft)' : 'var(--bg)'" stroke="var(--line)" />
        <text :x="c.x" y="24" text-anchor="middle" class="svg-t2 svg-b">{{ c.label }}</text>
      </g>
      <!-- 年の目盛り -->
      <g v-for="yr in years" :key="yr">
        <line x1="56" x2="630" :y1="y(yr)" :y2="y(yr)" stroke="var(--line)" stroke-dasharray="2 5" />
        <text x="50" :y="y(yr) + 4" text-anchor="end" class="svg-t2" style="font-size: 11.5px">{{ yr }}</text>
      </g>
      <text x="50" y="24" text-anchor="end" class="svg-t2 svg-b">登場年</text>

      <!-- フレームワーク -->
      <g v-for="it in items" :key="it.name">
        <rect :x="it.x - it.w / 2" :y="y(it.year) - 15" :width="it.w" height="30" rx="15" :fill="`var(--c-${it.color}-soft)`" :stroke="`var(--c-${it.color})`" :stroke-width="it.strong ? 3 : 1.5" />
        <text :x="it.x" :y="y(it.year) + 5" text-anchor="middle" class="svg-t svg-b">{{ it.name }}</text>
        <text :x="it.x" :y="y(it.year) + 30" text-anchor="middle" class="svg-t2" style="font-size: 11px">{{ it.note }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.fm > svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 680px;
  margin: 0 auto;
}
</style>
