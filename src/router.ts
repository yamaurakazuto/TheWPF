import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * hash モードを使う理由: GitHub Pages のような静的ホスティングでは
 * /chapters/history への直リンクが 404 になるため。hash ならサーバー設定なしで動く。
 * ページ内アンカーは `#/chapters/history#sec-id` の形（router-link の hash）で表現する。
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('./pages/HomePage.vue') },
    {
      path: '/chapters/:slug',
      name: 'chapter',
      component: () => import('./pages/ChapterPage.vue'),
      props: true,
    },
    { path: '/playground', name: 'playground', component: () => import('./pages/PlaygroundPage.vue') },
    { path: '/glossary', name: 'glossary', component: () => import('./pages/GlossaryPage.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./pages/NotFoundPage.vue') },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    // ページ内アンカーは、本文の遅延ロード完了後に各ページ側でスクロールする
    if (to.hash) return false
    if (to.path !== from.path) return { top: 0, behavior: 'auto' }
    return false
  },
})

const SITE = 'theWPF'
const NAMES: Record<string, string> = {
  playground: '演習場',
  glossary: '用語集',
  'not-found': 'ページが見つかりません',
}

router.afterEach((to) => {
  if (to.name === 'chapter') return // 章タイトルは ChapterPage が設定する
  const n = NAMES[String(to.name)]
  document.title = n ? `${n} — ${SITE}` : `${SITE} — 図とデモで学ぶ WPF`
})
