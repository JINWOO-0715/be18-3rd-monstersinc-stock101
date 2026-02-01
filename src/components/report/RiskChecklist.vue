<template>
  <section class="risk-checklist">
    <div class="checklist-header">
      <h3 class="checklist-title">
        <span class="title-icon">✓</span>
        핵심 포인트 체크리스트
      </h3>
      <div class="legend">
        <span class="legend-item positive">
          <span class="legend-dot positive-dot"></span>
          긍정
        </span>
        <span class="legend-item risk">
          <span class="legend-dot risk-dot"></span>
          리스크
        </span>
      </div>
    </div>

    <div v-if="keyPoints.length === 0" class="empty-state">
      <p>핵심 포인트가 없습니다</p>
    </div>

    <ul v-else class="checklist">
      <li
        v-for="(point, idx) in analyzedPoints"
        :key="idx"
        class="checklist-item"
        :class="{ 'item-risk': point.isRisk }"
      >
        <div class="item-marker">
          <span v-if="point.isRisk" class="marker-icon risk-icon">⚠️</span>
          <span v-else class="marker-icon check-icon">✓</span>
        </div>
        <div class="item-content">
          <p class="item-text">{{ point.text }}</p>
          <div v-if="point.isRisk" class="risk-badge">
            <span class="badge-text">주의 필요</span>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  keyPoints: {
    type: Array,
    default: () => []
  }
})

// Negative keywords to identify risks
const negativeKeywords = [
  '하락', '감소', '저하', '부진', '악화', '위축', '둔화', '약세',
  '리스크', '위험', '우려', '불확실', '부정적', '손실', '적자',
  '하향', '축소', '감축', '문제', '지연', '실패', '부담', '압박',
  '취약', '불안', '위기', '침체', '후퇴', '약화', '감소세', '하락세'
]

// Analyze each point for negative sentiment
const analyzedPoints = computed(() => {
  return props.keyPoints.map(point => {
    const text = typeof point === 'string' ? point : point.text || ''
    const isRisk = negativeKeywords.some(keyword =>
      text.includes(keyword)
    )
    return {
      text,
      isRisk
    }
  })
})

// Count risk items
const riskCount = computed(() => {
  return analyzedPoints.value.filter(p => p.isRisk).length
})
</script>

<style scoped>
.risk-checklist {
  background: white;
  padding: 32px;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
}

.checklist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.checklist-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.title-icon {
  font-size: 24px;
  color: #22c55e;
}

.legend {
  display: flex;
  gap: 16px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.positive-dot {
  background: #22c55e;
}

.risk-dot {
  background: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 15px;
  font-weight: 600;
  background: #f8fafc;
  border-radius: 12px;
}

.checklist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  background: #f8fafc;
  border-radius: 14px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.checklist-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.checklist-item.item-risk {
  background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
  border-color: #fecaca;
}

.checklist-item.item-risk:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
  border-color: #fca5a5;
}

.item-marker {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 18px;
  font-weight: 800;
}

.check-icon {
  color: #22c55e;
  background: #dcfce7;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.risk-icon {
  font-size: 20px;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-text {
  font-size: 15px;
  color: #334155;
  line-height: 1.7;
  font-weight: 600;
  margin: 0;
  word-break: keep-all;
}

.item-risk .item-text {
  color: #7f1d1d;
  font-weight: 700;
}

.risk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
}

.badge-text {
  font-size: 11px;
  font-weight: 800;
  color: #dc2626;
  background: #fee2e2;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid #fca5a5;
}

@media (max-width: 768px) {
  .risk-checklist {
    padding: 24px;
  }

  .checklist-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .checklist-item {
    padding: 14px 16px;
  }

  .item-text {
    font-size: 14px;
  }
}
</style>
