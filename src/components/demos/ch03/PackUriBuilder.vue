<script setup lang="ts">
import { computed, ref } from 'vue'
import CodeBlock from '@/components/content/CodeBlock.vue'

/** pack URI を部品ごとに色分けして組み立てるデモ */
type Kind = 'local' | 'referenced' | 'content' | 'origin'
const KINDS: { id: Kind; label: string; note: string }[] = [
  { id: 'local', label: '同じアセンブリのリソース', note: 'ビルドアクション Resource（または Page）のファイル。いちばんよく使う形。' },
  { id: 'referenced', label: '別アセンブリのリソース', note: '参照しているクラスライブラリに埋め込まれたリソース。「アセンブリ名;component」を挟む。' },
  { id: 'content', label: 'コンテンツファイル', note: 'ビルドアクション Content で、出力フォルダーにコピーされたファイル。書式はリソースと同じで、WPF はまずリソースを探し、なければコンテンツファイルを探す。' },
  { id: 'origin', label: '起点サイトのファイル', note: 'ビルド時には存在を知らない、exe と同じ場所に置かれたファイル。相対形式はなく、必ず絶対形式で書く。' },
]

const kind = ref<Kind>('local')
const rawPath = ref('Assets/logo.png')
const assembly = ref('MyApp.Controls')

const path = computed(() => rawPath.value.trim().replace(/\\/g, '/').replace(/^\/+/, '') || 'Assets/logo.png')
const asm = computed(() => assembly.value.trim().replace(/[;\s/]/g, '') || 'MyLib')

interface Seg {
  text: string
  role: 'scheme' | 'authority' | 'assembly' | 'path'
}
const segments = computed<Seg[]>(() => {
  const out: Seg[] = [
    { text: 'pack://', role: 'scheme' },
    { text: kind.value === 'origin' ? 'siteoforigin:,,,' : 'application:,,,', role: 'authority' },
  ]
  if (kind.value === 'referenced') out.push({ text: `/${asm.value};component`, role: 'assembly' })
  out.push({ text: `/${path.value}`, role: 'path' })
  return out
})
const absolute = computed(() => segments.value.map((s) => s.text).join(''))
const relative = computed(() => (kind.value === 'origin' ? null : kind.value === 'referenced' ? `/${asm.value};component/${path.value}` : `/${path.value}`))

const LEGEND: Record<Seg['role'], string> = {
  scheme: 'スキーム。「パッケージの中を指す URI」という宣言',
  authority: 'どのパッケージか。application = このアプリ、siteoforigin = exe のある場所。「,,,」は「///」を URI の中に書けるよう置き換えたもの',
  assembly: '参照先アセンブリの名前（拡張子なし）+ ;component',
  path: 'プロジェクトのルートから見たファイルのパス',
}
const roles = computed(() => segments.value.map((s) => s.role))

const xaml = computed(() => `<Image Source="${relative.value ?? absolute.value}" />`)
const csharp = computed(() =>
  relative.value
    ? `var uri = new Uri("${relative.value}", UriKind.Relative);\nvar image = new BitmapImage(uri);`
    : `var uri = new Uri("${absolute.value}", UriKind.Absolute);\nvar image = new BitmapImage(uri);`,
)
</script>

<template>
  <div class="pu">
    <fieldset class="pu__kinds">
      <legend>何を指したいか</legend>
      <label v-for="k in KINDS" :key="k.id" class="check">
        <input v-model="kind" type="radio" name="pack-kind" :value="k.id" />
        {{ k.label }}
      </label>
    </fieldset>
    <p class="pu__note">{{ KINDS.find((k) => k.id === kind)!.note }}</p>

    <div class="pu__inputs">
      <label class="field">
        ファイルのパス（プロジェクトルートから）
        <input v-model="rawPath" type="text" class="input mono" spellcheck="false" />
      </label>
      <label v-if="kind === 'referenced'" class="field">
        参照先アセンブリ名
        <input v-model="assembly" type="text" class="input mono" spellcheck="false" />
      </label>
    </div>

    <div class="pu__out" aria-live="polite">
      <p class="pu__label">絶対形式</p>
      <p class="pu__uri scroll-x" tabindex="0">
        <span v-for="(s, i) in segments" :key="i" :class="`pu__seg pu__seg--${s.role}`">{{ s.text }}</span>
      </p>
      <p class="pu__label">相対形式（XAML では普通こちらを書く）</p>
      <p class="pu__uri scroll-x" tabindex="0">
        <template v-if="relative">{{ relative }}</template>
        <span v-else class="muted">なし（絶対形式で書く）</span>
      </p>
    </div>

    <ul class="pu__legend">
      <li v-for="r in roles" :key="r"><span :class="`pu__seg pu__seg--${r}`">{{ segments.find((s) => s.role === r)!.text }}</span> {{ LEGEND[r] }}</li>
    </ul>

    <div class="pu__codes">
      <CodeBlock :code="xaml" lang="xaml" title="XAML で使う" excerpt />
      <CodeBlock :code="csharp" lang="csharp" title="C# で使う" excerpt />
    </div>
  </div>
</template>

<style scoped>
.pu {
  display: grid;
  gap: var(--sp-3);
}
.pu__kinds {
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  margin: 0;
  padding: 8px 14px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}
.pu__kinds legend {
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
  padding: 0 6px;
}
.pu__note {
  font-size: var(--fs-sm);
  color: var(--ink-2);
  min-height: 3.4em;
}
.pu__inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sp-3);
}
.pu__out {
  padding: 12px 14px;
  border-radius: var(--radius-m);
  background: var(--bg-code);
  border: 1px solid var(--line);
}
.pu__label {
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
}
.pu__label:not(:first-child) {
  margin-top: 10px;
}
.pu__uri {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  white-space: nowrap;
  padding: 4px 0;
  overflow-wrap: normal;
}
.pu__seg {
  padding: 2px 3px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-weight: 700;
}
.pu__seg--scheme {
  background: var(--c-mute-soft);
  color: var(--ink-2);
}
.pu__seg--authority {
  background: var(--c-ui-soft);
  color: var(--c-ui);
}
.pu__seg--assembly {
  background: var(--c-warn-soft);
  color: var(--c-warn);
}
.pu__seg--path {
  background: var(--c-data-soft);
  color: var(--c-data);
}
.pu__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  font-size: var(--fs-sm);
  line-height: 1.7;
}
.pu__legend .pu__seg {
  font-size: var(--fs-xs);
  margin-right: 4px;
  overflow-wrap: anywhere;
}
.pu__codes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--sp-3);
}
.pu__codes > * {
  min-width: 0;
}
</style>
