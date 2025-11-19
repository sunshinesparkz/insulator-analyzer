export enum AnalysisStatus {
  Normal = 'ปกติ',
  Flashover = 'Flashover',
  Broken = 'แตกหัก',
  NotAnInsulator = 'ไม่ใช่วัตถุลูกถ้วย',
  Unknown = 'ไม่สามารถระบุได้'
}

export interface ConfidenceScores {
  normal: number;
  flashover: number;
  broken: number;
}

export interface AnalysisResult {
  status: AnalysisStatus;
  description: string;
  objectType: string; // e.g., 'Cat', 'Electrical Insulator'
  confidenceScores?: ConfidenceScores; // Optional, as it's not relevant for non-insulators
}
