<template>
  <div>
    <div class="page-header">
      <h1>API Keys</h1>
      <p>管理你的 API 密钥</p>
    </div>
    <div class="page-body">
      <!-- Create Key -->
      <div class="card" style="margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
        <input
          v-model="newKeyName"
          class="form-input"
          style="max-width: 300px;"
          placeholder="输入密钥名称"
          @keyup.enter="createKey"
        />
        <button class="btn btn-primary" @click="createKey" :disabled="creating">
          {{ creating ? '创建中...' : '创建密钥' }}
        </button>
      </div>

      <!-- Key list -->
      <div class="card" style="padding: 0;">
        <div class="table-container">
          <table v-if="keys.length">
            <thead>
              <tr>
                <th>名称</th>
                <th>密钥</th>
                <th>状态</th>
                <th>最后使用</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in keys" :key="key.id">
                <td style="font-weight: 500;">{{ key.name }}</td>
                <td>
                  <div class="key-display">
                    <span class="key-value">{{ maskKey(key.key) }}</span>
                    <button class="btn-ghost" @click="copyKey(key.key)" title="复制">📋</button>
                  </div>
                </td>
                <td>
                  <span class="badge" :class="key.is_active ? 'badge-green' : 'badge-red'">
                    {{ key.is_active ? '启用' : '停用' }}
                  </span>
                </td>
                <td style="color: var(--text-secondary); font-size: 12px;">
                  {{ key.last_used ? formatTime(key.last_used) : '从未使用' }}
                </td>
                <td style="color: var(--text-secondary); font-size: 12px;">
                  {{ formatTime(key.created_at) }}
                </td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button
                      class="btn btn-sm btn-secondary"
                      @click="toggleKey(key)"
                    >
                      {{ key.is_active ? '停用' : '启用' }}
                    </button>
                    <button
                      class="btn btn-sm btn-danger"
                      @click="confirmDelete(key)"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <div class="empty-icon">🔑</div>
            <p>{{ loading ? '加载中...' : '还没有 API Key，创建一个吧' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../api'
import type { ApiKey } from '../types'

const keys = ref<ApiKey[]>([])
const newKeyName = ref('')
const loading = ref(false)
const creating = ref(false)

async function fetchKeys() {
  loading.value = true
  try {
    keys.value = await api.getApiKeys()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function createKey() {
  if (!newKeyName.value.trim()) return
  creating.value = true
  try {
    const newKey = await api.createApiKey(newKeyName.value.trim())
    // Refresh to get full list
    await fetchKeys()
    newKeyName.value = ''
  } catch (e: any) {
    alert(e.message || '创建失败')
  } finally {
    creating.value = false
  }
}

async function toggleKey(key: ApiKey) {
  try {
    await api.toggleApiKey(key.id)
    key.is_active = !key.is_active
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

function confirmDelete(key: ApiKey) {
  if (!confirm(`确定要删除密钥「${key.name}」吗？此操作不可撤销。`)) return
  api.deleteApiKey(key.id).then(() => {
    keys.value = keys.value.filter(k => k.id !== key.id)
  }).catch((e: any) => {
    alert(e.message || '删除失败')
  })
}

function maskKey(key: string) {
  if (key.length <= 12) return key
  return key.slice(0, 12) + '••••' + key.slice(-4)
}

async function copyKey(key: string) {
  try {
    await navigator.clipboard.writeText(key)
  } catch {
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = key
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hour = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hour}:${min}`
}

onMounted(fetchKeys)
</script>
