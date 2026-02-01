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
