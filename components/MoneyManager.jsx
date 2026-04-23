'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Wallet, X } from 'lucide-react';

const MONTH_BUDGET = 500000;
const CATEGORIES = ['🍔 Овқат','📚 Ўқиш','🚌 Транспорт','💊 Соғлиқ','🕌 Садақа','💸 Жарима','🎯 Бошқа'];
const CAT_COLORS  = {
  '🍔 Овқат':     '#f59e0b',
  '📚 Ўқиш':     '#6366f1',
  '🚌 Транспорт': '#10b981',
  '💊 Соғлиқ':   '#ef4444',
  '🕌 Садақа':   '#8b5cf6',
  '💸 Жарима':   '#dc2626',
  '🎯 Бошқа':    '#6b7280',
};

const TODAY = () => new Date().toISOString().split('T')[0];

function BarChart({ dailyMap, range }) {
  const entries = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) return <div className="text-center opacity-30 text-xs py-6">Маълумот йўқ</div>;
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-1 h-24 w-full overflow-x-auto pb-1">
      {entries.map(([date, val]) => {
        const pct = Math.max(4, (val / max) * 100);
        const label = range === 'month' ? date.slice(8) : date.slice(5);
        return (
          <div key={date} className="flex flex-col items-center gap-1 flex-1 min-w-[20px]">
            <div className="text-[8px] font-bold opacity-60">{val >= 1000 ? `${Math.round(val/1000)}k` : val}</div>
            <div className="w-full flex items-end" style={{ height: '60px' }}>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{ height: `${pct}%`, background: '#10b981' }}
              />
            </div>
            <div className="text-[8px] opacity-40">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryBreakdown({ expenses }) {
  const totals = {};
  expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  const total = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);

  if (!sorted.length) return null;

  return (
    <div className="space-y-2">
      {sorted.map(([cat, val]) => (
        <div key={cat} className="flex items-center gap-2">
          <div className="text-sm w-24 font-medium truncate">{cat}</div>
          <div className="flex-1 h-2 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(val/total)*100}%`, background: CAT_COLORS[cat] || '#6b7280' }}
            />
          </div>
          <div className="text-[11px] font-bold w-16 text-right">{val.toLocaleString()}с</div>
        </div>
      ))}
    </div>
  );
}

export default function MoneyManager({ theme, onClose }) {
  const [range, setRange]         = useState('month');
  const [expenses, setExpenses]   = useState([]);
  const [dailyMap, setDailyMap]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);

  // Add form
  const [amount, setAmount]     = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [note, setNote]         = useState('');
  const [saving, setSaving]     = useState(false);

  const today = TODAY();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/expenses?range=${range}&date=${today}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
      setDailyMap(data.dailyMap || {});
    } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const total     = expenses.reduce((s, e) => s + e.amount, 0);
  const todaySum  = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
  const monthPct  = Math.min(100, Math.round((total / MONTH_BUDGET) * 100));
  const isOver    = total > MONTH_BUDGET;

  async function handleAdd() {
    if (!amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), category, note, date: today }),
      });
      setAmount(''); setNote(''); setCategory(CATEGORIES[0]); setShowAdd(false);
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Ўчириш?')) return;
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className={`min-h-screen pb-28 ${theme.appBg} ${theme.text}`}>
      {/* HEADER */}
      <header className="px-5 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onClose} className="p-2 rounded-2xl bg-black/10 active:scale-95 transition-transform">
            <ArrowLeft size={18}/>
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">Пул Назорати</h1>
            <p className="text-[10px] opacity-40 font-medium uppercase tracking-widest">Money Manager</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-black/5 rounded-3xl p-4">
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Бугун</div>
            <div className="text-2xl font-black font-display">{todaySum.toLocaleString()}с</div>
          </div>
          <div className={`rounded-3xl p-4 ${isOver ? 'bg-red-500/10 border border-red-500/30' : 'bg-black/5'}`}>
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">
              {range === 'day' ? 'Жами' : range === 'week' ? 'Ҳафта' : 'Ой'}
            </div>
            <div className={`text-2xl font-black font-display ${isOver ? 'text-red-500' : ''}`}>
              {total.toLocaleString()}с
            </div>
          </div>
        </div>

        {/* Budget bar (month only) */}
        {range === 'month' && (
          <div className="mb-1">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                Бюджет: {MONTH_BUDGET.toLocaleString()}с
              </span>
              <span className={`text-[10px] font-bold ${isOver ? 'text-red-400' : 'opacity-60'}`}>
                {monthPct}% {isOver ? '⚠️ Ошди!' : ''}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-black/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${monthPct}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="px-5 space-y-4">
        {/* Range switch */}
        <div className={`flex gap-1 p-1 rounded-2xl bg-black/10`}>
          {[['day','Кун'],['week','Ҳафта'],['month','Ой']].map(([r, label]) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                range === r ? `${theme.button} text-white shadow` : 'opacity-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Chart */}
        {!loading && Object.keys(dailyMap).length > 0 && (
          <div className={`p-4 ${theme.card}`}>
            <div className={`${theme.cardTitle} mb-3`}>📊 Кунлик диаграмма</div>
            <BarChart dailyMap={dailyMap} range={range}/>
          </div>
        )}

        {/* Category breakdown */}
        {!loading && expenses.length > 0 && (
          <div className={`p-4 ${theme.card}`}>
            <div className={`${theme.cardTitle} mb-3`}>📌 Категориялар</div>
            <CategoryBreakdown expenses={expenses}/>
          </div>
        )}

        {/* Add expense button */}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className={`w-full py-4 rounded-3xl font-bold text-base flex items-center justify-center gap-2 text-white active:scale-95 transition-all ${theme.button}`}
          >
            <Plus size={18}/> Харажат қўшиш
          </button>
        ) : (
          <div className={`p-4 ${theme.card} space-y-3`}>
            <div className={`${theme.cardTitle} flex items-center justify-between`}>
              <span>Янги харажат</span>
              <button onClick={() => setShowAdd(false)}><X size={14}/></button>
            </div>
            <input
              type="number"
              placeholder="Сумма (сўм)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`w-full px-4 py-3 text-sm rounded-2xl ${theme.input}`}
              autoFocus
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={`w-full px-4 py-3 text-sm rounded-2xl ${theme.input}`}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="text"
              placeholder="Изоҳ (ихтиёрий)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className={`w-full px-4 py-3 text-sm rounded-2xl ${theme.input}`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setAmount(''); setNote(''); }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold opacity-50 hover:opacity-70 border border-current/20"
              >Бекор</button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white ${theme.button}`}
              >{saving ? 'Сақланяпти...' : 'Сақлаш'}</button>
            </div>
          </div>
        )}

        {/* Expense list */}
        {loading ? (
          <div className="text-center opacity-30 py-8">Юкланяпти...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center opacity-30 py-8">
            <Wallet size={32} className="mx-auto mb-2 opacity-30"/>
            <div className="text-sm">Харажатлар йўқ</div>
          </div>
        ) : (
          <div className={`${theme.card} overflow-hidden`}>
            <div className={`px-4 pt-4 pb-2 ${theme.cardTitle}`}>📋 Тарих</div>
            {expenses.map((e, i) => (
              <div key={e._id} className={`flex items-center gap-3 px-4 py-3 ${i < expenses.length - 1 ? 'border-b border-black/5' : ''}`}>
                <div className="text-xl">{e.category.slice(0, 2)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">{e.category.slice(3)}</div>
                  <div className="text-[10px] opacity-40">{e.note || e.date}</div>
                </div>
                <div className="text-sm font-black">{e.amount.toLocaleString()}с</div>
                <button onClick={() => handleDelete(e._id)} className="opacity-30 hover:opacity-70 active:scale-95 transition-all ml-1">
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
