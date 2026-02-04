import apiClient from '@/api'

export interface ReportSummary {
  id: number
  title: string
  content: string
  investment_grade?: string
  date: string
  tag: string
  stockId: number
  stockName?: string
  ticker?: string
}

export interface RecentReport {
  id: number
  stockId: number
  companyName: string
  stockCode: string
  title: string
  summary: string
  date: string
  author: string
  tag: string
}

export interface ReportsResponse {
  message: string
  count: number
  items: ReportSummary[]
}

/**
 * Get reports by stockId
 * @param stockId - Stock ID
 * @returns List of reports for the stock
 */
export const getReportsByStockId = async (stockId: number | string): Promise<ReportsResponse> => {
  try {
    const response = await apiClient.get(`/api/disclosure/reports/stock/${stockId}`)
    const data = response.data

    // 백엔드 응답이 배열인 경우와 객체인 경우 모두 처리
    const items = Array.isArray(data) ? data : (data.items || [])

    return {
      message: data.message || '',
      count: items.length,
      items: items.map((item: any) => ({
        id: item.reportId || item.id,
        title: item.title || '',
        content: item.content || '',
        investment_grade: item.investmentGrade || item.investment_grade || '',
        date: formatDate(item.createdAt || item.date || ''),
        tag: item.tag || '분석리포트',
        stockId: item.stockId || stockId,
        stockName: item.stockName || '',
        ticker: item.ticker || ''
      }))
    }
  } catch (error) {
    throw error
  }
}

/**
 * 최신 분석 리포트 조회
 */
export const getRecentReports = async (): Promise<RecentReport[]> => {
  try {
    const { data } = await apiClient.get('/api/disclosure/reports/recent')

    if (!Array.isArray(data)) {
      console.error('최신 분석 리포트 응답이 배열이 아닙니다:', data)
      return []
    }

    return data.map((item: any) => ({
      id: item.reportId || item.id,
      stockId: item.stockId,
      companyName: item.companyName || '종목맨',
      stockCode: item.stockCode || item.ticker || '',
      title: item.title,
      summary: item.summary || item.content,
      date: item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '')
        : '',
      author: item.author || 'AI Analyst',
      tag: item.reportType || item.tag || '분석 리포트'
    }))
  } catch (error) {
    console.error('최신 분석 리포트 데이터 로드 실패:', error)
    return []
  }
}

// 날짜 포맷 헬퍼 함수 (ISO 8601 → YYYY.MM.DD)
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
