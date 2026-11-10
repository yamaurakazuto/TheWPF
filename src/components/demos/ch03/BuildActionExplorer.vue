<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CodeLang } from '@/types/content'
import CodeBlock from '@/components/content/CodeBlock.vue'

/** ビルドアクションごとに「ファイルがどこへ行き、どう読むか」を切り替えて見るデモ */
type Dest = 'wpf' | 'manifest' | 'output'
interface Action {
  id: string
  example: string
  what: string
  dest: Dest[]
  /** 出力フォルダーへのコピーが任意設定の場合 */
  optionalCopy?: boolean
  use: string
  code: { lang: CodeLang; title: string; code: string }
  caution: string
}

const actions: Action[] = [
  {
    id: 'Page',
    example: 'Views/MainWindow.xaml',
    what: 'XAML を BAML にコンパイルし、対になる .g.cs を生成する。',
    dest: ['wpf'],
    use: 'Window / UserControl / ResourceDictionary など、すべての XAML。SDK スタイルでは *.xaml が自動でこれになる。',
    code: { lang: 'xml', title: '.csproj（通常は書かなくてよい）', code: `<!-- UseWPF=true なら **/*.xaml は自動的に Page として扱われる -->\n<Page Include="Views\\MainWindow.xaml" />` },
    caution: 'App.xaml だけは ApplicationDefinition という別のアクションで、Page の処理に加えてエントリーポイント（Main）が生成される。',
  },
  {
    id: 'Resource',
    example: 'Assets/logo.png',
    what: 'ファイルをそのまま WPF のリソースとしてアセンブリに埋め込む。',
    dest: ['wpf'],
    use: 'アプリと一体で配りたい画像・アイコン・フォント。XAML から pack URI で直接参照できる。',
    code: { lang: 'xaml', title: 'XAML から読む', code: `<!-- .csproj: <Resource Include="Assets\\logo.png" /> -->\n<Image Source="/Assets/logo.png" />` },
    caution: 'SDK スタイルでも画像は自動では Resource にならない（既定は None）。追加したら .csproj に書くか、Visual Studio のプロパティでビルドアクションを変える。忘れると実行時に「リソースが見つからない」例外になる。',
  },
  {
    id: 'Content',
    example: 'Data/manual.pdf',
    what: 'アセンブリには埋め込まず、「このアプリに付属するファイル」として記録する。',
    dest: ['output'],
    use: '大きなファイル、あとから差し替えたいファイル（マニュアル、動画、サンプルデータ）。',
    code: { lang: 'xml', title: '.csproj', code: `<Content Include="Data\\manual.pdf">\n  <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>\n</Content>` },
    caution: 'CopyToOutputDirectory を指定しないと出力フォルダーにコピーされず、実行時に見つからない。',
  },
  {
    id: 'EmbeddedResource',
    example: 'Properties/Resources.resx',
    what: '.NET 標準のマニフェストリソースとしてアセンブリに埋め込む。.resx は型付きのアクセス用クラスも生成される。',
    dest: ['manifest'],
    use: '.resx による文字列のローカライズ、WPF に依存しないライブラリから読むファイル。',
    code: { lang: 'csharp', title: 'C# から読む', code: `// .resx の場合: 生成されたクラス経由\nstring title = Properties.Resources.AppTitle;\n\n// 任意のファイルの場合: 「既定の名前空間.フォルダー.ファイル名」で指定する\nusing Stream? stream = typeof(App).Assembly\n    .GetManifestResourceStream("MyApp.Data.schema.json");` },
    caution: 'pack URI では読めない。XAML の <Image Source="..."> から参照したいなら Resource を使う。名前が似ているが別の仕組み。',
  },
  {
    id: 'None',
    example: 'appsettings.json / README.md',
    what: 'ビルドでは何もしない。指定すれば出力フォルダーへコピーだけ行う。',
    dest: [],
    optionalCopy: true,
    use: '設定ファイルなど、単に exe の隣に置いておきたいファイル。',
    code: { lang: 'xml', title: '.csproj', code: `<None Update="appsettings.json">\n  <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>\n</None>` },
    caution: '新しく追加したファイルの既定値はこれ。画像を追加して「表示されない」ときは、まずここを確認する。',
  },
]

const current = ref('Resource')
const act = computed(() => actions.find((x) => x.id === current.value)!)

const DESTS: { id: Dest; title: string; sub: string; read: string }[] = [
  { id: 'wpf', title: 'アセンブリの中（WPF リソース）', sub: 'MyApp.g.resources', read: 'pack URI で読む' },
  { id: 'manifest', title: 'アセンブリの中（マニフェストリソース）', sub: 'MyApp.Properties.Resources.resources など', read: 'ResourceManager / GetManifestResourceStream で読む' },
  { id: 'output', title: '出力フォルダー（exe の隣）', sub: 'bin/…/Data/manual.pdf', read: 'pack URI またはファイルパスで読む' },
]
const isOn = (d: Dest) => act.value.dest.includes(d) || (d === 'output' && !!act.value.optionalCopy)
</script>

<template>
  <div class="ba">
    <div class="seg" role="group" aria-label="ビルドアクション">
      <button v-for="x in actions" :key="x.id" type="button" class="mono" :aria-pressed="current === x.id" @click="current = x.id">{{ x.id }}</button>
    </div>

    <div class="ba__flow" aria-live="polite">
      <div class="ba__file">
        <span class="ba__k">例</span>
        <b class="mono">{{ act.example }}</b>
        <span>{{ act.what }}</span>
      </div>
      <div class="ba__arrow" aria-hidden="true">▼ ビルド</div>
      <ul class="ba__dests">
        <li v-for="d in DESTS" :key="d.id" :class="{ 'is-on': isOn(d.id), 'is-optional': d.id === 'output' && act.optionalCopy }">
          <b>{{ d.title }}</b>
          <span class="mono">{{ d.sub }}</span>
          <span v-if="isOn(d.id)" class="ba__read">{{ d.id === 'output' && act.optionalCopy ? 'CopyToOutputDirectory を指定したときだけコピー' : d.read }}</span>
          <span v-else class="ba__no">ここには入らない</span>
        </li>
      </ul>
    </div>

    <dl class="ba__info">
      <div>
        <dt>向いているもの</dt>
        <dd>{{ act.use }}</dd>
      </div>
      <div>
        <dt>注意</dt>
        <dd>{{ act.caution }}</dd>
      </div>
    </dl>
    <CodeBlock :code="act.code.code" :lang="act.code.lang" :title="act.code.title" excerpt />
  </div>
</template>

<style scoped>
.ba {
  display: grid;
  gap: var(--sp-3);
}
.ba__flow {
  display: grid;
  gap: 6px;
}
.ba__file {
  display: grid;
  gap: 2px;
  padding: 10px 14px;
  border-radius: var(--radius-m);
  border: 1.5px solid var(--c-ui);
  background: var(--c-ui-soft);
  font-size: var(--fs-sm);
  line-height: 1.6;
}
.ba__k {
  font-size: var(--fs-xs);
  color: var(--ink-3);
}
.ba__arrow {
  text-align: center;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
}
.ba__dests {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}
.ba__dests li {
  display: grid;
  gap: 2px;
  align-content: start;
  padding: 10px 12px;
  border-radius: var(--radius-m);
  border: 1.5px dashed var(--line-strong);
  font-size: var(--fs-xs);
  line-height: 1.55;
  color: var(--ink-3);
  transition:
    border-color 0.2s,
    background 0.2s;
}
.ba__dests li b {
  font-size: var(--fs-sm);
}
.ba__dests li .mono {
  overflow-wrap: anywhere;
}
.ba__dests li.is-on {
  border: 2px solid var(--c-data);
  background: var(--c-data-soft);
  color: var(--ink);
}
.ba__dests li.is-optional {
  border-style: dashed;
}
.ba__read {
  margin-top: 4px;
  font-weight: 700;
  color: var(--c-data);
}
.ba__no {
  margin-top: 4px;
}
.ba__info {
  margin: 0;
  display: grid;
  gap: 6px;
  font-size: var(--fs-sm);
  line-height: 1.7;
}
.ba__info div {
  display: grid;
  grid-template-columns: 7.5em minmax(0, 1fr);
  gap: 10px;
}
.ba__info dt {
  font-weight: 700;
  color: var(--ink-3);
}
.ba__info dd {
  margin: 0;
}
@media (max-width: 520px) {
  .ba__info div {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
}
</style>
