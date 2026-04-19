'use client';
import React, { useState, useEffect } from 'react';
import { Dumbbell, AlertTriangle, Flame, TrendingUp } from 'lucide-react';
import { getSportPenalty } from '@/lib/gameLogic';

// ============================================
// СПОРТ ТУРЛАРИ
// ============================================
const SPORT_TYPES = [
  { id: 'gym',      label: 'Зал',       emoji: '🏋️' },
  { id: 'running',  label: 'Югуриш',    emoji: '🏃' },
  { id: 'home',     label: 'Уй',        emoji: '🤸' },
  { id: 'cycling',  label: 'Велосипед', emoji: '🚴' },
  { id: 'swimming', label: 'Сузиш',     emoji: '🏊' },
  { id: 'walk',     label: 'Сайр',      emoji: '🚶' },
  { id: 'penalty',  label: 'Штраф',     emoji: '🛑' },
];

const INTENSITY = [
  { id: 'light',  label: 'Енгил',  color: 'text-emerald-500', bg: 'bg-emerald-500/15 border-emerald-500/40' },
  { id: 'medium', label: 'Ўрта',   color: 'text-amber-500',   bg: 'bg-amber-500/15 border-amber-500/40'   },
  { id: 'hard',   label: 'Қаттиқ', color: 'text-red-500',     bg: 'bg-red-500/15 border-red-500/40'       },
];

const DURATION_TARGET = 45;

// ============================================
// ҲАФТАЛИК STREAK — localStorage дан ўқийди
// ============================================
function WeekStreak({ theme }) {
  const [week, setWeek] = useState([]);

  useEffect(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `journal_${d.toISOString().split('T')[0]}`;
      const saved = localStorage.getItem(key);
      let didSport = false;
      if (saved) {
        try { didSport = JSON.parse(saved)?.sport?.didSport || false; } catch {}
      }
      days.push({ date: d.toISOString().split('T')[0], didSport, isToday: i === 0 });
    }
    setWeek(days);
  }, []);

  const streak = (() => {
    let s = 0;
    for (let i = week.length - 1; i >= 0; i--) {
      if (week[i].didSport) s++;
      else break;
    }
    return s;
  })();

  const DAY_LABELS = ['Дш', 'Сш', 'Чш', 'Пш', 'Жм', 'Шн', 'Як'];

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Ҳафталик</p>
        {streak > 0 && (
          <div className="flex items-center gap-1">
            <Flame size={11} className="text-orange-400"/>
            <span className="text-[10px] font-black text-orange-400">{streak} кунлик streak</span>
          </div>
        )}
      </div>
      <div className="flex gap-1.5">
        {week.map((day, i) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full aspect-square rounded-xl border transition-all duration-300 flex items-center justify-center ${
              day.didSport
                ? theme.button + ' border-transparent'
                : day.isToday
                ? theme.input + ' border-dashed opacity-60'
                : theme.input + ' opacity-25'
            }`}>
              {day.didSport && <span className="text-[10px]">✓</span>}
              {!day.didSport && day.isToday && <span className="text-[8px] opacity-60">бугун</span>}
            </div>
            <span className="text-[7px] opacity-30 font-bold">{DAY_LABELS[new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// АСОСИЙ КОМПОНЕНТ
// ============================================
export default function SportsTracker({ data, academicData, updateData, theme }) {
  const penalty = getSportPenalty(academicData || { uWorldDone: 0 });
  const duration = data.duration || 0;
  const pct = Math.min(100, (duration / DURATION_TARGET) * 100);

  const selectType = (id) => {
    const same = data.type === id;
    updateData('sport', { ...data, type: same ? '' : id, didSport: !same });
  };

  const setIntensity = (id) => {
    updateData('sport', { ...data, intensity: id, didSport: true });
  };

  const setDuration = (val) => {
    updateData('sport', { ...data, duration: val, didSport: val > 0 });
  };

  // Доира прогресс SVG
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const accentColor = theme.icon.includes('red') ? '#ef4444' : theme.icon.includes('C49A') ? '#f59e0b' : '#0D5C4C';

  return (
    <div className={`p-5 mb-4 relative overflow-hidden ${theme.card} ${penalty.active ? 'ring-2 ring-red-500/30' : ''}`}>
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.05] bg-current"/>

      {/* Сарлавҳа */}
      <h3 className={`font-bold flex items-center mb-4 gap-2 ${theme.cardTitle}`}>
        <Dumbbell size={14} className={theme.icon}/>
        Спорт
        {penalty.active && (
          <span className="text-[9px] text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse font-black uppercase tracking-wide">
            Отработка!
          </span>
        )}
      </h3>

      {/* Штраф огоҳлантириш */}
      {penalty.active && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5"/>
          <div>
            <p className="text-xs font-black text-red-400">UWorld кам бажарилди</p>
            <p className="text-xs opacity-70 mt-0.5">Мия ишламаса тан ишласин: <span className="font-black">{penalty.task}</span></p>
          </div>
        </div>
      )}

      {/* Ҳафталик streak */}
      <WeekStreak theme={theme}/>

      {/* Спорт тури */}
      <div className="mb-4">
        <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mb-2.5">Спорт тури</p>
        <div className="grid grid-cols-4 gap-2">
          {SPORT_TYPES.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => selectType(id)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border transition-all duration-300 ${
                data.type === id
                  ? theme.button + ' border-transparent scale-105'
                  : theme.input + ' opacity-50 hover:opacity-80'
              }`}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span className="text-[8px] font-black">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Вақт + Интенсивлик */}
      <div className="flex gap-4 items-center mb-4">

        {/* Доира прогресс */}
        <div className="relative flex-shrink-0 flex items-center justify-center w-24 h-24">
          <svg width="96" height="96" className="-rotate-90">
            <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="opacity-10"/>
            <circle
              cx="48" cy="48" r={r}
              fill="none"
              stroke={accentColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-xl font-black font-display leading-none ${theme.text}`}>{duration}</span>
            <span className="text-[8px] opacity-40 font-bold">дақ</span>
            <span className="text-[7px] opacity-30">/ {DURATION_TARGET}</span>
          </div>
        </div>

        {/* Слайдер + Интенсивлик */}
        <div className="flex-1">
          <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mb-2">Давомийлик</p>
          <input
            type="range"
            min="0" max="120" step="5"
            value={duration}
            onChange={e => setDuration(parseInt(e.target.value))}
            className="w-full h-2 rounded-full cursor-pointer accent-current mb-3"
            style={{ accentColor }}
          />

          <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mb-2">Интенсивлик</p>
          <div className="flex gap-1.5">
            {INTENSITY.map(({ id, label, bg }) => (
              <button
                key={id}
                onClick={() => setIntensity(id)}
                className={`flex-1 py-1.5 rounded-xl border text-[9px] font-black transition-all ${
                  data.intensity === id ? bg : theme.input + ' opacity-40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Детaллар */}
      <input
        type="text"
        placeholder="Детaллар: 5 км, 3×12 оғирлик..."
        className={`w-full rounded-2xl px-4 py-2.5 text-sm outline-none ${theme.input}`}
        value={data.details || ''}
        onChange={e => updateData('sport', { ...data, details: e.target.value, didSport: true })}
      />

      {/* Натижа */}
      {data.didSport && duration > 0 && (
        <div className={`mt-3 flex items-center gap-2 text-xs font-bold rounded-2xl px-3 py-2 ${
          pct >= 100
            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
            : 'opacity-50'
        }`}>
          <TrendingUp size={12}/>
          {pct >= 100
            ? `✦ Мақсад бажарилди! ${duration} дақиқа`
            : `${duration} дақ — мақсадга ${DURATION_TARGET - duration} дақ қолди`
          }
        </div>
      )}
    </div>
  );
}
