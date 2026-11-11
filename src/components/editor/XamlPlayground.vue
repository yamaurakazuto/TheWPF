<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { xamlSamples } from '@/content/xamlSamples'
import CodeEditor from './CodeEditor.vue'
import XamlPreview from './XamlPreview.vue'
import UiIcon from '@/components/content/UiIcon.vue'

/** 自由に XAML を書いて簡易プレビューで確かめる場所。内容はこのブラウザに保存される */
const KEY = 'thewpf:playground:v1'
const route = useRoute()

function initial(): { id: string; code: string } {
  const fromQuery = xamlSamples.find((s) => s.id === route.query.sample)
  if (fromQuery) return { id: fromQuery.id, code: fromQuery.xaml }
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return { id: '', code: saved }
  } catch {
    /* 保存領域が使えなければサンプルから始める */
  }
  return { id: xamlSamples[0].id, code: xamlSamples[0].xaml }
}

const init = initial()
const sampleId = ref(init.id)
const code = ref(init.code)
const range = ref<{ from: number; to: number } | null>(null)

function load(id: string) {
  const s = xamlSamples.find((x) => x.id === id)
  if (s) code.value = s.xaml
}

let timer = 0
watch(code, (v) => {
  clearTimeout(timer)
  timer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, v)
    } catch {
      /* 保存できなくても編集は続けられる */
    }
  }, 400)
})
</script>

<template>
  <div class="pg">
    <div class="controls">
      <label class="field pg__sample">
        サンプルを読み込む
        <select v-model="sampleId" class="input" @change="load(sampleId)">
          <option value="" disabled>（編集中の内容）</option>
          <option v-for="s in xamlSamples" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </label>
      <p class="pg__range" aria-live="polite">
        <template v-if="range"><UiIcon name="hand" :size="14" /> 選択中の要素: {{ range.from }}{{ range.to !== range.from ? `〜${range.to}` : '' }} 行目</template>
        <template v-else>プレビューの要素にカーソルを合わせると、対応する行番号が出ます</template>
      </p>
    </div>
    <div class="pg__grid">
      <CodeEditor v-model="code" lang="xaml" label="XAML エディター" min-height="320px" max-height="560px" />
      <XamlPreview :source="code" @hover="range = $event" />
    </div>
    <details class="pg__support">
      <summary>プレビューが対応している要素・プロパティ</summary>
      <p>
        <b>レイアウト:</b> Grid（Row/ColumnDefinitions、Span、.NET 10 の短縮記法）、StackPanel、DockPanel、WrapPanel、Canvas、UniformGrid、Border、ScrollViewer、GroupBox、Expander、TabControl<br />
        <b>コントロール:</b> TextBlock（Run / LineBreak / Bold など）、Label、Button、TextBox、PasswordBox、CheckBox、RadioButton、ComboBox、ListBox、Slider、ProgressBar、Menu、StatusBar、Rectangle、Ellipse、Separator、Image（枠のみ）<br />
        <b>共通プロパティ:</b> Width / Height / Min / Max、Margin、Padding、Horizontal / VerticalAlignment、Background、Foreground、BorderBrush、BorderThickness、CornerRadius、FontSize、FontWeight、Opacity、Visibility、ToolTip、IsEnabled<br />
        <b>リソース:</b> SolidColorBrush、Style（Setter、BasedOn、暗黙スタイル、IsMouseOver / IsPressed の Trigger）、StaticResource / DynamicResource による参照<br />
        <b>非対応:</b> バインディングの評価、ControlTemplate / DataTemplate、アニメーション、外部の ResourceDictionary、コードビハインド
      </p>
    </details>
  </div>
</template>

<style scoped>
.pg {
  display: grid;
  gap: var(--sp-3);
  container-type: inline-size;
  min-width: 0;
}
.pg__sample {
  min-width: 200px;
}
.pg__range {
  font-size: var(--fs-xs);
  color: var(--ink-3);
  align-self: end;
  padding-bottom: 8px;
}
.pg__grid {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: minmax(0, 1fr);
}
.pg__grid > * {
  min-width: 0;
}
@container (min-width: 860px) {
  .pg__grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: start;
  }
}
.pg__support {
  font-size: var(--fs-sm);
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  padding: 8px 14px;
  background: var(--bg-raised);
}
.pg__support summary {
  cursor: pointer;
  font-weight: 700;
}
.pg__support p {
  margin-top: 8px;
  line-height: 1.9;
}
</style>
