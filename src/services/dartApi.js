/**
 * DART 공시 정보 API 서비스
 */
import axios from 'axios'

/**
 * 종목 코드로 공시 조회 (내부 DB 조회, 없으면 자동 초기화)
 * @param {string} stockCode - 종목 코드 (6자리)
 * @returns {Promise} 공시 목록
 */
export const getDisclosuresByStockCode = async (stockCode) => {
  try {
    const response = await axios.get(`/api/dart/disclosures/${stockCode}`)
    return response.data
  } catch (error) {
    console.error('공시 정보 조회 실패:', error)
    throw error
  }
}

/**
 * 종목 코드로 최근 공시 조회 (기존 호환 - 외부 DART API 직접 호출)
 * @param {string} stockCode - 종목 코드 (6자리)
 * @param {number} days - 조회 일수 (기본 30일)
 * @returns {Promise} 공시 목록
 */
export const getRecentDisclosuresByStockCode = async (stockCode, days = 30) => {
  try {
    const response = await axios.get(`/api/disclosure/dart/stock/${stockCode}`, {
      params: { days }
    })
    return response.data
  } catch (error) {
    console.error('공시 정보 조회 실패:', error)
    throw error
  }
}

/**
 * 회사명으로 최근 공시 조회
 * @param {string} corpName - 회사명
 * @param {number} days - 조회 일수 (기본 30일)
 * @returns {Promise} 공시 목록
 */
export const getRecentDisclosuresByCorpName = async (corpName, days = 30) => {
  try {
    const response = await axios.get('/api/disclosure/dart/company', {
      params: { corpName, days }
    })
    return response.data
  } catch (error) {
    console.error('공시 정보 조회 실패:', error)
    throw error
  }
}

/**
 * DART 공시 검색 (상세 조건)
 * @param {Object} searchParams - 검색 조건
 * @returns {Promise} 공시 목록
 */
export const searchDartDisclosures = async (searchParams) => {
  try {
    const response = await axios.post('/api/disclosure/dart/search', searchParams)
    return response.data
  } catch (error) {
    console.error('공시 검색 실패:', error)
    throw error
  }
}

/**
 * 공시 보고서 타입별 한글명 매핑
 */
export const DISCLOSURE_TYPES = {
  A: '정기공시',
  B: '주요사항보고',
  C: '발행공시',
  D: '지분공시',
  E: '기타공시',
  F: '외부감사관련',
  G: '펀드공시',
  H: '자산유동화',
  I: '거래소공시',
  J: '공정위공시'
}

/**
 * 법인구분 한글명 매핑
 */
export const CORP_CLS = {
  Y: '유가증권시장',
  K: '코스닥',
  N: '코넥스',
  E: '기타'
}
