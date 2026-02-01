import axios from 'axios';
import type { StockPriceResponse , StockSummaryInfo} from '../types/stock';

export const getDailyPrices = async (stockCode: string, day: number): Promise<StockPriceResponse> => {
  const response = await axios.get(`/api/stocks/${stockCode}/prices`,{
    params: { days: day }
  });
  const raw = response.data;

  // 설계도(StockPriceResponse)에 맞게 데이터를 조립해서 반환
  return {
    stockCode: raw.stockCode,
    lastUpdated: raw.lastUpdated,
    stockName: raw.stockName,
    prices: raw.prices || []
  };
};


export const getStockSummaryInfo = async (stockCode: string): Promise<StockSummaryInfo> => {

try {
    const response = await axios.get(`/api/v1/stock/${stockCode}`);
    const data = response.data;

    // 1. 다양한 응답 구조 방어 (필요시 유지, 백엔드가 고정되었다면 raw 바로 사용)
    let raw = data?.items ? data.items[0] : (Array.isArray(data) ? data[0] : data);

    // 2. 백엔드 VO(raw)를 프론트엔드 Interface(StockSummaryInfo)로 매핑
    return {
      stockId: raw.stockId,
      stockCode: raw.stockCode,
      name: raw.name,
      market: raw.marketType, // 이름 치환
      marketCap: raw.marketCap || 0,
      faceValue: raw.faceValue || 0
    };
  } catch (error) {
    console.error('❌ 주식 요약 정보 로드 실패:', error);
    throw error; // 컴포넌트에서 에러 처리를 위해 다시 던짐
  }

};