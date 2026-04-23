'use client';
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Plus, ChevronRight } from 'lucide-react';

const MONTH_BUDGET = 500000; // сўм — default budget

export default function MoneyWidget({ theme, onOpenMoney }) {
  const [todayTotal, setTodayTotal] = useState(null);
  const [monthTotal, setMonthTotal] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('🍔 Овқат');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const CATEGORIES = ['🍔 Овқат','📚 Ўқиш','🚌 Транспорт','💊 Соғлиқ','🕌 Садақа','💸 Жарима','🎯 Бошқа'];

  async function loadSummary() {
    try {
      const [dayRes, monthRes] = await Promise.all([
        fetch(`/api/expenses?range=day&date=${today}`),
        fetch(`/api/expenses?range=month&date=${today}`),
      ]);
      const dayData   = await dayRes.json();
      const monthData = await monthRes.json();
      const daySum   = (dayData.expenses   || []).reduce((s, e) => s + e.amount, 0);
      const monthSum = (monthData.expenses || []).reduce((s, e) => s + e.amount, 0);
      setTodayTotal(daySum);
      setMonthTotal(monthSum);
    } catch {}
  }

  useEffect(() => { loadSummary(); }, []);

  async function handleQuickAdd() {
    if (!amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), category, note, date: today }),
      });
      setAmount(''); setNote(''); setShowQuickAdd(false);
      await loadSummary();
    } finally { setSaving(false); }
  }

  const monthPct = monthTotal != null ? Math.min(100, Math.round((monthTotal / MONTH_BUDGET) * 100)) : 0;
  const isOver   = monthTotal > MONTH_BUDGET;

  return (
    <div className={`p-4 ${theme.card}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet size={14} className={theme.icon}/>
          <span className={`${theme.cardTitle}`}>Пул Назорати</span>
        </div>
        <button
          onClick={onOpenMoney}
          className="flex items-center gap-1 opacity-50 hover:opacity-80 transition-opacity"
        >
          <span className="text-[10px] font-bold tracking-wide">Батафсил</span>
          <ChevronRight size={12}/>
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-3">
        <button
          onClick={onOpenMoney}
          className="flex-1 bg-black/5 rounded-2xl p-3 text-center active:scale-95 transition-transform"
        >
          <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Бугун</div>
          <div className="text-lg font-black font-display">
            {todayTotal == null ? '...' : `${todayTotal.toLocaleString()}с`}
          </div>
        </button>
        <button
          onClick={onOpenMoney}
          className="flex-1 bg-black/5 rounded-2xl p-3 text-center active:scale-95 transition-transform"
        >
          <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Ой</div>
          <div className={`text-lg font-black font-display ${isOver ? 'text-red-500' : ''}`}>
            {monthTotal == null ? '...' : `${monthTotal.toLocaleString()}с`}
          </div>
        </button>
      </div>

      {/* Month budget bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest">Бюджет</span>
          <span className={`text-[9px] font-bold ${isOver ? 'text-red-400' : 'opacity-40'}`}>
            {monthPct}% {isOver ? '⚠️' : ''}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${monthPct}%` }}
          />
        </div>
      </div>

      {/* Quick Add toggle */}
      {!showQuickAdd ? (
        <button
          onClick={() => setShowQuickAdd(true)}
          className={`w-full py-2.5 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity border border-current/20`}
        >
          <Plus size={13}/> Харажат қўшиш
        </button>
      ) : (
        <div className="space-y-2 pt-1">
          <input
            type="number"
            placeholder="Сумма (сўм)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className={`w-full px-3 py-2 text-sm rounded-xl ${theme.input}`}
            autoFocus
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className={`w-full px-3 py-2 text-sm rounded-xl ${theme.input}`}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="text"
            placeholder="Изоҳ (ихтиёрий)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className={`w-full px-3 py-2 text-sm rounded-xl ${theme.input}`}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowQuickAdd(false); setAmount(''); setNote(''); }}
              className="flex-1 py-2 rounded-xl text-[11px] font-bold opacity-50 hover:opacity-70 border border-current/20"
            >
              Бекор
            </button>
            <button
              onClick={handleQuickAdd}
              disabled={saving}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold text-white ${theme.button}`}
            >
              {saving ? '...' : 'Сақлаш'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
