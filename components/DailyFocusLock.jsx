'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, Lock, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

const MIN_TASK_LENGTH = 15;
const REQUIRED_TASKS = 3;

export default function DailyFocusLock({ onUnlock }) {
  const [tasks, setTasks] = useState(["", "", "", "", ""]);
  const [startTime, setStartTime] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const validTasks = tasks.filter(t => t.trim().length >= MIN_TASK_LENGTH);
  const validTasksCount = validTasks.length;
  const hasTime = startTime.trim().length >= 4;
  const canUnlock = validTasksCount >= REQUIRED_TASKS && hasTime;

  const handleComplete = () => {
    if (!canUnlock) {
      setShowWarning(true);
      return;
    }
    const allTasks = tasks.map((t) => t.trim() ? `[${startTime}] ${t}` : t);
    onUnlock(allTasks);
  };

  const remaining = Math.max(0, REQUIRED_TASKS - validTasksCount);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 z-50 fixed inset-0 font-sans overflow-y-auto">
      <div className="absolute w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] top-10 left-10 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] bottom-10 right-10 animate-pulse delay-1000"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden my-4">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-emerald-500 to-indigo-500"></div>
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-3 border border-slate-700 shadow-inner">
            <Lock size={28} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">🔒 Кун Блок</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Бугун ишлашни бошлашдан олдин — режа тузинг.{' '}
            <span className="text-red-400 font-bold">Камида {REQUIRED_TASKS} та вазифа</span>,{' '}
            ҳар бири камида <span className="text-yellow-400 font-bold">{MIN_TASK_LENGTH} та ҳарф</span>.
            Умумий сўзлар (<span className="text-red-400">"ўқиш"</span>) қабул қилинмайди.
          </p>
        </div>

        {/* Бошланиш вақти */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <Clock size={12}/> Бугун қачондан бошлайсиз?
          </label>
          <input
            type="time"
            className={`w-full bg-slate-950/50 border rounded-xl py-3 px-4 text-white text-lg font-bold focus:outline-none transition-all ${
              hasTime ? 'border-emerald-500/60 text-emerald-400' : 'border-slate-700 focus:border-indigo-500'
            }`}
            value={startTime}
            onChange={e => { setStartTime(e.target.value); setShowWarning(false); }}
          />
        </div>

        {/* Вазифалар */}
        <div className="space-y-2.5 mb-5">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Target size={12}/> Бугунги аниқ вазифалар
          </label>
          {tasks.map((task, index) => {
            const isValid = task.trim().length >= MIN_TASK_LENGTH;
            const isRequired = index < REQUIRED_TASKS;
            return (
              <div key={index} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isValid ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <span className={`text-xs font-black w-4 text-center ${isRequired ? 'text-red-400' : 'text-slate-600'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={
                    index === 0 ? "UWorld'дан 40 та савол ишлаш (Cardio)" :
                    index === 1 ? "First Aid: Renal chapter — 15 бет ўқиш" :
                    index === 2 ? "Anki: 50 та карточка такрорлаш" :
                    index === 3 ? "4. Ихтиёрий вазифа..." :
                    "5. Ихтиёрий вазифа..."
                  }
                  className={`w-full bg-slate-950/50 border rounded-xl py-3 pl-8 pr-4 text-white text-sm focus:outline-none transition-all duration-300 ${
                    isValid
                      ? 'border-emerald-500/50 focus:border-emerald-400 bg-emerald-950/10'
                      : isRequired
                      ? 'border-red-900/50 focus:border-red-500 focus:bg-red-950/10'
                      : 'border-slate-700/50 focus:border-slate-500'
                  }`}
                  value={task}
                  onChange={e => {
                    const newTasks = [...tasks];
                    newTasks[index] = e.target.value;
                    setTasks(newTasks);
                    setShowWarning(false);
                  }}
                />
                {task.trim().length > 0 && task.trim().length < MIN_TASK_LENGTH && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-orange-400 font-bold">
                    {MIN_TASK_LENGTH - task.trim().length} ҳарф кам
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Прогресс */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Тайёрлик</span>
            <span className={validTasksCount >= REQUIRED_TASKS ? 'text-emerald-400 font-bold' : 'text-orange-400'}>
              {validTasksCount}/{REQUIRED_TASKS} вазифа ✓
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                canUnlock ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(100, (validTasksCount / REQUIRED_TASKS) * 100)}%` }}
            />
          </div>
        </div>

        {/* Огоҳлантириш */}
        {showWarning && (
          <div className="mb-4 bg-red-950/40 border border-red-700/50 rounded-xl p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0"/>
            <div className="text-xs text-red-300">
              {!hasTime && <div>⏰ Бошланиш вақтини киритинг!</div>}
              {remaining > 0 && <div>📝 Яна {remaining} та аниқ вазифа ёзинг (камида {MIN_TASK_LENGTH} ҳарф)</div>}
            </div>
          </div>
        )}

        {/* Кнопка */}
        <button 
          onClick={handleComplete}
          className={`w-full py-4 rounded-xl font-bold transition-all duration-500 flex items-center justify-center group ${
            canUnlock 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
          }`}
        >
          {canUnlock ? (
            <>
              <span>Бисмиллаҳ, бошладик</span>
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <span className="text-sm">
              {!hasTime ? '⏰ Аввал вақтни белгиланг' : `📝 Яна ${remaining} та вазифа ёзинг`}
            </span>
          )}
        </button>

        <p className="text-center text-[10px] text-slate-600 mt-3">
          Режасиз кун = автоматик жарима 50 сомони
        </p>
      </div>
    </div>
  );
}
