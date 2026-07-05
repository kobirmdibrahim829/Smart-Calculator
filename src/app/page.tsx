'use client';

import { useEffect, useState } from 'react';
import { CURRENCIES, NAV_ITEMS, UNIT_CATEGORIES } from '@/constants';
import { convertCurrency } from '@/services';
import type { HistoryItem, HistoryItemType } from '@/types';
import { calculateAge, calculateEMI, formatNumber, roundTo, safeJsonParse } from '@/utils';

type FeatureKey = 'standard' | 'scientific' | 'currency' | 'unit' | 'age' | 'emi' | 'history';
type UnitCategoryKey = keyof typeof UNIT_CATEGORIES;

const globalStyles = `
  @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; }
  @media (max-width: 768px) { 
    aside { width: 100% !important; height: auto !important; flex-direction: row !important; overflow-x: auto; }
    h1 { font-size: 1.2rem !important; }
  }
`;

const standardButtons = [['7','8','9','/'],[' 4','5','6','*'],['1','2','3','-'],['0','.','C','+']];
const scientificButtons = [['sin(','cos(','tan(','√('],['π','e','log(','ln('],['x²','(',')','^'],['7','8','9','/'],[' 4','5','6','*'],['1','2','3','-'],['0','.','C','+']];

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
    if (!Number.isFinite(amount)) { setCurrencyError('Please enter a valid number'); setCurrencyResult(''); setCurrencyRate(''); return; }
    let cancelled = false;
    const run = async () => { setCurrencyLoading(true); setCurrencyError('');
      try { const result = await convertCurrency(amount, currencyFrom, currencyTo, 2); if (!cancelled) { setCurrencyResult(formatNumber(result.converted)); setCurrencyRate(`1 ${currencyFrom} = ${roundTo(result.rate, 4)} ${currencyTo}`); } }
      catch (error) { if (!cancelled) { setCurrencyError(error instanceof Error ? error.message : 'Unable to fetch conversion rate'); setCurrencyResult(''); setCurrencyRate(''); } }
      finally { if (!cancelled) setCurrencyLoading(false); } };
    void run();
    return () => { cancelled = true; };
  }, [currencyAmount, currencyFrom, currencyTo]);

  useEffect(() => {
    const currentUnits = Object.keys(UNIT_CATEGORIES[unitCategory].units);
    if (!currentUnits.includes(unitFrom)) setUnitFrom(currentUnits[0]);
    if (!currentUnits.includes(unitTo)) setUnitTo(currentUnits[1] ?? currentUnits[0]);
  }, [unitCategory, unitFrom, unitTo]);

  const addHistoryEntry = (type: HistoryItemType, expression: string, result: string) => {
    setHistory((prev) => [{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type, expression, result, timestamp: new Date().toISOString() }, ...prev].slice(0, 8));
  };

  const handleStandardButton = (value: string) => {
    if (value === 'C') { setStandardDisplay('0'); return; }
    if (value === '=') {
      const expression = standardDisplay.replace(/×/g, '*').replace(/÷/g, '/');
      try {
        const safeExpression = expression.replace(/[^0-9+\-*/().]/g, '');
        const answer = Number(new Function(`return (${safeExpression})`)());
        const nextValue = Number.isFinite(answer) ? answer.toString() : '0';
        setStandardDisplay(nextValue);
        addHistoryEntry('standard', expression, nextValue);
      } catch { setStandardDisplay('0'); }
      return;
    }
    setStandardDisplay((prev) => { if (prev === '0' && /[0-9.]/.test(value)) return value; return prev + value; });
  };

  const handleScientificButton = (value: string) => {
    if (value === 'C') { setScientificDisplay('0'); return; }
    if (value === '=') {
      const raw = scientificDisplay.replace(/×/g, '*').replace(/÷/g, '/').replace(/x²/g, '**2');
      try {
        const expression = raw.replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E').replace(/sqrt\(/g, 'Math.sqrt(').replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(').replace(/tan\(/g, 'Math.tan(').replace(/log\(/g, 'Math.log10(').replace(/ln\(/g, 'Math.log(').replace(/\^/g, '**');
        const answer = Number(new Function(`return (${expression})`)());
        const nextValue = Number.isFinite(answer) ? answer.toString() : '0';
        setScientificDisplay(nextValue);
        addHistoryEntry('scientific', scientificDisplay, nextValue);
      } catch { setScientificDisplay('0'); }
      return;
    }
    setScientificDisplay((prev) => { if (prev === '0' && /[0-9.]/.test(value)) return value; if (value === 'x²') return `${prev}**2`; if (value === '√(') return `${prev}Math.sqrt(`; return prev + value; });
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
      const celsius = fromUnit === 'C' ? input : fromUnit === 'F' ? (input - 32) * 5 / 9 : input - 273.15;
      const converted = toUnit === 'C' ? celsius : toUnit === 'F' ? celsius * 9 / 5 + 32 : celsius + 273.15;
      return `${formatNumber(converted)} ${unitTo}`;
    }
    const fromRatio = UNIT_CATEGORIES[unitCategory].units[unitFrom] as number;
    const toRatio = UNIT_CATEGORIES[unitCategory].units[unitTo] as number;
    const converted = (unitValueNumber * fromRatio) / toRatio;
    return `${formatNumber(converted)} ${unitTo}`;
  })();

  const Btn = ({ onClick, children, style: s }: { onClick?: () => void; children: string; style?: Record<string, string | number> }) => (
    <button onClick={onClick} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#1e293b', color: '#f8fafc', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', ...s }} onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }} onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
      {children}
    </button>
  );

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 55%, #1d4ed8 100%)', color: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{globalStyles}</style>
      <header style={{ padding: '20px 24px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', animation: 'slideIn 0.4s ease-out' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div><h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.3rem, 4vw, 2rem)', fontWeight: 700 }}>✨ Smart Calculator</h1><p style={{ margin: 0, color: '#93c5fd', fontSize: '0.9rem' }}>Professional • Mobile-Friendly • Live Animations</p></div>
          <div style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.15)', border: '1px solid #3b82f6', color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>🚀 GitHub Ready</div>
        </div>
      </header>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '16px', padding: '16px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <aside style={{ width: 'clamp(160px, 20vw, 240px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'slideIn 0.5s ease-out 0.1s both' }}>
          {NAV_ITEMS.filter((item) => ['standard', 'scientific', 'currency', 'unit', 'age', 'emi', 'history'].includes(item.page)).map((item) => {
            const featureKey = item.page as FeatureKey;
            const isActive = activeFeature === featureKey;
            return (
              <button key={item.page} onClick={() => setActiveFeature(featureKey)} style={{ padding: '14px 12px', borderRadius: '14px', border: isActive ? '1.5px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.2)', background: isActive ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.7)', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: isActive ? 'translateX(4px)' : 'translateX(0)', boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none' }} onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)'; e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)'; } }} onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)'; e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'; } }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{item.icon}</div>
                <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.9rem)', fontWeight: 700 }}>{item.label}</div>
              </button>
            );
          })}
        </aside>
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', minWidth: 0 }}>
          <div style={{ padding: '24px', borderRadius: '18px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.15)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.6s ease-out' }}>
            {activeFeature === 'standard' && (<div><h2 style={{ margin: '0 0 16px' }}>🧮 Standard Calculator</h2><div style={{ padding: '20px', borderRadius: '14px', background: '#020617', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', textAlign: 'right', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', border: '1px solid rgba(148, 163, 184, 0.1)', wordBreak: 'break-all', animation: 'slideIn 0.3s ease-out', marginBottom: '16px' }}>{standardDisplay}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>{standardButtons.flat().map((btn, i) => (<Btn key={i} onClick={() => handleStandardButton(btn)} style={{ background: btn === 'C' ? '#ef4444' : '#1e293b' }}>{btn}</Btn>))}<Btn onClick={() => handleStandardButton('=')} style={{ background: '#2563eb', gridColumn: 'span 2' }}>=</Btn></div></div>)}
            {activeFeature === 'scientific' && (<div><h2 style={{ margin: '0 0 16px' }}>📐 Scientific</h2><div style={{ padding: '20px', borderRadius: '14px', background: '#020617', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', textAlign: 'right', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', border: '1px solid rgba(148, 163, 184, 0.1)', wordBreak: 'break-all', marginBottom: '16px' }}>{scientificDisplay}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>{scientificButtons.flat().map((btn, i) => (<Btn key={i} onClick={() => handleScientificButton(btn)} style={{ background: btn === 'C' ? '#ef4444' : '#1e293b' }}>{btn}</Btn>))}<Btn onClick={() => handleScientificButton('=')} style={{ background: '#2563eb', gridColumn: 'span 2' }}>Eval</Btn></div></div>)}
            {activeFeature === 'currency' && (<div><h2 style={{ margin: '0 0 16px' }}>💱 Currency Converter</h2><div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}><input value={currencyAmount} onChange={(e) => setCurrencyAmount(e.target.value)} placeholder="Amount" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} /><select value={currencyFrom} onChange={(e) => setCurrencyFrom(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', cursor: 'pointer' }}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select><select value={currencyTo} onChange={(e) => setCurrencyTo(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', cursor: 'pointer' }}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></div><div style={{ padding: '20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(124, 58, 237, 0.15))', border: '1px solid rgba(59, 130, 246, 0.3)', marginTop: '16px', animation: 'slideIn 0.4s ease-out' }}>{currencyLoading && <div style={{ animation: 'pulse 1.5s infinite' }}>⏳ Fetching…</div>}{currencyError ? <div style={{ color: '#fca5a5' }}>⚠️ {currencyError}</div> : null}{!currencyLoading && !currencyError && currencyResult ? <><div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{currencyResult} {currencyTo}</div><div style={{ color: '#cbd5e1', marginTop: '8px', fontSize: '0.9rem' }}>{currencyRate}</div></> : null}</div></div>)}
            {activeFeature === 'unit' && (<div><h2 style={{ margin: '0 0 16px' }}>📏 Unit Converter</h2><div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}><input value={unitValue} onChange={(e) => setUnitValue(e.target.value)} placeholder="Value" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} /><select value={unitCategory} onChange={(e) => setUnitCategory(e.target.value as UnitCategoryKey)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', cursor: 'pointer' }}>{Object.entries(UNIT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select><select value={unitFrom} onChange={(e) => setUnitFrom(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', cursor: 'pointer' }}>{currentUnits.map((u) => <option key={u} value={u}>{u}</option>)}</select><select value={unitTo} onChange={(e) => setUnitTo(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', cursor: 'pointer' }}>{currentUnits.map((u) => <option key={u} value={u}>{u}</option>)}</select></div><div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', marginTop: '16px', fontSize: '1.3rem', fontWeight: 700 }}>{unitSummary}</div></div>)}
            {activeFeature === 'age' && (<div><h2 style={{ margin: '0 0 16px' }}>🎂 Age Calculator</h2><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', fontSize: '1rem', marginBottom: '16px', width: '100%' }} /><div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>{[['Years', ageResult.years], ['Months', ageResult.months], ['Days', ageResult.days], ['B-day', `${ageResult.daysToNextBirthday}d`]].map(([l, v]) => (<div key={l} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(59, 130, 246, 0.2)', transition: 'all 0.3s', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}><div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{l}</div><div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '8px' }}>{v}</div></div>))}</div></div>)}
            {activeFeature === 'emi' && (<div><h2 style={{ margin: '0 0 16px' }}>💰 EMI Calculator</h2><div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}><input value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="Principal" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} /><input value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} placeholder="Rate (%)" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} /><input value={tenureYears} onChange={(e) => setTenureYears(e.target.value)} placeholder="Tenure (yrs)" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }} /></div><div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginTop: '16px' }}>{[['Monthly', `${formatNumber(emiResult.monthlyEMI)}`], ['Interest', `${formatNumber(emiResult.totalInterest)}`], ['Total', `${formatNumber(emiResult.totalPayment)}`], ['Months', emiResult.tenureMonths.toString()]].map(([l, v]) => (<div key={l} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.2)' }}><div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{l}</div><div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>{v}</div></div>))}</div></div>)}
            {activeFeature === 'history' && (<div><h2 style={{ margin: '0 0 16px' }}>📜 History ({history.length})</h2>{history.length === 0 ? (<div style={{ padding: '32px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.7)', color: '#cbd5e1', textAlign: 'center', border: '1px dashed rgba(148, 163, 184, 0.3)' }}>No calculations yet 🚀</div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>{history.map((item, idx) => (<div key={item.id} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.15)', animation: `slideIn 0.3s ease-out ${idx * 0.05}s both` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}><span style={{ color: '#93c5fd', fontSize: '0.75rem', fontWeight: 700 }}>{item.type.toUpperCase()}</span><span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{new Date(item.timestamp).toLocaleTimeString()}</span></div><div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '4px' }}>{item.expression}</div><div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem' }}>= {item.result}</div></div>))}</div>)}</div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
