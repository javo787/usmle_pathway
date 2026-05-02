'use client';
import React, { useState } from 'react';
import { Settings as IconSettings, Download, Upload, Target, Gift, AlertTriangle, Server } from 'lucide-react';

export default function Settings({ settings, updateSettings, goals, updateGoals, theme }) {

  const handleExport = () => {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('journal_') || key === 'quitzilla_challenges' || key === 'penalty_debt') {
        allData[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(allData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuro_pathway_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        Object.keys(imported).forEach(key => localStorage.setItem(key, imported[key]));
        alert('✅ Маълумотлар тикланди! Саҳифа янгиланади.');
        window.location.reload();
      } catch (err) {
        alert('Хатолик: Файл бузуқ.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`rounded-2xl p-6 mb-6 animate-in slide-in-from-right-4 duration-500 ${theme.card}`}>
      <h2 className={`text-xl font-bold mb-6 flex items-center ${theme.text}`}>
        <IconSettings className="mr-2" /> Созламалар
      </h2>

      {/* AI Server info */}
      <div className="mb-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
          <Server size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-600">AI Server Mode</h4>
          <p className="text-[10px] opacity-70">API калит Vercel Environment Variables орқали уланган.</p>
        </div>
      </div>

      {/* Мақсадлар — Germany Path */}
      <div className="mb-6">
        <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
          <Target size={14} /> Кунлик Мақсадлар
        </h3>

        {/* Немецкий */}
        <div className={`p-4 rounded-xl border mb-3 ${theme.input}`}>
          <label className={`text-xs font-bold opacity-60 block mb-2 ${theme.text}`}>
            🇩🇪 Немецкий — кунлик (мин)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min="15" max="120" step="5"
              value={goals.germanMinutes || 45}
              onChange={e => updateGoals('germanMinutes', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className={`text-lg font-black w-12 text-right ${theme.text}`}>
              {goals.germanMinutes || 45}м
            </span>
          </div>
        </div>

        {/* Anki */}
        <div className={`p-4 rounded-xl border mb-3 ${theme.input}`}>
          <label className={`text-xs font-bold opacity-60 block mb-2 ${theme.text}`}>
            🔁 Anki — кунлик карточкалар
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min="10" max="300" step="10"
              value={goals.anki || 50}
              onChange={e => updateGoals('anki', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className={`text-lg font-black w-12 text-right ${theme.text}`}>
              {goals.anki || 50}
            </span>
          </div>
        </div>

        {/* Университет */}
        <div className={`p-4 rounded-xl border mb-3 ${theme.input}`}>
          <label className={`text-xs font-bold opacity-60 block mb-2 ${theme.text}`}>
            🏥 Универ / Кафедра — соат
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min="1" max="12" step="1"
              value={goals.uniHours || 4}
              onChange={e => updateGoals('uniHours', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className={`text-lg font-black w-12 text-right ${theme.text}`}>
              {goals.uniHours || 4}ч
            </span>
          </div>
        </div>
      </div>

      {/* Мукофот ва жазо */}
      <div className="mb-6">
        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}>
          <Gift size={14} /> Мукофот / Жазо
        </h3>
        {[
          { field: 'smallReward',  label: '🟢 Кичик мукофот', placeholder: '+50с ҳалол!' },
          { field: 'bigReward',    label: '🏆 Катта мукофот',  placeholder: 'Германияга бориш' },
          { field: 'punishment',   label: '⚠️ Жарима',         placeholder: '50с Эҳсон' },
        ].map(({ field, label, placeholder }) => (
          <div key={field} className="mb-3">
            <label className={`text-[10px] font-bold opacity-50 block mb-1 ${theme.text}`}>{label}</label>
            <input
              type="text"
              value={settings[field] || ''}
              onChange={e => updateSettings(field, e.target.value)}
              placeholder={placeholder}
              className={`w-full p-3 rounded-xl text-sm font-medium border ${theme.input} ${theme.text}`}
            />
          </div>
        ))}
      </div>

      {/* Экспорт / Импорт */}
      <div className="mb-4">
        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}>
          <Download size={14} /> Маълумотлар
        </h3>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${theme.button}`}
          >
            <Download size={14} /> Экспорт
          </button>
          <label className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${theme.input} ${theme.text} opacity-70`}>
            <Upload size={14} /> Импорт
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Стратегия эслатма */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <h4 className="text-xs font-bold text-blue-500 mb-2">🗺️ Стратегия</h4>
        <div className="text-[10px] text-blue-400/70 space-y-1">
          <p>→ Немецкий B2 — 2026 йилгача</p>
          <p>→ 2–3 публикация — битирувгача</p>
          <p>→ Hospitation Германия — ёз 2026</p>
          <p>→ Германияга кўчиш — 2028 ёки 2030</p>
        </div>
      </div>
    </div>
  );
}
