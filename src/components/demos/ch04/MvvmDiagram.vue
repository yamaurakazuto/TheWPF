<script setup lang="ts">
import { ref } from 'vue'

/** MVVM の 3 つの層と、その間を流れるもの。箱や矢印を選ぶと説明が出る */
interface Part {
  id: string
  kind: 'box' | 'arrow'
  title: string
  desc: string
}
const parts: Part[] = [
  { id: 'view', kind: 'box', title: 'View', desc: 'XAML とコードビハインド。見た目とレイアウトを担当する。ViewModel のことは DataContext を通じて知っているが、型に強く依存しないのが理想（バインディングは名前で結び付くだけ）。' },
  { id: 'vm', kind: 'box', title: 'ViewModel', desc: '画面の状態（プロパティ）と操作（コマンド）を公開するクラス。View の型も、Button や TextBox の存在も知らない。だから画面なしで単体テストできる。' },
  { id: 'model', kind: 'box', title: 'Model / Services', desc: '業務データ、業務ルール、データアクセス、外部 API 呼び出し。UI のことは一切知らない。ほかの UI（Web、コンソール）からもそのまま使える。' },
  { id: 'bind', kind: 'arrow', title: 'データバインディング / コマンド', desc: 'View から ViewModel へ。TextBox の入力はバインディングでプロパティへ書き込まれ、Button のクリックは Command の Execute を呼ぶ。イベントハンドラーを書く必要がない。' },
  { id: 'notify', kind: 'arrow', title: '変更通知', desc: 'ViewModel から View へ。ViewModel は「Name が変わった」とイベントで知らせるだけで、誰が聞いているかは知らない。聞いているのはバインディング。' },
  { id: 'call', kind: 'arrow', title: 'メソッド呼び出し', desc: 'ViewModel は、コンストラクターで受け取ったサービス（インターフェイス）のメソッドを呼ぶ。実装を直接 new しないので、テストでは偽物に差し替えられる。' },
  { id: 'result', kind: 'arrow', title: '結果・イベント', desc: 'Model やサービスは、戻り値やイベントで結果を返す。ViewModel はそれを画面向けの形に整えてプロパティに入れる。' },
]
const active = ref('vm')
const cur = () => parts.find((p) => p.id === active.value)!
const on = (id: string) => active.value === id
const pick = (id: string) => (active.value = id)
</script>

<template>
  <div class="mv">
    <svg viewBox="0 0 640 250" role="group" aria-label="MVVM の構成図">
      <defs>
        <marker id="mv-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="var(--ink-2)" />
        </marker>
        <marker id="mv-a-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="var(--accent)" />
        </marker>
      </defs>

      <!-- 箱 -->
      <g v-for="b in [
          { id: 'view', x: 10, color: 'render', sub1: 'XAML', sub2: 'コードビハインド' },
          { id: 'vm', x: 240, color: 'ui', sub1: 'プロパティ', sub2: 'コマンド' },
          { id: 'model', x: 470, color: 'data', sub1: 'データ・業務ルール', sub2: 'サービス' },
        ]" :key="b.id" class="mv__hit" role="button" tabindex="0" :aria-pressed="on(b.id)" :aria-label="parts.find((p) => p.id === b.id)!.title" @click="pick(b.id)" @mouseenter="pick(b.id)" @focus="pick(b.id)">
        <rect :x="b.x" y="50" width="160" height="120" rx="12" :fill="`var(--c-${b.color}-soft)`" :stroke="`var(--c-${b.color})`" :stroke-width="on(b.id) ? 3.5 : 1.5" />
        <text :x="b.x + 80" y="92" text-anchor="middle" class="svg-t svg-b" style="font-size: 17px">{{ parts.find((p) => p.id === b.id)!.title }}</text>
        <text :x="b.x + 80" y="120" text-anchor="middle" class="svg-t2">{{ b.sub1 }}</text>
        <text :x="b.x + 80" y="140" text-anchor="middle" class="svg-t2">{{ b.sub2 }}</text>
      </g>

      <!-- 矢印 -->
      <g v-for="ar in [
          { id: 'bind', d: 'M174 86H236', lx: 205, ly: 36, l1: 'バインディング', l2: 'コマンド', dash: false },
          { id: 'notify', d: 'M236 134H174', lx: 205, ly: 196, l1: '変更通知', l2: '', dash: true },
          { id: 'call', d: 'M404 86H466', lx: 435, ly: 36, l1: '呼び出し', l2: '', dash: false },
          { id: 'result', d: 'M466 134H404', lx: 435, ly: 196, l1: '結果・イベント', l2: '', dash: true },
        ]" :key="ar.id" class="mv__hit" role="button" tabindex="0" :aria-pressed="on(ar.id)" :aria-label="parts.find((p) => p.id === ar.id)!.title" @click="pick(ar.id)" @mouseenter="pick(ar.id)" @focus="pick(ar.id)">
        <rect :x="ar.lx - 60" :y="ar.ly - 18" width="120" :height="ar.l2 ? 44 : 28" fill="transparent" />
        <path :d="ar.d" fill="none" :stroke="on(ar.id) ? 'var(--accent)' : 'var(--ink-2)'" :stroke-width="on(ar.id) ? 3.5 : 2" :stroke-dasharray="ar.dash ? '6 4' : undefined" :marker-end="on(ar.id) ? 'url(#mv-a-on)' : 'url(#mv-a)'" />
        <path :d="ar.d" stroke="transparent" stroke-width="26" fill="none" />
        <text :x="ar.lx" :y="ar.ly" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: on(ar.id) ? 'var(--accent)' : undefined }">{{ ar.l1 }}</text>
        <text v-if="ar.l2" :x="ar.lx" :y="ar.ly + 16" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: on(ar.id) ? 'var(--accent)' : undefined }">{{ ar.l2 }}</text>
      </g>

      <!-- 「知っている」方向 -->
      <text x="320" y="236" text-anchor="middle" class="svg-t2">依存の向き: View → ViewModel → Model（右側は左側を知らない）</text>
    </svg>
    <p class="mv__desc" aria-live="polite">
      <b>{{ cur().title }}</b>
      {{ cur().desc }}
    </p>
  </div>
</template>

<style scoped>
.mv {
  display: grid;
  gap: var(--sp-2);
}
.mv > svg {
  width: 100%;
  height: auto;
  max-width: 680px;
  justify-self: center;
}
.mv__hit {
  cursor: pointer;
  outline: none;
}
.mv__hit:focus-visible > rect:first-child,
.mv__hit:focus-visible > path:first-of-type {
  stroke: var(--focus);
}
.mv__desc {
  min-height: 5.4em;
  padding: 10px 14px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  background: var(--bg);
  font-size: var(--fs-sm);
  line-height: 1.75;
}
.mv__desc b {
  display: block;
  color: var(--accent);
}
</style>
