<template>
  <div class="pdf-viewer">
    <div class="pdf-viewer__header">
      <h3 class="pdf-viewer__title">📄 원문 뷰어</h3>
      <div v-if="fileUrl" class="pdf-viewer__actions">
        <a :href="fileUrl" target="_blank" class="download-link">전체 화면으로 보기</a>
      </div>
    </div>
    
    <div class="pdf-viewer__container">
      <iframe 
        v-if="fileUrl" 
        :src="fileUrl" 
        width="100%" 
        height="600px" 
        frameborder="0"
      ></iframe>
      <div v-else class="pdf-viewer__empty">
        <p>상단의 대시보드에서 PDF를 업로드하면 여기서 원문을 확인할 수 있습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  fileUrl: String
})
</script>

<style scoped>
.pdf-viewer {
  background: var(--card-bg);
  border-radius: 24px;
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
  height: 100%;
}

.pdf-viewer__header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pdf-viewer__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.download-link {
  font-size: 12px;
  color: var(--brand-deep-blue);
  text-decoration: none;
  font-weight: 600;
}

.pdf-viewer__container {
  height: 600px;
  background: var(--bg);
  position: relative;
}

.pdf-viewer__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  width: 80%;
}
</style>
