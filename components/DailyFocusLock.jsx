'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

export default function DailyFocusLock({ onUnlock }) {
  const [tasks, setTasks] = useState(["", "", ""]);

  // Считаем, сколько задач содержат хотя бы 3 символа
  const validTasksCount = tasks.filter(t => t.trim().length > 2).length;
  const canUnlock = validTasksCount >= 2;

  const handleComplete = () => {
    if (canUnlock) {
      onUnlock(tasks);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 z-50 fixed inset-0 font-sans">
      {/* Анимированный фоновый эффект */}
      <div className="absolute w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] top-10 left-10 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] bottom-10 right-10 animate-pulse delay-1000"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
        
        {/* Декоративная линия */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
        
        {/* Иконка и заголовок */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
            <Lock size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Кунни режалаштиринг!</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Тизим блок қилинган. Иловадан фойдаланиш учун бугунги энг муҳим камида <span className="text-emerald-400 font-bold">2 та вазифани</span> киритинг.
          </p>
        </div>

        {/* Инпуты для задач */}
        <div className="space-y-4 mb-8">
          {tasks.map((task, index) => (
            <div key={index} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {task.trim().length > 2 ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <Target size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                )}
              </div>
              <input
                type="text"
                placeholder={
                  index === 0 ? "1. Масалан: UWorld'дан 40 та савол" : 
                  index === 1 ? "2. Масалан: Қазо намозларни ўқиш" : 
                  "3. Яна бир муҳим иш (Ихтиёрий)..."
                }
                className={`w-full bg-slate-950/50 border rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none transition-all duration-300 ${
                  task.trim().length > 2 
                    ? 'border-emerald-500/50 focus:border-emerald-400 focus:bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'border-slate-700 focus:border-indigo-500 focus:bg-indigo-950/20'
                }`}
                value={task}
                onChange={(e) => {
                  const newTasks = [...tasks];
                  newTasks[index] = e.target.value;
                  setTasks(newTasks);
                }}
              />
            </div>
          ))}
        </div>

        {/* Кнопка разблокировки */}
        <button 
          onClick={handleComplete}
          disabled={!canUnlock}
          className={`w-full py-4 rounded-xl font-bold transition-all duration-500 flex items-center justify-center group ${
            canUnlock 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-70'
          }`}
        >
          {canUnlock ? (
            <>
              <span>Бисмиллаҳ, бошладик</span>
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            `Камида ${2 - validTasksCount} та вазифа ёзинг`
          )}
        </button>
      </div>
    </div>
  );
}