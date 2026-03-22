'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView({ selectedDate, onSelectDate, theme }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [history, setHistory] = useState({});

  // Ой ўзгарганда, шу ойдаги барча маълумотларни ўқиб оламиз (ранглар учун)
  useEffect(() => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const newHistory = {};
    for (let d = 1; d <= endOfMonth.getDate(); d++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const saved = localStorage.getItem(`journal_${dateStr}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        newHistory[d] = parsed.score || 0;
      }
    }
    setHistory(newHistory);
  }, [currentMonth]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 = Sunday

  // Ҳафта Душанбадан бошланиши учун (0=Sun -> 6, 1=Mon -> 0)
  const shiftDay = (day) => (day === 0 ? 6 : day - 1);
  const startEmptyDays = shiftDay(firstDay);

  const days = [];
  // Бўш катаклар (ой бошигача)
  for (let i = 0; i < startEmptyDays; i++) {
    days.push(<div key={`empty-${i}`} className="h-14"></div>);
  }

  // Кунлар
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const score = history[d];
    
    let bgClass = "bg-gray-100 text-gray-400 border border-transparent";
    
    if (score !== undefined) {
      if (score < 50) bgClass = "bg-red-100 text-red-700 border border-red-200 font-bold";
      else if (score < 80) bgClass = "bg-blue-100 text-blue-700 border border-blue-200 font-bold";
      else bgClass = "bg-amber-100 text-amber-700 border border-amber-300 font-black shadow-sm";
    }

    // Танланган кун
    if (dateStr === selectedDate) {
        bgClass += " ring-2 ring-offset-2 ring-indigo-500 z-10 scale-105 transition-transform";
    }

    days.push(
      <button 
        key={d} 
        onClick={() => onSelectDate(dateStr)} 
        className={`h-14 rounded-xl flex flex-col items-center justify-center text-sm transition-all active:scale-95 hover:bg-opacity-80 relative ${bgClass}`}
      >
        <span>{d}</span>
        {score !== undefined && <span className="text-[9px] opacity-80">{score}%</span>}
      </button>
    );
  }

  const changeMonth = (delta) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const monthNames = [
    "Январ", "Феврал", "Март", "Апрел", "Май", "Июн",
    "Июл", "Август", "Сентябр", "Октябр", "Ноябр", "Декабр"
  ];

  return (
    <div className={`rounded-2xl p-5 mb-6 animate-in slide-in-from-bottom-4 duration-500 ${theme.card}`}>
       {/* Header */}
       <div className="flex items-center justify-between mb-6">
         <button onClick={() => changeMonth(-1)} className={`p-2 rounded-full hover:bg-black/5 ${theme.text}`}>
            <ChevronLeft size={24}/>
         </button>
         <h2 className={`text-xl font-black uppercase tracking-widest ${theme.text}`}>
            {monthNames[currentMonth.getMonth()]} <span className="opacity-50">{currentMonth.getFullYear()}</span>
         </h2>
         <button onClick={() => changeMonth(1)} className={`p-2 rounded-full hover:bg-black/5 ${theme.text}`}>
            <ChevronRight size={24}/>
         </button>
       </div>

       {/* Week Days */}
       <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold opacity-50 uppercase">
         <span>Ду</span><span>Се</span><span>Чо</span><span>Па</span><span>Жу</span><span>Ша</span><span>Як</span>
       </div>

       {/* Days Grid */}
       <div className="grid grid-cols-7 gap-2">
         {days}
       </div>
    </div>
  );
}
