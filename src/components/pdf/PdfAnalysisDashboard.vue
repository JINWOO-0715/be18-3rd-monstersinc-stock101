<template>
  <div class="pdf-dashboard">
    <div class="pdf-dashboard__header">
      <h2 class="pdf-dashboard__title">AI 리포트 분석 대시보드</h2>
      <div class="pdf-dashboard__upload">
        <input
          ref="fileInput"
          type="file"
          id="pdf-upload"
          accept="application/pdf"
          hidden
          @change="handleUpload"
        />
        <button class="upload-btn" @click.prevent="triggerUpload">
          <span class="icon">📁</span>
          PDF 업로드 및 분석
        </button>
      </div>
    </div>

    <div v-if="loading" class="pdf-dashboard__loading">
      <div class="spinner"></div>
      <p>AI가 문서를 분석하고 있습니다. 잠시만 기다려주세요...</p>
    </div>

    <div v-else-if="analysisResult" class="pdf-dashboard__content">
      <!-- AI 요약 -->
      <section class="analysis-section">
        <h3 class="section-title">✨ AI 요약 요약</h3>
        <div class="summary-text" v-html="formattedResult"></div>
      </section>

      <!-- 핵심 키워드 -->
      <section class="analysis-section">
        <h3 class="section-title">🔑 핵심 키워드</h3>
        <div class="keywords-list">
          <span v-for="kw in keywords" :key="kw" class="keyword-badge">{{ kw }}</span>
        </div>
      </section>

      <!-- 재무 하이라이트 -->
      <section class="analysis-section">
        <h3 class="section-title">📊 재무 하이라이트</h3>
        <div class="chart-container">
          <apexchart
            type="bar"
            height="250"
            :options="chartOptions"
            :series="chartSeries"
          ></apexchart>
        </div>
      </section>
    </div>

    <div v-else class="pdf-dashboard__empty">
      <p>공시 보고서를 업로드하여 AI의 정밀 분석을 받아보세요.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import VueApexCharts from 'vue3-apexcharts'
import { PDFUpload } from '@/api/pdfService'

const props = defineProps({
  stockId: { type: [Number, String], required: true }
})

const loading = ref(false)
const analysisResult = ref(null)
const keywords = ref(['영업이익 상승', '신규 투자', '부채 감소', 'R&D 확대', '시장 점유율 증가', '친환경 에너지'])

const chartSeries = ref([
  { name: '매출액 (십억원)', data: [450, 520, 610, 580] },
  { name: '영업이익 (십억원)', data: [45, 55, 72, 65] }
])

const chartOptions = computed(() => ({
  chart: { type: 'bar', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
  plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '55%' } },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: { categories: ['2021', '2022', '2023', '2024 (E)'], axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { title: { text: '(십억원)', style: { color: '#64748b' } } },
  legend: { position: 'top', horizontalAlign: 'right' },
  tooltip: { y: { formatter: (val) => `${val} 십억원` } },
  fill: { opacity: 1, colors: ['#2D72ED', '#10b981'] },
  colors: ['#2D72ED', '#10b981']
}))

const formattedResult = computed(() => {
  if (!analysisResult.value) return ''
  return analysisResult.value.replace(/\n/g, '<br>')
})

const emit = defineEmits(['uploaded'])
const router = useRouter()
const auth = useAuthStore()
const fileInput = ref(null)

const triggerUpload = () => {
  if (!auth.isLoggedIn) {
    router.push({ path: '/auth/login' })
    return
  }
  if (fileInput.value) fileInput.value.click()
}

const handleUpload = async (event) => {
  const file = event?.target?.files ? event.target.files[0] : null
  if (!file) return

  const fileUrl = URL.createObjectURL(file)
  emit('uploaded', fileUrl)

  loading.value = true
  try {
    const userId = auth.userInfo?.userId || null
    const uploadRes = await PDFUpload(file, userId, props.stockId)
    alert(uploadRes?.message || '업로드가 완료되었습니다.')
    if (uploadRes?.analysis) analysisResult.value = uploadRes.analysis
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    alert('분석 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pdf-dashboard {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
}

.pdf-dashboard__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.pdf-dashboard__title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
}

.upload-btn {
  background: var(--brand-sub);
  color: var(--brand-neutral);
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 220ms ease, color 220ms ease, transform 160ms ease;
  border: 1px solid transparent;
}

.upload-btn:hover {
  /* subtle darken instead of switching to red */
  background: var(--brand-sub);
  filter: brightness(0.92);
  color: #ffffff;
  transform: translateY(-2px);
}

.pdf-dashboard__loading {
  text-align: center;
  padding: 60px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--brand-sub);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.analysis-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #111827;
}

.summary-text {
  background: var(--card-bg);
  padding: 20px;
  border-radius: 16px;
  line-height: 1.6;
  font-size: 15px;
  color: var(--brand-sub);
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-badge {
  background: white;
  color: #1e293b;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.keyword-badge:hover {
  border-color: var(--brand-deep-blue);
  color: var(--brand-deep-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.keyword-badge::before {
  content: '#';
  color: #64748b;
}

.chart-placeholder {
  height: 200px;
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}

.pdf-dashboard__empty {
  text-align: center;
  padding: 80px 0;
  color: #6b7280;
}
</style>
