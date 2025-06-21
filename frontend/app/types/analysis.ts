export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
}

export interface Summary {
  totalReceived: number;
  totalSpent: number;
  balance: number;
  creditCount: number;
  debitCount: number;
  highestCredit?: number;
  highestDebit?: number;
}

export interface DetailedCategory {
  category: string;
  amount: number;
  count: number;
  percentage: string;
  transactions: Transaction[];
}

export interface AnalysisResult {
  summary: Summary;
  transactions: Transaction[];
  detailedCategoryBreakdown: DetailedCategory[];
  pageCount?: number;
}

export type View = 'home' | 'kotak' | 'phonepe' | 'results';

export type AnalysisState = 'upload' | 'analyzing' | 'results'; 