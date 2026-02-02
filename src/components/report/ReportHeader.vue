<template>
  <header class="report-header">
    <div class="header-main">
      <div class="report-meta">
        <span class="report-tag">{{ tag }}</span>
        <span
          v-if="investmentGrade"
          class="investment-badge"
          :class="investmentGradeClass"
        >
          {{ investmentGrade }}
        </span>
        <span class="report-date">{{ date }}</span>
      </div>

      <h1 class="report-title">{{ title }}</h1>

      <div v-if="stockName && ticker" class="stock-info">
        <span class="stock-label">대상 종목:</span>
        <router-link :to="`/stock/${stockId}`" class="stock-link">
          {{ stockName }} ({{ ticker }})
          <span class="link-icon">↗</span>
        </router-link>
      </div>
      <div v-else-if="stockId" class="stock-info">
        <span class="stock-label">대상 종목:</span>
        <router-link :to="`/stock/${stockId}`" class="stock-link">
          바로가기
          <span class="link-icon">↗</span>
        </router-link>
      </div>
    </div>

    <div class="ai-summary-box">
      <div class="summary-header">
        <span class="ai-icon">🤖</span>
        <span class="summary-label">AI 한줄 평</span>
      </div>
      <blockquote class="summary-text">
        "{{ content }}"
      </blockquote>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    default: '분석리포트'
  },
  investmentGrade: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    required: true
  },
  stockId: {
    type: [String, Number],
    required: true
  },
  stockName: {
    type: String,
    required: true
  },
  ticker: {
    type: String,
    required: true
  }
})

const investmentGradeClass = computed(() => {
  const grade = props.investmentGrade
  if (grade === '매수') return 'grade-buy'
  if (grade === '보유') return 'grade-hold'
  if (grade === '주의') return 'grade-caution'
  return ''
})
</script>

<style scoped>
.report-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 48px;
  border-radius: 32px;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 48px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.header-main {
  flex: 1;
  min-width: 0;
}

.report-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.report-tag {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  border: 1px solid #bfdbfe;
}

.investment-badge {
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.grade-buy {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #15803d;
  border: 1px solid #86efac;
}

.grade-hold {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  color: #c2410c;
  border: 1px solid #fdba74;
}

.grade-caution {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.report-date {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.report-title {
  font-size: 38px;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 20px;
  line-height: 1.2;
  letter-spacing: -0.03em;
  word-break: keep-all;
}

.stock-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  padding: 14px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  width: fit-content;
}

.stock-label {
  color: #64748b;
  font-weight: 700;
}

.stock-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.stock-link:hover {
  color: #1e40af;
  border-bottom-color: #1e40af;
}

.link-icon {
  font-size: 14px;
  opacity: 0.7;
}

.ai-summary-box {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 28px;
  border-radius: 24px;
  width: 380px;
  flex-shrink: 0;
  border: 2px solid #bae6fd;
  box-shadow: 0 8px 16px rgba(14, 165, 233, 0.08);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.ai-icon {
  font-size: 24px;
}

.summary-label {
  font-size: 13px;
  font-weight: 800;
  color: #0c4a6e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-text {
  font-size: 17px;
  color: #0f172a;
  line-height: 1.7;
  font-weight: 600;
  margin: 0;
  font-style: italic;
  word-break: keep-all;
  border-left: 4px solid #0ea5e9;
  padding-left: 16px;
}

@media (max-width: 1024px) {
  .report-header {
    flex-direction: column;
    padding: 32px;
    gap: 32px;
  }

  .ai-summary-box {
    width: 100%;
  }

  .report-title {
    font-size: 32px;
  }
}

@media (max-width: 768px) {
  .report-header {
    padding: 24px;
  }

  .report-title {
    font-size: 28px;
  }

  .summary-text {
    font-size: 16px;
  }
}
</style>
