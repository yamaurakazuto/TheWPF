import { defineAsyncComponent, type Component } from 'vue'

/**
 * 図・デモの登録。demos/ 以下に `Foo.vue` を置けば、コンテンツ側から
 * `{ type: 'figure', demo: 'Foo', ... }` で参照できる（ファイル名がキー）。
 * 章ごとに遅延ロードされるので、開いていない章のデモは読み込まれない。
 */
const modules = import.meta.glob<{ default: Component }>('./**/*.vue')

const table = new Map<string, Component>()
for (const [path, loader] of Object.entries(modules)) {
  const name = path.split('/').pop()!.replace(/\.vue$/, '')
  table.set(
    name,
    defineAsyncComponent({
      loader,
      delay: 150,
    }),
  )
}

export function resolveDemo(key: string): Component | null {
  return table.get(key) ?? null
}

export const demoKeys = (): string[] => [...table.keys()]
