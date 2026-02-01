<template>
  <section class="detailed-analysis">
    <h2 class="section-title">
      <span class="title-icon">📊</span>
      상세 분석 리포트
    </h2>

    <div class="analysis-columns">
      <!-- Part 1: 경영 현황 요약 -->
      <article v-if="summaryContent" class="analysis-column">
        <div class="column-header">
          <span class="column-number">Part 1</span>
          <h3 class="column-title">경영 현황 요약</h3>
        </div>
        <div class="column-content">
          <p class="content-text">{{ summaryContent }}</p>
          <div v-if="hasKeyPhrase(summaryContent)" class="highlight-quote">
            <blockquote>{{ extractKeyPhrase(summaryContent) }}</blockquote>
          </div>
        </div>
      </article>

      <!-- Part 2: 향후 전망 및 전략 -->
      <article v-if="prospectContent" class="analysis-column">
        <div class="column-header">
          <span class="column-number">Part 2</span>
          <h3 class="column-title">향후 전망 및 전략</h3>
        </div>
        <div class="column-content">
          <p class="content-text">{{ prospectContent }}</p>
          <div v-if="hasKeyPhrase(prospectContent)" class="highlight-quote">
            <blockquote>{{ extractKeyPhrase(prospectContent) }}</blockquote>
          </div>
        </div>
      </article>
    </div>

    <!-- Empty State -->
    <div v-if="!summaryContent && !prospectContent" class="empty-state">
      <p>상세 분석 데이터가 없습니다</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  summaryContent: {
    type: String,
    default: ''
  },
  prospectContent: {
    type: String,
    default: ''
  }
})

// Extract key phrases (first sentence or short excerpt for quote)
const hasKeyPhrase = (text) => {
  if (!text) return false
  // Check if text has at least 2 sentences
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0)
  return sentences.length >= 2
}

const extractKeyPhrase = (text) => {
  if (!text) return ''
  // Extract first sentence as key phrase
  const match = text.match(/^[^.!?]+[.!?]/)
  return match ? match[0].trim() : ''
}
</script>

<style scoped>
.detailed-analysis {
  background: white;
  padding: 40px;
  border-radius: 28px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 26px;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 32px;
  padding-bottom: 20px;
  border-bottom: 3px solid #e2e8f0;
}

.title-icon {
  font-size: 28px;
}

.analysis-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  position: relative;
}

.analysis-columns::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom,
    transparent 0%,
    #e2e8f0 10%,
    #e2e8f0 90%,
    transparent 100%
  );
  transform: translateX(-50%);
}

.analysis-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.column-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.column-number {
  font-size: 12px;
  font-weight: 800;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: #eff6ff;
  padding: 4px 12px;
  border-radius: 6px;
  width: fit-content;
}

.column-title {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.01em;
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-text {
  font-size: 15px;
  color: #334155;
  line-height: 1.9;
  margin: 0;
  text-align: justify;
  word-break: keep-all;
  letter-spacing: -0.01em;
  font-weight: 500;
}

.highlight-quote {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border-left: 4px solid #eab308;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(234, 179, 8, 0.08);
}

.highlight-quote blockquote {
  margin: 0;
  font-size: 15px;
  color: #713f12;
  line-height: 1.7;
  font-weight: 700;
  font-style: italic;
  quotes: '"' '"' ''' ''';
}

.highlight-quote blockquote::before {
  content: open-quote;
  font-size: 28px;
  line-height: 0;
  vertical-align: -0.4em;
  margin-right: 4px;
  color: #ca8a04;
}

.highlight-quote blockquote::after {
  content: close-quote;
  font-size: 28px;
  line-height: 0;
  vertical-align: -0.4em;
  margin-left: 4px;
  color: #ca8a04;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 15px;
  font-weight: 600;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px dashed #e2e8f0;
}

@media (max-width: 1024px) {
  .detailed-analysis {
    padding: 32px;
  }

  .analysis-columns {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .analysis-columns::before {
    display: none;
  }
}

@media (max-width: 768px) {
  .detailed-analysis {
    padding: 24px;
  }

  .section-title {
    font-size: 22px;
  }

  .column-title {
    font-size: 18px;
  }

  .content-text {
    font-size: 14px;
    line-height: 1.8;
  }

  .highlight-quote {
    padding: 16px 20px;
  }
}
</style>
