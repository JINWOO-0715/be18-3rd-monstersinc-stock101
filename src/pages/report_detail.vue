<template>
  <section class="report-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">전문가 리포트를 불러오는 중...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-text">{{ error }}</p>
      <button class="retry-btn" @click="fetchReport">다시 시도</button>
    </div>

    <!-- Main Content -->
    <div v-else class="report-container">
      <!-- 1. Report Header -->
      <ReportHeader
        :title="reportData.title"
        :content="reportData.content"
        :tag="reportData.tag"
        :investment-grade="reportData.investment_grade"
        :date="reportData.date"
        :stock-id="reportData.stockId"
        :stock-name="reportData.stockName"
        :ticker="reportData.ticker"
      />

      <!-- 2. Key Metrics Dashboard -->
      <section class="dashboard-section">
        <h2 class="dashboard-title">
          <span class="dashboard-icon">📈</span>
          핵심 지표 대시보드
        </h2>

        <div class="dashboard-grid">
          <!-- Left: Metric Cards + Data Table -->
          <div class="dashboard-left">
            <MetricCards :metrics="metricsRows" />

            <!-- Detailed Metrics Table -->
            <div v-if="metricsRows.length > 0" class="metrics-table-card">
              <h3 class="table-title">데이터 상세</h3>
              <div class="table-wrapper">
                <table class="metrics-table">
                  <thead>
                    <tr>
                      <th>항목</th>
                      <th class="text-right">당기</th>
                      <th class="text-right">전기</th>
                      <th class="text-right">증감</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in metricsRows" :key="idx">
                      <td class="metric-name">{{ row.item }}</td>
                      <td class="metric-value">{{ row.current }}</td>
                      <td class="metric-value">{{ row.previous }}</td>
                      <td :class="varianceClass(row.variance)">
                        {{ formatVariance(row.variance) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right: Sentiment Gauge + Risk Checklist -->
          <div class="dashboard-right">
            <SentimentGauge :score="sentimentScore" />
            <RiskChecklist :key-points="keyPointsList" />
          </div>
        </div>
      </section>

      <!-- 3. Detailed Analysis (2-column layout) -->
      <DetailedAnalysis
        :summary-content="reportData.summary_content"
        :prospect-content="reportData.prospect_content"
      />

      <!-- 4. PDF Viewer (if available) -->
      <section v-if="reportData.pdfUrl" class="pdf-section">
        <div class="pdf-header">
          <h2 class="pdf-title">
            <span class="pdf-icon">📄</span>
            리포트 원문 뷰어
          </h2>
          <BaseButton class="download-btn" @click="handleDownload">
            <span class="btn-icon">⬇</span>
            PDF 다운로드
          </BaseButton>
        </div>
        <PdfViewer :fileUrl="reportData.pdfUrl" />
      </section>

      <!-- 5. Recommended Reports Sidebar (Optional) -->
      <aside v-if="recommendedReports.length > 0" class="recommendations">
        <h3 class="recommendations-title">비슷한 업종 리포트</h3>
        <div class="recommendation-list">
          <div
            v-for="rec in recommendedReports"
            :key="rec.id"
            class="recommendation-item"
            @click="goReport(rec.id)"
          >
            <div class="rec-thumb">
              <img :src="rec.image" :alt="rec.title" />
            </div>
            <div class="rec-info">
              <h4 class="rec-title">{{ rec.title }}</h4>
              <span class="rec-stock">{{ rec.stockName }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '@/api'

// Import new components
import ReportHeader from '@/components/report/ReportHeader.vue'
import MetricCards from '@/components/report/MetricCards.vue'
import SentimentGauge from '@/components/report/SentimentGauge.vue'
import RiskChecklist from '@/components/report/RiskChecklist.vue'
import DetailedAnalysis from '@/components/report/DetailedAnalysis.vue'
import PdfViewer from '@/components/pdf/PdfViewer.vue'
import BaseButton from '@/components/button/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const reportId = route.params.id

const loading = ref(true)
const error = ref('')

const reportData = ref({
  id: reportId,
  stockId: '',
  stockName: '',
  ticker: '',
  title: '',
  content: '',
  investment_grade: '',
  date: '',
  tag: '',
  pdfUrl: '',
  metrics_data: null,
  key_points: null,
  summary_content: '',
  prospect_content: '',
  sentiment_score: 0.75 // Default value
})

const recommendedReports = ref([
  { id: 101, title: 'SK하이닉스 Q3 전망', stockName: 'SK하이닉스', image: 'https://picsum.photos/seed/sk/100/70' },
  { id: 102, title: 'LG에너지솔루션 배터리 분석', stockName: 'LG에너지솔루션', image: 'https://picsum.photos/seed/lg/100/70' },
  { id: 103, title: '한미반도체 공정 분석', stockName: '한미반도체', image: 'https://picsum.photos/seed/hanmi/100/70' }
])

// Parse metrics_data JSON
const metricsRows = computed(() => {
  try {
    const data = reportData.value.metrics_data
    if (!data) return []
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

// Parse key_points JSON
const keyPointsList = computed(() => {
  try {
    const data = reportData.value.key_points
    if (!data) return []
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

// Sentiment score (0-1)
const sentimentScore = computed(() => {
  return reportData.value.sentiment_score || 0.5
})

// Variance styling helpers
const varianceClass = (variance) => {
  const num = parseFloat(variance)
  if (isNaN(num)) return 'metric-variance'
  if (num > 0) return 'metric-variance variance-positive'
  if (num < 0) return 'metric-variance variance-negative'
  return 'metric-variance'
}

const formatVariance = (variance) => {
  const num = parseFloat(variance)
  if (isNaN(num)) return variance || '-'
  const sign = num > 0 ? '+' : ''
  return `${sign}${num}%`
}

// Fetch report data from API
const fetchReport = async () => {
  try {
    loading.value = true
    error.value = ''
    const { data } = await apiClient.get(`/api/disclosure/reports/${reportId}`)
    console.log('📄 리포트 상세 조회:', data)

    const report = data.items ? data.items[0] : data

    // Map backend fields to frontend fields
    reportData.value = {
      id: report.reportId || report.id || reportId,
      stockId: report.stockId || '',
      stockName: report.stockName || '',
      ticker: report.ticker || '',
      title: report.title || '',
      content: report.content || '',
      investment_grade: report.investmentGrade || report.investment_grade || '',
      date: formatDate(report.createdAt || report.date || ''),
      tag: report.tag || '분석리포트',
      pdfUrl: report.pdfUrl || '',
      metrics_data: report.metricsData || report.metrics_data || null,
      key_points: report.keyPoints || report.key_points || null,
      summary_content: report.summaryContent || report.summary_content || '',
      prospect_content: report.prospectContent || report.prospect_content || '',
      sentiment_score: report.sentimentScore || report.sentiment_score || 0.75
    }
  } catch (e) {
    console.error('리포트 조회 실패:', e)
    error.value = '리포트를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.'
  } finally {
    loading.value = false
  }
}

// Format date helper (ISO 8601 → YYYY.MM.DD)
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const goReport = (id) => router.push(`/report/${id}`)
const handleDownload = () => window.open(reportData.value.pdfUrl, '_blank')

onMounted(() => {
  window.scrollTo(0, 0)
  fetchReport()
})
</script>

<style scoped>
/* Base Layout */
.report-page {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  padding: 48px 24px;
}

.report-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 5px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #475569;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
}

.error-icon {
  font-size: 64px;
}

.error-text {
  color: #dc2626;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.retry-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
}

/* Dashboard Section */
.dashboard-section {
  background: white;
  padding: 40px;
  border-radius: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 32px;
  padding-bottom: 20px;
  border-bottom: 3px solid #e2e8f0;
  letter-spacing: -0.02em;
}

.dashboard-icon {
  font-size: 32px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 32px;
}

.dashboard-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Metrics Table Card */
.metrics-table-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
}

.table-title {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 20px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.metrics-table thead th {
  text-align: left;
  padding: 14px 12px;
  font-weight: 700;
  color: #64748b;
  font-size: 13px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.metrics-table thead th.text-right {
  text-align: right;
}

.metrics-table tbody td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.metrics-table tbody tr:last-child td {
  border-bottom: none;
}

.metrics-table tbody tr:hover {
  background: #f8fafc;
}

.metric-name {
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.metric-value {
  text-align: right;
  color: #334155;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.metric-variance {
  text-align: right;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.variance-positive {
  color: #dc2626;
}

.variance-negative {
  color: #2563eb;
}

/* PDF Section */
.pdf-section {
  background: white;
  padding: 40px;
  border-radius: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.pdf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.pdf-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.pdf-icon {
  font-size: 26px;
}

.download-btn {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border-radius: 14px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2);
}

.btn-icon {
  font-size: 16px;
}

/* Recommendations */
.recommendations {
  background: white;
  padding: 32px;
  border-radius: 28px;
  border: 1px solid #e2e8f0;
}

.recommendations-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 24px;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recommendation-item {
  display: flex;
  gap: 16px;
  cursor: pointer;
  padding: 16px;
  border-radius: 14px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.recommendation-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
  transform: translateX(6px);
}

.rec-thumb img {
  width: 100px;
  height: 70px;
  border-radius: 10px;
  object-fit: cover;
}

.rec-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.rec-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.4;
}

.rec-stock {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .report-container {
    gap: 32px;
  }
}

@media (max-width: 768px) {
  .report-page {
    padding: 24px 16px;
  }

  .report-container {
    gap: 24px;
  }

  .dashboard-section {
    padding: 24px;
  }

  .dashboard-title {
    font-size: 24px;
  }

  .pdf-section {
    padding: 24px;
  }

  .pdf-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
