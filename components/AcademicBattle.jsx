'use client';
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, RotateCcw, Languages, FileText, GraduationCap, Timer, Coffee, Play, Pause, Square } from 'lucide-react';

// Slider component
const Slider = ({ label, value, max, unit, dataKey, updateData, data, theme, accent }) => (
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
const Counter = ({ dataKey, label, step, Icon, updateData, data, theme }) => (
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

export default function AcademicBattle({ data, updateData, theme }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerType, setTimerType] = useState(null); // 'focus', 'rest'
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      if (timerType === 'focus') {
        updateData('academic', { ...data, focusSessions: (data.focusSessions || 0) + 1 });
        // Auto-start rest
        setTimerType('rest');
        setTimeLeft(20 * 60);
        setTimerActive(true);
      } else {
        setTimerType('done');
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerType, data, updateData]);

  // Micro-rest reminder every 15 minutes (900 seconds)
  useEffect(() => {
    if (timerType === 'focus' && timerActive) {
      const elapsed = (90 * 60) - timeLeft;
      if (elapsed > 0 && elapsed % 900 === 0) {
        setShowToast(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setShowToast(false), 12000);
      }
    }
  }, [timeLeft, timerType, timerActive]);

  const startFocus = () => {
    setTimerType('focus');
    setTimeLeft(90 * 60);
    setTimerActive(true);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const accent = theme.icon.includes('red')
    ? { bar: 'from-red-600 to-red-400', bg: 'bg-red-950/50' }
    : theme.icon.includes('C49A')
    ? { bar: 'from-amber-500 to-yellow-400', bg: 'bg-amber-100' }
    : { bar: 'from-emerald-600 to-teal-400', bg: 'bg-emerald-50' };

  return (
    <div className={`p-5 mb-4 relative overflow-hidden ${theme.card}`}>
      {/* Toast Reminder */}
      {showToast && (
        <div className="absolute top-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Coffee size={16} />
              </div>
              <p className="text-xs font-bold leading-tight">10 сония дам олинг — экранга қараманг</p>
           </div>
        </div>
      )}

      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.06] bg-current" />

      <div className="flex justify-between items-center mb-5">
        <h3 className={`font-bold flex items-center gap-2 ${theme.cardTitle}`}>
          <GraduationCap size={14} className={theme.icon} /> Академик Жанг
        </h3>
        <div className="flex items-center gap-2">
           <div className={`text-[10px] font-black uppercase tracking-tighter opacity-40`}>Focus: {data.focusSessions || 0}</div>
        </div>
      </div>

      {/* Timer UI */}
      <div className={`mb-6 p-4 rounded-3xl border transition-all duration-500 ${timerType === 'focus' ? 'bg-indigo-500/10 border-indigo-500/30' : timerType === 'rest' ? 'bg-emerald-500/10 border-emerald-500/30' : theme.input}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {timerType === 'focus' ? <Timer size={16} className="text-indigo-500 animate-pulse" /> : timerType === 'rest' ? <Coffee size={16} className="text-emerald-500 animate-bounce" /> : <Timer size={16} className="opacity-30" />}
            <span className={`text-[10px] font-black uppercase tracking-widest ${timerType === 'focus' ? 'text-indigo-500' : timerType === 'rest' ? 'text-emerald-500' : 'opacity-40'}`}>
              {timerType === 'focus' ? 'FOCUS SESSION' : timerType === 'rest' ? 'REST PHASE' : timerType === 'done' ? 'SESSION DONE' : 'ULTRADIAN RHYTHM'}
            </span>
          </div>
          <div className={`text-2xl font-black font-display ${timerType === 'focus' ? 'text-indigo-500' : timerType === 'rest' ? 'text-emerald-500' : theme.text}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex gap-2">
          {!timerActive && !timerType && (
            <button onClick={startFocus} className={`flex-1 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all`}>
              <Play size={14} /> 90 МИН ФОКУС
            </button>
          )}
          {timerActive && (
            <button onClick={() => setTimerActive(false)} className={`flex-1 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 ${theme.input} opacity-70`}>
              <Pause size={14} /> ТЎХТАТИШ
            </button>
          )}
          {!timerActive && timerType && timerType !== 'done' && (
             <button onClick={() => setTimerActive(true)} className={`flex-1 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all`}>
               <Play size={14} /> ДАВОМ ЭТТИРИШ
             </button>
          )}
          {(timerType || timeLeft > 0) && (
            <button onClick={() => { setTimerActive(false); setTimerType(null); setTimeLeft(0); }} className={`p-3 rounded-2xl ${theme.input} opacity-50 hover:opacity-100 transition-all`}>
              <Square size={14} fill="currentColor" />
            </button>
          )}
        </div>
      </div>

      {/* Немецкий язык — слайдер */}
      <Slider
        label="🇩🇪 Немецкий (мин)"
        value={data.germanMinutes}
        max={60}
        unit="мин"
        dataKey="germanMinutes"
        updateData={updateData}
        data={data}
        theme={theme}
        accent={accent}
      />

      {/* Университет — слайдер */}
      <Slider
        label="🏥 Университет / Кафедра (ч)"
        value={data.uniHours}
        max={8}
        unit="ч"
        dataKey="uniHours"
        updateData={updateData}
        data={data}
        theme={theme}
        accent={accent}
      />

      {/* Anki + Публикация */}
      <div className="grid grid-cols-2 gap-3">
        <Counter dataKey="ankiDone" label="Anki" step={10} Icon={RotateCcw} updateData={updateData} data={data} theme={theme} />
        <Counter dataKey="pubHours" label="Статья" step={1} Icon={FileText} updateData={updateData} data={data} theme={theme} />
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

      {/* Teach-Back Log */}
      <div className="mt-6 pt-5 border-t border-current/10">
        <label className={`text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3`}>
          Бугун нимани ўргатдингиз?
        </label>
        <textarea
          value={data.teachBack || ""}
          onChange={(e) => updateData('academic', { ...data, teachBack: e.target.value })}
          placeholder="Масалан: Do-while loop-ни тушунтирдим..."
          className={`w-full rounded-2xl p-4 text-sm h-24 outline-none transition-all duration-300 ${theme.input} focus:ring-2 focus:ring-indigo-500/20`}
        />
        {data.teachBack && data.teachBack.trim().length > 0 && (
           <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase">
             <Play size={10} fill="currentColor" /> +3 Teach-back бонуси олинди
           </div>
        )}
      </div>
    </div>
  );
}
