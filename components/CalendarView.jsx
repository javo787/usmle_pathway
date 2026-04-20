'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView({ selectedDate, onSelectDate, theme }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(selectedDate || new Date());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);

  // API dan oxirgi 30 kunlik scorelarni yuklaymiz
  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/journal');
        const json = await res.json();
        const logs = json.logs || [];
        const map = {};
        logs.forEach(log => {
          if (log.date && log.score !== undefined) {
            map[log.date] = log.score;
          }
        });
        setScores(map);
      } catch (err) {
        console.error('CalendarView fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr  = new Date().toISOString().split('T')[0];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const DAY_NAMES   = ['Як','Дш','Сш','Чш','Пш','Жм','Шн'];

  const getScoreColor = (score) => {
    if (score === undefined) return '';
    if (score >= 85) return 'bg-amber-400';
    if (score >= 60) return 'bg-emerald-500';
    if (score >= 30) return 'bg-blue-400';
    return 'bg-red-400';
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={`p-5 rounded-3xl mb-4 ${theme.card}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className={`w-9 h-9 rounded-2xl flex items-center justify-center ${theme.input} opacity-60 hover:opacity-100 transition`}>
          <ChevronLeft size={18}/>
        </button>
        <h3 className={`font-black text-base ${theme.text}`}>
          {MONTH_NAMES[month]} {year}
        </h3>
        <button onClick={nextMonth} className={`w-9 h-9 rounded-2xl flex items-center justify-center ${theme.input} opacity-60 hover:opacity-100 transition`}>
          <ChevronRight size={18}/>
        </button>
      </div>

      {/* Kun nomlari */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[9px] font-black opacity-30 uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Kunlar */}
      {loading ? (
        <div className="flex items-center justify-center h-32 opacity-40">
          <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin"/>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`}/>;
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const score   = scores[dateStr];
            const isToday    = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isFuture   = dateStr > todayStr;
            const dotColor   = getScoreColor(score);

            return (
              <button
                key={dateStr}
                onClick={() => !isFuture && onSelectDate(dateStr)}
                disabled={isFuture}
                className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl text-xs font-bold transition-all duration-200 ${
                  isSelected
                    ? theme.button + ' text-white scale-105'
                    : isToday
                    ? `border-2 ${theme.icon.includes('0D5C') ? 'border-[#0D5C4C]' : theme.icon.includes('C49A') ? 'border-amber-500' : 'border-red-500'} ${theme.text}`
                    : isFuture
                    ? 'opacity-20 cursor-not-allowed ' + theme.text
                    : theme.input + ' hover:opacity-80 ' + theme.text
                }`}
              >
                {day}
                {score !== undefined && !isSelected && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`}/>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legenda */}
      <div className="flex gap-3 mt-4 justify-center flex-wrap">
        {[
          { color: 'bg-amber-400',   label: 'Legend (85+)' },
          { color: 'bg-emerald-500', label: 'Yaxshi (60+)' },
          { color: 'bg-blue-400',    label: "O'rta (30+)"  },
          { color: 'bg-red-400',     label: 'Kam (<30)'    },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color}`}/>
            <span className="text-[9px] opacity-50 font-bold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
