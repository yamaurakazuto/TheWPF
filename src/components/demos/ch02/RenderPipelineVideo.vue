<script setup lang="ts">
import AnimationPlayer, { type Cue } from '@/components/player/AnimationPlayer.vue'
import { along, fade, ramp } from '@/lib/anim'

/**
 * 「プロパティを 1 つ変えてから画面に出るまで」を 60 秒で追う。
 * UI スレッドとレンダースレッドの役割分担と、retained mode の意味を見せる。
 */
const cues: Cue[] = [
  { t: 0, title: '2 つのスレッド', text: 'WPF アプリには最低 2 つのスレッドがある。あなたのコードが走る UI スレッドと、描画だけを担当するレンダースレッドだ。' },
  { t: 9, title: '① プロパティが変わる', text: 'UI スレッドでボタンの Background を赤に変える。この時点では画面には何も起きていない。変わったのはオブジェクトの値だけ。' },
  { t: 19, title: '② レイアウトと描画命令の記録', text: '必要ならサイズと位置を計算し直し（Measure / Arrange）、各要素が「何を描くか」を記録する。ピクセルを塗るのではなく、描画の指示を残すだけ。' },
  { t: 29, title: '③ 変更がレンダースレッドへ送られる', text: '変わった部分だけがまとめてレンダースレッドへ送られる。レンダースレッドは画面全体の描画内容のコピー（合成ツリー）を持っている。' },
  { t: 39, title: '④ 合成して画面へ', text: 'レンダースレッドが合成ツリーを DirectX で描き、画面が更新される。描画内容を保持しているので、アプリに「描き直して」と頼む必要がない。' },
  { t: 49, title: '⑤ UI スレッドを塞ぐと', text: 'UI スレッドで重い処理をすると、新しい変更が届かなくなり画面は固まる。保持済みの内容の再合成はできても、アニメーションも入力への反応も止まる。' },
]

const TOKEN = [
  [9, 86, 62],
  [19, 86, 62],
  [22, 241, 62],
  [24, 241, 62],
  [26, 402, 62],
  [27, 402, 62],
  [29, 554, 62],
  [30, 554, 62],
  [36, 530, 250],
  [40, 530, 250],
  [43, 325, 250],
  [44, 325, 250],
  [47, 116, 244],
  [49, 116, 244],
] as const

const UI_BOXES = [
  { id: 'a', x: 24, w: 124, title: 'プロパティ変更', sub: 'SetValue', on: [9, 19] },
  { id: 'b', x: 166, w: 150, title: 'レイアウト', sub: 'Measure / Arrange', on: [21, 24.5] },
  { id: 'c', x: 334, w: 136, title: '描画命令を記録', sub: 'OnRender', on: [25.5, 27.5] },
  { id: 'd', x: 488, w: 132, title: 'ビジュアルツリー', sub: '描く内容を保持', on: [28.5, 31] },
] as const
const RENDER_BOXES = [
  { id: 'e', x: 440, w: 180, title: '合成ツリー', sub: '描画内容のコピー', on: [35, 41] },
  { id: 'f', x: 240, w: 170, title: 'DirectX で合成', sub: 'GPU', on: [42.5, 45] },
] as const
const glow = (t: number, on: readonly [number, number]) => fade(t, on[0], on[1], 0.5)
</script>

<template>
  <AnimationPlayer :duration="60" :cues="cues" label="1 フレームができるまで" v-slot="{ t }">
    <svg viewBox="0 0 640 360" role="img" aria-label="プロパティの変更が UI スレッドからレンダースレッドを経て画面に届く様子">
      <defs>
        <pattern id="rp-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="10" fill="var(--c-danger)" opacity="0.28" />
        </pattern>
        <marker id="rp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--line-strong)" />
        </marker>
      </defs>

      <!-- UI スレッド -->
      <g :opacity="ramp(t, 0.3, 2)">
        <rect x="10" y="16" width="620" height="134" rx="12" fill="var(--c-ui-soft)" stroke="var(--c-ui)" />
        <text x="26" y="42" class="svg-t svg-b" :style="{ fill: 'var(--c-ui)' }">UI スレッド</text>
        <text x="118" y="42" class="svg-t2">あなたのコードが走る</text>
      </g>
      <!-- レンダースレッド -->
      <g :opacity="ramp(t, 3, 5)">
        <rect x="10" y="206" width="620" height="140" rx="12" fill="var(--c-render-soft)" stroke="var(--c-render)" />
        <text x="26" y="232" class="svg-t svg-b" :style="{ fill: 'var(--c-render)' }">レンダースレッド</text>
        <text x="150" y="232" class="svg-t2">milcore。あなたのコードは走らない</text>
      </g>

      <!-- UI スレッドの工程 -->
      <g :opacity="ramp(t, 5, 7)">
        <g v-for="b in UI_BOXES" :key="b.id">
          <rect :x="b.x" y="62" :width="b.w" height="60" rx="8" fill="var(--bg-raised)" stroke="var(--c-ui)" :stroke-width="1.5 + glow(t, b.on) * 2.5" />
          <rect :x="b.x" y="62" :width="b.w" height="60" rx="8" fill="var(--c-ui)" :opacity="glow(t, b.on) * 0.18" />
          <text :x="b.x + b.w / 2" y="88" text-anchor="middle" class="svg-t svg-b">{{ b.title }}</text>
          <text :x="b.x + b.w / 2" y="108" text-anchor="middle" class="svg-t2">{{ b.sub }}</text>
        </g>
        <path d="M150 92H162M318 92H330M472 92H484" stroke="var(--line-strong)" stroke-width="1.5" marker-end="url(#rp-arrow)" fill="none" />
      </g>

      <!-- レンダースレッドの工程 -->
      <g :opacity="ramp(t, 6, 8)">
        <g v-for="b in RENDER_BOXES" :key="b.id">
          <rect :x="b.x" y="250" :width="b.w" height="60" rx="8" fill="var(--bg-raised)" stroke="var(--c-render)" :stroke-width="1.5 + glow(t, b.on) * 2.5" />
          <rect :x="b.x" y="250" :width="b.w" height="60" rx="8" fill="var(--c-render)" :opacity="glow(t, b.on) * 0.18" />
          <text :x="b.x + b.w / 2" y="276" text-anchor="middle" class="svg-t svg-b">{{ b.title }}</text>
          <text :x="b.x + b.w / 2" y="296" text-anchor="middle" class="svg-t2">{{ b.sub }}</text>
        </g>
        <path d="M438 280H414M238 280H206" stroke="var(--line-strong)" stroke-width="1.5" marker-end="url(#rp-arrow)" fill="none" />

        <!-- 画面 -->
        <g>
          <rect x="30" y="244" width="172" height="92" rx="6" fill="var(--bg-raised)" stroke="var(--line-strong)" stroke-width="1.5" />
          <path d="M30 262H202" stroke="var(--line-strong)" />
          <text x="40" y="257" class="svg-t2">画面</text>
          <rect x="52" y="274" width="70" height="8" rx="3" fill="var(--c-mute)" opacity="0.5" />
          <rect x="52" y="294" width="92" height="28" rx="5" :fill="t >= 46.5 ? 'var(--c-danger)' : 'var(--c-mute)'" :opacity="t >= 46.5 ? 1 : 0.45" />
          <text x="98" y="313" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: t >= 46.5 ? '#fff' : 'var(--ink)' }">Button</text>
        </g>
      </g>

      <!-- スレッド間の受け渡し -->
      <g :opacity="ramp(t, 28, 30)">
        <path d="M554 124C554 170 530 190 530 246" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 5" marker-end="url(#rp-arrow)" />
        <text x="360" y="184" class="svg-t2 svg-b" :opacity="fade(t, 29, 49, 0.6)">変更をまとめて送る（スレッド間の通信）</text>
      </g>

      <!-- 追跡する「変更」 -->
      <g v-if="t >= 9 && t < 49" :transform="`translate(${along(t, TOKEN).x} ${along(t, TOKEN).y})`">
        <circle r="13" fill="var(--c-danger)" opacity="0.25" />
        <circle r="8" fill="var(--c-danger)" stroke="var(--bg-raised)" stroke-width="2" />
      </g>
      <g :opacity="fade(t, 9.5, 19, 0.6)">
        <rect x="30" y="126" width="270" height="22" rx="5" fill="var(--bg-raised)" stroke="var(--line)" />
        <text x="40" y="141.5" class="svg-mono">button.Background = Brushes.Red;</text>
      </g>

      <!-- ⑤ UI スレッドがブロックされた状態 -->
      <g :opacity="ramp(t, 49.5, 51.5)">
        <rect x="10" y="16" width="620" height="134" rx="12" fill="url(#rp-hatch)" />
        <rect x="186" y="70" width="268" height="44" rx="8" fill="var(--bg-raised)" stroke="var(--c-danger)" stroke-width="2" />
        <text x="320" y="90" text-anchor="middle" class="svg-t svg-b" :style="{ fill: 'var(--c-danger)' }">重い処理でブロック中</text>
        <text x="320" y="107" text-anchor="middle" class="svg-t2">Thread.Sleep、同期 I/O、長いループ…</text>
        <g transform="translate(542 176)">
          <circle r="15" fill="var(--bg-raised)" stroke="var(--c-danger)" stroke-width="2.5" />
          <path d="M-7 -7L7 7M7 -7L-7 7" stroke="var(--c-danger)" stroke-width="3" stroke-linecap="round" />
        </g>
      </g>
      <g :opacity="ramp(t, 53, 55)">
        <text x="222" y="336" class="svg-t2 svg-b" :style="{ fill: 'var(--c-render)' }">保持している内容の再合成は続けられる</text>
      </g>
    </svg>
  </AnimationPlayer>
</template>
