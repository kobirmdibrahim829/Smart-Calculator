//src//types//index.ts
// ============================================================
// SMART CALCULATOR PRO — TypeScript Type Definitions
// ============================================================

export type Theme = 'light' | 'dark';
export type Page =
  | 'home' | 'standard' | 'scientific'
  | 'currency' | 'unit' | 'age' | 'emi'
  | 'history' | 'settings' | 'about';
export type HistoryItemType =
  | 'standard' | 'scientific' | 'currency'
  | 'unit' | 'age' | 'emi';

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  expression: string;
  result: string;
  timestamp: string;
}

export interface AppSettings {
  sound: boolean;
  animations: boolean;
  precision: number;
}

export interface AppState {
  theme: Theme;
  history: HistoryItem[];
  settings: AppSettings;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  date: string;
  cachedAt: number;
}

export interface EMIResult {
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
  principal: number;
  annualRate: number;
  tenureMonths: number;
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalHours: number;
  daysToNextBirthday: number;
}

export interface UnitEntry {
  [unitName: string]: number | string;
}

export interface UnitCategoryDef {
  label: string;
  units: UnitEntry;
}

export type UnitCategoryKey =
  | 'length' | 'weight' | 'temperature'
  | 'area' | 'volume' | 'speed' | 'data';

export type UnitCategoriesMap = Record<UnitCategoryKey, UnitCategoryDef>;