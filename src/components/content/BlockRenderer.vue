<script setup lang="ts">
import { inject } from 'vue'
import type { Block } from '@/types/content'
import { resolveDemo } from '@/components/demos/registry'
import RichText from './RichText'
import CodeBlock from './CodeBlock.vue'
import AnnotatedCode from './AnnotatedCode.vue'
import FigureFrame from './FigureFrame.vue'
import UiIcon, { type IconName } from './UiIcon.vue'

/** Block 配列を上から順に描画する。文章の見た目はここだけで決まる */
defineProps<{ blocks: Block[] }>()

/** ChapterPage が提供する「図ブロック → 番号」の対応 */
const figureNo = inject<Map<Block, string>>('figureNo', new Map())

const CALLOUT: Record<string, { label: string; icon: IconName }> = {
  note: { label: '補足', icon: 'info' },
  tip: { label: 'コツ', icon: 'bulb' },
  warn: { label: '注意', icon: 'warn' },
  pitfall: { label: '落とし穴', icon: 'warn' },
  history: { label: '背景', icon: 'clock' },
}
</script>

<template>
  <div class="blocks">
    <template v-for="(b, i) in blocks" :key="i">
      <RichText v-if="b.type === 'p'" tag="p" class="b-p" :text="b.text" />

      <h3 v-else-if="b.type === 'h3'" class="b-h3">{{ b.text }}</h3>

      <component :is="b.ordered ? 'ol' : 'ul'" v-else-if="b.type === 'list'" class="b-list">
        <RichText v-for="(it, j) in b.items" :key="j" tag="li" :text="it" />
      </component>

      <ol v-else-if="b.type === 'steps'" class="b-steps">
        <li v-for="(s, j) in b.items" :key="j">
          <span class="b-steps__n" aria-hidden="true">{{ j + 1 }}</span>
          <div>
            <b>{{ s.title }}</b>
            <RichText tag="p" :text="s.text" />
          </div>
        </li>
      </ol>

      <div v-else-if="b.type === 'table'" class="b-table scroll-x" tabindex="0" role="group" :aria-label="b.caption ?? '表'">
        <table>
          <caption v-if="b.caption">
            {{
              b.caption
            }}
          </caption>
          <thead>
            <tr>
              <th v-for="(hcell, j) in b.head" :key="j" scope="col">{{ hcell }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, j) in b.rows" :key="j">
              <template v-for="(cell, k) in row" :key="k">
                <RichText v-if="k === 0" tag="th" scope="row" :text="cell" />
                <RichText v-else tag="td" :text="cell" />
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <aside v-else-if="b.type === 'callout'" class="b-callout" :class="`b-callout--${b.kind}`">
        <p class="b-callout__head">
          <UiIcon :name="CALLOUT[b.kind].icon" :size="16" />
          <span>{{ CALLOUT[b.kind].label }}</span>
          <b v-if="b.title">{{ b.title }}</b>
        </p>
        <RichText tag="p" :text="b.text" />
      </aside>

      <CodeBlock
        v-else-if="b.type === 'code'"
        :code="b.code"
        :lang="b.lang"
        :title="b.title"
        :pseudo="b.pseudo"
        :excerpt="b.excerpt"
        :highlight="b.highlight"
      />

      <AnnotatedCode
        v-else-if="b.type === 'annotated'"
        :lines="b.lines"
        :lang="b.lang"
        :title="b.title"
        :hint="b.hint"
      />

      <div v-else-if="b.type === 'compare'" class="b-compare">
        <div class="b-compare__grid">
          <section
            v-for="(side, j) in [b.left, b.right]"
            :key="j"
            class="b-compare__side"
            :class="`b-compare__side--${side.tone}`"
          >
            <h4>
              <UiIcon v-if="side.tone === 'bad'" name="cross" :size="15" />
              <UiIcon v-else-if="side.tone === 'good'" name="check" :size="15" />
              {{ side.label }}
            </h4>
            <CodeBlock v-if="side.code" :code="side.code" :lang="side.lang ?? 'csharp'" />
            <ul v-if="side.points?.length">
              <RichText v-for="(pt, k) in side.points" :key="k" tag="li" :text="pt" />
            </ul>
          </section>
        </div>
        <RichText v-if="b.caption" tag="p" class="b-compare__cap" :text="b.caption" />
      </div>

      <FigureFrame
        v-else-if="b.type === 'figure'"
        :kind="b.kind"
        :title="b.title"
        :number="figureNo.get(b)"
        :caption="b.caption"
      >
        <component :is="resolveDemo(b.demo)" v-if="resolveDemo(b.demo)" />
        <p v-else class="b-missing">デモ「{{ b.demo }}」が見つかりません。</p>
      </FigureFrame>

      <aside v-else-if="b.type === 'sources'" class="b-sources" aria-label="出典">
        <p class="b-sources__head"><UiIcon name="link" :size="14" /> 出典・一次情報</p>
        <ul>
          <li v-for="(s, j) in b.items" :key="j">
            <a :href="s.url" target="_blank" rel="noopener noreferrer">{{ s.label }}</a>
            <span v-if="s.note" class="b-sources__note"> — {{ s.note }}</span>
          </li>
        </ul>
      </aside>
    </template>
  </div>
</template>

<style scoped>
.blocks {
  display: grid;
  gap: var(--sp-4);
  min-width: 0;
}
.blocks > * {
  min-width: 0;
}
.b-h3 {
  margin-top: var(--sp-4);
  font-size: var(--fs-lg);
  padding-left: 12px;
  border-left: 4px solid var(--accent);
}
.b-list {
  margin: 0;
  padding-left: 1.4em;
  display: grid;
  gap: 6px;
}
.b-list li::marker {
  color: var(--accent);
  font-weight: 700;
}

.b-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0;
}
.b-steps li {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: var(--sp-3);
  padding-bottom: var(--sp-3);
  position: relative;
}
.b-steps li:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 32px;
  bottom: 0;
  width: 2px;
  background: var(--line);
}
.b-steps__n {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--accent-line);
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: var(--fs-sm);
}
.b-steps b {
  display: block;
  margin-top: 2px;
}
.b-steps p {
  color: var(--ink-2);
  font-size: 0.9375rem;
}

.b-table {
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--bg-raised);
}
.b-table table {
  border-collapse: collapse;
  width: 100%;
  min-width: 520px;
  font-size: var(--fs-sm);
  line-height: 1.65;
}
.b-table caption {
  caption-side: top;
  text-align: left;
  padding: 10px 14px 6px;
  font-weight: 700;
  color: var(--ink-2);
}
.b-table th,
.b-table td {
  padding: 9px 14px;
  text-align: left;
  vertical-align: top;
  border-top: 1px solid var(--line);
}
.b-table thead th {
  border-top: 0;
  background: var(--bg-sunken);
  font-size: var(--fs-xs);
  color: var(--ink-2);
  white-space: nowrap;
}
.b-table tbody th {
  font-weight: 700;
  min-width: 8.5em;
}

.b-callout {
  padding: 12px 16px 14px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  border-left-width: 4px;
  background: var(--bg-raised);
  font-size: 0.9375rem;
}
.b-callout__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-xs);
  font-weight: 700;
  margin-bottom: 2px;
}
.b-callout__head b {
  font-size: var(--fs-sm);
  color: var(--ink);
}
.b-callout--note {
  border-left-color: var(--c-render);
}
.b-callout--note .b-callout__head {
  color: var(--c-render);
}
.b-callout--tip {
  border-left-color: var(--c-data);
}
.b-callout--tip .b-callout__head {
  color: var(--c-data);
}
.b-callout--warn,
.b-callout--pitfall {
  border-left-color: var(--c-warn);
  background: var(--c-warn-soft);
}
.b-callout--warn .b-callout__head {
  color: var(--c-warn);
}
.b-callout--pitfall {
  border-left-color: var(--c-danger);
  background: var(--c-danger-soft);
}
.b-callout--pitfall .b-callout__head {
  color: var(--c-danger);
}
.b-callout--history {
  border-left-color: var(--c-mute);
}
.b-callout--history .b-callout__head {
  color: var(--ink-3);
}

.b-compare {
  container-type: inline-size;
}
.b-compare__grid {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: minmax(0, 1fr);
}
@container (min-width: 720px) {
  .b-compare__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.b-compare__side {
  display: grid;
  gap: var(--sp-2);
  align-content: start;
  padding: 12px;
  border-radius: var(--radius-m);
  border: 1px solid var(--line);
  background: var(--bg-raised);
  min-width: 0;
}
.b-compare__side h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-sm);
}
.b-compare__side--bad {
  border-top: 3px solid var(--c-danger);
}
.b-compare__side--bad h4 {
  color: var(--c-danger);
}
.b-compare__side--good {
  border-top: 3px solid var(--c-data);
}
.b-compare__side--good h4 {
  color: var(--c-data);
}
.b-compare__side--neutral {
  border-top: 3px solid var(--c-mute);
}
.b-compare__side ul {
  margin: 0;
  padding-left: 1.3em;
  font-size: var(--fs-sm);
  line-height: 1.7;
  display: grid;
  gap: 4px;
}
.b-compare__cap {
  margin-top: var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--ink-2);
}

.b-missing {
  color: var(--c-danger);
}

.b-sources {
  padding: 10px 14px 12px;
  border-radius: var(--radius-m);
  border: 1px dashed var(--line-strong);
  font-size: var(--fs-sm);
  line-height: 1.7;
}
.b-sources__head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--ink-3);
}
.b-sources ul {
  margin: 4px 0 0;
  padding-left: 1.3em;
}
.b-sources__note {
  color: var(--ink-3);
}
</style>
