<script setup lang="ts">
import AnimationPlayer, { type Cue } from '@/components/player/AnimationPlayer.vue'
import { easeInOut, ramp } from '@/lib/anim'

/**
 * アプリの起動から終了までをシーケンス図で 60 秒。
 * StartupUri を使う標準的な構成（App.xaml に StartupUri="MainWindow.xaml"）の場合の流れ。
 */
const cues: Cue[] = [
  { t: 0, title: '① Main() が呼ばれる', text: 'エントリーポイントの Main() は自分では書かない。App.xaml をビルドすると、[STAThread] 付きの Main() が App.g.cs に自動生成される。' },
  { t: 7, title: '② App を作り、App.xaml を読む', text: 'new App() で Application.Current が決まる。続く InitializeComponent() が App.xaml を読み、リソースと StartupUri を設定する。' },
  { t: 14, title: '③ Run() — メッセージループ開始', text: 'app.Run() が Dispatcher のメッセージループを開始する。Run() はアプリが終了するまで戻ってこない。' },
  { t: 21, title: '④ Startup イベント', text: 'ループが回り始めて最初に Startup イベントが発生する（OnStartup）。コマンドライン引数の処理や、例外ハンドラーの登録、DI の準備はここで行う。' },
  { t: 28, title: '⑤ メインウィンドウの生成', text: 'StartupUri に書かれたウィンドウが生成される。コンストラクターの InitializeComponent() が BAML を読み込み、要素の木を組み立てる。' },
  { t: 36, title: '⑥ 表示', text: 'ウィンドウが表示され、SourceInitialized → Activated → Loaded → ContentRendered の順にイベントが発生する。' },
  { t: 44, title: '⑦ 実行中', text: 'ここからはイベント駆動。入力、描画、BeginInvoke された処理が、Dispatcher のキューから 1 件ずつ取り出されて実行される。' },
  { t: 52, title: '⑧ 終了', text: '既定（OnLastWindowClose）では、最後のウィンドウが閉じると Exit イベントが発生し、Run() が戻って Main() が終わる。' },
]

const LANES = [
  { id: 'os', x: 78, label: 'OS / .NET', color: 'mute' },
  { id: 'app', x: 238, label: 'App', color: 'ui' },
  { id: 'disp', x: 400, label: 'Dispatcher', color: 'render' },
  { id: 'win', x: 562, label: 'MainWindow', color: 'data' },
] as const
type LaneId = (typeof LANES)[number]['id']
const X = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<LaneId, number>

interface Msg {
  t: number
  cue: number
  from: LaneId
  to: LaneId
  y: number
  label: string
}
const msgs: Msg[] = [
  { t: 1, cue: 0, from: 'os', to: 'app', y: 78, label: 'Main()  [STAThread]' },
  { t: 8, cue: 1, from: 'app', to: 'app', y: 108, label: 'new App() / InitializeComponent()' },
  { t: 15, cue: 2, from: 'app', to: 'disp', y: 146, label: 'Run()' },
  { t: 22, cue: 3, from: 'disp', to: 'app', y: 180, label: 'Startup → OnStartup()' },
  { t: 29, cue: 4, from: 'app', to: 'win', y: 214, label: 'new MainWindow()' },
  { t: 32, cue: 4, from: 'win', to: 'win', y: 240, label: 'InitializeComponent()' },
  { t: 37, cue: 5, from: 'win', to: 'win', y: 274, label: 'Show() → Loaded' },
  { t: 53, cue: 7, from: 'win', to: 'app', y: 336, label: '最後のウィンドウが閉じる' },
  { t: 56, cue: 7, from: 'app', to: 'os', y: 366, label: 'Exit → Run() が戻る' },
]

const prog = (t: number, m: Msg) => easeInOut(ramp(t, m.t, m.t + 1.6))
const endX = (t: number, m: Msg) => X[m.from] + (X[m.to] - X[m.from]) * prog(t, m)
const labelX = (m: Msg) => (m.from === m.to ? X[m.from] + 16 : (X[m.from] + X[m.to]) / 2)
</script>

<template>
  <AnimationPlayer :duration="60" :cues="cues" label="アプリの起動から終了まで" v-slot="{ t, cue }">
    <svg viewBox="0 0 640 392" role="img" aria-label="WPF アプリの起動シーケンス図">
      <defs>
        <marker id="ss-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="var(--accent)" />
        </marker>
        <marker id="ss-arrow-off" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="var(--ink-3)" />
        </marker>
      </defs>

      <!-- ライフライン -->
      <g v-for="l in LANES" :key="l.id">
        <line :x1="l.x" :x2="l.x" y1="44" y2="384" stroke="var(--line-strong)" stroke-dasharray="4 5" />
        <rect :x="l.x - 62" y="10" width="124" height="32" rx="8" :fill="`var(--c-${l.color}-soft)`" :stroke="`var(--c-${l.color})`" stroke-width="1.5" />
        <text :x="l.x" y="31" text-anchor="middle" class="svg-t svg-b">{{ l.label }}</text>
      </g>

      <!-- Dispatcher のループが回っている区間 -->
      <g v-if="t >= 16.6">
        <rect :x="X.disp - 7" y="146" width="14" :height="Math.min(220, (t - 16.6) * 26)" rx="3" fill="var(--c-render)" opacity="0.85" />
      </g>
      <!-- ⑦ 実行中のループ表示 -->
      <g v-if="t >= 44" :opacity="ramp(t, 44, 45)">
        <g :transform="`translate(${X.disp + 44} 304)`">
          <circle r="16" fill="none" stroke="var(--c-render)" stroke-width="2.5" stroke-dasharray="70 30" :transform="`rotate(${(t * 120) % 360})`" />
        </g>
        <text :x="X.disp + 68" y="300" class="svg-t2 svg-b" :style="{ fill: 'var(--c-render)' }">メッセージループ</text>
        <text :x="X.disp + 68" y="316" class="svg-t2">入力・描画・BeginInvoke</text>
      </g>

      <!-- メッセージ -->
      <g v-for="(m, i) in msgs" :key="i">
        <g v-if="t >= m.t" :style="{ color: cue === m.cue ? 'var(--accent)' : 'var(--ink-3)' }">
          <template v-if="m.from !== m.to">
            <line :x1="X[m.from]" :x2="endX(t, m)" :y1="m.y" :y2="m.y" stroke="currentColor" :stroke-width="cue === m.cue ? 2.5 : 1.5" :marker-end="prog(t, m) > 0.15 ? (cue === m.cue ? 'url(#ss-arrow-on)' : 'url(#ss-arrow-off)') : undefined" />
          </template>
          <template v-else>
            <path :d="`M${X[m.from]} ${m.y - 8}h12v14h-10`" fill="none" stroke="currentColor" :stroke-width="cue === m.cue ? 2.5 : 1.5" :marker-end="cue === m.cue ? 'url(#ss-arrow-on)' : 'url(#ss-arrow-off)'" :opacity="prog(t, m)" />
          </template>
          <text
            :x="labelX(m)"
            :y="m.from === m.to ? m.y + 4 : m.y - 7"
            :text-anchor="m.from === m.to ? (X[m.from] > 500 ? 'end' : 'start') : 'middle'"
            :dx="m.from === m.to && X[m.from] > 500 ? -30 : 0"
            class="svg-mono"
            :class="{ 'svg-b': cue === m.cue }"
            :opacity="ramp(t, m.t + 0.3, m.t + 1.2)"
            style="font-size: 12px"
          >
            {{ m.label }}
          </text>
        </g>
      </g>
    </svg>
  </AnimationPlayer>
</template>
