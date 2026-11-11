<template>
  <div class="nf">
    <h1>ページが見つかりません</h1>
    <p>URL が変わったか、入力に誤りがあるようです。</p>
    <RouterLink to="/" class="btn btn--primary">トップへ戻る</RouterLink>
  </div>
</template>

<style scoped>
.nf {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-5);
  display: grid;
  gap: var(--sp-3);
  justify-items: start;
}
.nf .btn {
  text-decoration: none;
}
</style>
