<template>
  <div class="stock-chart-container">
    <div v-if="stockData" class="chart-header">
      <div class="header-main">
        <h2 class="stock-title">
          <span class="name">{{ stockData.stockName }}</span>
          <span class="code">{{ stockData.stockCode }}</span>
        </h2>
        <div v-if="latestPrice" class="price-badge">{{ latestPrice }}</div>
      </div>
      
      <div class="header-controls">
        <div class="button-group">
          <button 
            v-for="range in rangeOptions"
            :key="range.label"
            :class="['flat-btn', { active: selectedRange === range.label }]"
            @click="selectedRange = range.label"
          >
            {{ range.label }}
          </button>
        </div>
        
        <div class="button-group type-toggle">
          <button 
            v-for="type in chartTypes"
            :key="type.value"
            :class="['flat-btn', { active: chartType === type.value }]"
            @click="chartType = type.value"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="chart-area">
      <v-chart 
        v-if="!isLoading && processedPrices.length > 0"
        class="chart"
        :option="chartOptions" 
        autoresize
      />
      <div v-else class="chart-status">
        <span v-if="isLoading" class="loading-text">📊 데이터를 분석 중입니다...</span>
        <span v-else>📭 표시할 차트 데이터가 없습니다.</span>
      </div>
    </div>

    <div class="chart-footer">
      <div class="info-tag">{{ dataRangeText }}</div>
      <div v-if="stockData" class="update-tag">Last Update: {{ stockData.lastUpdated }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { CandlestickChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, DataZoomComponent } from 'echarts/components'
import VChart from 'vue-echarts'

import { getDailyPrices } from '@/api/stockSerivce'
import type { StockPriceResponse, DailyPrice } from '@/types/stock'

// ECharts 필수 구성요소 등록
use([CanvasRenderer, CandlestickChart, TooltipComponent, GridComponent, DataZoomComponent])

interface Props {
  stockCode: string
}
const props = defineProps<Props>()

// --- 상태 관리 ---
const stockData = ref<StockPriceResponse | null>(null)
const selectedRange = ref('1M')
const chartType = ref<'daily' | 'weekly' | 'monthly'>('daily')
const isLoading = ref(false)

const rangeOptions = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: 5000 }
]

const chartTypes = [
  { label: '일봉', value: 'daily' },
  { label: '주봉', value: 'weekly' },
  { label: '월봉', value: 'monthly' }
] as const

// --- 데이터 페칭 ---
const fetchStockChart = async (code: string) => {
  if (!code || code === '—') return
  isLoading.value = true
  try {
    const data = await getDailyPrices(code, 600)
    stockData.value = data
  } catch (error) {
    console.error('차트 데이터 로드 실패:', error)
    stockData.value = null
  } finally {
    isLoading.value = false
  }
}

// --- 유틸리티: 주봉/월봉 변환 ---
const convertToWeekly = (dailyData: DailyPrice[]) => {
  if (!dailyData.length) return []
  const sorted = [...dailyData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const groups: any[] = []
  
  sorted.forEach(p => {
    const d = new Date(p.date)
    const day = (d.getDay() + 6) % 7
    const monday = new Date(d); monday.setDate(d.getDate() - day); monday.setHours(0,0,0,0)
    const key = monday.toISOString().slice(0, 10)
    
    let last = groups[groups.length - 1]
    if (!last || last.weekKey !== key) {
      groups.push({ ...p, weekKey: key, open: p.open, high: p.high, low: p.low, close: p.close })
    } else {
      last.high = Math.max(Number(last.high), Number(p.high))
      last.low = Math.min(Number(last.low), Number(p.low))
      last.close = p.close
      last.date = p.date
    }
  })
  return groups
}

const convertToMonthly = (dailyData: DailyPrice[]) => {
  if (!dailyData.length) return []
  const sorted = [...dailyData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const groups: any[] = []
  
  sorted.forEach(p => {
    const key = p.date.slice(0, 7) // YYYY-MM
    let last = groups[groups.length - 1]
    if (!last || last.date.slice(0, 7) !== key) {
      groups.push({ ...p, open: p.open, high: p.high, low: p.low, close: p.close })
    } else {
      last.high = Math.max(Number(last.high), Number(p.high))
      last.low = Math.min(Number(last.low), Number(p.low))
      last.close = p.close
      last.date = p.date
    }
  })
  return groups
}

// --- 데이터 가공 ---
const processedPrices = computed(() => {
  if (!stockData.value?.prices) return []
  const days = rangeOptions.find(r => r.label === selectedRange.value)?.days || 30
  const sliced = stockData.value.prices.slice(-days)
  
  if (chartType.value === 'weekly') return convertToWeekly(sliced)
  if (chartType.value === 'monthly') return convertToMonthly(sliced)
  return sliced
})

// --- ECharts 옵션 ---
const chartOptions = computed(() => {
  const dates = processedPrices.value.map(p => p.date)
  const values = processedPrices.value.map(p => [Number(p.open), Number(p.close), Number(p.low), Number(p.high)])

  // 읽기 쉬운 색상 토큰을 CSS 변수에서 가져옵니다 (런타임)
  const _root = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const _pointRed = _root?.getPropertyValue('--brand-main')?.trim() || '#E02D2D'
  const _deepBlue = _root?.getPropertyValue('--brand-deep-blue')?.trim() || '#2D72ED'

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', lineStyle: { color: '#94a3b8' } },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
      textStyle: { color: 'var(--brand-sub)', fontSize: 12 }
    },
    grid: { left: '45', right: '15', top: '20', bottom: '65', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    yAxis: {
      scale: true,
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    dataZoom: [
      { type: 'inside' }, 
      { 
        type: 'slider', 
        height: 18, 
        bottom: 10, 
        borderColor: 'transparent',
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#F5F7FA',
        fillerColor: 'rgba(45, 114, 237, 0.08)',
        handleSize: '0%', // 핸들을 숨겨 더 깔끔하게 처리
        showDetail: false
      }
    ],
    series: [{
      type: 'candlestick',
      data: values,
      itemStyle: {
        // 한국 관행: 상승(양봉)=빨강, 하락(음봉)=파랑
        color: _pointRed,
        color0: _deepBlue,
        borderColor: _pointRed,
        borderColor0: _deepBlue
      }
    }]
  }
})

const latestPrice = computed(() => {
  const prices = stockData.value?.prices
  if (!prices?.length) return ''
  return `${Number(prices[prices.length - 1].close).toLocaleString()}원`
})

const dataRangeText = computed(() => {
  const data = processedPrices.value
  if (!data.length) return '데이터 없음'
  return `${data[0].date} ~ ${data[data.length - 1].date} (${data.length}개 봉)`
})

watch(() => props.stockCode, (newCode) => fetchStockChart(newCode), { immediate: true })
</script>

<style scoped>
.stock-chart-container {
  font-family: 'Pretendard', sans-serif;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #f1f5f9;
}

.chart-header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
.header-main { display: flex; align-items: center; justify-content: space-between; }
.stock-title { display: flex; align-items: baseline; gap: 6px; margin: 0; }
.stock-title .name { font-size: 20px; font-weight: 700; color: #1e293b; }
.stock-title .code { font-size: 13px; color: #94a3b8; }
.price-badge { background: #eff6ff; color: var(--brand-deep-blue); padding: 6px 12px; border-radius: 8px; font-weight: 700; }

.header-controls { display: flex; justify-content: space-between; }
.button-group { display: flex; background: #f1f5f9; padding: 4px; border-radius: 8px; gap: 2px; }
.flat-btn { 
  border: none; background: transparent; padding: 5px 12px; 
  font-size: 12px; font-weight: 600; color: #64748b; 
  cursor: pointer; border-radius: 6px; transition: 0.2s;
}
.flat-btn.active { background: var(--brand-sub); color: #fff; box-shadow: 0 4px 10px rgba(45,55,72,0.12); }

.chart-area { min-height: 400px; position: relative; }
.chart { height: 400px; width: 100%; }
.chart-status { height: 400px; display: flex; align-items: center; justify-content: center; color: #94a3b8; }

.chart-footer { display: flex; justify-content: space-between; margin-top: 12px; font-size: 11px; color: #cbd5e1; }
</style>