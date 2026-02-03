<template>
  <div class="analysis-card" @click="$emit('click')">
    <div class="analysis-card__thumbnail">
      <div class="stock-display">
        <span class="stock-name">{{ companyName ||  '종목 정보 없음' }}</span>
      </div>
      <div v-if="tag" class="analysis-card__tag">{{ tag }}</div>
    </div>
    <div class="analysis-card__content">
      <h3 class="analysis-card__title">{{ title }}</h3>
      <p class="analysis-card__summary">{{ summary }}</p>
      <div class="analysis-card__footer">
        <span class="analysis-card__date">{{ date }}</span>
        <span class="analysis-card__author">{{ author }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  summary: String,
  date: String,
  author: String,
  tag: String,
  companyName: String,
  stockCode: String
})
</script>

<style scoped>
.analysis-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.analysis-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.analysis-card__thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stock-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.stock-name {
  font-size: 28px;
  font-weight: 900;
  color: white;
  text-align: center;
  line-height: 1.2;
  word-break: keep-all;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.analysis-card__tag {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(17, 24, 39, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.analysis-card__content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
}

.analysis-card__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #111827;
  line-height: 1.5;
}

.analysis-card__summary {
  font-size: 14px;
  color: #4b5563;
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.analysis-card__footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}
</style>
