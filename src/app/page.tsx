'use client';

import { useEffect, useState } from 'react';
import { CURRENCIES, NAV_ITEMS, UNIT_CATEGORIES } from '@/constants';
import { convertCurrency } from '@/services';
import type { HistoryItem, HistoryItemType } from '@/types';
import { calculateAge, calculateEMI, formatNumber, roundTo, safeJsonParse } from '@/utils';

type FeatureKey = 'standard' | 'scientific' | 'currency' | 'unit' | 'age' | 'emi' | 'history';

type UnitCategoryKey = keyof typeof UNIT_CATEGORIES;

const standardButtons = [
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['0', '.', 'C', '+'],
];

const scientificButtons = [
  ['sin(', 'cos(', 'tan(', '√('],
  ['π', 'e', 'log(', 'ln('],
  ['x²', '(', ')', '^'],
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['0', '.', 'C', '+'],
];

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>('standard');
  const [standardDisplay, setStandardDisplay] = useState('0');
  const [scientificDisplay, setScientificDisplay] = useState('0');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [currencyAmount, setCurrencyAmount] = useState('1');
  const [currencyFrom, setCurrencyFrom] = useState('USD');
  const [currencyTo, setCurrencyTo] = useState('BDT');
  const [currencyResult, setCurrencyResult] = useState<string>('');
  const [currencyRate, setCurrencyRate] = useState<string>('');
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState('');

  const [unitCategory, setUnitCategory] = useState<UnitCategoryKey>('length');
  const [unitFrom, setUnitFrom] = useState('Meter (m)');
  const [unitTo, setUnitTo] = useState('Foot (ft)');
  const [unitValue, setUnitValue] = useState('1');

  const [dob, setDob] = useState('1995-01-15');
  const [principal, setPrincipal] = useState('100000');
  const [annualRate, setAnnualRate] = useState('12');
  const [tenureYears, setTenureYears] = useState('5');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = safeJsonParse<HistoryItem[]>(window.localStorage.getItem('scp_history'), []);
    setHistory(stored);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('scp_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const amount = Number(currencyAmount);
    if (!Number.isFinite(amount)) {
      setCurrencyError('Please enter a valid number');
      setCurrencyResult('');
      setCurrencyRate('');
      return;
    }

    let cancelled = false;
    const run = async () => {
      setCurrencyLoading(true);
      setCurrencyError('');
      try {
        const result = await convertCurrency(amount, currencyFrom, currencyTo, 2);
        if (!cancelled) {
          setCurrencyResult(formatNumber(result.converted));
          setCurrencyRate(`1 ${currencyFrom} = ${roundTo(result.rate, 4)} ${currencyTo}`);
        }
      } catch (error) {
        if (!cancelled) {
          setCurrencyError(error instanceof Error ? error.message : 'Unable to fetch conversion rate');
          setCurrencyResult('');
          setCurrencyRate('');
        }
      } finally {
        if (!cancelled) setCurrencyLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [currencyAmount, currencyFrom, currencyTo]);

  useEffect(() => {
    const currentUnits = Object.keys(UNIT_CATEGORIES[unitCategory].units);
    if (!currentUnits.includes(unitFrom)) {
      setUnitFrom(currentUnits[0]);
    }
    if (!currentUnits.includes(unitTo)) {
      setUnitTo(currentUnits[1] ?? currentUnits[0]);
    }
  }, [unitCategory, unitFrom, unitTo]);

  const addHistoryEntry = (type: HistoryItemType, expression: string, result: string) => {
    const item: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      expression,
      result,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => [item, ...prev].slice(0, 8));
  };

  const handleStandardButton = (value: string) => {
    if (value === 'C') {
      setStandardDisplay('0');
      return;
    }
    if (value === '=') {
      const expression = standardDisplay.replace(/×/g, '*').replace(/÷/g, '/');
      try {
        const safeExpression = expression.replace(/[^0-9+\-*/().]/g, '');
        const answer = Number(new Function(`return (${safeExpression})`)());
        const nextValue = Number.isFinite(answer) ? answer.toString() : '0';
        setStandardDisplay(nextValue);
        addHistoryEntry('standard', expression, nextValue);
      } catch {
        setStandardDisplay('0');
      }
      return;
    }
    setStandardDisplay((prev) => {
      if (prev === '0' && /[0-9.]/.test(value)) return value;
      return prev + value;
    });
  };

  const handleScientificButton = (value: string) => {
    if (value === 'C') {
      setScientificDisplay('0');
      return;
    }
    if (value === '=') {
      const raw = scientificDisplay.replace(/×/g, '*').replace(/÷/g, '/').replace(/x²/g, '**2');
      try {
        const expression = raw
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E')
          .replace(/sqrt\(/g, 'Math.sqrt(')
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/\^/g, '**');
        const answer = Number(new Function(`return (${expression})`)());
        const nextValue = Number.isFinite(answer) ? answer.toString() : '0';
        setScientificDisplay(nextValue);
        addHistoryEntry('scientific', scientificDisplay, nextValue);
      } catch {
        setScientificDisplay('0');
      }
      return;
    }

    setScientificDisplay((prev) => {
      if (prev === '0' && /[0-9.]/.test(value)) return value;
      if (value === 'x²') return `${prev}**2`;
      if (value === '√(') return `${prev}Math.sqrt(`;
      return prev + value;
    });
  };

  const ageResult = calculateAge(new Date(dob), new Date());
  const emiResult = calculateEMI(Number(principal) || 0, Number(annualRate) || 0, (Number(tenureYears) || 0) * 12);

  const currentUnits = Object.keys(UNIT_CATEGORIES[unitCategory].units);
  const featureItems = NAV_ITEMS.filter((item) => ['standard', 'scientific', 'currency', 'unit', 'age', 'emi', 'history'].includes(item.page));
  const unitValueNumber = Number(unitValue);

  const unitSummary = (() => {
    if (unitCategory === 'temperature') {
      const fromUnit = UNIT_CATEGORIES.temperature.units[unitFrom] as string;
      const toUnit = UNIT_CATEGORIES.temperature.units[unitTo] as string;
      const input = Number(unitValue);
      const celsius = fromUnit === 'C' ? input : fromUnit === 'F' ? (input - 32) * 5 / 9 : input - 273.15;
      const converted = toUnit === 'C' ? celsius : toUnit === 'F' ? celsius * 9 / 5 + 32 : celsius + 273.15;
      return `${formatNumber(converted)} ${unitTo}`;
    }
    const fromRatio = UNIT_CATEGORIES[unitCategory].units[unitFrom] as number;
    const toRatio = UNIT_CATEGORIES[unitCategory].units[unitTo] as number;
    const converted = (unitValueNumber * fromRatio) / toRatio;
    return `${formatNumber(converted)} ${unitTo}`;
  })();

  return (
    <main style={{ minHeight: '100vh', padding: '24px', background: 'linear-gradient(135deg, #020617 0%, #0f172a 55%, #1d4ed8 100%)', color: '#f8fafc' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gap: '20px' }}>
        <section style={{ padding: '24px', borderRadius: '24px', background: 'rgba(15, 23, 42, 0.84)', boxShadow: '0 20px 50px rgba(2, 6, 23, 0.35)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.8rem' }}>Smart Calculator Pro</p>
              <h1 style={{ margin: '6px 0 8px', fontSize: '2rem' }}>All-in-one math, currency, and utility tools</h1>
              <p style={{ margin: 0, color: '#cbd5e1', maxWidth: 720, lineHeight: 1.6 }}>
                A polished experience for everyday calculations, quick conversions, and useful history tracking.
              </p>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', fontWeight: 700 }}>
              ✨ Modern UI • Fast results • Local history
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {featureItems.map((item) => {
            const featureKey = item.page as FeatureKey;
            const isActive = activeFeature === featureKey;
            return (
              <button
                key={item.page}
                onClick={() => setActiveFeature(featureKey)}
                style={{
                  border: isActive ? '1px solid #60a5fa' : '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '18px',
                  background: isActive ? 'rgba(37, 99, 235, 0.24)' : 'rgba(15, 23, 42, 0.86)',
                  color: '#f8fafc',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '1.25rem' }}>{item.icon}</div>
                <div style={{ fontWeight: 700, marginTop: '6px' }}>{item.label}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>{item.section}</div>
              </button>
            );
          })}
        </section>

        <section style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1.5fr 0.9fr' }}>
          <div style={{ borderRadius: '24px', padding: '22px', background: 'rgba(15, 23, 42, 0.86)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
            {activeFeature === 'standard' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0 }}>Standard Calculator</h2>
                  <span style={{ color: '#93c5fd' }}>Fast arithmetic</span>
                </div>
                <div style={{ padding: '16px', borderRadius: '16px', background: '#020617', fontSize: '2rem', marginBottom: '16px', minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{standardDisplay}</div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {standardButtons.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
                      {row.map((button) => (
                        <button key={button} onClick={() => handleStandardButton(button)} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: button === 'C' ? '#ef4444' : '#1e293b', color: '#f8fafc', fontSize: '1rem', cursor: 'pointer' }}>
                          {button}
                        </button>
                      ))}
                    </div>
                  ))}
                  <button onClick={() => handleStandardButton('=')} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: '#2563eb', color: '#f8fafc', fontSize: '1rem', cursor: 'pointer' }}> = </button>
                </div>
              </>
            )}

            {activeFeature === 'scientific' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0 }}>Scientific Calculator</h2>
                  <span style={{ color: '#93c5fd' }}>Advanced expressions</span>
                </div>
                <div style={{ padding: '16px', borderRadius: '16px', background: '#020617', fontSize: '1.4rem', marginBottom: '16px', minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{scientificDisplay}</div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {scientificButtons.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
                      {row.map((button) => (
                        <button key={button} onClick={() => handleScientificButton(button)} style={{ padding: '12px', borderRadius: '14px', border: 'none', background: button === 'C' ? '#ef4444' : '#1e293b', color: '#f8fafc', cursor: 'pointer' }}>
                          {button}
                        </button>
                      ))}
                    </div>
                  ))}
                  <button onClick={() => handleScientificButton('=')} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: '#2563eb', color: '#f8fafc', cursor: 'pointer' }}>Evaluate</button>
                </div>
              </>
            )}

            {activeFeature === 'currency' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0 }}>Currency Converter</h2>
                  <span style={{ color: '#93c5fd' }}>Live FX rates</span>
                </div>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                  <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>Amount</span>
                  <input value={currencyAmount} onChange={(event) => setCurrencyAmount(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} />
                </label>
                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                  <label>
                    <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>From</span>
                    <select value={currencyFrom} onChange={(event) => setCurrencyFrom(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }}>
                      {CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.flag} {currency.code}</option>)}
                    </select>
                  </label>
                  <label>
                    <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>To</span>
                    <select value={currencyTo} onChange={(event) => setCurrencyTo(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }}>
                      {CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.flag} {currency.code}</option>)}
                    </select>
                  </label>
                </div>
                <div style={{ marginTop: '16px', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(124, 58, 237, 0.18))' }}>
                  {currencyLoading && <div>Fetching live exchange rate…</div>}
                  {currencyError ? <div style={{ color: '#fca5a5' }}>{currencyError}</div> : null}
                  {!currencyLoading && !currencyError && currencyResult ? <><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{currencyResult} {currencyTo}</div><div style={{ color: '#cbd5e1', marginTop: '6px' }}>{currencyRate}</div></> : null}
                </div>
              </>
            )}

            {activeFeature === 'unit' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0 }}>Unit Converter</h2>
                  <span style={{ color: '#93c5fd' }}>Measure with precision</span>
                </div>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                  <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>Value</span>
                  <input value={unitValue} onChange={(event) => setUnitValue(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} />
                </label>
                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                  <label>
                    <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>Category</span>
                    <select value={unitCategory} onChange={(event) => setUnitCategory(event.target.value as UnitCategoryKey)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }}>
                      {Object.entries(UNIT_CATEGORIES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>From</span>
                    <select value={unitFrom} onChange={(event) => setUnitFrom(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }}>
                      {currentUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </label>
                </div>
                <div style={{ display: 'grid', gap: '10px', marginTop: '10px', gridTemplateColumns: '1fr 1fr' }}>
                  <label>
                    <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>To</span>
                    <select value={unitTo} onChange={(event) => setUnitTo(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }}>
                      {currentUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </label>
                  <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(37, 99, 235, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', fontWeight: 700 }}>
                    {unitSummary}
                  </div>
                </div>
              </>
            )}

            {activeFeature === 'age' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0 }}>Age Calculator</h2>
                  <span style={{ color: '#93c5fd' }}>Know your milestones</span>
                </div>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                  <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>Date of birth</span>
                  <input type="date" value={dob} onChange={(event) => setDob(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} />
                </label>
                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  {[
                    ['Years', ageResult.years],
                    ['Months', ageResult.months],
                    ['Days', ageResult.days],
                    ['Next birthday', `${ageResult.daysToNextBirthday} days`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '12px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{label}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '4px' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeFeature === 'emi' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0 }}>EMI Calculator</h2>
                  <span style={{ color: '#93c5fd' }}>Plan your loan smoothly</span>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <label>
                    <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>Principal amount</span>
                    <input value={principal} onChange={(event) => setPrincipal(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} />
                  </label>
                  <label>
                    <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>Annual interest rate (%)</span>
                    <input value={annualRate} onChange={(event) => setAnnualRate(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} />
                  </label>
                  <label>
                    <span style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1' }}>Tenure (years)</span>
                    <input value={tenureYears} onChange={(event) => setTenureYears(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} />
                  </label>
                </div>
                <div style={{ marginTop: '16px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  {[
                    ['Monthly EMI', `৳${formatNumber(emiResult.monthlyEMI)}`],
                    ['Total interest', `৳${formatNumber(emiResult.totalInterest)}`],
                    ['Total payment', `৳${formatNumber(emiResult.totalPayment)}`],
                    ['Tenure months', emiResult.tenureMonths.toString()],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '12px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{label}</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '4px' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeFeature === 'history' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0 }}>Recent History</h2>
                  <span style={{ color: '#93c5fd' }}>Saved locally</span>
                </div>
                {history.length === 0 ? (
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.7)', color: '#cbd5e1' }}>No history yet. Run a calculation and it will appear here.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {history.map((item) => (
                      <div key={item.id} style={{ padding: '14px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ color: '#93c5fd', fontWeight: 700 }}>{item.type}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <div style={{ color: '#f8fafc' }}>{item.expression}</div>
                        <div style={{ color: '#fbbf24', fontWeight: 700, marginTop: '6px' }}>{item.result}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <aside style={{ display: 'grid', gap: '16px' }}>
            <div style={{ padding: '20px', borderRadius: '24px', background: 'rgba(15, 23, 42, 0.86)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
              <h3 style={{ marginTop: 0 }}>Popular currencies</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CURRENCIES.slice(0, 8).map((currency) => (
                  <span key={currency.code} style={{ padding: '8px 10px', borderRadius: '999px', background: '#1e293b', color: '#f8fafc', fontSize: '0.9rem' }}>{currency.flag} {currency.code}</span>
                ))}
              </div>
            </div>

            <div style={{ padding: '20px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.28), rgba(15, 23, 42, 0.86))', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
              <h3 style={{ marginTop: 0 }}>Quick tips</h3>
              <ul style={{ paddingLeft: '18px', color: '#cbd5e1', lineHeight: 1.7 }}>
                <li>Use scientific mode for advanced expressions.</li>
                <li>Currency rates refresh live from Frankfurter API.</li>
                <li>History is stored locally in your browser.</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
