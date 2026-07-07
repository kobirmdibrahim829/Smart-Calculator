//src//constants//index.ts
// ============================================================
// SMART CALCULATOR PRO — App Constants
// ============================================================

import type { UnitCategoriesMap } from '@/types';

/** Navigation items for sidebar */
export const NAV_ITEMS = [
  { page: 'home', icon: '🏠', label: 'Home', section: 'Main' },
  { page: 'standard', icon: '🧮', label: 'Standard', section: 'Calculators' },
  { page: 'scientific', icon: '📐', label: 'Scientific', section: 'Calculators' },
  { page: 'currency', icon: '💱', label: 'Currency', section: 'Converters' },
  { page: 'unit', icon: '📏', label: 'Unit', section: 'Converters' },
  { page: 'age', icon: '🎂', label: 'Age Calculator', section: 'Tools' },
  { page: 'emi', icon: '💰', label: 'EMI Calculator', section: 'Tools' },
  { page: 'history', icon: '📜', label: 'History', section: 'More' },
  { page: 'settings', icon: '⚙️', label: 'Settings', section: 'More' },
  { page: 'about', icon: 'ℹ️', label: 'About', section: 'More' },
] as const;

/** Popular currencies shown in converter */
export const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { code: 'BDT', flag: '🇧🇩', name: 'Bangladeshi Taka' },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal' },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc' },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'MYR', flag: '🇲🇾', name: 'Malaysian Ringgit' },
  { code: 'KWD', flag: '🇰🇼', name: 'Kuwaiti Dinar' },
  { code: 'QAR', flag: '🇶🇦', name: 'Qatari Riyal' },
] as const;

/** Unit conversion data — base SI unit = 1 */
export const UNIT_CATEGORIES: UnitCategoriesMap = {
  length: {
    label: 'Length',
    units: {
      'Meter (m)': 1,
      'Kilometer (km)': 1000,
      'Centimeter (cm)': 0.01,
      'Millimeter (mm)': 0.001,
      'Micrometer (µm)': 1e-6,
      'Mile (mi)': 1609.344,
      'Yard (yd)': 0.9144,
      'Foot (ft)': 0.3048,
      'Inch (in)': 0.0254,
      'Nautical Mile': 1852,
    },
  },
  weight: {
    label: 'Weight',
    units: {
      'Kilogram (kg)': 1,
      'Gram (g)': 0.001,
      'Milligram (mg)': 1e-6,
      'Tonne (t)': 1000,
      'Pound (lb)': 0.45359237,
      'Ounce (oz)': 0.028349523,
      'Carat': 0.0002,
    },
  },
  temperature: {
    label: 'Temperature',
    units: {
      'Celsius (°C)': 'C',
      'Fahrenheit (°F)': 'F',
      'Kelvin (K)': 'K',
    },
  },
  area: {
    label: 'Area',
    units: {
      'Square Meter (m²)': 1,
      'Square Kilometer (km²)': 1e6,
      'Square Centimeter (cm²)': 0.0001,
      'Square Foot (ft²)': 0.092903,
      'Square Yard (yd²)': 0.836127,
      'Square Mile (mi²)': 2.59e6,
      'Acre': 4046.86,
      'Hectare (ha)': 10000,
    },
  },
  volume: {
    label: 'Volume',
    units: {
      'Liter (L)': 1,
      'Milliliter (mL)': 0.001,
      'Cubic Meter (m³)': 1000,
      'Cubic Centimeter (cm³)': 0.001,
      'Gallon (US)': 3.78541,
      'Quart (US)': 0.946353,
      'Pint (US)': 0.473176,
      'Cup (US)': 0.236588,
      'Fluid Ounce (US)': 0.0295735,
      'Tablespoon': 0.0147868,
    },
  },
  speed: {
    label: 'Speed',
    units: {
      'Meter/Second (m/s)': 1,
      'Kilometer/Hour (km/h)': 0.277778,
      'Mile/Hour (mph)': 0.44704,
      'Foot/Second (ft/s)': 0.3048,
      'Knot': 0.514444,
    },
  },
  data: {
    label: 'Data Storage',
    units: {
      'Byte (B)': 1,
      'Kilobyte (KB)': 1024,
      'Megabyte (MB)': 1048576,
      'Gigabyte (GB)': 1073741824,
      'Terabyte (TB)': 1.0995e12,
      'Petabyte (PB)': 1.126e15,
      'Bit': 0.125,
      'Kilobit (Kbit)': 128,
      'Megabit (Mbit)': 131072,
    },
  },
};

/** LocalStorage key */
export const STORAGE_KEY = 'scp_state_v1';

/** Frankfurter API base URL */
export const FRANKFURTER_API = 'https://api.frankfurter.app';

/** Currency cache duration (ms) */
export const CURRENCY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/** Max history items */
export const MAX_HISTORY_ITEMS = 200;

/** App version */
export const APP_VERSION = '1.0.0';