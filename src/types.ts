export interface User {
  email: string;
  name: string;
  photoUrl: string;
  role: string;
}

export interface InsightData {
  text: string;
  category: 'SEO' | 'ALGORITHM' | 'PSYCHOLOGY' | 'STRUCTURE';
}

export interface OptimizationResult {
  titulo: string;
  tituloInsight: InsightData;
  linhaFina: string;
  linhaFinaInsight: InsightData;
  primeiroParagrafo: string;
  primeiroParagrafoInsight: InsightData;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type EditorialTone = 'COLD' | 'NEUTRAL' | 'HOT';
