'use client';
import React from 'react';
import { Dumbbell, AlertTriangle } from 'lucide-react';
import { getSportPenalty } from '@/lib/gameLogic';

export default function SportsTracker({ data, academicData, updateData, theme }) {
  // Проверяем, есть ли штраф на основе успеваемости
  const penalty = getSportPenalty(academicData || { uWorldDone: 0 });

  return (
    <div className={`rounded-2xl p-5 mb-6 transition-colors duration-500 ${theme.card} ${penalty.active ? 'border-2 border-red-500/50' : ''}`}>
      <h3 className={`font-bold flex items-center mb-4 ${theme.cardTitle}`}>
        <Dumbbell size={18} className={`mr-2 ${theme.icon}`}/> 
        Спорт {penalty.active && <span className="ml-2 text-[10px] text-red-600 bg-red-100 px-2 py-0.5 rounded animate-pulse">ТРЕБУЕТСЯ ОТРАБОТКА</span>}
      </h3>

      {penalty.active && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl mb-4 flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-red-600">Назначен Штраф!</p>
            {/* ИСПРАВЛЕНИЕ: Используем &lt; вместо < */}
            <p className="text-xs opacity-80">Ты мало занимался UWorld (&lt; 20). Мозг закис. Разгони кровь:</p>
            <p className="text-sm font-black mt-1 uppercase">{penalty.task}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={`text-xs font-bold mb-1 block opacity-60 ${theme.text}`}>Вид</label>
          <select 
            className={`w-full rounded-lg p-2 text-sm outline-none ${theme.input}`}
            value={data.type || ""}
            onChange={(e) => updateData('sport', { ...data, type: e.target.value, didSport: true })}
          >
            <option value="">Танланг...</option>
            <option value="gym">Gym (Зал)</option>
            <option value="running">Югуриш (Cardio)</option>
            <option value="home">Уй машқлари</option>
            <option value="penalty">🛑 ШТРАФ (Берпи)</option>
          </select>
        </div>
        <div>
          <label className={`text-xs font-bold mb-1 block opacity-60 ${theme.text}`}>Детали</label>
          <input 
            type="text" 
            placeholder="5 км / 50 отж..."
            className={`w-full rounded-lg p-2 text-sm outline-none ${theme.input}`}
            value={data.details || ""} 
            onChange={(e) => updateData('sport', { ...data, details: e.target.value, didSport: true })}
          />
        </div>
      </div>
      
      <div>
          <label className={`text-xs font-bold mb-1 block opacity-60 ${theme.text}`}>Вақт (мин)</label>
          <input 
            type="number" className={`w-full rounded-lg p-2 text-sm outline-none ${theme.input}`}
            value={data.duration || ""}
            onChange={(e) => updateData('sport', { ...data, duration: parseInt(e.target.value), didSport: true })}
          />
        </div>
    </div>
  );
}
