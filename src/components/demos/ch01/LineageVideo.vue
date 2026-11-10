<script setup lang="ts">
import AnimationPlayer, { type Cue } from '@/components/player/AnimationPlayer.vue'
import { lerp } from '@/lib/anim'

/**
 * Microsoft 系 / XAML 系 UI フレームワークの系譜を、時間軸上のバーとして 50 秒で見せる。
 * 開始・終了の年月は第 1 章の年表（timeline.ts）と同じ出典に基づく。
 */
const cues: Cue[] = [
  { t: 0, title: '2002〜2006年: Windows Forms の時代', text: '.NET 最初の UI は Windows Forms。その裏で、DirectX で描く次世代基盤「Avalon」が構想されていた。' },
  { t: 8, title: '2006〜2012年: WPF 登場、Silverlight が並走', text: '.NET Framework 3.0 で WPF が登場。翌年には XAML をブラウザーで動かす Silverlight が始まり、XAML が 2 系統になる。' },
  { t: 18, title: '2012〜2018年: 主役は WinRT / UWP へ', text: 'Windows 8 が 3 つ目の XAML を導入。WPF への機能追加は減り「停滞期」と呼ばれたが、業務アプリは WPF で作られ続けた。' },
  { t: 28, title: '2018〜2019年: オープンソース化と .NET Core 3.0', text: '2018 年 12 月に WPF がオープンソースに。2019 年 9 月の .NET Core 3.0 で、WPF は新しい .NET の上で動き始める。' },
  { t: 36, title: '2020年〜: 選択肢が並ぶ現在', text: 'WinUI 3、.NET MAUI、Avalonia が出そろう。Silverlight は 2021 年に終了。WPF は毎年の .NET リリースとともに改善が続く。' },
]

const KEYS: [number, number][] = [
  [0, 2002],
  [8, 2006.85],
  [18, 2012.8],
  [28, 2018.3],
  [36, 2020],
  [46, 2026.86],
  [50, 2026.86],
]
function yearAt(t: number): number {
  for (let i = 1; i < KEYS.length; i++) {
    if (t <= KEYS[i][0]) {
      const [t0, y0] = KEYS[i - 1]
      const [t1, y1] = KEYS[i]
      return lerp(y0, y1, (t - t0) / (t1 - t0))
    }
  }
  return KEYS[KEYS.length - 1][1]
}

const X0 = 150
const X1 = 628
const Y_FROM = 2002
const Y_TO = 2027
const x = (year: number) => X0 + ((year - Y_FROM) / (Y_TO - Y_FROM)) * (X1 - X0)

interface Lane {
  name: string
  sub?: string
  from: number
  to?: number
  color: string
  marks?: { at: number; label: string }[]
}
const lanes: Lane[] = [
  { name: 'Windows Forms', from: 2002.12, color: 'mute' },
  {
    name: 'WPF',
    from: 2006.85,
    color: 'ui',
    marks: [
      { at: 2018.92, label: 'OSS 化・.NET Core 対応' },
    ],
  },
  { name: 'Silverlight', from: 2007.68, to: 2021.78, color: 'danger' },
  { name: 'WinRT / UWP', from: 2012.8, color: 'warn' },
  { name: 'Avalonia', sub: 'コミュニティ主導', from: 2013.93, color: 'data', marks: [{ at: 2023.52, label: 'v11' }] },
  { name: 'WinUI 3', from: 2021.87, color: 'render' },
  { name: '.NET MAUI', from: 2022.39, color: 'render' },
]
const LANE_H = 40
const laneY = (i: number) => 58 + i * LANE_H
const ticks = Array.from({ length: 13 }, (_, i) => 2002 + i * 2)
</script>

<template>
  <AnimationPlayer :duration="50" :cues="cues" label="UI フレームワークの系譜" v-slot="{ t }">
    <svg viewBox="0 0 640 352" role="img" :aria-label="`UI フレームワークの系譜。現在の表示位置は ${Math.floor(yearAt(t))} 年`">
      <!-- 時間軸 -->
      <g>
        <line :x1="X0" :x2="X1" y1="38" y2="38" stroke="var(--line-strong)" />
        <g v-for="y in ticks" :key="y">
          <line :x1="x(y)" :x2="x(y)" y1="34" y2="42" stroke="var(--line-strong)" />
          <line :x1="x(y)" :x2="x(y)" y1="44" :y2="laneY(lanes.length) - 6" stroke="var(--line)" stroke-dasharray="2 4" />
          <text v-if="(y - 2002) % 4 === 0" :x="x(y)" y="26" text-anchor="middle" class="svg-t2">{{ y }}</text>
        </g>
      </g>

      <!-- レーン -->
      <g v-for="(l, i) in lanes" :key="l.name" :opacity="yearAt(t) >= l.from ? 1 : 0.28">
        <text :x="X0 - 10" :y="laneY(i) + (l.sub ? 12 : 18)" text-anchor="end" class="svg-t svg-b">{{ l.name }}</text>
        <text v-if="l.sub" :x="X0 - 10" :y="laneY(i) + 27" text-anchor="end" class="svg-t2">{{ l.sub }}</text>
        <rect
          v-if="yearAt(t) > l.from"
          :x="x(l.from)"
          :y="laneY(i) + 4"
          :width="Math.max(2, x(Math.min(yearAt(t), l.to ?? 9999)) - x(l.from))"
          height="22"
          rx="5"
          :fill="`var(--c-${l.color}-soft)`"
          :stroke="`var(--c-${l.color})`"
          stroke-width="1.5"
        />
        <!-- 終了したもの -->
        <g v-if="l.to && yearAt(t) >= l.to">
          <line :x1="x(l.to)" :x2="x(l.to)" :y1="laneY(i)" :y2="laneY(i) + 30" :stroke="`var(--c-${l.color})`" stroke-width="2.5" />
          <text :x="x(l.to) + 6" :y="laneY(i) + 20" class="svg-t2">終了</text>
        </g>
        <!-- 節目 -->
        <g v-for="m in l.marks ?? []" :key="m.label">
          <g v-if="yearAt(t) >= m.at">
            <path :d="`M${x(m.at)} ${laneY(i) + 6} l7 9 -7 9 -7 -9z`" :fill="`var(--c-${l.color})`" />
            <text :x="x(m.at) + 8" :y="laneY(i) - 1" text-anchor="end" class="svg-t2 svg-b" :style="{ fill: `var(--c-${l.color})` }">{{ m.label }}</text>
          </g>
        </g>
      </g>

      <!-- 再生ヘッド -->
      <g>
        <line :x1="x(yearAt(t))" :x2="x(yearAt(t))" y1="38" :y2="laneY(lanes.length) - 8" stroke="var(--accent)" stroke-width="2" />
        <rect :x="x(yearAt(t)) - 24" :y="laneY(lanes.length) - 8" width="48" height="20" rx="6" fill="var(--accent)" />
        <text :x="x(yearAt(t))" :y="laneY(lanes.length) + 6.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--accent-ink)" font-family="var(--font-mono)">
          {{ Math.floor(yearAt(t)) }}
        </text>
      </g>
    </svg>
  </AnimationPlayer>
</template>
