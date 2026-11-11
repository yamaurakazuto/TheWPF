<script setup lang="ts">
import AnimationPlayer, { type Cue } from '@/components/player/AnimationPlayer.vue'
import { along, fade, ramp } from '@/lib/anim'

/**
 * UI スレッドで .Result を呼んだときのデッドロックを 42 秒で。
 *   string s = LoadAsync().Result;   // LoadAsync の中に await Task.Delay(1000) がある
 * 最後に、await に直すとなぜ解けるのかを見せる。
 */
const cues: Cue[] = [
  { t: 0, title: '① ボタンが押された', text: 'UI スレッドでクリックのハンドラーが走り、LoadAsync() を呼ぶ。LoadAsync は await Task.Delay(1000) まで進むと、未完了の Task を返していったん戻ってくる。' },
  { t: 7, title: '② .Result で結果を待つ', text: 'ハンドラーは返ってきた Task の .Result を読む。Task はまだ終わっていないので、UI スレッドはここで停止して完了を待つ。メッセージループも止まる。' },
  { t: 14, title: '③ 1 秒後、Delay が終わる', text: 'await は「続きは元の場所（UI スレッド）で実行する」と覚えている。そこで LoadAsync の続きが、UI スレッドの順番待ちに積まれる。' },
  { t: 22, title: '④ お互いを待ち続ける', text: 'UI スレッドは Task の完了を待っている。Task を完了させる「続き」は、UI スレッドが空くのを待っている。どちらも永遠に進めない。これがデッドロック。' },
  { t: 31, title: '⑤ await に直すと', text: '.Result の代わりに await を使うと、UI スレッドは待たずにメッセージループへ戻る。手が空いているので、積まれた「続き」を実行でき、処理が最後まで進む。' },
]
const TOKEN = [
  [15, 330, 246],
  [18, 540, 96],
  [35, 540, 96],
  [37, 360, 96],
] as const
</script>

<template>
  <AnimationPlayer :duration="42" :cues="cues" label="デッドロックの作り方と解き方" v-slot="{ t }">
    <svg viewBox="0 0 640 320" role="img" aria-label="UI スレッドで .Result を呼ぶとデッドロックする様子と、await で解決する様子">
      <defs>
        <pattern id="dl-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="10" fill="var(--c-danger)" opacity="0.3" /></pattern>
        <marker id="dl-ng" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--c-danger)" /></marker>
      </defs>

      <!-- UI スレッド -->
      <rect x="10" y="34" width="620" height="118" rx="12" fill="var(--c-ui-soft)" stroke="var(--c-ui)" />
      <text x="24" y="56" class="svg-t svg-b" :style="{ fill: 'var(--c-ui)' }">UI スレッド</text>

      <!-- ハンドラー -->
      <g :opacity="ramp(t, 0.5, 1.8)">
        <rect x="24" y="70" width="128" height="52" rx="8" fill="var(--bg-raised)" stroke="var(--c-ui)" stroke-width="1.5" />
        <text x="88" y="92" text-anchor="middle" class="svg-t2 svg-b">OnClick</text>
        <text x="88" y="110" text-anchor="middle" class="svg-mono" style="font-size: 11px">LoadAsync()</text>
      </g>

      <!-- .Result で待機（〜31 秒） -->
      <g :opacity="Math.min(ramp(t, 7.5, 9), 1 - ramp(t, 31.5, 33))">
        <rect x="160" y="70" width="270" height="52" rx="8" fill="var(--bg-raised)" stroke="var(--c-danger)" stroke-width="2" />
        <rect x="160" y="70" width="270" height="52" rx="8" fill="url(#dl-hatch)" />
        <text x="295" y="92" text-anchor="middle" class="svg-mono svg-b">.Result</text>
        <text x="295" y="110" text-anchor="middle" class="svg-t2">完了するまで停止して待つ</text>
      </g>
      <!-- await（31 秒〜） -->
      <g :opacity="ramp(t, 32.5, 34)">
        <rect x="160" y="70" width="270" height="52" rx="8" fill="var(--c-data-soft)" stroke="var(--c-data)" stroke-width="2" stroke-dasharray="6 4" />
        <text x="232" y="92" text-anchor="middle" class="svg-mono svg-b">await</text>
        <text x="232" y="110" text-anchor="middle" class="svg-t2" style="font-size: 11.5px">待たずにループへ戻る</text>
      </g>

      <!-- UI スレッドの順番待ち -->
      <rect x="456" y="62" width="162" height="68" rx="8" fill="var(--bg-raised)" stroke="var(--line-strong)" stroke-dasharray="4 4" />
      <text x="537" y="80" text-anchor="middle" class="svg-t2" style="font-size: 11.5px">UI スレッドの順番待ち</text>

      <!-- スレッドプール -->
      <rect x="10" y="196" width="620" height="100" rx="12" fill="var(--c-render-soft)" stroke="var(--c-render)" />
      <text x="24" y="218" class="svg-t svg-b" :style="{ fill: 'var(--c-render)' }">タイマー / スレッドプール</text>
      <g :opacity="ramp(t, 4, 5.5)">
        <rect x="160" y="232" width="340" height="30" rx="6" fill="var(--bg-raised)" stroke="var(--c-render)" />
        <rect x="160" y="232" :width="340 * ramp(t, 5, 14)" height="30" rx="6" fill="var(--c-render)" opacity="0.45" />
        <text x="330" y="252" text-anchor="middle" class="svg-mono svg-b">Task.Delay(1000){{ t >= 14 ? ' 完了' : '' }}</text>
        <path d="M152 124C152 180 190 210 218 228" fill="none" stroke="var(--line-strong)" stroke-width="1.5" stroke-dasharray="4 4" />
      </g>

      <!-- 「続き」の札 -->
      <g v-if="t >= 15" :transform="`translate(${along(t, TOKEN).x} ${along(t, TOKEN).y + 12})`">
        <rect x="-70" y="-14" width="140" height="28" rx="14" :fill="t >= 37 ? 'var(--c-data)' : 'var(--c-warn)'" />
        <text y="4.5" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bg-raised)" font-family="var(--font-sans)">{{ t >= 37.5 ? '続きを実行 ✓' : 'LoadAsync の続き' }}</text>
      </g>

      <!-- お互いを待つ矢印 -->
      <g :opacity="fade(t, 22.5, 31.5, 0.8)">
        <path d="M432 84C444 76 462 80 480 96" fill="none" stroke="var(--c-danger)" stroke-width="2.5" marker-end="url(#dl-ng)" />
        <path d="M486 124C462 146 444 140 432 114" fill="none" stroke="var(--c-danger)" stroke-width="2.5" marker-end="url(#dl-ng)" />
        <text x="300" y="172" text-anchor="middle" class="svg-t svg-b" :style="{ fill: 'var(--c-danger)' }">Task の完了を待つ ⇄ UI スレッドが空くのを待つ</text>
        <rect x="244" y="4" width="152" height="26" rx="13" fill="var(--c-danger)" :opacity="ramp(t, 25, 26)" />
        <text x="320" y="22" text-anchor="middle" font-size="13.5" font-weight="700" fill="var(--bg-raised)" font-family="var(--font-sans)" :opacity="ramp(t, 25, 26)">デッドロック</text>
      </g>
    </svg>
  </AnimationPlayer>
</template>
