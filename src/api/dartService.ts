import axios from 'axios';
import type {DartReportResponse,DartReport} from '../types/dart';


export const DartReportgetDartReports = async(stockCode:string):Promise<DartReportResponse>=>{
    try{
        const response = await axios.get(`/api/v1/dart/disclosures/${stockCode}`);
        const data = response.data;

        return{
            message: data.message,
            stockName: data.stockName,
            corpCode: data.corpCode || '',
            count: data.count || 0,
            disclosures: (data.disclosures || []).map((item:any)=>({
                rceptNo: item.rceptNo,
                corpName: item.corpName,
                reportName: item.reportNm,
                receptionDate: item.receptionDate
            }))
        }
    }catch(error){
        console.error('❌ DART 공시 정보 로드 실패:', error);
        throw error;
    }

}

