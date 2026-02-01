<template>
  <div class="sentiment-gauge">
    <div class="gauge-container">
      <svg class="gauge-svg" viewBox="0 0 200 120">
        <!-- Background Arc -->
        <path
          :d="arcPath"
          fill="none"
          stroke="#e2e8f0"
          stroke-width="16"
          stroke-linecap="round"
        />
        <!-- Foreground Arc (Animated) -->
        <path
          :d="arcPath"
          fill="none"
          :stroke="gaugeColor"
          stroke-width="16"
          stroke-linecap="round"
          :stroke-dasharray="dashArray"
          :stroke-dashoffset="dashOffset"
          class="gauge-progress"
        />
        <!-- Center Text -->
        <text x="100" y="85" text-anchor="middle" class="gauge-score">
          {{ displayScore }}
        </text>
        <text x="100" y="105" text-anchor="middle" class="gauge-label">
          {{ sentimentLabel }}
        </text>
      </svg>
    </div>
    <div class="sentiment-info">
      <div class="info-item">
        <span class="info-icon positive-icon">😊</span>
        <span class="info-label">긍정 신호</span>
      </div>
      <div class="info-divider"></div>
      <div class="info-item">
        <span class="info-icon negative-icon">😟</span>
        <span class="info-label">부정 신호</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  score: {
    type: Number,
    default: 0.5,
    validator: (value) => value >= 0 && value <= 1
  }
})

// Arc path for semi-circle gauge
const arcPath = computed(() => {
  const centerX = 100
  const centerY = 100
  const radius = 70
  const startAngle = Math.PI // Start at left (180 degrees)
  const endAngle = 0 // End at right (0 degrees)

  const x1 = centerX + radius * Math.cos(startAngle)
  const y1 = centerY + radius * Math.sin(startAngle)
  const x2 = centerX + radius * Math.cos(endAngle)
  const y2 = centerY + radius * Math.sin(endAngle)

  return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`
})

// Calculate dash array and offset for progress
const circumference = computed(() => Math.PI * 70) // Half circle
const dashArray = computed(() => circumference.value)
const dashOffset = computed(() => {
  const progress = props.score
  return circumference.value * (1 - progress)
})

// Dynamic color based on score
const gaugeColor = computed(() => {
  const score = props.score
  if (score >= 0.7) return '#22c55e' // Green (positive)
  if (score >= 0.5) return '#f59e0b' // Orange (neutral)
  return '#ef4444' // Red (negative)
})

// Sentiment label
const sentimentLabel = computed(() => {
  const score = props.score
  if (score >= 0.7) return '매우 긍정'
  if (score >= 0.6) return '긍정'
  if (score >= 0.5) return '중립'
  if (score >= 0.4) return '부정'
  return '매우 부정'
})

// Display score as percentage
const displayScore = computed(() => {
  return `${Math.round(props.score * 100)}%`
})
</script>

<style scoped>
.sentiment-gauge {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.gauge-container {
  width: 100%;
  max-width: 240px;
}

.gauge-svg {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 12px rgba(15, 23, 42, 0.06));
}

.gauge-progress {
  transition: all 1s ease-out;
}

.gauge-score {
  font-size: 32px;
  font-weight: 900;
  fill: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.gauge-label {
  font-size: 14px;
  font-weight: 700;
  fill: #64748b;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.sentiment-info {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  justify-content: center;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.info-icon {
  font-size: 28px;
  transition: transform 0.2s;
}

.info-item:hover .info-icon {
  transform: scale(1.15);
}

.info-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-align: center;
}

.info-divider {
  width: 1px;
  height: 40px;
  background: #e2e8f0;
}

@media (max-width: 768px) {
  .sentiment-gauge {
    padding: 20px;
  }

  .gauge-container {
    max-width: 200px;
  }

  .sentiment-info {
    gap: 16px;
  }

  .info-icon {
    font-size: 24px;
  }
}
</style>
