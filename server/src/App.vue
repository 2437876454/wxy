<template>
  <div class="app-layout">
    <template v-if="auth.isLoggedIn">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <span>✦ Console</span>
        </div>
        <nav class="sidebar-nav">
          <router-link to="/" class="sidebar-link" :class="{ active: $route.path === '/' }">
            <span class="icon">◉</span>
            <span>用量概览</span>
          </router-link>
          <router-link to="/keys" class="sidebar-link" :class="{ active: $route.path === '/keys' }">
            <span class="icon">🔑</span>
            <span>API Keys</span>
          </router-link>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-avatar">{{ auth.user?.username?.charAt(0).toUpperCase() }}</div>
            <span class="sidebar-username">{{ auth.user?.username }}</span>
          </div>
          <a class="sidebar-link" @click="handleLogout" style="cursor: pointer;">
            <span class="icon">←</span>
            <span>退出登录</span>
          </a>
        </div>
      </aside>
      <main class="main-content">
        <router-view />
      </main>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
