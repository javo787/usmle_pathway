'use client';
import React from 'react';
import { BookOpen, RotateCcw, Languages, FileText, GraduationCap } from 'lucide-react';

export default function AcademicBattle({ data, updateData, theme }) {
  const accent = theme.icon.includes('red')
    ? { bar: 'from-red-600 to-red-400', bg: 'bg-red-950/50' }
    : theme.icon.includes('C49A')
    ? { bar: 'from-amber-500 to-yellow-400', bg: 'bg-amber-100' }
    : { bar: 'from-emerald-600 to-teal-400', bg: 'bg-emerald-50' };

  // Slider component
  const Slider = ({ label, value, max, unit, dataKey }) => (
    <div className="mb-5">
      <div className={`flex justify-between text-xs font-bold mb-2 ${theme.text}`}>
        <span className="opacity-60">{label}</span>
        <span className="font-black">{value} <span className="opacity-40 font-normal">/ {max} {unit}</span></span>
      </div>
      <div className={`w-full h-2 rounded-full overflow-hidden ${accent.bg}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${accent.bar}`}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
      <input
        type="range" min="0" max={max} value={value}
        onChange={e => updateData('academic', { ...data, [dataKey]: parseInt(e.target.value) })}
        className="w-full h-1 opacity-0 -mt-2 cursor-pointer"
      />
    </div>
  );

  // Counter component
  const Counter = ({ dataKey, label, step, max, Icon }) => (
    <div className={`p-4 rounded-2xl border text-center ${theme.input}`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon size={10} className={`${theme.icon} opacity-60`} />
        <div className="text-[9px] opacity-50 font-black uppercase tracking-widest">{label}</div>
      </div>
      <div className={`text-3xl font-black font-display my-1 ${theme.text}`}>{data[dataKey]}</div>
      <div className="flex justify-center gap-3 mt-2">
        <button
          onClick={() => updateData('academic', { ...data, [dataKey]: Math.max(0, data[dataKey] - step) })}
          className={`w-8 h-8 rounded-xl text-lg font-bold opacity-50 hover:opacity-100 transition-all ${theme.input} flex items-center justify-center`}
        >−</button>
        <button
          onClick={() => updateData('academic', { ...data, [dataKey]: data[dataKey] + step })}
          className={`w-8 h-8 rounded-xl text-sm font-black transition-all ${theme.button} flex items-center justify-center`}
        >+</button>
      </div>
    </div>
  );

  return (
    <div className={`p-5 mb-4 relative overflow-hidden ${theme.card}`}>
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.06] bg-current" />

      <h3 className={`font-bold flex items-center mb-5 gap-2 ${theme.cardTitle}`}>
        <GraduationCap size={14} className={theme.icon} /> Академик Жанг
      </h3>

      {/* Немецкий язык — слайдер */}
      <Slider
        label="🇩🇪 Немецкий (мин)"
        value={data.germanMinutes}
        max={60}
        unit="мин"
        dataKey="germanMinutes"
      />

      {/* Университет — слайдер */}
      <Slider
        label="🏥 Университет / Кафедра (ч)"
        value={data.uniHours}
        max={8}
        unit="ч"
        dataKey="uniHours"
      />

      {/* Anki + Публикация */}
      <div className="grid grid-cols-2 gap-3">
        <Counter dataKey="ankiDone" label="Anki" step={10} max={300} Icon={RotateCcw} />
        <Counter dataKey="pubHours" label="Статья" step={1} max={8} Icon={FileText} />
      </div>

      {/* Чекбоксы */}
      <div className="flex gap-3 mt-3">
        {[
          { key: 'ankiRepetition',   label: '🔁 Повтор Anki' },
          { key: 'clinicVisit',      label: '🏥 Отделение' },
          { key: 'researchMeeting',  label: '📋 Науч. рук.' },
          { key: 'germanPractice',   label: '🎙️ Говорил DE' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => updateData('academic', { ...data, [key]: !data[key] })}
            className={`flex-1 py-2 rounded-2xl text-[10px] font-bold transition-all duration-300 ${data[key] ? theme.button : theme.input + ' opacity-60'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
