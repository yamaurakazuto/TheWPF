<script setup lang="ts">
import { computed, reactive } from 'vue'
import UiIcon from '@/components/content/UiIcon.vue'

/**
 * 依存関係プロパティの「値の優先順位」を手で確かめるデモ。
 * 値の供給元を ON / OFF すると、いちばん上にある有効な供給元の値が採用される。
 * 並び順は Microsoft Learn「依存関係プロパティ値の優先順位」に従う。
 */
interface Source {
  id: string
  rank: number
  name: string
  example: string
  /** プレビューに使う色。null は「このデモでは切り替えない」行 */
  color: string | null
  colorName?: string
  fixed?: string
}

const sources: Source[] = [
  { id: 'coerce', rank: 1, name: 'プロパティシステムによる強制', example: 'CoerceValueCallback。Slider.Value を Minimum〜Maximum に収める、など', color: null, fixed: '最後に値を補正する仕組み。供給元というより「仕上げ」' },
  { id: 'anim', rank: 2, name: 'アクティブなアニメーション', example: '<ColorAnimation To="Orange" …/> が再生中、または終了後に値を保持中', color: '#e8590c', colorName: 'オレンジ' },
  { id: 'local', rank: 3, name: 'ローカル値', example: '<Button Foreground="Red"/> や SetValue()。バインディングやリソース参照もここ', color: '#e03131', colorName: '赤' },
  { id: 'tparent', rank: 4, name: 'テンプレートが内部の要素に設定した値', example: 'ControlTemplate の中の要素に書かれた属性やトリガー（テンプレート内部の要素から見た場合）', color: null, fixed: 'テンプレートの「中の要素」にだけ関係する' },
  { id: 'implicit', rank: 5, name: '暗黙スタイル', example: 'x:Key のない Style。この順位は Style プロパティ自身にだけ適用される', color: null, fixed: 'Style プロパティ専用の順位' },
  { id: 'strigger', rank: 6, name: 'スタイルのトリガー', example: '<Style.Triggers><Trigger Property="IsMouseOver" Value="True">…', color: '#1971c2', colorName: '青' },
  { id: 'ttrigger', rank: 7, name: 'テンプレートのトリガー', example: '<ControlTemplate.Triggers>… でコントロール自身に設定する値', color: '#0c8599', colorName: '青緑' },
  { id: 'setter', rank: 8, name: 'スタイルの Setter', example: '<Style><Setter Property="Foreground" Value="Green"/>', color: '#2f9e44', colorName: '緑' },
  { id: 'theme', rank: 9, name: '既定（テーマ）スタイル', example: 'コントロールに最初から付いている見た目。Themes/Generic.xaml や OS テーマ', color: '#6741d9', colorName: '紫' },
  { id: 'inherit', rank: 10, name: 'プロパティ値の継承', example: '親要素に設定された値を引き継ぐ（Foreground、FontSize、DataContext など一部のプロパティ）', color: '#c2255c', colorName: 'ピンク' },
  { id: 'default', rank: 11, name: 'メタデータの既定値', example: 'プロパティ登録時に PropertyMetadata で指定した値', color: '#495057', colorName: '灰' },
]

const on = reactive<Record<string, boolean>>({
  anim: false,
  local: false,
  strigger: false,
  ttrigger: false,
  setter: true,
  theme: true,
  inherit: true,
  default: true,
})

const winner = computed(() => sources.find((s) => s.color && on[s.id])!)

const PRESETS = [
  { label: 'スタイルだけ', set: { setter: true } },
  { label: 'スタイル + ホバー中のトリガー', set: { setter: true, strigger: true } },
  { label: 'ローカル値を書くとトリガーが効かない', set: { setter: true, strigger: true, local: true } },
  { label: 'アニメーション中', set: { setter: true, local: true, anim: true } },
] as const

function apply(set: Record<string, boolean>) {
  for (const k of ['anim', 'local', 'strigger', 'ttrigger', 'setter']) on[k] = !!set[k]
  on.theme = true
  on.inherit = true
}
</script>

<template>
  <div class="dpp">
    <div class="dpp__preview" aria-live="polite">
      <div class="dpp__sample">
        <span class="dpp__text" :style="{ color: winner.color! }">Foreground</span>
        <span class="dpp__swatch" :style="{ background: winner.color! }" />
      </div>
      <p>
        いま有効な値: <b :style="{ color: winner.color! }">{{ winner.colorName }}</b>
        <br />
        供給元: <b>{{ winner.rank }}. {{ winner.name }}</b>
      </p>
    </div>

    <div class="controls">
      <span class="small muted">例を試す:</span>
      <button v-for="p in PRESETS" :key="p.label" class="btn btn--sm" type="button" @click="apply(p.set)">{{ p.label }}</button>
    </div>

    <ol class="dpp__list">
      <li v-for="s in sources" :key="s.id" class="dpp__row" :class="{ 'is-winner': s.id === winner.id, 'is-off': s.color && !on[s.id], 'is-fixed': !s.color }">
        <span class="dpp__rank" aria-hidden="true">{{ s.rank }}</span>
        <label v-if="s.color && s.id !== 'default'" class="dpp__label">
          <input v-model="on[s.id]" type="checkbox" />
          <span class="dpp__dot" :style="{ background: s.color }" aria-hidden="true" />
          <span class="dpp__name">{{ s.name }}</span>
          <span class="dpp__val">→ {{ s.colorName }}</span>
        </label>
        <span v-else class="dpp__label">
          <span v-if="s.color" class="dpp__dot" :style="{ background: s.color }" aria-hidden="true" />
          <span class="dpp__name">{{ s.name }}</span>
          <span v-if="s.color" class="dpp__val">→ {{ s.colorName }}（常にある）</span>
          <span v-else class="dpp__val">{{ s.fixed }}</span>
        </span>
        <span class="dpp__ex">{{ s.example }}</span>
        <span v-if="s.id === winner.id" class="dpp__win"><UiIcon name="check" :size="14" /> 採用</span>
      </li>
    </ol>
    <p class="small muted">上にあるものほど強い。チェックを入れた供給元のうち、いちばん上のものが「いま有効な値」になる。</p>
  </div>
</template>

<style scoped>
.dpp {
  display: grid;
  gap: var(--sp-3);
}
.dpp__preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3) var(--sp-5);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  background: #fff;
  color: #17171f;
  font-size: var(--fs-sm);
  line-height: 1.7;
}
.dpp__sample {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dpp__text {
  font-size: 1.7rem;
  font-weight: 800;
  font-family: var(--font-mono);
  transition: color 0.2s;
}
.dpp__swatch {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  transition: background 0.2s;
}
.dpp__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}
.dpp__row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 0 10px;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
  background: var(--bg);
}
.dpp__rank {
  grid-row: span 2;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--bg-sunken);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  font-weight: 700;
}
.dpp__label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  font-size: var(--fs-sm);
  min-width: 0;
}
label.dpp__label {
  cursor: pointer;
}
.dpp__label input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}
.dpp__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: none;
  border: 1px solid rgb(255 255 255 / 0.5);
}
.dpp__name {
  font-weight: 700;
}
.dpp__val {
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.dpp__ex {
  grid-column: 2 / -1;
  font-size: var(--fs-xs);
  color: var(--ink-3);
  line-height: 1.55;
}
.dpp__win {
  grid-column: 3;
  grid-row: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--c-data);
}
.dpp__row.is-winner {
  border-color: var(--c-data);
  background: var(--c-data-soft);
  box-shadow: inset 4px 0 0 var(--c-data);
}
.dpp__row.is-winner .dpp__rank {
  background: var(--c-data);
  color: var(--bg-raised);
}
.dpp__row.is-off .dpp__name,
.dpp__row.is-off .dpp__ex {
  opacity: 0.55;
}
.dpp__row.is-fixed {
  border-style: dashed;
}
</style>
