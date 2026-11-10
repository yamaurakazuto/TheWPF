<script setup lang="ts">
import { ref } from 'vue'

/** スレッドアフィニティの図。別スレッドから UI に触る 3 通りの結果を見せる */
const ROUTES = [
  { id: 'direct', label: '直接さわる', ok: false, desc: 'ワーカースレッドから textBlock.Text = "…" と直接書くと、InvalidOperationException（「呼び出しスレッドは、異なるスレッドがこのオブジェクトを所有しているため、このオブジェクトにアクセスできません」）になる。DispatcherObject は、生まれたスレッド以外からのアクセスを拒否する。' },
  { id: 'dispatch', label: 'Dispatcher に頼む', ok: true, desc: 'Dispatcher.InvokeAsync(() => textBlock.Text = "…") と書くと、処理が UI スレッドのキューに積まれ、UI スレッドが自分の番で実行する。ワーカースレッドは UI に直接触っていないので問題ない。await のあとに自動で UI スレッドへ戻るのも、内部ではこの仕組みを使っている。' },
  { id: 'frozen', label: '凍結して渡す', ok: true, desc: 'ブラシや画像などの Freezable は、Freeze() で変更不可にするとスレッドに縛られなくなる。ワーカースレッドで作って凍結した画像を、UI スレッドの Image.Source にそのまま設定できる。' },
] as const
const active = ref<(typeof ROUTES)[number]['id']>('direct')
const cur = () => ROUTES.find((r) => r.id === active.value)!
</script>

<template>
  <div class="ta">
    <div class="seg" role="group" aria-label="UI への触れ方">
      <button v-for="r in ROUTES" :key="r.id" type="button" :aria-pressed="active === r.id" @click="active = r.id">{{ r.label }}</button>
    </div>

    <svg viewBox="0 0 640 250" role="img" :aria-label="`ワーカースレッドから UI に ${cur().label}: ${cur().ok ? '成功' : '例外'}`">
      <defs>
        <marker id="ta-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--c-data)" /></marker>
        <marker id="ta-ng" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--c-danger)" /></marker>
      </defs>

      <!-- UI スレッド -->
      <rect x="10" y="14" width="300" height="222" rx="12" fill="var(--c-ui-soft)" stroke="var(--c-ui)" />
      <text x="26" y="40" class="svg-t svg-b" :style="{ fill: 'var(--c-ui)' }">UI スレッド（STA）</text>
      <rect x="28" y="56" width="118" height="44" rx="8" fill="var(--bg-raised)" stroke="var(--c-ui)" :stroke-width="active === 'dispatch' ? 3 : 1.5" />
      <text x="87" y="76" text-anchor="middle" class="svg-t2 svg-b">Dispatcher</text>
      <text x="87" y="92" text-anchor="middle" class="svg-t2" style="font-size: 11px">作業キュー</text>
      <rect x="174" y="56" width="118" height="44" rx="8" fill="var(--bg-raised)" stroke="var(--c-ui)" :stroke-width="active === 'direct' ? 3 : 1.5" />
      <text x="233" y="76" text-anchor="middle" class="svg-mono svg-b">TextBlock</text>
      <text x="233" y="92" text-anchor="middle" class="svg-t2" style="font-size: 11px">DispatcherObject</text>
      <rect x="174" y="156" width="118" height="44" rx="8" fill="var(--bg-raised)" stroke="var(--c-ui)" :stroke-width="active === 'frozen' ? 3 : 1.5" />
      <text x="233" y="176" text-anchor="middle" class="svg-mono svg-b">Image.Source</text>
      <text x="233" y="192" text-anchor="middle" class="svg-t2" style="font-size: 11px">凍結済みの画像を参照</text>
      <path v-if="active === 'dispatch'" d="M148 78H170" stroke="var(--c-data)" stroke-width="2.5" marker-end="url(#ta-ok)" />
      <text x="26" y="222" class="svg-t2">UI 要素は、作られたスレッドに所属する</text>

      <!-- ワーカースレッド -->
      <rect x="400" y="14" width="230" height="222" rx="12" fill="var(--c-render-soft)" stroke="var(--c-render)" />
      <text x="416" y="40" class="svg-t svg-b" :style="{ fill: 'var(--c-render)' }">ワーカースレッド</text>
      <rect x="420" y="84" width="190" height="44" rx="8" fill="var(--bg-raised)" stroke="var(--c-render)" stroke-width="1.5" />
      <text x="515" y="104" text-anchor="middle" class="svg-t2 svg-b">Task.Run(() =&gt; …)</text>
      <text x="515" y="120" text-anchor="middle" class="svg-t2" style="font-size: 11px">重い処理</text>
      <g v-if="active === 'frozen'">
        <rect x="420" y="156" width="190" height="44" rx="8" fill="var(--c-data-soft)" stroke="var(--c-data)" stroke-width="2" />
        <text x="515" y="176" text-anchor="middle" class="svg-mono svg-b">BitmapImage</text>
        <text x="515" y="192" text-anchor="middle" class="svg-t2" style="font-size: 11px">Freeze() 済み = 変更不可</text>
      </g>

      <!-- 経路 -->
      <g v-if="active === 'direct'">
        <path d="M418 98C370 98 340 80 296 79" fill="none" stroke="var(--c-danger)" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#ta-ng)" />
        <g transform="translate(355 86)">
          <circle r="15" fill="var(--bg-raised)" stroke="var(--c-danger)" stroke-width="2.5" />
          <path d="M-6 -6L6 6M6 -6L-6 6" stroke="var(--c-danger)" stroke-width="3" stroke-linecap="round" />
        </g>
        <text x="355" y="128" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: 'var(--c-danger)' }">例外</text>
      </g>
      <g v-else-if="active === 'dispatch'">
        <path d="M418 110C330 150 200 140 96 104" fill="none" stroke="var(--c-data)" stroke-width="2.5" marker-end="url(#ta-ok)" />
        <text x="270" y="158" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: 'var(--c-data)' }">InvokeAsync（依頼を積む）</text>
      </g>
      <g v-else>
        <path d="M418 178H296" fill="none" stroke="var(--c-data)" stroke-width="2.5" marker-end="url(#ta-ok)" />
        <text x="356" y="170" text-anchor="middle" class="svg-t2 svg-b" :style="{ fill: 'var(--c-data)' }">共有できる</text>
      </g>
    </svg>

    <p class="ta__desc" :class="cur().ok ? 'is-ok' : 'is-ng'" aria-live="polite">
      <b>{{ cur().ok ? '✓ 動く' : '✗ 例外になる' }}: {{ cur().label }}</b>
      {{ cur().desc }}
    </p>
  </div>
</template>

<style scoped>
.ta {
  display: grid;
  gap: var(--sp-3);
}
.ta > svg {
  width: 100%;
  height: auto;
  max-width: 680px;
  justify-self: center;
}
.ta__desc {
  min-height: 6.2em;
  padding: 10px 14px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  border-left: 4px solid var(--c-data);
  background: var(--bg);
  font-size: var(--fs-sm);
  line-height: 1.75;
}
.ta__desc.is-ng {
  border-left-color: var(--c-danger);
}
.ta__desc b {
  display: block;
}
.ta__desc.is-ok b {
  color: var(--c-data);
}
.ta__desc.is-ng b {
  color: var(--c-danger);
}
</style>
