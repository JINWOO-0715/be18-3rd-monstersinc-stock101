<template>
  <section class="metric-cards">
    <div v-if="metrics.length === 0" class="empty-state">
      <p>핵심 지표 데이터가 없습니다</p>
    </div>
    <div v-else class="cards-grid">
      <div
        v-for="(metric, idx) in metrics"
        :key="idx"
        class="metric-card"
        :class="getCardClass(metric.variance)"
      >
        <div class="metric-label">{{ metric.item }}</div>
        <div class="metric-main">
          <div class="metric-current">{{ metric.current }}</div>
          <div class="metric-change" :class="getVarianceClass(metric.variance)">
            <span class="change-icon">{{ getChangeIcon(metric.variance) }}</span>
            <span class="change-value">{{ formatVariance(metric.variance) }}</span>
          </div>
        </div>
        <div class="metric-comparison">
          <span class="comparison-label">전기:</span>
          <span class="comparison-value">{{ metric.previous }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  metrics: {
    type: Array,
    default: () => []
  }
})

const getVarianceClass = (variance) => {
  const num = parseFloat(variance)
  if (isNaN(num)) return ''
  if (num > 0) return 'change-positive'
  if (num < 0) return 'change-negative'
  return 'change-neutral'
}

const getCardClass = (variance) => {
  const num = parseFloat(variance)
  if (isNaN(num)) return ''
  if (num > 0) return 'card-positive'
  if (num < 0) return 'card-negative'
  return ''
}

const getChangeIcon = (variance) => {
  const num = parseFloat(variance)
  if (isNaN(num)) return '―'
  if (num > 0) return '▲'
  if (num < 0) return '▼'
  return '―'
}

const formatVariance = (variance) => {
  const num = parseFloat(variance)
  if (isNaN(num)) return variance || '-'
  const sign = num > 0 ? '+' : ''
  return `${sign}${num}%`
}
</script>

<style scoped>
.metric-cards {
  background: white;
  padding: 32px;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 15px;
  font-weight: 600;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric-card {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #cbd5e1;
  transition: background 0.25s;
}

.metric-card.card-positive::before {
  background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%);
}

.metric-card.card-negative::before {
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  border-color: #cbd5e1;
}

.metric-label {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-current {
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.change-icon {
  font-size: 12px;
}

.change-positive {
  color: #dc2626;
}

.change-negative {
  color: #2563eb;
}

.change-neutral {
  color: #64748b;
}

.metric-comparison {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  font-size: 13px;
}

.comparison-label {
  color: #94a3b8;
  font-weight: 600;
}

.comparison-value {
  color: #475569;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
  }

  .metric-card {
    padding: 16px;
  }

  .metric-current {
    font-size: 24px;
  }
}
</style>
