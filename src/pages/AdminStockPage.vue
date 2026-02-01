<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>관리자 - 종목 데이터 관리</h1>
      <p class="subtitle">한국투자증권 MST 파일 자동 동기화</p>
    </div>

    <div class="admin-content">
      <!-- KOSPI 관리 -->
      <div class="mst-card">
        <div class="card-header">
          <h2>📊 KOSPI 종목</h2>
          <span class="badge kospi">코스피</span>
        </div>
        <div class="card-body">
          <p class="description">
            한국 증권시장 대형주 마스터 파일을 자동 다운로드하여 DB에 동기화합니다.
          </p>
          <div class="status-info">
            <span class="label">자동 업데이트:</span>
            <span class="value">매일 오후 4시 + 오전 9시 (재시도)</span>
          </div>
          <button
            @click="downloadKospi"
            :disabled="loading"
            class="btn btn-kospi"
          >
            <span v-if="!loading" class="btn-text">
              🔄 KOSPI 지금 업데이트
            </span>
            <span v-else class="btn-text">
              ⏳ 업데이트 중...
            </span>
          </button>
        </div>
        <div v-if="kospiResult" class="card-result" :class="kospiResult.success ? 'success' : 'error'">
          <p v-if="kospiResult.success" class="result-text">
            ✅ {{ kospiResult.message }} ({{ kospiResult.updatedCount }}개)
          </p>
          <p v-else class="result-text">
            ❌ {{ kospiResult.message }}
          </p>
        </div>
      </div>

      <!-- KOSDAQ 관리 -->
      <div class="mst-card">
        <div class="card-header">
          <h2>📈 KOSDAQ 종목</h2>
          <span class="badge kosdaq">코스닥</span>
        </div>
        <div class="card-body">
          <p class="description">
            한국 코스닥 시장 중소형주 마스터 파일을 자동 다운로드하여 DB에 동기화합니다.
          </p>
          <div class="status-info">
            <span class="label">자동 업데이트:</span>
            <span class="value">매일 오후 4시 30분 + 오전 9시 (재시도)</span>
          </div>
          <button
            @click="downloadKosdaq"
            :disabled="loading"
            class="btn btn-kosdaq"
          >
            <span v-if="!loading" class="btn-text">
              🔄 KOSDAQ 지금 업데이트
            </span>
            <span v-else class="btn-text">
              ⏳ 업데이트 중...
            </span>
          </button>
        </div>
        <div v-if="kosdaqResult" class="card-result" :class="kosdaqResult.success ? 'success' : 'error'">
          <p v-if="kosdaqResult.success" class="result-text">
            ✅ {{ kosdaqResult.message }} ({{ kosdaqResult.updatedCount }}개)
          </p>
          <p v-else class="result-text">
            ❌ {{ kosdaqResult.message }}
          </p>
        </div>
      </div>
    </div>

    <!-- 스케줄 정보 -->
    <div class="schedule-info">
      <h3>⏰ 자동 업데이트 스케줄</h3>
      <div class="schedule-grid">
        <div class="schedule-item">
          <span class="time">09:00</span>
          <span class="desc">개장 전 KOSPI/KOSDAQ 재업데이트</span>
        </div>
        <div class="schedule-item">
          <span class="time">16:00</span>
          <span class="desc">KOSPI 마스터 파일 업데이트</span>
        </div>
        <div class="schedule-item">
          <span class="time">16:30</span>
          <span class="desc">KOSDAQ 마스터 파일 업데이트</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminStockPage',
  data() {
    return {
      loading: false,
      kospiResult: null,
      kosdaqResult: null,
    };
  },
  methods: {
    async downloadKospi() {
      this.loading = true;
      this.kospiResult = null;
      try {
        const response = await axios.get('/api/v1/admin/stock/download-kospi');
        this.kospiResult = response.data;
      } catch (error) {
        this.kospiResult = {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      } finally {
        this.loading = false;
      }
    },
    async downloadKosdaq() {
      this.loading = true;
      this.kosdaqResult = null;
      try {
        const response = await axios.get('/api/v1/admin/stock/download-kosdaq');
        this.kosdaqResult = response.data;
      } catch (error) {
        this.kosdaqResult = {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.admin-header {
  text-align: center;
  margin-bottom: 50px;
}

.admin-header h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #2c3e50;
}

.subtitle {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
}

.admin-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.mst-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.mst-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.kospi {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.badge.kosdaq {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.card-body {
  padding: 24px;
}

.description {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 16px;
  line-height: 1.6;
}

.status-info {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-info .label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 80px;
}

.status-info .value {
  color: #3498db;
  font-size: 14px;
}

.btn {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-kospi {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-kosdaq {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-result {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid;
}

.card-result.success {
  background: #d4edda;
  border-left-color: #28a745;
}

.card-result.error {
  background: #f8d7da;
  border-left-color: #dc3545;
}

.result-text {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.card-result.success .result-text {
  color: #155724;
}

.card-result.error .result-text {
  color: #721c24;
}

.schedule-info {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.schedule-info h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  color: #2c3e50;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.schedule-item {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  display: flex;
  flex-direction: column;
}

.schedule-item .time {
  font-size: 18px;
  font-weight: 700;
  color: #3498db;
  margin-bottom: 4px;
}

.schedule-item .desc {
  font-size: 14px;
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .admin-content {
    grid-template-columns: 1fr;
  }

  .schedule-grid {
    grid-template-columns: 1fr;
  }

  .admin-header h1 {
    font-size: 24px;
  }
}
</style>
