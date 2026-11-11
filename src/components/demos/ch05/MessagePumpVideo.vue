<script setup lang="ts">
import AnimationPlayer, { type Cue } from '@/components/player/AnimationPlayer.vue'
import { along, fade, ramp } from '@/lib/anim'

/**
 * メッセージポンプと Dispatcher キューの動きを 70 秒で。
 * OS のメッセージキュー → メッセージループ → Dispatcher のキュー → 実行、という流れと、
 * 「一度に 1 件」「優先度順」「1 件が長いと全部が待つ」を見せる。
 */
const cues: Cue[] = [
  { t: 0, title: '① メッセージループ', text: 'UI スレッドの正体は 1 本のループだ。OS のメッセージキューから 1 件取り出し、処理し、また 1 件取り出す。これを終了まで繰り返す。' },
  { t: 9, title: '② 入力が届く', text: 'キーを押すと、OS がメッセージ（WM_KEYDOWN）をキューに入れる。ループがそれを取り出し、WPF が KeyDown イベントに変換して、あなたのハンドラーを呼ぶ。' },
  { t: 19, title: '③ BeginInvoke すると', text: '作業は Dispatcher のキューに、優先度を付けて積まれる。同時に Dispatcher は、自分宛の「キューを見て」という合図のメッセージを OS のキューへ送る。' },
  { t: 30, title: '④ 合図を受けて 1 件実行', text: 'ループが合図のメッセージを取り出すと、Dispatcher が自分のキューから最も優先度の高い 1 件を取り出して実行する。実行するのは 1 回につき 1 件だけ。' },
  { t: 41, title: '⑤ 優先度順に処理される', text: '積んだ順は B → C → D でも、実行されるのは優先度の高い順（Normal → Render → Background）。1 件ごとにループへ戻るので、合間に入力も処理できる。' },
  { t: 54, title: '⑥ 1 件が長いと、すべてが待つ', text: '実行中の処理が終わるまで、ループは次のメッセージを取り出せない。入力も描画も溜まる一方になり、数秒続くと OS はウィンドウを「応答なし」と表示する。' },
]

const OSX = 85
const slotY = (i: number) => 98 + i * 36
const LOOP = { x: 240, y: 190 }
const EXEC = { x: 480, y: 298 }
const LANE = { Normal: 86, Render: 118, Input: 150, Background: 182 } as const
const LX = 505

interface Chip {
  label: string
  color: 'ui' | 'render' | 'warn' | 'data' | 'danger'
  w: number
  from: number
  to: number
  keys: (readonly [number, number, number])[]
}
const chips: Chip[] = [
  { label: 'WM_MOUSEMOVE', color: 'warn', w: 124, from: 1, to: 8.5, keys: [[1, OSX, slotY(0)], [4, OSX, slotY(0)], [5.5, LOOP.x, LOOP.y], [6, LOOP.x, LOOP.y], [7, EXEC.x, EXEC.y], [8.5, EXEC.x, EXEC.y]] },
  { label: 'WM_KEYDOWN', color: 'warn', w: 124, from: 10, to: 18.5, keys: [[10, OSX, slotY(0)], [12, OSX, slotY(0)], [13.5, LOOP.x, LOOP.y], [14, LOOP.x, LOOP.y], [15.5, EXEC.x, EXEC.y], [18.5, EXEC.x, EXEC.y]] },
  { label: 'A（Normal）', color: 'ui', w: 112, from: 20, to: 40, keys: [[20, 480, 20], [21, 480, 20], [23, LX, LANE.Normal], [35, LX, LANE.Normal], [37, EXEC.x, EXEC.y], [40, EXEC.x, EXEC.y]] },
  { label: 'Dispatcher 宛', color: 'ui', w: 124, from: 23.5, to: 35, keys: [[23.5, OSX, slotY(0)], [31, OSX, slotY(0)], [32.5, LOOP.x, LOOP.y], [33, LOOP.x, LOOP.y], [34.5, 372, 60], [35, 372, 60]] },
  { label: 'D（Normal）', color: 'ui', w: 112, from: 41.5, to: 46, keys: [[41.5, LX, LANE.Normal], [43, LX, LANE.Normal], [44.5, EXEC.x, EXEC.y], [46, EXEC.x, EXEC.y]] },
  { label: 'C（Render）', color: 'render', w: 112, from: 41.5, to: 49.5, keys: [[41.5, LX, LANE.Render], [46.5, LX, LANE.Render], [48, EXEC.x, EXEC.y], [49.5, EXEC.x, EXEC.y]] },
  { label: 'B（Background）', color: 'data', w: 132, from: 41.5, to: 53.5, keys: [[41.5, LX, LANE.Background], [50, LX, LANE.Background], [51.5, EXEC.x, EXEC.y], [53.5, EXEC.x, EXEC.y]] },
  { label: '重い処理（数秒かかる）', color: 'danger', w: 176, from: 54.5, to: 71, keys: [[54.5, LX, LANE.Normal], [55, LX, LANE.Normal], [56.5, EXEC.x, EXEC.y], [71, EXEC.x, EXEC.y]] },
  ...['WM_MOUSEMOVE', 'WM_KEYDOWN', 'WM_LBUTTONDOWN', 'Dispatcher 宛', 'WM_MOUSEMOVE', 'WM_KEYDOWN'].map(
    (label, i): Chip => ({ label, color: label.startsWith('WM') ? 'warn' : 'ui', w: 124, from: 57 + i * 2, to: 71, keys: [[57 + i * 2, OSX, slotY(i)]] }),
  ),
]
const stuck = (t: number) => t >= 56.5
</script>

<template>
  <AnimationPlayer :duration="70" :cues="cues" label="メッセージポンプと Dispatcher キュー" v-slot="{ t }">
    <svg viewBox="0 0 640 360" role="img" aria-label="OS のメッセージキューからメッセージループ、Dispatcher のキューを経て処理が実行される様子">
      <defs>
        <marker id="mp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--line-strong)" /></marker>
        <pattern id="mp-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="10" fill="var(--c-danger)" opacity="0.22" /></pattern>
      </defs>

      <!-- OS のメッセージキュー -->
      <rect x="10" y="44" width="150" height="304" rx="10" fill="var(--c-warn-soft)" stroke="var(--c-warn)" />
      <text x="85" y="66" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: 'var(--c-warn)' }">OS のメッセージキュー</text>
      <text x="85" y="340" text-anchor="middle" class="svg-t2" style="font-size: 11px">先頭から 1 件ずつ取り出す</text>

      <!-- メッセージループ -->
      <g :transform="`translate(${LOOP.x} ${LOOP.y})`">
        <circle r="46" fill="var(--bg-raised)" :stroke="stuck(t) ? 'var(--c-danger)' : 'var(--line-strong)'" stroke-width="1.5" />
        <circle r="46" fill="none" :stroke="stuck(t) ? 'var(--c-danger)' : 'var(--accent)'" stroke-width="5" stroke-dasharray="80 209" stroke-linecap="round" :transform="`rotate(${(Math.min(t, 56.5) * 150) % 360})`" />
        <text y="-4" text-anchor="middle" class="svg-t2 svg-b">メッセージ</text>
        <text y="13" text-anchor="middle" class="svg-t2 svg-b">ループ</text>
      </g>
      <path d="M162 150C176 150 180 172 192 180" fill="none" stroke="var(--line-strong)" stroke-width="1.5" marker-end="url(#mp-arrow)" />
      <path d="M286 176C304 160 310 140 326 132" fill="none" stroke="var(--line-strong)" stroke-width="1.5" marker-end="url(#mp-arrow)" />
      <path d="M280 214C300 240 312 262 326 274" fill="none" stroke="var(--line-strong)" stroke-width="1.5" marker-end="url(#mp-arrow)" />
      <text :x="LOOP.x" y="262" text-anchor="middle" class="svg-t2 svg-b" :opacity="ramp(t, 58, 59.5)" :style="{ fill: 'var(--c-danger)' }">ループが回れない</text>

      <!-- Dispatcher のキュー -->
      <rect x="330" y="44" width="300" height="162" rx="10" fill="var(--c-ui-soft)" stroke="var(--c-ui)" />
      <text x="418" y="64" class="svg-t2 svg-b" :style="{ fill: 'var(--c-ui)' }">Dispatcher のキュー（優先度順）</text>
      <g v-for="(y, name) in LANE" :key="name">
        <rect x="340" :y="y - 14" width="280" height="28" rx="5" fill="var(--bg-raised)" stroke="var(--line)" />
        <text x="350" :y="y + 4.5" class="svg-t2" style="font-size: 11.5px">{{ name }}</text>
      </g>

      <!-- 実行スロット -->
      <rect x="330" y="250" width="300" height="98" rx="10" fill="var(--bg-raised)" stroke="var(--line-strong)" stroke-width="1.5" />
      <rect v-if="stuck(t)" x="330" y="250" width="300" height="98" rx="10" fill="url(#mp-hatch)" />
      <text x="344" y="270" class="svg-t2 svg-b">UI スレッドで実行（一度に 1 件）</text>

      <!-- ③ 合図のメッセージ -->
      <g :opacity="fade(t, 23, 30, 0.5)">
        <path d="M328 76C270 60 220 70 164 92" fill="none" stroke="var(--c-ui)" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#mp-arrow)" />
        <text x="246" y="56" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: 'var(--c-ui)' }">合図のメッセージを送る</text>
      </g>
      <g :opacity="fade(t, 19.5, 24, 0.4)">
        <text x="330" y="24" class="svg-mono" style="font-size: 11.5px">BeginInvoke(…)</text>
      </g>

      <!-- 動く札 -->
      <g v-for="(c, i) in chips" :key="i">
        <g v-if="t >= c.from && t < c.to" :transform="`translate(${along(t, c.keys).x} ${along(t, c.keys).y})`">
          <rect :x="-c.w / 2" y="-13" :width="c.w" height="26" rx="13" :fill="`var(--c-${c.color})`" />
          <text y="4.5" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bg-raised)" font-family="var(--font-sans)">{{ c.label }}</text>
        </g>
      </g>
    </svg>
  </AnimationPlayer>
</template>
