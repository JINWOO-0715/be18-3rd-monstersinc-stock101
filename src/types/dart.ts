export interface DartReport {
 rceptNo:string;
 corpName: string;
 reportName: string;
 receptionDate: string;
 
}

export interface DartReportResponse {
    message : string;
    stockName : string;
    corpCode : string;
    count : number;
    disclosures : DartReport[];
}