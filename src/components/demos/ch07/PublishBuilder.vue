<script setup lang="ts">
import { computed, ref } from 'vue'
import CodeBlock from '@/components/content/CodeBlock.vue'
import UiIcon from '@/components/content/UiIcon.vue'

/** dotnet publish のオプションを選ぶと、コマンドと「何が起きるか」が出るデモ */
const selfContained = ref(false)
const singleFile = ref(false)
const readyToRun = ref(false)
const trimmed = ref(false)
const rid = ref('win-x64')
const RIDS = [
  { id: 'win-x64', label: 'win-x64（64 ビット。通常はこれ）' },
  { id: 'win-arm64', label: 'win-arm64（Arm 版 Windows）' },
  { id: 'win-x86', label: 'win-x86（32 ビット）' },
]

const command = computed(() => {
  const parts = ['dotnet publish -c Release', `-r ${rid.value}`, `--self-contained ${selfContained.value}`]
  if (singleFile.value) {
    parts.push('-p:PublishSingleFile=true')
    if (selfContained.value) parts.push('-p:IncludeNativeLibrariesForSelfExtract=true')
  }
  if (readyToRun.value) parts.push('-p:PublishReadyToRun=true')
  if (trimmed.value) parts.push('-p:PublishTrimmed=true')
  return parts.join(' `\n  ')
})

interface Note {
  kind: 'ok' | 'warn' | 'ng'
  text: string
}
const notes = computed<Note[]>(() => {
  const n: Note[] = []
  if (selfContained.value) {
    n.push({ kind: 'ok', text: '.NET ランタイムを同梱する。利用者の PC に .NET が入っていなくても動く。' })
    n.push({ kind: 'warn', text: '配布サイズが大きくなる。.NET のセキュリティ更新を適用するには、アプリを発行し直して配り直す必要がある。' })
  } else {
    n.push({ kind: 'ok', text: '配布物は小さい。.NET のセキュリティ更新は、PC 側のランタイム更新で適用される。' })
    n.push({ kind: 'warn', text: '利用者の PC に「.NET デスクトップ ランタイム」（同じメジャーバージョン）のインストールが必要。' })
  }
  if (singleFile.value) {
    n.push({ kind: 'ok', text: '多数の DLL を 1 つの exe にまとめる。配布とコピーが楽になる。' })
    if (selfContained.value) n.push({ kind: 'ok', text: 'WPF はネイティブ DLL を含むため、IncludeNativeLibrariesForSelfExtract を付けて一緒に束ねる（初回起動時に一時フォルダーへ展開される）。' })
    else n.push({ kind: 'warn', text: 'フレームワーク依存の単一ファイルでは、アプリ自身の DLL だけがまとまる。' })
  }
  if (readyToRun.value) n.push({ kind: 'ok', text: '事前コンパイルしたコードを同梱し、起動時の JIT を減らす。起動は速くなるが、ファイルサイズは増える。' })
  if (trimmed.value) n.push({ kind: 'ng', text: 'WPF はトリミングに対応していない。SDK がビルドエラー（NETSDK1168）にするので、このオプションは使えない。' })
  return n
})

const summary = computed(() => {
  if (trimmed.value) return { label: 'このままでは発行できない', tone: 'ng' }
  if (selfContained.value && singleFile.value) return { label: '「exe 1 つを渡せば動く」構成', tone: 'ok' }
  if (selfContained.value) return { label: 'ランタイム同梱（フォルダーごと配布）', tone: 'ok' }
  return { label: 'フレームワーク依存（ランタイムは別途インストール）', tone: 'ok' }
})
</script>

<template>
  <div class="pb">
    <div class="pb__opts">
      <fieldset>
        <legend>ランタイム</legend>
        <label class="check"><input v-model="selfContained" type="radio" name="pb-sc" :value="false" /> フレームワーク依存</label>
        <label class="check"><input v-model="selfContained" type="radio" name="pb-sc" :value="true" /> 自己完結型（同梱する）</label>
      </fieldset>
      <fieldset>
        <legend>オプション</legend>
        <label class="check"><input v-model="singleFile" type="checkbox" /> 単一ファイルにまとめる</label>
        <label class="check"><input v-model="readyToRun" type="checkbox" /> ReadyToRun（起動を速く）</label>
        <label class="check"><input v-model="trimmed" type="checkbox" /> トリミング（未使用コードを削る）</label>
      </fieldset>
      <label class="field">
        対象の環境（RID）
        <select v-model="rid" class="input">
          <option v-for="r in RIDS" :key="r.id" :value="r.id">{{ r.label }}</option>
        </select>
      </label>
    </div>

    <p class="pb__summary" :class="`is-${summary.tone}`" aria-live="polite">{{ summary.label }}</p>
    <CodeBlock :code="command" lang="powershell" title="PowerShell" />

    <ul class="pb__notes" aria-live="polite">
      <li v-for="(n, i) in notes" :key="i" :class="`is-${n.kind}`">
        <UiIcon :name="n.kind === 'ok' ? 'check' : n.kind === 'warn' ? 'warn' : 'cross'" :size="15" />
        <span>{{ n.text }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pb {
  display: grid;
  gap: var(--sp-3);
}
.pb__opts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sp-2);
  align-items: start;
}
fieldset {
  margin: 0;
  padding: 6px 12px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  display: grid;
  gap: 4px;
}
legend {
  padding: 0 6px;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
}
.pb__summary {
  padding: 6px 12px;
  border-radius: var(--radius-s);
  font-weight: 700;
  font-size: var(--fs-sm);
  background: var(--c-data-soft);
  color: var(--c-data);
}
.pb__summary.is-ng {
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.pb__notes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  font-size: var(--fs-sm);
  line-height: 1.7;
}
.pb__notes li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}
.pb__notes li > :first-child {
  margin-top: 5px;
}
.pb__notes .is-ok > :first-child {
  color: var(--c-data);
}
.pb__notes .is-warn > :first-child {
  color: var(--c-warn);
}
.pb__notes .is-ng {
  color: var(--c-danger);
  font-weight: 700;
}
</style>
