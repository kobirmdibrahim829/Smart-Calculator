'use client';

import { useEffect, useState } from 'react';
import { CURRENCIES, NAV_ITEMS, UNIT_CATEGORIES } from '@/constants';
import { convertCurrency } from '@/services';
import type { HistoryItem, HistoryItemType } from '@/types';
import { calculateAge, calculateEMI, formatNumber, roundTo, safeJsonParse } from '@/utils';

type FeatureKey = 'standard' | 'scientific' | 'currency' | 'unit' | 'age' | 'emi' | 'history';
type UnitCategoryKey = keyof typeof UNIT_CATEGORIES;

const globalStyles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; overflow-x: hidden; }
  button, input, select { font: inherit; }

  .scp-shell {
    min-height: 100vh;
    background: linear-gradient(135deg, #020617 0%, #0f172a 55%, #1d4ed8 100%);
    color: #f8fafc;
    display: flex;
    flex-direction: column;
  }

  .scp-header {
    padding: 18px 16px;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    animation: slideIn 0.4s ease-out;
  }

  .scp-header-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .scp-title {
    margin: 0 0 6px;
    font-size: clamp(1.2rem, 4vw, 2rem);
    font-weight: 800;
  }

  .scp-subtitle {
    margin: 0;
    color: #93c5fd;
    font-size: 0.92rem;
  }

  .scp-badge {
    padding: 10px 16px;
    border-radius: 12px;
    background: rgba(37, 99, 235, 0.15);
    border: 1px solid #3b82f6;
    color: #93c5fd;
    font-size: 0.85rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .scp-app {
    flex: 1;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 16px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .scp-sidebar {
    width: 240px;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: slideIn 0.5s ease-out 0.1s both;
  }

  .scp-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .scp-panel {
    padding: 24px;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.15);
    backdrop-filter: blur(10px);
    animation: fadeIn 0.6s ease-out;
    min-width: 0;
  }

  .scp-section-title {
    margin: 0 0 16px;
    font-size: clamp(1.1rem, 2vw, 1.45rem);
  }

  .scp-display {
    padding: 18px;
    border-radius: 14px;
    background: #020617;
    text-align: right;
    min-height: 78px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border: 1px solid rgba(148, 163, 184, 0.1);
    word-break: break-word;
    overflow-wrap: anywhere;
    margin-bottom: 16px;
  }

  .scp-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .scp-auto-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .scp-auto-grid-small {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  }

  .scp-nav-btn {
    padding: 14px 12px;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    background: rgba(15, 23, 42, 0.7);
    color: #f8fafc;
    cursor: pointer;
    text-align: left;
    transition: all 0.25s ease;
    width: 100%;
  }

  .scp-nav-btn.active {
    border: 1.5px solid #3b82f6;
    background: rgba(37, 99, 235, 0.2);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    transform: translateX(4px);
  }

  .scp-nav-btn:hover {
    background: rgba(15, 23, 42, 0.88);
    border-color: rgba(148, 163, 184, 0.35);
  }

  .scp-input,
  .scp-select {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #334155;
    background: #020617;
    color: #f8fafc;
    outline: none;
    min-width: 0;
  }

  .scp-result-box {
    padding: 18px;
    border-radius: 14px;
    background: rgba(37, 99, 235, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.3);
    margin-top: 16px;
  }

  .scp-history-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 380px;
    overflow-y: auto;
  }

  @media (max-width: 1100px) {
    .scp-app {
      gap: 14px;
      padding: 14px;
    }

    .scp-sidebar {
      width: 210px;
      min-width: 200px;
    }

    .scp-panel {
      padding: 20px;
    }
  }

  @media (max-width: 900px) {
    .scp-app {
      flex-direction: column;
      align-items: stretch;
    }

    .scp-sidebar {
      width: 100%;
      min-width: 0;
      flex-direction: row;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 4px;
      gap: 10px;
      scrollbar-width: thin;
    }

    .scp-sidebar::-webkit-scrollbar {
      height: 6px;
    }

    .scp-sidebar::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.35);
      border-radius: 999px;
    }

    .scp-nav-btn {
      min-width: 150px;
      flex: 0 0 auto;
      text-align: center;
      padding: 12px 10px;
    }

    .scp-nav-btn.active {
      transform: translateY(-2px);
    }
  }

  @media (max-width: 640px) {
    .scp-header {
      padding: 16px 12px;
    }

    .scp-app {
      padding: 12px;
      gap: 12px;
    }

    .scp-panel {
      padding: 16px;
      border-radius: 16px;
    }

    .scp-display {
      min-height: 72px;
      padding: 14px;
    }

    .scp-grid-4 {
      gap: 8px;
    }

    .scp-auto-grid {
      grid-template-columns: 1fr;
    }

    .scp-auto-grid-small {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .scp-badge {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 420px) {
    .scp-panel {
      padding: 14px;
    }

    .scp-auto-grid-small {
      grid-template-columns: 1fr;
    }
  }
`;

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
  const [currencyResult, setCurrencyResult] = useState('');
  const [currencyRate, setCurrencyRate] = useState('');
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
    if (!currentUnits.includes(unitFrom)) setUnitFrom(currentUnits[0]);
    if (!currentUnits.includes(unitTo)) setUnitTo(currentUnits[1] ?? currentUnits[0]);
  }, [unitCategory, unitFrom, unitTo]);

  const addHistoryEntry = (type: HistoryItemType, expression: string, result: string) => {
    setHistory((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type,
          expression,
          result,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 8)
    );
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
  const unitValueNumber = Number(unitValue);

  const unitSummary = (() => {
    if (unitCategory === 'temperature') {
      const fromUnit = UNIT_CATEGORIES.temperature.units[unitFrom] as string;
      const toUnit = UNIT_CATEGORIES.temperature.units[unitTo] as string;
      const input = Number(unitValue);

      const celsius =
        fromUnit === 'C'
          ? input
          : fromUnit === 'F'
          ? (input - 32) * 5 / 9
          : input - 273.15;

      const converted =
        toUnit === 'C'
          ? celsius
          : toUnit === 'F'
          ? celsius * 9 / 5 + 32
          : celsius + 273.15;

      return `${formatNumber(converted)} ${unitTo}`;
    }

    const fromRatio = UNIT_CATEGORIES[unitCategory].units[unitFrom] as number;
    const toRatio = UNIT_CATEGORIES[unitCategory].units[unitTo] as number;
    const converted = (unitValueNumber * fromRatio) / toRatio;
    return `${formatNumber(converted)} ${unitTo}`;
  })();

  const Btn = ({
    onClick,
    children,
    style: s,
  }: {
    onClick?: () => void;
    children: string;
    style?: React.CSSProperties;
  }) => (
    <button
      onClick={onClick}
      style={{
        padding: '12px',
        minHeight: '48px',
        borderRadius: '10px',
        border: 'none',
        background: '#1e293b',
        color: '#f8fafc',
        fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: '100%',
        ...s,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.96)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {children}
    </button>
  );

  return (
    <main className="scp-shell">
      <style>{globalStyles}</style>

      <header className="scp-header">
        <div className="scp-header-inner">
          <div>
            <h1 className="scp-title">✨ Smart Calculator</h1>
            <p className="scp-subtitle">Professional • Mobile-Friendly • Live Animations</p>
          </div>

          <div className="scp-badge">🚀 GitHub Ready</div>
        </div>
      </header>

      <div className="scp-app">
        <aside className="scp-sidebar">
          {NAV_ITEMS.filter((item) =>
            ['standard', 'scientific', 'currency', 'unit', 'age', 'emi', 'history'].includes(item.page)
          ).map((item) => {
            const featureKey = item.page as FeatureKey;
            const isActive = activeFeature === featureKey;

            return (
              <button
                key={item.page}
                onClick={() => setActiveFeature(featureKey)}
                className={`scp-nav-btn ${isActive ? 'active' : ''}`}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{item.icon}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.label}</div>
              </button>
            );
          })}
        </aside>

        <section className="scp-content">
          <div className="scp-panel">
            {activeFeature === 'standard' && (
              <div>
                <h2 className="scp-section-title">🧮 Standard Calculator</h2>

                <div
                  className="scp-display"
                  style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)' }}
                >
                  {standardDisplay}
                </div>

                <div className="scp-grid-4">
                  {standardButtons.flat().map((btn, i) => (
                    <Btn
                      key={i}
                      onClick={() => handleStandardButton(btn)}
                      style={{ background: btn === 'C' ? '#ef4444' : '#1e293b' }}
                    >
                      {btn}
                    </Btn>
                  ))}
                  <Btn onClick={() => handleStandardButton('=')} style={{ background: '#2563eb', gridColumn: 'span 2' }}>
                    =
                  </Btn>
                </div>
              </div>
            )}

            {activeFeature === 'scientific' && (
              <div>
                <h2 className="scp-section-title">📐 Scientific Calculator</h2>

                <div
                  className="scp-display"
                  style={{ fontSize: 'clamp(1.15rem, 3vw, 1.8rem)' }}
                >
                  {scientificDisplay}
                </div>

                <div className="scp-grid-4">
                  {scientificButtons.flat().map((btn, i) => (
                    <Btn
                      key={i}
                      onClick={() => handleScientificButton(btn)}
                      style={{ background: btn === 'C' ? '#ef4444' : '#1e293b' }}
                    >
                      {btn}
                    </Btn>
                  ))}
                  <Btn onClick={() => handleScientificButton('=')} style={{ background: '#2563eb', gridColumn: 'span 2' }}>
                    Eval
                  </Btn>
                </div>
              </div>
            )}

            {activeFeature === 'currency' && (
              <div>
                <h2 className="scp-section-title">💱 Currency Converter</h2>

                <div className="scp-auto-grid">
                  <input
                    value={currencyAmount}
                    onChange={(e) => setCurrencyAmount(e.target.value)}
                    placeholder="Amount"
                    className="scp-input"
                  />

                  <select
                    value={currencyFrom}
                    onChange={(e) => setCurrencyFrom(e.target.value)}
                    className="scp-select"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currencyTo}
                    onChange={(e) => setCurrencyTo(e.target.value)}
                    className="scp-select"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(124, 58, 237, 0.15))',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    marginTop: '16px',
                    animation: 'slideIn 0.4s ease-out',
                  }}
                >
                  {currencyLoading && <div style={{ animation: 'pulse 1.5s infinite' }}>⏳ Fetching…</div>}
                  {currencyError ? <div style={{ color: '#fca5a5' }}>⚠️ {currencyError}</div> : null}

                  {!currencyLoading && !currencyError && currencyResult ? (
                    <>
                      <div style={{ fontSize: 'clamp(1.25rem, 3vw, 1.8rem)', fontWeight: 800 }}>
                        {currencyResult} {currencyTo}
                      </div>
                      <div style={{ color: '#cbd5e1', marginTop: '8px', fontSize: '0.9rem' }}>
                        {currencyRate}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {activeFeature === 'unit' && (
              <div>
                <h2 className="scp-section-title">📏 Unit Converter</h2>

                <div className="scp-auto-grid">
                  <input
                    value={unitValue}
                    onChange={(e) => setUnitValue(e.target.value)}
                    placeholder="Value"
                    className="scp-input"
                  />

                  <select
                    value={unitCategory}
                    onChange={(e) => setUnitCategory(e.target.value as UnitCategoryKey)}
                    className="scp-select"
                  >
                    {Object.entries(UNIT_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>

                  <select value={unitFrom} onChange={(e) => setUnitFrom(e.target.value)} className="scp-select">
                    {currentUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>

                  <select value={unitTo} onChange={(e) => setUnitTo(e.target.value)} className="scp-select">
                    {currentUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="scp-result-box" style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)', fontWeight: 800 }}>
                  {unitSummary}
                </div>
              </div>
            )}

            {activeFeature === 'age' && (
              <div>
                <h2 className="scp-section-title">🎂 Age Calculator</h2>

                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="scp-input"
                  style={{ marginBottom: '16px' }}
                />

                <div className="scp-auto-grid-small">
                  {[
                    ['Years', ageResult.years],
                    ['Months', ageResult.months],
                    ['Days', ageResult.days],
                    ['B-day', `${ageResult.daysToNextBirthday}d`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(37, 99, 235, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                      }}
                    >
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{label}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '8px' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeFeature === 'emi' && (
              <div>
                <h2 className="scp-section-title">💰 EMI Calculator</h2>

                <div className="scp-auto-grid">
                  <input
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="Principal"
                    className="scp-input"
                  />
                  <input
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    placeholder="Rate (%)"
                    className="scp-input"
                  />
                  <input
                    value={tenureYears}
                    onChange={(e) => setTenureYears(e.target.value)}
                    placeholder="Tenure (yrs)"
                    className="scp-input"
                  />
                </div>

                <div className="scp-auto-grid-small" style={{ marginTop: '16px' }}>
                  {[
                    ['Monthly', `${formatNumber(emiResult.monthlyEMI)}`],
                    ['Interest', `${formatNumber(emiResult.totalInterest)}`],
                    ['Total', `${formatNumber(emiResult.totalPayment)}`],
                    ['Months', emiResult.tenureMonths.toString()],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(124, 58, 237, 0.12)',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                      }}
                    >
                      <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{label}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeFeature === 'history' && (
              <div>
                <h2 className="scp-section-title">📜 History ({history.length})</h2>

                {history.length === 0 ? (
                  <div
                    style={{
                      padding: '32px',
                      borderRadius: '14px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      color: '#cbd5e1',
                      textAlign: 'center',
                      border: '1px dashed rgba(148, 163, 184, 0.3)',
                    }}
                  >
                    No calculations yet 🚀
                  </div>
                ) : (
                  <div className="scp-history-list">
                    {history.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid rgba(148, 163, 184, 0.15)',
                          animation: `slideIn 0.3s ease-out ${idx * 0.05}s both`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '8px',
                            marginBottom: '6px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ color: '#93c5fd', fontSize: '0.75rem', fontWeight: 700 }}>
                            {item.type.toUpperCase()}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <div
                          style={{
                            color: '#cbd5e1',
                            fontSize: '0.9rem',
                            marginBottom: '4px',
                            wordBreak: 'break-word',
                          }}
                        >
                          {item.expression}
                        </div>

                        <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.95rem' }}>
                          = {item.result}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}