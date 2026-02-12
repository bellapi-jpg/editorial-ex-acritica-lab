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
  palavraChavePrincipal: string;
  palavrasChaveSecundarias: string[];
  titulo: string;
  tituloInsight: InsightData;
  linhaFina: string;
  linhaFinaInsight: InsightData;
  primeiroParagrafo: string;
  primeiroParagrafoInsight: InsightData;
  tags: string[];
  tagsInsight: InsightData;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type EditorialTone = 'COLD' | 'NEUTRAL' | 'HOT';
