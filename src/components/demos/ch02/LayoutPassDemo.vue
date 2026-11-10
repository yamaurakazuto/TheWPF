<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import UiIcon from '@/components/content/UiIcon.vue'
import CodeBlock from '@/components/content/CodeBlock.vue'

/**
 * レイアウトパス（Measure → Arrange → Render）のステップ実行デモ。
 * 300×200 のウィンドウに縦の StackPanel を置いた例で、渡される大きさと返る大きさを 1 手ずつ見せる。
 */
const XAML = `<StackPanel>                       <!-- 親（Window）から 300×200 をもらう -->
    <TextBlock Text="お名前" />
    <Button Content="OK" Width="120" HorizontalAlignment="Left" />
    <Border Height="40" Background="#DDD" />
</StackPanel>`

type Phase = 'idle' | 'measure' | 'arrange' | 'render'
interface Step {
  phase: Phase
  title: string
  text: string
  /** 強調する要素 */
  focus: ('stack' | 'text' | 'button' | 'border')[]
  /** 方向: 親→子 / 子→親 */
  dir?: 'down' | 'up'
}

const steps: Step[] = [
  { phase: 'idle', title: 'レイアウト前', text: 'まだどの要素も大きさと位置が決まっていない（以下の数値は説明用の例）。親から順に「測定（Measure）」が始まる。', focus: [] },
  { phase: 'measure', dir: 'down', title: 'Measure ①  Window → StackPanel', text: 'StackPanel.Measure(300×200) が呼ばれる。引数は「使ってよい大きさ（availableSize）」。', focus: ['stack'] },
  { phase: 'measure', dir: 'down', title: 'Measure ②  StackPanel → TextBlock', text: '縦に積む StackPanel は、子に「幅は 300 まで、高さはいくらでも（∞）」と伝える。TextBlock は文字の大きさから 36×16 が欲しいと答える（DesiredSize）。', focus: ['text'] },
  { phase: 'measure', dir: 'down', title: 'Measure ③  StackPanel → Button', text: 'Button は Width="120" と中身の高さから、120×22 が欲しいと答える。', focus: ['button'] },
  { phase: 'measure', dir: 'down', title: 'Measure ④  StackPanel → Border', text: 'Border は中身がなく Height="40" だけなので、0×40 と答える。幅は「いらない」と言っているだけで、あとで親が決める。', focus: ['border'] },
  { phase: 'measure', dir: 'up', title: 'Measure ⑤  StackPanel が自分の希望を返す', text: '子の希望を集計する。幅は最大値の 120、高さは合計の 16 + 22 + 40 = 78。StackPanel の DesiredSize は 120×78。', focus: ['stack'] },
  { phase: 'arrange', dir: 'down', title: 'Arrange ①  Window → StackPanel', text: '次は配置。StackPanel.Arrange(0, 0, 300, 200) が呼ばれる。希望は 120×78 だったが、既定の配置が Stretch なので 300×200 全体をもらう。', focus: ['stack'] },
  { phase: 'arrange', dir: 'down', title: 'Arrange ②  StackPanel → 子', text: '各子に「枠」を渡す。幅は 300、高さはそれぞれの希望どおり。TextBlock と Border は Stretch なので幅 300 に、Button は Width=120・左寄せなので枠の左側 120 だけを使う。', focus: ['text', 'button', 'border'] },
  { phase: 'render', title: 'Render', text: '位置と大きさが決まったので、各要素が描画命令を記録する（OnRender）。この内容がレンダースレッドへ送られて画面に出る。', focus: ['stack', 'text', 'button', 'border'] },
]

const i = ref(0)
const s = computed(() => steps[i.value])
const playing = ref(false)
let timer = 0
function stop() {
  playing.value = false
  clearInterval(timer)
}
function next() {
  if (i.value < steps.length - 1) i.value++
  else stop()
}
function prev() {
  stop()
  if (i.value > 0) i.value--
}
function play() {
  if (i.value >= steps.length - 1) i.value = 0
  playing.value = true
  timer = window.setInterval(next, 2600)
}
onBeforeUnmount(stop)

// 図の座標（1 DIP = 1 単位。原点は StackPanel の左上）
const OX = 30
const OY = 46
const measured = (n: number) => i.value >= n // そのステップ以降で DesiredSize が出ている
const arranged = computed(() => i.value >= 7)
const rendered = computed(() => i.value >= 8)
const isFocus = (k: Step['focus'][number]) => s.value.focus.includes(k)
const PHASE: Record<Phase, { label: string; color: string }> = {
  idle: { label: '開始前', color: 'mute' },
  measure: { label: 'Measure（測定）', color: 'ui' },
  arrange: { label: 'Arrange（配置）', color: 'render' },
  render: { label: 'Render（描画）', color: 'data' },
}
</script>

<template>
  <div class="lp">
    <CodeBlock :code="XAML" lang="xaml" />

    <ol class="lp__phases" aria-label="レイアウトの段階">
      <li v-for="p in ['measure', 'arrange', 'render'] as const" :key="p" :class="{ 'is-on': s.phase === p }" :style="{ '--pc': `var(--c-${PHASE[p].color})`, '--pcs': `var(--c-${PHASE[p].color}-soft)` }">
        {{ PHASE[p].label }}
      </li>
    </ol>

    <div class="lp__grid">
      <svg viewBox="0 0 360 270" role="img" :aria-label="`レイアウトの様子: ${s.title}`">
        <text :x="OX" y="22" class="svg-t2">Window のクライアント領域 300 × 200</text>
        <text :x="OX" y="38" class="svg-t2 svg-b" :style="{ fill: `var(--c-${PHASE[s.phase].color})` }">
          {{ s.dir === 'down' ? '▼ 親 → 子：大きさを渡す' : s.dir === 'up' ? '▲ 子 → 親：希望を返す' : '' }}
        </text>

        <!-- StackPanel に与えられる領域 -->
        <rect :x="OX" :y="OY" width="300" height="200" rx="2" :fill="arranged ? 'var(--c-ui-soft)' : 'none'" :opacity="arranged ? 0.5 : 1" stroke="var(--line-strong)" :stroke-dasharray="i >= 6 ? '0' : '5 5'" :stroke-width="isFocus('stack') ? 3 : 1.5" :style="{ stroke: isFocus('stack') ? `var(--c-${PHASE[s.phase].color})` : undefined }" />
        <text v-if="i >= 1 && i < 5" :x="OX + 296" :y="OY + 194" text-anchor="end" class="svg-t2">available 300×200</text>

        <!-- StackPanel の DesiredSize -->
        <g v-if="i === 5">
          <rect :x="OX" :y="OY" width="120" height="78" fill="none" stroke="var(--c-ui)" stroke-width="2.5" />
          <text :x="OX + 126" :y="OY + 70" class="svg-t2 svg-b" :style="{ fill: 'var(--c-ui)' }">DesiredSize 120×78</text>
        </g>

        <!-- TextBlock -->
        <g v-if="measured(2)">
          <rect v-if="arranged" :x="OX" :y="OY" width="300" height="16" fill="none" stroke="var(--c-render)" stroke-dasharray="3 3" />
          <rect :x="OX" :y="OY" :width="arranged ? 300 : 36" height="16" :fill="rendered ? 'var(--bg-raised)' : 'var(--c-ui-soft)'" :stroke="isFocus('text') ? `var(--c-${PHASE[s.phase].color})` : 'var(--c-ui)'" :stroke-width="isFocus('text') ? 2.5 : 1" />
          <text v-if="rendered" :x="OX + 2" :y="OY + 12.5" font-size="12" fill="var(--ink)">お名前</text>
          <text v-if="i === 2" :x="OX + 44" :y="OY + 13" class="svg-t2 svg-b">36×16</text>
        </g>
        <!-- Button -->
        <g v-if="measured(3)">
          <rect v-if="arranged" :x="OX" :y="OY + 16" width="300" height="22" fill="none" stroke="var(--c-render)" stroke-dasharray="3 3" />
          <rect :x="OX" :y="OY + 16" width="120" height="22" :fill="rendered ? 'var(--bg-sunken)' : 'var(--c-ui-soft)'" :stroke="isFocus('button') ? `var(--c-${PHASE[s.phase].color})` : 'var(--c-ui)'" :stroke-width="isFocus('button') ? 2.5 : 1" />
          <text v-if="rendered" :x="OX + 60" :y="OY + 31.5" text-anchor="middle" font-size="12" fill="var(--ink)">OK</text>
          <text v-if="i === 3" :x="OX + 128" :y="OY + 32" class="svg-t2 svg-b">120×22</text>
          <text v-if="i === 7" :x="OX + 128" :y="OY + 32" class="svg-t2">枠は 300、使うのは 120</text>
        </g>
        <!-- Border -->
        <g v-if="measured(4)">
          <rect :x="OX" :y="OY + 38" :width="arranged ? 300 : 3" height="40" :fill="rendered ? 'var(--c-mute)' : 'var(--c-ui-soft)'" :opacity="rendered ? 0.45 : 1" :stroke="isFocus('border') ? `var(--c-${PHASE[s.phase].color})` : 'var(--c-ui)'" :stroke-width="isFocus('border') ? 2.5 : 1" />
          <text v-if="i === 4" :x="OX + 12" :y="OY + 63" class="svg-t2 svg-b">0×40（幅は希望なし）</text>
        </g>

        <!-- 無限大の高さを示す矢印（Measure ②〜④） -->
        <g v-if="i >= 2 && i <= 4" stroke="var(--c-ui)" fill="none" stroke-width="1.5">
          <path :d="`M${OX + 316} ${OY + 4}V${OY + 196}`" stroke-dasharray="4 4" />
          <path :d="`M${OX + 311} ${OY + 188}l5 9 5-9`" />
        </g>
        <text v-if="i >= 2 && i <= 4" :x="OX + 316" :y="OY - 6" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: 'var(--c-ui)' }">高さ ∞</text>
      </svg>

      <div class="lp__info" aria-live="polite">
        <p class="lp__step">ステップ {{ i + 1 }} / {{ steps.length }}</p>
        <h4 :style="{ color: `var(--c-${PHASE[s.phase].color})` }">{{ s.title }}</h4>
        <p>{{ s.text }}</p>
        <div class="controls">
          <button class="btn btn--sm" type="button" :disabled="i === 0" @click="prev"><UiIcon name="left" :size="14" /> 戻る</button>
          <button class="btn btn--sm btn--primary" type="button" :disabled="i === steps.length - 1" @click="(stop(), next())">次へ <UiIcon name="right" :size="14" /></button>
          <button class="btn btn--sm" type="button" @click="playing ? stop() : play()">
            <UiIcon :name="playing ? 'pause' : 'play'" :size="14" /> {{ playing ? '停止' : '自動再生' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp {
  display: grid;
  gap: var(--sp-3);
  container-type: inline-size;
}
.lp__phases {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.lp__phases li {
  flex: 1 1 120px;
  text-align: center;
  padding: 5px 8px;
  border-radius: var(--radius-s);
  border: 1.5px solid var(--line);
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--ink-3);
}
.lp__phases li.is-on {
  border-color: var(--pc);
  background: var(--pcs);
  color: var(--pc);
}
.lp__grid {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: minmax(0, 1fr);
}
@container (min-width: 680px) {
  .lp__grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: start;
  }
}
.lp__grid > svg {
  width: 100%;
  height: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg);
}
.lp__info {
  display: grid;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
  line-height: 1.75;
}
.lp__info > p:nth-of-type(2) {
  min-height: 7em;
}
.lp__step {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.lp__info h4 {
  font-size: var(--fs-md);
}
</style>
