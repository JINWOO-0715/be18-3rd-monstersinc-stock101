<template>
  <div class="app-shell">
    <Header />
    <main class="app-shell__main">
      <RouterView />
    </main>
    <ToastHost />
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import ToastHost from '@/components/shared/ToastHost.vue'
import Header from '@/components/Header.vue'
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background-color: var(--bg);
}

.app-shell__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 40px;
  background-color: var(--card-bg);
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.app-shell__brand {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--brand-sub);
}

.app-shell__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.app-shell__nav a {
  font-size: 14px;
  color: var(--brand-deep-blue);
  text-decoration: none;
}

.app-shell__nav a.router-link-active {
  font-weight: 600;
}

.app-shell__main {
  padding: 24px 0 60px;
}

@media (max-width: 768px) {
  .app-shell__header {
    padding: 16px 20px;
  }
}
</style>
