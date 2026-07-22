<template>
  <div class="auth-page">
    <div class="card auth-card">
      <div class="auth-header">
        <h1><span>✦ Console</span></h1>
        <p>登录你的账户查看 API 用量</p>
      </div>
      <div v-if="error" class="auth-error">{{ error }}</div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="username"
            class="form-input"
            type="text"
            placeholder="输入用户名"
            autocomplete="username"
          />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="password"
            class="form-input"
            type="password"
            placeholder="输入密码"
            autocomplete="current-password"
          />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 10px;" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <div class="auth-footer">
        还没有账户？<router-link to="/register">注册</router-link>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 12px;">
          演示账号：demo / demo123456
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  try {
    await auth.login(username.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
