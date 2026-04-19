'use client';
import React from 'react';
import { BookOpen, Zap, RotateCcw } from 'lucide-react';

export default function AcademicBattle({ data, updateData, theme }) {
  return (
    <div className={`p-5 mb-4 relative overflow-hidden ${theme.card}`}>
      {/* Безак доира */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.06] bg-current"/>
      
      <h3 className={`font-bold flex items-center mb-5 gap-2 ${theme.cardTitle}`}>
        <BookOpen size={14} className={theme.icon}/> Академик Жанг
      </h3>

      {/* First Aid слайдер */}
      <div className="mb-5">
        <div className={`flex justify-between text-xs font-bold mb-2 ${theme.text}`}>
          <span className="opacity-60">First Aid</span>
          <span className="font-black">{data.firstAidDone} <span className="opacity-40 font-normal">/ 30 бет</span></span>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden ${theme.input.includes('black') ? 'bg-red-950/50' : 'bg-emerald-50'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-700 ${theme.icon.includes('red') ? 'bg-gradient-to-r from-red-600 to-red-400' : theme.icon.includes('C49A') ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-emerald-600 to-teal-400'}`}
            style={{ width: `${(data.firstAidDone / 30) * 100}%` }}
          />
        </div>
        <input 
          type="range" min="0" max="30" value={data.firstAidDone}
          onChange={(e) => updateData('academic', { ...data, firstAidDone: parseInt(e.target.value) })}
          className="w-full h-1 opacity-0 -mt-2 cursor-pointer"
        />
      </div>

      {/* UWorld ва Anki */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'uWorldDone', label: 'UWorld', step: 5, max: 80, icon: Zap },
          { key: 'ankiDone', label: 'Anki', step: 10, max: 200, icon: RotateCcw },
        ].map(({ key, label, step, max, icon: Icon }) => (
          <div key={key} className={`p-4 rounded-2xl border text-center ${theme.input}`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon size={10} className={`${theme.icon} opacity-60`}/>
              <div className="text-[9px] opacity-50 font-black uppercase tracking-widest">{label}</div>
            </div>
            <div className={`text-3xl font-black font-display my-1 ${theme.text}`}>{data[key]}</div>
            <div className="flex justify-center gap-3 mt-2">
              <button 
                onClick={() => updateData('academic', { ...data, [key]: Math.max(0, data[key] - step) })} 
                className={`w-8 h-8 rounded-xl text-lg font-bold opacity-50 hover:opacity-100 transition-all ${theme.input} flex items-center justify-center`}
              >−</button>
              <button 
                onClick={() => updateData('academic', { ...data, [key]: data[key] + step })} 
                className={`w-8 h-8 rounded-xl text-sm font-black transition-all ${theme.button} flex items-center justify-center`}
              >+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Қўшимча */}
      <div className="flex gap-3 mt-3">
        {[
          { key: 'repetition', label: '🔁 Такрор' },
          { key: 'additionalResource', label: '📎 Қўшимча' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => updateData('academic', { ...data, [key]: !data[key] })}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${data[key] ? theme.button : theme.input + ' opacity-60'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
