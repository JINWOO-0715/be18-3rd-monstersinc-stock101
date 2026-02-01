// 일봉 데이터 상세
export interface DailyPrice {
    date: string;    // LocalDate는 JSON으로 올 때 보통 string입니다.
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    tradingValue: number;
}

// 전체 응답 구조
export interface StockPriceResponse {
    stockCode: string;
    stockName: string;
    lastUpdated: string;
    prices: DailyPrice[];
}

export interface StockSummaryInfo {
    stockId: number;      // 종목 ID (Long -> number)
    stockCode: string;    // 단축코드 (6자리)
    name: string;         // 종목명
    market: string;       // 시장구분 (KOSPI/KOSDAQ 등) - VO의 marketType 대응
    marketCap: number;    // 시가총액 (억 단위)
    faceValue: number;    // 액면가
}


