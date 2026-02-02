/**
 * 금액 표기를 조/억원 단위로 변환합니다.
 * 예: "162,595억원" → "16조 2,595억원"
 * 예: "5,234억원" → "5,234억원"
 * 예: "10,000억원" → "1조원"
 */
export function formatAmountToTrillionBillion(value: string | number): string {
  if (!value) return '-'

  // 문자열인 경우 숫자만 추출
  const str = String(value)

  // 이미 "조" 단위가 포함되어 있으면 그대로 반환
  if (str.includes('조')) {
    return str
  }

  // "억원" 패턴 찾기
  const billionMatch = str.match(/([\d,]+)억원?/)
  if (!billionMatch) {
    // 억원 단위가 아니면 그대로 반환
    return str
  }

  // 콤마 제거 후 숫자로 변환
  const billionAmount = parseInt(billionMatch[1].replace(/,/g, ''), 10)

  if (isNaN(billionAmount)) {
    return str
  }

  // 10,000억원 = 1조
  if (billionAmount >= 10000) {
    const trillion = Math.floor(billionAmount / 10000)
    const billion = billionAmount % 10000

    if (billion === 0) {
      // 딱 떨어지는 경우: "16조원"
      return `${trillion.toLocaleString('ko-KR')}조원`
    } else {
      // 조와 억이 모두 있는 경우: "16조 2,595억원"
      return `${trillion.toLocaleString('ko-KR')}조 ${billion.toLocaleString('ko-KR')}억원`
    }
  }

  // 10,000억원 미만이면 그대로 반환 (콤마만 추가)
  return `${billionAmount.toLocaleString('ko-KR')}억원`
}

/**
 * 금액 값이 숫자 뒤에 단위가 붙은 형태인지 확인하고 변환합니다.
 * MetricCards와 테이블에서 사용
 */
export function formatMetricAmount(value: string | number): string {
  if (!value) return '-'

  const str = String(value).trim()

  // 이미 포맷된 값이면 변환
  return formatAmountToTrillionBillion(str)
}
