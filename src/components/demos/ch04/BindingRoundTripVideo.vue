<script setup lang="ts">
import AnimationPlayer, { type Cue } from '@/components/player/AnimationPlayer.vue'
import { along, fade, ramp } from '@/lib/anim'

/**
 * 1 文字の入力がソースに届き、通知となって別の表示に戻ってくるまでを 48 秒で追う。
 * TextBox.Text="{Binding Name, UpdateSourceTrigger=PropertyChanged}" と
 * TextBlock.Text="{Binding Name, StringFormat=こんにちは、{0} さん}" が同じ Name を見ている想定。
 */
const cues: Cue[] = [
  { t: 0, title: '登場人物', text: '左が画面（View）、右がデータ（ViewModel）。2 つの Binding が、同じ Name プロパティを見ている。' },
  { t: 7, title: '① 利用者が入力する', text: 'TextBox に「A」と打つと、まず TextBox.Text（ターゲット）の値が変わる。この時点では ViewModel はまだ何も知らない。' },
  { t: 15, title: '② Binding が値を運ぶ', text: 'UpdateSourceTrigger の条件を満たすと Binding が動く。検証ルールがあれば検査し、コンバーターがあれば ConvertBack で値を変換する。' },
  { t: 23, title: '③ ソースの setter が呼ばれる', text: 'Binding が ViewModel の Name に値を代入する。あなたが書いた setter のコードが実行されるのはここ。' },
  { t: 30, title: '④ PropertyChanged が発生する', text: 'setter が「Name が変わった」と通知する。この通知がなければ、ここで流れは止まる。' },
  { t: 38, title: '⑤ 同じプロパティを見ている Binding が更新する', text: 'Name を見ているすべての Binding が値を取り直し、Convert / StringFormat を通して画面を更新する。' },
]

const TOKEN = [
  [7, 150, 96],
  [15, 150, 96],
  [18, 262, 96],
  [20, 262, 96],
  [22, 378, 96],
  [23, 378, 96],
  [26, 528, 138],
  [30, 528, 138],
  [33, 378, 236],
  [38, 378, 236],
  [41, 262, 236],
  [42, 262, 236],
  [45, 150, 236],
] as const

const glow = (t: number, a: number, b: number) => fade(t, a, b, 0.5)
</script>

<template>
  <AnimationPlayer :duration="48" :cues="cues" label="バインディングの往復" v-slot="{ t }">
    <svg viewBox="0 0 640 320" role="img" aria-label="入力がバインディングを通ってソースへ届き、通知として戻ってくる様子">
      <defs>
        <marker id="br-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="var(--ink-3)" />
        </marker>
      </defs>

      <!-- View -->
      <g :opacity="ramp(t, 0.3, 1.5)">
        <rect x="10" y="20" width="200" height="280" rx="12" fill="var(--c-render-soft)" stroke="var(--c-render)" />
        <text x="26" y="44" class="svg-t svg-b" :style="{ fill: 'var(--c-render)' }">View（画面）</text>
        <!-- TextBox -->
        <text x="26" y="72" class="svg-t2">TextBox</text>
        <rect x="26" y="80" width="168" height="32" rx="3" fill="#fff" stroke="#abadb3" :stroke-width="1 + glow(t, 7, 15) * 2" :style="{ stroke: t >= 7 && t < 15 ? 'var(--c-danger)' : undefined }" />
        <text x="34" y="101" font-size="15" fill="#000" font-family="var(--font-sans)">{{ t >= 8 ? 'A' : '' }}</text>
        <rect v-if="t >= 7 && t < 15 && Math.floor(t * 2) % 2 === 0" :x="t >= 8 ? 46 : 34" y="87" width="1.5" height="18" fill="#000" />
        <!-- TextBlock -->
        <text x="26" y="212" class="svg-t2">TextBlock</text>
        <rect x="26" y="220" width="168" height="32" rx="3" fill="var(--bg-raised)" stroke="var(--line)" :stroke-width="1 + glow(t, 44.5, 48) * 2" :style="{ stroke: t >= 44.5 ? 'var(--c-data)' : undefined }" />
        <text x="34" y="241" font-size="13.5" fill="var(--ink)" font-family="var(--font-sans)">{{ t >= 45 ? 'こんにちは、A さん' : 'こんにちは、 さん' }}</text>
      </g>

      <!-- ViewModel -->
      <g :opacity="ramp(t, 1.5, 3)">
        <rect x="446" y="20" width="184" height="280" rx="12" fill="var(--c-ui-soft)" stroke="var(--c-ui)" />
        <text x="462" y="44" class="svg-t svg-b" :style="{ fill: 'var(--c-ui)' }">ViewModel</text>
        <rect x="462" y="124" width="152" height="54" rx="8" fill="var(--bg-raised)" stroke="var(--c-ui)" :stroke-width="1.5 + glow(t, 25.5, 31) * 2.5" />
        <text x="474" y="146" class="svg-mono svg-b">Name</text>
        <text x="474" y="166" class="svg-mono">= "{{ t >= 26 ? 'A' : '' }}"</text>
        <g :opacity="glow(t, 30, 38)">
          <text x="462" y="206" class="svg-mono" style="font-size: 11.5px">PropertyChanged</text>
          <text x="462" y="222" class="svg-mono" style="font-size: 11.5px">("Name")</text>
        </g>
      </g>

      <!-- Binding（上: ターゲット → ソース） -->
      <g :opacity="ramp(t, 3, 5)">
        <path d="M196 96H440" stroke="var(--line-strong)" stroke-width="1.5" fill="none" marker-end="url(#br-arrow)" />
        <text x="320" y="48" text-anchor="middle" class="svg-t2 svg-b">Binding（TextBox.Text ⇄ Name）</text>
        <g>
          <rect x="222" y="78" width="80" height="36" rx="18" fill="var(--bg-raised)" stroke="var(--c-warn)" :stroke-width="1.5 + glow(t, 17.5, 20.5) * 2.5" />
          <text x="262" y="101" text-anchor="middle" class="svg-t2 svg-b">検証</text>
          <rect x="328" y="78" width="100" height="36" rx="18" fill="var(--bg-raised)" stroke="var(--c-warn)" :stroke-width="1.5 + glow(t, 21.5, 23.5) * 2.5" />
          <text x="378" y="101" text-anchor="middle" class="svg-t2 svg-b">ConvertBack</text>
        </g>
        <!-- Binding（下: ソース → ターゲット） -->
        <path d="M444 236H200" stroke="var(--line-strong)" stroke-width="1.5" fill="none" marker-end="url(#br-arrow)" />
        <text x="320" y="282" text-anchor="middle" class="svg-t2 svg-b">Binding（Name → TextBlock.Text）</text>
        <rect x="328" y="218" width="100" height="36" rx="18" fill="var(--bg-raised)" stroke="var(--c-data)" :stroke-width="1.5 + glow(t, 37, 39.5) * 2.5" />
        <text x="378" y="241" text-anchor="middle" class="svg-t2 svg-b">Convert</text>
        <rect x="212" y="218" width="100" height="36" rx="18" fill="var(--bg-raised)" stroke="var(--c-data)" :stroke-width="1.5 + glow(t, 40.5, 43) * 2.5" />
        <text x="262" y="241" text-anchor="middle" class="svg-t2 svg-b">StringFormat</text>
      </g>

      <!-- 運ばれる値 -->
      <g v-if="t >= 8 && t < 46" :transform="`translate(${along(t, TOKEN).x} ${along(t, TOKEN).y - 26})`">
        <rect x="-15" y="-12" width="30" height="24" rx="6" :fill="t < 30 ? 'var(--c-danger)' : 'var(--c-data)'" />
        <text y="5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="var(--font-mono)">"A"</text>
      </g>
    </svg>
  </AnimationPlayer>
</template>
