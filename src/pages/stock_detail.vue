<template>
  <section class="page">
    <!-- 1. 상단: 기본 정보 영역 -->
    <header class="hero">
      <div class="hero-card">
        <div class="hero-main">
          <h1 v-if="stockInfo?.name" class="hero-title">{{  stockInfo.name}}
            <span v-if="stockInfo?.stockCode" class="ticker-code">({{ stockInfo?.stockCode }})</span>
          </h1>

          <div v-if="indicatorPills.length" class="hero-indicators">
            <div v-for="indicator in indicatorPills" :key="indicator.key" class="indicator-item">
              <span class="indicator-label">{{ indicator.title }}</span>
              <Pill :text="indicator.text" :variant="indicator.variant" tone="solid" size="sm" />
            </div>
          </div>
        </div>
      </div>

      <!-- 상단 정보 확장: 차트 -->
      <div class="hero-extended">
        <div class="hero-chart">
          <StockDailyChart :stockCode="stockInfo?.stockCode" :stockName="stockInfo?.name" />
        </div>
      </div>
    </header>

    <!-- 탭 네비게이션 -->
    <nav class="tab-nav">
      <button 
        :class="['tab-btn', { active: activeTab === 'analysis' }]" 
        @click="activeTab = 'analysis'"
      >
        📚 AI 정밀 분석
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'disclosure' }]" 
        @click="activeTab = 'disclosure'"
      >
        📋 최근 공시
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'discussion' }]" 
        @click="activeTab = 'discussion'"
      >
        💬 투자자 토론
      </button>
    </nav>

    <!-- 탭 콘텐츠: AI 정밀 분석 -->
    <template v-if="activeTab === 'analysis'">
      <section class="analysis-grid">
        <div class="analysis-grid__left">
          <PdfAnalysisDashboard :stockId="Number(stockId)" @uploaded="url => uploadedPdfUrl = url" />
        </div>
        <div class="analysis-grid__right">
          <div class="related-reports">
            <h3 class="related-reports__title">관련 리포트</h3>
            <div v-if="topThreeReports.length > 0" class="report-list">
              <article
                v-for="report in topThreeReports"
                :key="report.id"
                class="report-card"
                @click="$router.push(`/report/${report.id}`)"
              >
                <h4 class="report-card__title">{{ report.title }}</h4>
                <p class="report-card__summary">{{ report.content }}</p>
                <div class="report-card__meta">
                  <span>{{ report.date }}</span>
                  <span v-if="report.investment_grade" class="report-grade" :class="`grade-${report.investment_grade}`">
                    {{ report.investment_grade }}
                  </span>
                </div>
              </article>
            </div>
            <p v-else class="empty-text">관련 리포트가 없습니다.</p>
          </div>
        </div>
      </section>
    </template>

    <!-- 탭 콘텐츠: 최근 공시 -->
    <template v-else-if="activeTab === 'disclosure'">
      <section class="sec">
        <h2 class="sec-title">최근 공시 (DART)</h2>
        <div v-if="disclosuresList.count > 0" class="disclosure-table-wrap">
          <table class="disclosure-table">
            <thead>
              <tr>
                <th>접수일</th>
                <th>보고서명</th>
                <th>회사명</th>
                <th>공시유형</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in disclosuresList.disclosures" :key="item.rceptNo || item.rceptNo" class="disclosure-row">
                <td class="disclosure-date">
                  <div>{{ formatDateFromBackend(item.receptionDate) }}</div>
                  <div class="disclosure-time"></div>
                </td>
                <td class="disclosure-report">
                  <a :href="`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rceptNo}`" 
                     target="_blank" 
                     class="disclosure-link">
                    {{ item.reportName }}
                  </a>
                </td>
                <td class="disclosure-submitter">{{ item.corpName }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty-text">최근 30일 내 공시가 없습니다.</p>
      </section>
    </template>

    <!-- 탭 콘텐츠: 투자자 토론 -->
    <template v-else-if="activeTab === 'discussion'">
      <section class="discussion-container">
        <!-- 기존 피드 임시 배치 (이후 고도화 예정) -->
        <div class="community-wrapper-full">
          <CommunityFeed :stockId="Number(stockId)" :embedded="true" />
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Pill from '@/components/ui/Pill.vue'
import StockDailyChart from '@/components/chart/StockDailyChart.vue'
import CommunityFeed from '@/views/CommunityFeedView.vue'
import PdfAnalysisDashboard from '@/components/pdf/PdfAnalysisDashboard.vue'
// PdfViewer removed; replaced by related reports mock in template
import { getStockSummaryInfo } from '@/api/stockSerivce'
import { DartReportgetDartReports } from '@/api/dartService'
import { getReportsByStockId, type ReportsResponse } from '@/api/reportService'

import type {StockPriceResponse,DailyPrice,StockSummaryInfo} from '@/types/stock'
import type {DartReportResponse,DartReport} from '@/types/dart'


const route = useRoute()
const stockId = ref(route.params.stockId ?? '')
const activeTab = ref('analysis')
const stockInfo = ref<StockSummaryInfo | null>(null)
const uploadedPdfUrl = ref(null)
const disclosuresList = ref<DartReportResponse | null>(null)
const relatedReports = ref<ReportsResponse | null>(null)

// 관련 리포트 상위 3개만
const topThreeReports = computed(() => {
  if (!relatedReports.value || !relatedReports.value.items) return []
  return relatedReports.value.items.slice(0, 3)
})

// -----------------------------------------FUNCTIONS--------------------------------------------------

onMounted(async () => {
  const id = Array.isArray(stockId.value) ? stockId.value[0] : stockId.value;
  if (!id) return;
  try{
    stockInfo.value = await getStockSummaryInfo(id);

  // 2. stockInfo 로드 후, 해당 정보를 사용하는 API들을 병렬로 호출
    if (stockInfo.value && stockInfo.value.stockCode) {
      const [disclosures, reports] = await Promise.all([
        DartReportgetDartReports(stockInfo.value.stockCode), // 공시 정보
        getReportsByStockId(id) // 관련 리포트
      ]);

      // 3. 결과값을 각각의 ref 변수에 할당
      disclosuresList.value = disclosures;
      relatedReports.value = reports;
    }
  } catch (error) {
    // Error loading stock data
  }
  
});



const readStoredToken = () => {
  const raw = localStorage.getItem('AuthToken') ?? localStorage.getItem('authToken') ?? ''
  return typeof raw === 'string' ? raw.trim() : ''
}

const authToken = ref(readStoredToken())
const isLoggedIn = computed(() => authToken.value.length > 0)


const formatDateFromBackend = (dateStr) => {
  if (!dateStr) return '—'
  // ISO 형식(YYYY-MM-DD) 또는 LocalDate를 YYYY.MM.DD로 변환
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const getReportTypeLabel = (reportType) => {
  const typeMap = {
    'A': '정기공시',
    'B': '주요사항보고',
    'C': '발행공시',
    'D': '지분공시',
    'E': '기타공시',
    'F': '외부감사',
    'G': '펀드공시',
    'H': '자산유동화',
    'mo': '거래소공시',
    'J': '공정위공시'
  }
  return typeMap[reportType] || reportType || '—'
}

const getReportTypeClass = (reportType) => {
  // reportType을 CSS 클래스명으로 변환
  const classMap = {
    'A': 'Y',  // 정기공시 → 유가증권 스타일
    'B': 'K',  // 주요사항보고 → 코스닥 스타일
    'C': 'N',  // 발행공시 → 코넥스 스타일
  }
  return classMap[reportType] || 'E'
}




const indicatorPills = computed(() => []) // To be implemented with original logic if needed








watch(() => route.params.stockId, async (next) => {
  if (next) {
    stockId.value = next
    const id = Array.isArray(stockId.value) ? stockId.value[0] : stockId.value;
    if (!id) return;
    try{
      stockInfo.value = await getStockSummaryInfo(id);

      if (stockInfo.value && stockInfo.value.stockCode) {
        const [disclosures, reports] = await Promise.all([
          DartReportgetDartReports(stockInfo.value.stockCode),
          getReportsByStockId(id)
        ]);

        disclosuresList.value = disclosures;
        relatedReports.value = reports;
      }
    } catch (error) {
      // Error loading stock data
    }
  }
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 28px; padding: 32px; max-width: 1400px; margin: 0 auto; background: var(--bg); min-height: 100vh; }

/* 공통 섹션 스타일 */
.sec { display: flex; flex-direction: column; gap: 24px; }
.sec-title { font-size: 22px; font-weight: 800; color: var(--brand-sub); letter-spacing: -0.025em; display: flex; align-items: center; gap: 8px; }
  .sec-title::before { content: ''; width: 4px; height: 18px; background: var(--brand-main); border-radius: 2px; }

/* 히어로 카드 개선 */
.hero-card { display: flex; justify-content: flex-start; align-items: flex-start; padding: 32px; border-radius: var(--card-radius); background: var(--card-bg); border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 6px 14px rgba(15,23,42,0.04); }
.hero-main { display: flex; flex-direction: column; gap: 12px; }
.hero-tags { display: flex; gap: 8px; }
.hero-title { margin: 0; font-size: 44px; font-weight: 900; color: var(--brand-sub); letter-spacing: -0.03em; }
.ticker-code { font-size: 14px; font-weight: 600; color: #94a3b8; margin-left: 10px; }
.hero-company { font-size: 18px; color: #64748b; font-weight: 500; margin: 0; }
.hero-desc { font-size: 14px; color: #94a3b8; margin: 0; }

/* 확장 영역 (차트) */
.hero-extended { margin-top: 20px; }
.hero-chart { background: var(--card-bg); border-radius: calc(var(--card-radius)); border: 1px solid rgba(226, 232, 240, 0.8); padding: 28px; min-height: 420px; box-shadow: 0 6px 14px rgba(15,23,42,0.04); }

/* 탭 네비게이션 */
.tab-nav { display: flex; gap: 24px; padding: 0 24px; border-bottom: 1px solid rgba(226,232,240,0.8); margin-top: -6px; }
.tab-btn { background: none; border: none; padding: 12px 0; font-size: 18px; font-weight: 700; color: #94a3b8; cursor: pointer; transition: all 0.18s; position: relative; }
.tab-btn:hover { color: var(--brand-sub); }
.tab-btn.active { color: var(--brand-sub); }
.tab-btn.active::after { content: ''; position: absolute; bottom: -6px; left: 0; width: 100%; height: 3px; background: var(--brand-sub); border-radius: 999px; }

/* 재무 테이블 스타일 */
.financial-table-wrap {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  margin-top: 20px;
}

.financial-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.financial-table th {
  padding: 16px;
  border-bottom: 2px solid #f1f5f9;
  color: #64748b;
  font-size: 14px;
}

.financial-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

  .financial-table .pos { color: var(--brand-main); }
.financial-table .neg { color: var(--brand-deep-blue); }

/* 토론 영역 전용 */
.community-wrapper-full { background: white; border-radius: 32px; border: 1px solid rgba(226, 232, 240, 0.8); padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04); }

/* 중단/하단 공통 카드 */
.analysis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }

.related-reports { background: var(--card-bg); border-radius: 12px; padding: 18px; border: 1px solid rgba(226,232,240,0.8); }
.related-reports__title { margin: 0 0 12px; font-size: 18px; color: var(--brand-sub); font-weight: 800 }
.report-list { display: flex; flex-direction: column; gap: 12px }
.report-card { background: white; border-radius: 10px; padding: 14px; box-shadow: 0 6px 12px rgba(15,23,42,0.04); border: 1px solid #eef2f6; cursor: pointer; transition: all 0.2s; }
.report-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(15,23,42,0.08); }
.report-card__title { margin: 0 0 6px; font-size: 16px; font-weight: 800; color: var(--brand-sub) }
.report-card__summary { margin: 0 0 8px; color: #475569; font-size: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.report-card__meta { font-size: 12px; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.report-grade { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; }
.report-grade.grade-매수 { background: #dcfce7; color: #15803d; }
.report-grade.grade-보유 { background: #fff7ed; color: #c2410c; }
.report-grade.grade-주의 { background: #fef2f2; color: #dc2626; }

/* DART 공시 스타일 */
.disclosure-table-wrap {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.disclosure-table {
  width: 100%;
  border-collapse: collapse;
}

.disclosure-table thead {
  background: var(--bg);
  border-bottom: 2px solid #e2e8f0;
}

.disclosure-table th {
  padding: 16px 20px;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.disclosure-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.disclosure-table tbody tr:hover {
  background: var(--bg);
}

.disclosure-table tbody tr:last-child {
  border-bottom: none;
}

.disclosure-table td {
  padding: 16px 20px;
  font-size: 14px;
  vertical-align: middle;
}

.disclosure-date {
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
  min-width: 110px;
}

.disclosure-time {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.disclosure-report {
  min-width: 300px;
}

.disclosure-link {
  color: var(--brand-deep-blue);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.disclosure-link:hover {
  color: var(--brand-deep-blue);
  text-decoration: underline;
}

.disclosure-link::before {
  content: '📄';
  font-size: 16px;
}

.disclosure-submitter {
  color: #1e293b;
  font-weight: 500;
  min-width: 120px;
}

.disclosure-market {
  text-align: center;
  min-width: 80px;
}

.market-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.market-badge.market-Y {
  background: #dbeafe;
  color: #1e40af;
}

.market-badge.market-K {
  background: #fef3c7;
  color: #92400e;
}

.market-badge.market-N {
  background: #f3e8ff;
  color: #6b21a8;
}

.market-badge.market-E {
  background: #f1f5f9;
  color: #64748b;
}

.empty-text {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 15px;
  font-weight: 500;
}

@media (max-width: 1200px) {
  .hero-extended, .analysis-grid, .tab-nav { grid-template-columns: 1fr; gap: 16px; }
  .tab-nav { gap: 20px; }
  .page { padding: 20px; }
  .hero-card { flex-direction: column; gap: 24px; text-align: center; }
}
</style>
