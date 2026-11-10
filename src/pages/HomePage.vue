<script setup lang="ts">
import { computed } from 'vue'
import { chapterMetas } from '@/content/meta'
import { useProgress } from '@/stores/progress'
import UiIcon from '@/components/content/UiIcon.vue'

const progress = useProgress()

const cards = computed(() =>
  chapterMetas.map((c) => {
    const q = progress.state.quiz[c.slug]
    return { ...c, quiz: q ?? null }
  }),
)
const answered = computed(() => Object.values(progress.state.quiz).filter((q) => Object.keys(q.answers).length === q.total).length)
const exercisesDone = computed(() => Object.values(progress.state.exercises).filter((e) => e.done).length)

/** まだクイズを終えていない最初の章 */
const nextUp = computed(() => {
  const c = chapterMetas.find((m) => {
    const q = progress.state.quiz[m.slug]
    return !q || Object.keys(q.answers).length < q.total
  })
  return c ?? chapterMetas[0]
})

const WAYS = [
  { icon: 'image', title: '図で全体像をつかむ', text: 'すべての章に自作の図があります。文章は図の読み方を補うために置いてあります。' },
  { icon: 'hand', title: '触って確かめる', text: 'ツリーの切り替え、イベントの伝播、Dispatcher のキューなど、仕組みを手で動かせます。' },
  { icon: 'film', title: '動きで理解する', text: '描画やメッセージポンプは短いアニメーションで。再生・一時停止・ステップ送りができます。' },
  { icon: 'code', title: '書いて定着させる', text: '章末のクイズとコード演習。XAML はその場で簡易プレビューできます。' },
] as const
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero__text">
        <p class="hero__kicker">図とデモで学ぶ Windows Presentation Foundation</p>
        <h1>WPF を、<br />仕組みから理解する。</h1>
        <p class="hero__lead">
          歴史 → 仕組み → 開発の土台 → 実践ノウハウ → 技術選定。上から順に読めば、WPF を「なんとなく動かせる」から「理由を説明できる」に変えられる学習サイトです。
        </p>
        <div class="hero__cta">
          <RouterLink :to="`/chapters/${nextUp.slug}`" class="btn btn--primary hero__btn">
            {{ answered ? `第${nextUp.no}章から続ける` : '第1章から読む' }} <UiIcon name="right" :size="16" />
          </RouterLink>
          <RouterLink to="/playground" class="btn hero__btn"><UiIcon name="code" :size="16" /> XAML を書いてみる</RouterLink>
        </div>
        <p v-if="answered || exercisesDone" class="hero__progress">
          進捗: クイズ {{ answered }} / {{ chapterMetas.length }} 章 ・ 演習 {{ exercisesDone }} 問達成（このブラウザに保存）
        </p>
      </div>

      <!-- XAML → ツリー → 画面 という WPF の基本の流れを 1 枚で -->
      <svg class="hero__art" viewBox="0 0 520 300" role="img" aria-label="XAML の記述が要素のツリーになり、レイアウトと描画を経て画面になる流れの図">
        <g class="art-code">
          <rect x="8" y="40" width="150" height="220" rx="10" fill="var(--bg-raised)" stroke="var(--line-strong)" />
          <text x="20" y="62" class="svg-t2 svg-b">XAML</text>
          <g font-family="var(--font-mono)" font-size="10.5">
            <text x="20" y="88" fill="var(--c-ui)">&lt;Window&gt;</text>
            <text x="30" y="108" fill="var(--c-ui)">&lt;StackPanel&gt;</text>
            <text x="40" y="128" fill="var(--c-render)">&lt;TextBlock /&gt;</text>
            <text x="40" y="148" fill="var(--c-data)">&lt;TextBox /&gt;</text>
            <text x="40" y="168" fill="var(--c-warn)">&lt;Button /&gt;</text>
            <text x="30" y="188" fill="var(--c-ui)">&lt;/StackPanel&gt;</text>
            <text x="20" y="208" fill="var(--c-ui)">&lt;/Window&gt;</text>
          </g>
        </g>

        <g class="art-tree" fill="none" stroke="var(--line-strong)" stroke-width="1.5">
          <path d="M262 92 V118 M262 148 V160 M262 160 H212 V176 M262 160 V176 M262 160 H312 V176" />
        </g>
        <g class="art-tree">
          <text x="262" y="56" text-anchor="middle" class="svg-t2 svg-b">要素のツリー</text>
          <rect x="232" y="68" width="60" height="24" rx="6" fill="var(--c-ui-soft)" stroke="var(--c-ui)" />
          <text x="262" y="84" text-anchor="middle" class="svg-t2">Window</text>
          <rect x="222" y="120" width="80" height="26" rx="6" fill="var(--c-ui-soft)" stroke="var(--c-ui)" />
          <text x="262" y="137" text-anchor="middle" class="svg-t2">StackPanel</text>
          <circle cx="212" cy="188" r="11" fill="var(--c-render-soft)" stroke="var(--c-render)" />
          <circle cx="262" cy="188" r="11" fill="var(--c-data-soft)" stroke="var(--c-data)" />
          <circle cx="312" cy="188" r="11" fill="var(--c-warn-soft)" stroke="var(--c-warn)" />
          <text x="262" y="226" text-anchor="middle" class="svg-t2">Measure → Arrange → Render</text>
        </g>

        <g class="art-win">
          <rect x="366" y="52" width="146" height="196" rx="8" fill="var(--bg-raised)" stroke="var(--line-strong)" />
          <path d="M366 76 H512" stroke="var(--line-strong)" />
          <circle cx="380" cy="64" r="3.5" fill="var(--c-danger)" />
          <circle cx="392" cy="64" r="3.5" fill="var(--c-warn)" />
          <circle cx="404" cy="64" r="3.5" fill="var(--c-data)" />
          <rect x="382" y="96" width="92" height="9" rx="3" fill="var(--c-render)" />
          <rect x="382" y="120" width="114" height="26" rx="4" fill="none" stroke="var(--c-data)" stroke-width="1.5" />
          <rect x="424" y="164" width="72" height="28" rx="5" fill="var(--c-warn)" />
          <text x="439" y="268" text-anchor="middle" class="svg-t2 svg-b">画面</text>
        </g>

        <g class="art-flow" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round">
          <path d="M166 150 H206" />
          <path d="M200 144 l8 6 -8 6" />
          <path d="M320 150 H358" />
          <path d="M352 144 l8 6 -8 6" />
        </g>
      </svg>
    </section>

    <section class="ways" aria-labelledby="ways-h">
      <h2 id="ways-h">このサイトの読み方</h2>
      <ul>
        <li v-for="w in WAYS" :key="w.title">
          <span class="ways__icon"><UiIcon :name="w.icon" :size="20" /></span>
          <b>{{ w.title }}</b>
          <p>{{ w.text }}</p>
        </li>
      </ul>
    </section>

    <section class="chapters" aria-labelledby="chapters-h">
      <h2 id="chapters-h">章の一覧</h2>
      <ol>
        <li v-for="c in cards" :key="c.slug">
          <RouterLink :to="`/chapters/${c.slug}`" class="card">
            <span class="card__no" aria-hidden="true">{{ String(c.no).padStart(2, '0') }}</span>
            <span class="card__body">
              <b class="card__title"><span class="sr-only">第{{ c.no }}章 </span>{{ c.title }}</b>
              <span class="card__sub">{{ c.subtitle }}</span>
              <span class="card__summary">{{ c.summary }}</span>
              <span class="card__meta">
                <span v-for="k in c.keywords" :key="k" class="chip">{{ k }}</span>
              </span>
            </span>
            <span class="card__side">
              <span class="chip"><UiIcon name="clock" :size="12" /> {{ c.minutes }} 分</span>
              <span v-if="c.quiz" class="chip" :class="{ 'card__ok': c.quiz.correct === c.quiz.total }">クイズ {{ c.quiz.correct }}/{{ c.quiz.total }}</span>
            </span>
          </RouterLink>
        </li>
      </ol>
    </section>

    <section class="about" aria-labelledby="about-h">
      <h2 id="about-h">内容の信頼性について</h2>
      <ul>
        <li>年号・バージョン・API 名は Microsoft Learn、.NET Blog、dotnet/wpf リポジトリなどで確認し、各節の末尾に出典リンクを置いています。</li>
        <li>一次情報で日付が割れるものは「諸説あり」と明記し、断定していません。</li>
        <li>執筆時点は <strong>2026 年 11 月 10 日</strong>です。.NET のサポート期間など時間で変わる内容は、必ず出典先で最新の状態を確認してください。</li>
        <li>演習の判定とXAML プレビューはブラウザ内の簡易実装です。最終確認は実際の Visual Studio / <code>dotnet build</code> で行ってください。</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5) var(--sp-8);
  display: grid;
  gap: var(--sp-7);
}
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: var(--sp-6);
  align-items: center;
}
.hero__kicker {
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.06em;
}
.hero h1 {
  margin-top: var(--sp-2);
  font-size: clamp(2.1rem, 1.2rem + 3.4vw, 3.4rem);
  line-height: 1.22;
  font-weight: 800;
}
.hero__lead {
  margin-top: var(--sp-4);
  color: var(--ink-2);
  max-width: 34em;
}
.hero__cta {
  margin-top: var(--sp-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
}
.hero__btn {
  min-height: 44px;
  padding: 8px 18px;
  font-size: var(--fs-md);
  text-decoration: none;
}
.hero__progress {
  margin-top: var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--ink-3);
}
.hero__art {
  width: 100%;
  height: auto;
}
.art-flow path {
  stroke-dasharray: 6 6;
  animation: flow 1.2s linear infinite;
}
@keyframes flow {
  to {
    stroke-dashoffset: -12;
  }
}

.home h2 {
  font-size: var(--fs-xl);
  margin-bottom: var(--sp-4);
}

.ways ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sp-3);
}
.ways li {
  padding: var(--sp-4);
  border-radius: var(--radius-l);
  border: 1px solid var(--line);
  background: var(--bg-raised);
  display: grid;
  gap: 6px;
  align-content: start;
}
.ways__icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
}
.ways p {
  font-size: var(--fs-sm);
  color: var(--ink-2);
  line-height: 1.7;
}

.chapters ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sp-3);
}
.card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--sp-4);
  align-items: start;
  padding: var(--sp-4);
  border-radius: var(--radius-l);
  border: 1px solid var(--line);
  background: var(--bg-raised);
  color: var(--ink);
  text-decoration: none;
  transition:
    border-color 0.15s var(--ease),
    transform 0.15s var(--ease),
    box-shadow 0.15s var(--ease);
}
.card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-2);
}
.card__no {
  font-family: var(--font-mono);
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1;
  color: var(--accent);
  opacity: 0.85;
}
.card__body {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.card__title {
  font-size: var(--fs-lg);
}
.card__sub {
  font-size: var(--fs-sm);
  color: var(--ink-3);
}
.card__summary {
  margin-top: 4px;
  font-size: 0.9375rem;
  color: var(--ink-2);
  line-height: 1.7;
}
.card__meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.card__side {
  display: grid;
  gap: 6px;
  justify-items: end;
}
.card__ok {
  border-color: var(--c-data);
  color: var(--c-data);
  background: var(--c-data-soft);
}

.about ul {
  margin: 0;
  padding-left: 1.3em;
  color: var(--ink-2);
  font-size: 0.9375rem;
  display: grid;
  gap: 6px;
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero__art {
    max-width: 520px;
    justify-self: center;
  }
}
@media (max-width: 640px) {
  .home {
    padding: var(--sp-5) var(--sp-4) var(--sp-7);
  }
  .card {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .card__side {
    grid-column: 2;
    justify-items: start;
    grid-auto-flow: column;
    justify-content: start;
  }
}
</style>
