import { defineComponent, h, type VNodeChild } from 'vue'
import { parseInline, type InlineToken } from '@/lib/inline'
import TermTip from './TermTip.vue'

function render(tokens: InlineToken[]): VNodeChild[] {
  return tokens.map((t) => {
    switch (t.t) {
      case 'text':
        return t.v
      case 'code':
        return h('code', null, t.v)
      case 'strong':
        return h('strong', null, render(t.v))
      case 'term':
        return h(TermTip, { id: t.id, label: t.v ?? undefined })
      case 'link': {
        const external = /^https?:/.test(t.href)
        return h(
          'a',
          external ? { href: t.href, target: '_blank', rel: 'noopener noreferrer' } : { href: t.href },
          render(t.v),
        )
      }
    }
  })
}

/** インライン記法つき文字列を描画する。<RichText tag="p" :text="..." /> */
export default defineComponent({
  name: 'RichText',
  props: {
    text: { type: String, required: true },
    tag: { type: String, default: 'span' },
  },
  setup(props) {
    return () => h(props.tag, null, render(parseInline(props.text)))
  },
})
