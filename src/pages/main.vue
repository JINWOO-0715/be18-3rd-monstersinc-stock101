<template>
  <section class="page">
    <!-- 1. 상단 히트맵/지수 바 -->
    <!-- indices moved to Header for unified layout -->

    <!-- 2. 헤더 및 중앙 검색바 -->
    <header class="hero">
      <div class="hero__content">
        <h1>Stock 101</h1>
        <p class="tagline">종목명 또는 공시 키워드로 스마트하게 검색하세요.</p>

        <div class="search-wrap">
          <div class="search-container">
            <span class="search-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11" cy="11" r="6" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <input type="text" class="main-search" placeholder="종목명 또는 종목 코드 검색 예) 삼성전자" 
              :value="searchQuery"
              @input="searchQuery = $event.target.value"
              @focus="showDropdown = true" @blur="handleBlur" @keyup.enter="handleSearch" />
            <BaseButton class="search-btn" @click="handleSearch">검색</BaseButton>
          </div>

          <!-- 검색 드롭다운 -->
          <div v-if="showDropdown && searchQuery.trim() && filteredStocks.length > 0" class="search-dropdown" ref="dropdownRef">
            <ul class="suggestion-list" ref="suggestionListRef">
              <li v-for="item in filteredStocks" :key="item.id" class="suggestion-item"
                @mousedown="selectSuggestion(item)">
                <div class="suggestion-info">
                  <div class="suggestion-main">
                    <span class="suggestion-name">{{ item.name }}</span>
                    <span class="suggestion-market">{{ item.marketName }}</span>
                  </div>
                  <span class="suggestion-symbol">{{ item.symbol }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

    
    </header>

    <!-- 3. 최신 분석 리포트 섹션 (핵심) -->
    <section class="sec">
      <div class="sec__header">
        <h2 class="sec__title">최신 분석 리포트</h2>
        <a href="#" class="sec__more">더보기</a>
      </div>
      <BaseGrid :items="latestReports" :cols="4" gap="20px" itemKey="id">
        <template #default="{ item }">
          <AnalysisReportCard :title="item.title" :summary="item.summary" :image="item.image" :date="item.date"
            :author="item.author" :tag="item.tag" @click="goReport(item.id)" />
        </template>
      </BaseGrid>
    </section>

    <!-- 4. 지금 주목 받는 주식 -->
    <section class="sec">
      <h2 class="sec__title">지금 주목 받는 주식</h2>
      <div class="hot-stocks">
        <div class="hot-stocks__track">
          <StatCard v-for="item in hotStocks" :key="item.id" class="hot-stocks__card" :title="item.symbol"
            :subtitle="item.name" :value="item.price" locale="ko-KR" :currency="item.currency || 'KRW'" :change="item.change"
            :percentMode="true" :clickable="true" :metricSize="'lg'" @click="goStock(item.id)" />
        </div>
      </div>
    </section>

  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import BaseGrid from '@/components/grid/BaseGrid.vue'
import StatCard from '@/components/card/variants/StatCard.vue'
import NewsCard from '@/components/card/variants/NewsCard.vue'
import AnalysisReportCard from '@/components/card/variants/AnalysisReportCard.vue'
import BaseButton from '@/components/button/BaseButton.vue'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')
const showDropdown = ref(false)
const allStocks = ref([])
const hotStocks = ref([])
const isComposing = ref(false)
const dropdownRef = ref(null)
const suggestionListRef = ref(null)

// 필터링된 검색 결과를 computed로 계산
const filteredStocks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  
  if (!query) {
    return []
  }

  // allStocks에서 검색어가 포함된 종목 필터링
  // 종목명(name), 종목코드(symbol) 모두 검색
  return allStocks.value.filter(stock => {
    const name = stock.name.toLowerCase()
    const symbol = stock.symbol.toLowerCase()
    return name.includes(query) || symbol.includes(query)
  }).slice(0, 100) // 최대 100개까지만 표시
})

const handleBlur = () => {
  // mousedown 이벤트가 먼저 발생하도록 약간 지연
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const selectSuggestion = (item) => {
  searchQuery.value = item.name
  showDropdown.value = false
  goStock(item.id)
}

const goLogin = () => router.push({ path: '/auth/login', query: { type: 'login' } })
const goRegister = () => router.push({ path: '/auth/register', query: { type: 'register' } })
const goProfile = (userId) => {
  if (userId === 'me' && authStore.userInfo?.userId) {
    router.push({ path: `/profile/${authStore.userInfo.userId}` })
  } else {
    router.push({ path: `/profile/${userId}` })
  }
}
const goStock = (ticker) => router.push({ path: `/stock/${ticker}` })
const goReport = (reportId) => router.push({ path: `/report/${reportId}` })
const goLogout = () => {
  authStore.logout()
  router.push({ name: 'main' })
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return

  try {
    // 필터링된 결과에서 첫 번째 항목으로 이동
    if (filteredStocks.value.length > 0) {
      goStock(filteredStocks.value[0].id)
      showDropdown.value = false
    } else {
      alert('해당하는 종목을 찾을 수 없습니다.')
    }
  } catch (error) {
    console.error('검색 오류:', error)
    alert('검색 중 오류가 발생했습니다.')
  }
}

const extractSource = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const indices = ref([])
const latestReports = ref([
  {
    id: 1,
    stockId: 1,
    title: '삼성전자 반기보고서 분석',
    summary: '영업이익 20% 상승, 부채비율 감소 등 재무 건전성 강화 확인',
    image: 'https://picsum.photos/seed/samsung/300/200',
    date: '2024.08.24',
    author: 'AI Analyst',
    tag: '반기보고서'
  },
  {
    id: 2,
    stockId: 2,
    title: '현대차 미래 전략 분석',
    summary: '신규 전기차 라인업 확대 및 생산 자동화로 수익성 개선 전망',
    image: 'https://picsum.photos/seed/hyundai/300/200',
    date: '2024.08.23',
    author: 'AI Analyst',
    tag: '경영계획'
  }
])

const fallbackStocks = [
  { id: 'stk1', symbol: 'NVDA', name: 'NVIDIA Corp.', price: 120.34, change: 2.45, marketName: 'NASDAQ', currency: 'USD' },
  { id: 'stk2', symbol: 'TSLA', name: 'Tesla Inc.', price: 215.12, change: -1.18, marketName: 'NASDAQ', currency: 'USD' },
]

onMounted(async () => {
  // 시장 지수 데이터 (KOSPI, KOSDAQ)
  // TODO: 백엔드 실시간 시장 지수 API 구현 시 연동
  indices.value = [
    { id: 'kospi', title: 'KOSPI', value: 2567.89, change: 1.23 },
    { id: 'kosdaq', title: 'KOSDAQ', value: 834.56, change: -0.89 },
  ]

  // 전체 주식 데이터 로드 (한 번만 호출)
  try {
    const { data } = await axios.get('/api/v1/stock')
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
    const mapped = items.map((item) => ({
      id: item.stockId,
      symbol: item.stockCode || item.symbol || item.name,
      name: item.name,
      price: item.price,
      change: item.fluctuation || item.change,
      marketName: item.marketName || 'KOSPI',
      currency: item.currency || (item.marketName && item.marketName.toUpperCase().includes('NASDAQ') ? 'USD' : 'KRW')
    }))

    allStocks.value = mapped
    hotStocks.value = mapped.length > 0 ? mapped.slice(0, 10) : fallbackStocks.map(s => ({ ...s }))
  } catch (error) {
    console.error('전체 주식 데이터를 불러오지 못했어요', error)
    
    // fallback: /api/v1/stock에서 로드 시도
    try {
      const { data } = await axios.get('/api/v1/stock')
      const items = Array.isArray(data?.items) ? data.items : []
      const mapped = items.map((item) => ({
        id: item.stockId,
        symbol: item.stockCode || item.name,
        name: item.name,
        price: item.price,
        change: item.fluctuation,
        marketName: 'KOSPI',
        currency: item.currency || 'KRW'
      }))
      allStocks.value = mapped
      hotStocks.value = mapped.length > 0 ? mapped.slice(0, 10) : fallbackStocks.map(s => ({ ...s }))
    } catch (fallbackError) {
      console.error('Fallback 주식 데이터 로드 실패:', fallbackError)
      hotStocks.value = fallbackStocks.map((item) => ({ ...item }))
    }
  }
})

</script>

<style scoped>
.page {
  padding: 0 0 40px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 상단 지수 바 */
.indices-bar {
  background: var(--bg);
  border-bottom: 1px solid rgba(0,0,0,0.04);
  padding: 12px 40px;
  overflow: hidden;
}

.indices-ticker {
  display: flex;
  gap: 40px;
  animation: scroll 30s linear infinite;
  white-space: nowrap;
}

.ticker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.ticker-item__title {
  color: #6b7280;
}

.ticker-item__value {
  color: #111827;
}

.ticker-item__change.pos {
  color: var(--brand-main);
}

.ticker-item__change.neg {
  color: var(--brand-deep-blue);
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

/* Hero */
.hero {
  padding: 40px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: transparent;
  position: relative;
}

.hero__content h1 {
  font-size: 48px;
  margin: 0 0 16px;
  letter-spacing: -1px;
}

.tagline {
  font-size: 20px;
  color: #6b7280;
  margin-bottom: 40px;
}

/* 검색바 */
.search-wrap {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  position: relative;
  z-index: 100;
}

/* search button color: use brand-sub (deep navy) to avoid conflicting with rise color */
.search-btn { background: var(--brand-sub); color: white; padding: 0 20px; border-radius: calc(var(--card-radius) - 4px); font-weight: 700 }
.search-btn:hover { filter: brightness(0.96) }


.search-container {
  display: flex;
  width: 100%;
  background: var(--card-bg);
  border-radius: var(--card-radius);
  padding: 12px;
  box-shadow: 0 20px 30px -8px rgba(15,23,42,0.08);
  border: 1px solid rgba(0,0,0,0.06);
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  background: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
  text-align: left;
}

.search-loading {
  padding: 20px;
  color: #6b7280;
  text-align: center;
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 360px;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

/* 드래그 스크롤 가능하도록 설정 */
.suggestion-list {
  cursor: grab;
}

.suggestion-list:active {
  cursor: grabbing;
}

.suggestion-item {
  padding: 16px 24px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: #f9fafb;
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestion-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggestion-market {
  font-size: 11px;
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}

.suggestion-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.suggestion-symbol {
  font-size: 13px;
  color: #6b7280;
}

.suggestion-keywords {
  display: flex;
  gap: 8px;
}

.keyword-tag {
  font-size: 12px;
  background: #eff6ff;
  color: var(--brand-deep-blue);
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 500;
}

.main-search {
  flex: 1;
  border: none;
  padding: 10px 16px 10px 40px; /* make room for icon */
  font-size: 16px;
  outline: none;
  border-radius: calc(var(--card-radius) - 4px);
}

.search-btn {
  background: var(--brand-sub);
  color: white;
  padding: 0 20px;
  border-radius: calc(var(--card-radius) - 4px);
  font-weight: 700;
}

.hero__actions {
  position: absolute;
  top: 20px;
  right: 40px;
  display: flex;
  gap: 8px;
}

.sec {
  padding: 28px;
  display: grid;
  gap: 24px;
}

.sec__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.sec__title {
  font-size: 24px;
  font-weight: 800;
  margin: 0;
}

.sec__more {
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
}

.hot-stocks {
  overflow: hidden;
}

.hot-stocks__track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 4px;
}

.hot-stocks__card {
  flex: 0 0 240px;
}

.news-col {
  display: grid;
  gap: 12px;
}
</style>
