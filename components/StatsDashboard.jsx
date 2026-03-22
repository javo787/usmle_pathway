'use client';
import React, { useState, useEffect } from 'react';
import { Activity, Brain, Moon, TrendingUp, Shield } from 'lucide-react';

const ProgressBar = ({ label, value, max, color }) => {
  const safeMax = max || 1; // Защита от деления на 0
  const percent = Math.min(100, Math.round((value / safeMax) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1 font-bold opacity-80">
        <span>{label}</span>
        <span>{value}/{safeMax} ({percent}%)</span>
      </div>
      <div className="h-2 w-full bg-gray-200/20 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${color} shadow-[0_0_10px_currentColor]`} 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default function StatsDashboard({ data, goals, challenges, theme }) {
  // 1. Расчет Clean Streak из Quitzilla
  // Находим самый большой стрик среди всех челленджей
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    if (challenges && challenges.length > 0) {
      const now = new Date();
      const streaks = challenges.map(ch => {
        const start = new Date(ch.start);
        const diffTime = Math.abs(now - start);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
      });
      setMaxStreak(Math.max(...streaks));
    } else {
      setMaxStreak(0);
    }
  }, [challenges]);

  // 2. Расчет Дофамина (Энергии)
  const dopamineLevel = Math.max(0, Math.min(100, 
    (data.spiritual.sleepOnTime ? 20 : 0) + 
    (data.sport.didSport ? 20 : 0) + 
    (data.spiritual.prayersDone * 10) +
    (data.academic.uWorldDone > 10 ? 10 : 0) - 
    (data.spiritual.nafsRelapse ? 50 : 0)
  ));

  return (
    <div className="space-y-4 animate-in fade-in zoom-in duration-300">
      
      {/* Сводка */}
      <div className={`p-5 rounded-3xl grid grid-cols-2 gap-4 ${theme.card}`}>
        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
            <Activity className="mx-auto mb-2 text-emerald-500" size={28}/>
            <div className={`text-3xl font-black ${theme.text}`}>{dopamineLevel}%</div>
            <div className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Energy</div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
            <TrendingUp className="mx-auto mb-2 text-blue-500" size={28}/>
            <div className={`text-3xl font-black ${theme.text}`}>{data.score}%</div>
            <div className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Score</div>
        </div>
      </div>

      {/* Академический Прогресс (Реагирует на Настройки) */}
      <div className={`p-6 rounded-3xl ${theme.card}`}>
        <h3 className={`font-bold flex items-center mb-6 text-lg ${theme.cardTitle}`}>
            <Brain size={20} className="mr-2"/> Учеба (KPI)
        </h3>
        {/* Берем цели из goals (firstAid, uWorld, anki) */}
        <ProgressBar label="First Aid (Pages)" value={data.academic.firstAidDone} max={goals?.firstAid || 15} color="bg-blue-500" />
        <ProgressBar label="UWorld (Questions)" value={data.academic.uWorldDone} max={goals?.uWorld || 40} color="bg-indigo-500" />
        <ProgressBar label="Anki (Cards)" value={data.academic.ankiDone} max={goals?.anki || 50} color="bg-pink-500" />
      </div>

       {/* Clean Streak (Реальный из Quitzilla) */}
       <div className={`p-6 rounded-3xl ${theme.card} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={80}/></div>
        <h3 className={`font-bold flex items-center mb-4 text-lg ${theme.cardTitle}`}>
            <Moon size={20} className="mr-2"/> Clean Streak
        </h3>
        <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 backdrop-blur-md">
                  <span className="font-black text-3xl text-emerald-500">{maxStreak}</span>
              </div>
              {/* Декор: сияние */}
              <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full"></div>
            </div>
            <div>
                <p className={`font-bold text-lg ${theme.text}`}>Кун тозалик</p>
                <p className="text-xs opacity-60 max-w-[150px]">
                  {maxStreak > 7 ? "МашаАллоҳ! Организм тикланмоқда." : "Сабр қилинг, боши қийин бўлади."}
                </p>
            </div>
        </div>
      </div>

    </div>
  );
}
