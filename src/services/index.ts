// ============================================================
// SMART CALCULATOR PRO — Currency Service (Frankfurter API)
// ============================================================

import { FRANKFURTER_API, CURRENCY_CACHE_DURATION } from '@/constants';
import type { CurrencyRate } from '@/types';

/** In-memory rate cache to avoid excessive API calls */
const rateCache = new Map<string, CurrencyRate>();

/**
 * Fetch live exchange rate from Frankfurter API.
 * Results are cached for CURRENCY_CACHE_DURATION (5 min).
 */
export async function fetchExchangeRate(
  from: string,
  to: string
): Promise<CurrencyRate> {
  // Same currency — rate is always 1
  if (from === to) {
    return { from, to, rate: 1, date: new Date().toISOString().split('T')[0], cachedAt: Date.now() };
  }

  const cacheKey = `${from}_${to}`;
  const cached = rateCache.get(cacheKey);

  // Return cached rate if still fresh
  if (cached && Date.now() - cached.cachedAt < CURRENCY_CACHE_DURATION) {
    return cached;
  }

  const url = `${FRANKFURTER_API}/latest?from=${from}&to=${to}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Frankfurter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
  };

  const rate = data.rates[to];
  if (rate === undefined) {
    throw new Error(`No rate found for ${to}`);
  }

  const result: CurrencyRate = { from, to, rate, date: data.date, cachedAt: Date.now() };
  rateCache.set(cacheKey, result);
  return result;
}

/**
 * Convert an amount between two currencies.
 * Returns the converted value and the rate used.
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
  precision: number = 2
): Promise<{ converted: number; rate: number; date: string }> {
  const rateData = await fetchExchangeRate(from, to);
  const converted = parseFloat((amount * rateData.rate).toFixed(precision));
  return { converted, rate: rateData.rate, date: rateData.date };
}