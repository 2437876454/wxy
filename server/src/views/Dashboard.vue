<template>
  <div>
    <div class="page-header">
      <h1>用量概览</h1>
      <p>查看 API 调用数据和使用趋势</p>
    </div>
    <div class="page-body">
      <!-- Time range -->
      <div class="time-range">
        <button
          v-for="d in timeRanges"
          :key="d.value"
          class="time-btn"
          :class="{ active: selectedDays === d.value }"
          @click="changeTimeRange(d.value)"
        >
          {{ d.label }}
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="card">
          <div class="card-title">总消耗</div>
          <div class="card-value">
            ${{ formatCost(stats?.total_cost) }}
            <span class="card-unit">USD</span>
          </div>
        </div>
        <div class="card">
          <div class="card-title">总 Token</div>
          <div class="card-value">
            {{ formatNumber(stats?.total_tokens) }}
          </div>
        </div>
        <div class="card">
          <div class="card-title">总请求数</div>
          <div class="card-value">
            {{ formatNumber(stats?.total_requests) }}
          </div>
        </div>
        <div class="card">
          <div class="card-title">活跃 Keys</div>
          <div class="card-value">
            {{ stats?.active_keys || 0 }}
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-container card">
        <div class="card-title">每日消耗趋势</div>
        <div class="chart-box">
          <svg v-if="chartData.length" class="chart-svg" viewBox="0 0 800 220" preserveAspectRatio="none">
            <!-- Grid lines -->
            <line v-for="(_, i) in 5" :key="'g'+i" x1="0" :y1="20 + i * 40" x2="800" :y2="20 + i * 40" stroke="#333" stroke-width="0.5" />
            <!-- Area fill -->
            <path :d="areaPath" fill="url(#grad)" opacity="0.3" />
            <!-- Line -->
            <path :d="linePath" fill="none" stroke="#4f9cff" stroke-width="2" />
            <!-- Dots -->
            <circle
              v-for="(d, i) in chartData"
              :key="'c'+i"
              :cx="chartX(i)"
              :cy="chartY(d.cost)"
              r="3"
              fill="#4f9cff"
              stroke="#1a1a1a"
              stroke-width="1.5"
            >
              <title>{{ d.date }} - ${{ d.cost.toFixed(4) }}</title>
            </circle>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4f9cff" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#4f9cff" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div v-else class="empty-state">
            <div class="empty-icon">📊</div>
            <p>{{ loading ? '加载中...' : '暂无数据' }}</p>
          </div>
        </div>
      </div>

      <!-- Bottom section: Model breakdown + Recent calls -->
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px;">
        <div class="card">
          <div class="card-title">模型分布</div>
          <div v-if="stats?.model_breakdown?.length" class="model-list">
            <div v-for="m in stats.model_breakdown" :key="m.model" class="model-item">
              <div class="model-header">
                <span class="model-name">{{ m.model }}</span>
                <span class="model-stats">${{ m.cost.toFixed(2) }} · {{ formatNumber(m.tokens) }} tokens</span>
              </div>
              <div class="model-bar">
                <div class="model-bar-fill" :style="{ width: modelPercent(m.cost) + '%' }"></div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="padding: 30px 0;">
            <p>暂无数据</p>
          </div>
        </div>

        <div class="card">
          <div class="card-title">最近调用</div>
          <div class="table-container">
            <table v-if="stats?.recent_calls?.length">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>模型</th>
                  <th>Tokens</th>
                  <th>消耗</th>
                  <th>Key</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="call in stats.recent_calls.slice(0, 15)" :key="call.id">
                  <td>{{ formatTime(call.created_at) }}</td>
                  <td><span class="badge badge-blue">{{ call.model }}</span></td>
                  <td>{{ formatNumber(call.tokens) }}</td>
                  <td>${{ call.cost.toFixed(6) }}</td>
                  <td style="color: var(--text-secondary); font-size: 12px;">{{ call.api_key_name }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>暂无调用记录</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../api'
import type { DashboardStats, CostTrend } from '../types'

const loading = ref(false)
const stats = ref<DashboardStats | null>(null)
const costTrend = ref<CostTrend[]>([])
const selectedDays = ref(7)

const timeRanges = [
  { label: '近 7 天', value: 7 },
  { label: '近 30 天', value: 30 },
  { label: '近 60 天', value: 60 },
]

async function fetchData() {
  loading.value = true
  try {
    const [s, t] = await Promise.all([
      api.getStats(selectedDays.value),
      api.getCostTrend(selectedDays.value),
    ])
    stats.value = s
    costTrend.value = t
  } catch (e) {
    console.error('Failed to fetch data', e)
  } finally {
    loading.value = false
  }
}

function changeTimeRange(days: number) {
  selectedDays.value = days
  fetchData()
}

onMounted(fetchData)

// Chart computations
const chartData = computed(() => costTrend.value || [])

const maxCost = computed(() => {
  if (!chartData.value.length) return 1
  return Math.max(...chartData.value.map(d => d.cost), 0.001)
})

const chartX = (i: number) => {
  const len = chartData.value.length
  if (len <= 1) return 400
  return 40 + (i / (len - 1)) * 720
}

const chartY = (val: number) => {
  if (maxCost.value === 0) return 200
  return 200 - (val / maxCost.value) * 170
}

const linePath = computed(() => {
  if (!chartData.value.length) return ''
  return chartData.value.map((d, i) => {
    const x = chartX(i)
    const y = chartY(d.cost)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
})

const areaPath = computed(() => {
  if (!chartData.value.length) return ''
  const first = chartX(0)
  const last = chartX(chartData.value.length - 1)
  const line = linePath.value
  return `${line} L${last},200 L${first},200 Z`
})

const modelPercent = (cost: number) => {
  if (!stats.value?.model_breakdown?.length) return 0
  const max = Math.max(...stats.value.model_breakdown.map(m => m.cost))
  return max > 0 ? (cost / max) * 100 : 0
}

function formatCost(val?: number) {
  if (val === undefined || val === null) return '0.00'
  return val.toFixed(2)
}

function formatNumber(val?: number) {
  if (val === undefined || val === null) return '0'
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
  return val.toLocaleString()
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hour = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hour}:${min}`
}
</script>
