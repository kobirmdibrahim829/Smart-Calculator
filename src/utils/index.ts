// ============================================================
// SMART CALCULATOR PRO — Utility Functions
// ============================================================

import type { AgeResult, EMIResult } from '@/types';

/**
 * Round a number to n decimal places, removing trailing zeros
 */
export function roundTo(value: number, precision: number): string {
  return parseFloat(value.toFixed(precision)).toString();
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 10,
  }).format(value);
}

/**
 * Format a number as BDT currency string
 */
export function formatBDT(n: number): string {
  if (n >= 10_000_000) return '৳' + (n / 10_000_000).toFixed(2) + ' Cr';
  if (n >= 100_000)    return '৳' + (n / 100_000).toFixed(2) + ' L';
  if (n >= 1_000)      return '৳' + (n / 1_000).toFixed(1) + 'K';
  return '৳' + n.toFixed(0);
}

/**
 * Calculate monthly EMI, total interest, and total payment
 * Uses standard EMI formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): EMIResult {
  const r = annualRate / (12 * 100);
  let monthlyEMI: number;
  if (r === 0) {
    monthlyEMI = principal / tenureMonths;
  } else {
    const factor = Math.pow(1 + r, tenureMonths);
    monthlyEMI = (principal * r * factor) / (factor - 1);
  }
  const totalPayment = monthlyEMI * tenureMonths;
  const totalInterest = totalPayment - principal;
  return {
    monthlyEMI,
    totalInterest,
    totalPayment,
    principal,
    annualRate,
    tenureMonths,
  };
}

/**
 * Calculate exact age between two dates
 */
export function calculateAge(dob: Date, target: Date): AgeResult {
  let years = target.getFullYear() - dob.getFullYear();
  let months = target.getMonth() - dob.getMonth();
  let days = target.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const daysInPrevMonth = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.floor((target.getTime() - dob.getTime()) / msPerDay);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  const totalHours = totalDays * 24;

  // Next birthday
  let nextBday = new Date(target.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBday <= target) nextBday.setFullYear(nextBday.getFullYear() + 1);
  const daysToNextBirthday = Math.ceil((nextBday.getTime() - target.getTime()) / msPerDay);

  return { years, months, days, totalDays, totalWeeks, totalMonths, totalHours, daysToNextBirthday };
}

/**
 * Calculate factorial (integer only)
 */
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/**
 * Convert temperature between C, F, and K
 */
export function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === 'C')      celsius = value;
  else if (from === 'F') celsius = (value - 32) * 5 / 9;
  else                   celsius = value - 273.15; // K

  if (to === 'C')      return celsius;
  if (to === 'F')      return celsius * 9 / 5 + 32;
  return celsius + 273.15; // K
}

/**
 * Convert units using the ratio method (SI base = 1)
 */
export function convertUnit(
  value: number,
  fromRatio: number,
  toRatio: number
): number {
  return (value * fromRatio) / toRatio;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Format a Date as a locale-aware string
 */
export function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Safely parse JSON from localStorage
 */
export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}