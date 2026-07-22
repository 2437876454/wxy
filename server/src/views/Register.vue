<template>
  <div class="auth-page">
    <div class="card auth-card">
      <div class="auth-header">
        <h1><span>✦ Console</span></h1>
        <p>创建你的账户</p>
      </div>
      <div v-if="error" class="auth-error">{{ error }}</div>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input v-model="username" class="form-input" type="text" placeholder="输入用户名" />
        </div>
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input v-model="email" class="form-input" type="email" placeholder="输入邮箱" />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="password" class="form-input" type="password" placeholder="至少6位密码" />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 10px;" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      <div class="auth-footer">
        已有账户？<router-link to="/login">登录</router-link>
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
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  if (!username.value || !email.value || !password.value) {
    error.value = '请填写所有字段'
    return
  }
  if (password.value.length < 6) {
    error.value = '密码长度至少6位'
    return
  }

  loading.value = true
  try {
    await auth.register(username.value, email.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>
