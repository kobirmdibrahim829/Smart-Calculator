//src//hooks//index.ts
// ============================================================
// SMART CALCULATOR PRO — useLocalStorage Hook
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { safeJsonParse } from '@/utils';

/**
 * A hook that syncs state with localStorage.
 * Safe for SSR — returns the initialValue on first render.
 *
 * @param key        The localStorage key
 * @param initialValue  Default value if key doesn't exist
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const raw = window.localStorage.getItem(key);
    const parsed = safeJsonParse<T>(raw, initialValue);
    setStoredValue(parsed);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          console.warn(`[useLocalStorage] Could not write key "${key}"`, next);
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue] as const;
}