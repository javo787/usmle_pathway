'use client';
import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Zap, Activity, Brain, Plus, Trash2, RefreshCw, X } from 'lucide-react';

const QUOTES = [
  "Сабр қил. Албатта, Аллоҳнинг ваъдаси ҳақдир. (Рум: 60)",
  "Зинога яқинлашманглар! У фаҳш иш ва ёмон йўлдир. (Исро: 32)",
  "Тиббий факт: Дофамин 'очлиги' (craving) ўртача 15 дақиқа давом этади. Шунчаки чидаб бер.",
  "Эслатма: Сен келажакда инсон миясини операция қиласан. Ўз миянгни бошқара олмасанг, беморникини қандай бошқарасан?",
  "Ҳар бир ҳаром қилинган қараш — қалбга отилган заҳарли ўқдир."
];

const LEVELS = [
  { days: 0, title: "Дофамин Ломкаси", desc: "Энг қийин давр. Сабр!", color: "text-red-500", icon: AlertTriangle },
  { days: 3, title: "Гормонал Тикланиш", desc: "Рецепторлар уйғонмоқда.", color: "text-orange-500", icon: Activity },
  { days: 7, title: "Тестостерон Cho'qqisi", desc: "Энергия: 145% UP 🚀", color: "text-yellow-500", icon: Zap },
  { days: 30, title: "Нейропластиклик", desc: "Мия қайта қурилди.", color: "text-emerald-500", icon: Brain },
  { days: 90, title: "Мутлақ Ҳокимлик", desc: "Нафс жиловланди.", color: "text-blue-500", icon: Shield },
];

export default function Quitzilla({ challenges = [], onAdd, onReset, onDelete, theme }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Модаллар
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showRelapseModal, setShowRelapseModal] = useState(false);
  const [relapseReason, setRelapseReason] = useState("");
  const [showSOS, setShowSOS] = useState(false);
  const [sosContent, setSosContent] = useState("");

  // 1. ХАВФСИЗЛИК: Агар activeIndex мавжуд бўлмаган элементга тўғри келса, 0-га қайтарамиз
  const safeIndex = (challenges && challenges[activeIndex]) ? activeIndex : 0;
  const activeChallenge = challenges[safeIndex] || null;

  useEffect(() => {
    if (!activeChallenge) return;
    
    // Таймерни дарҳол янгилаш (кутиб ўтирмасдан)
    const updateTimer = () => {
      const start = new Date(activeChallenge.start);
      const now = new Date();
      const diff = Math.max(0, now - start);
      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateTimer(); // Биринчи марта дарҳол чақирамиз
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeChallenge]);

  const currentLevel = activeChallenge 
    ? (LEVELS.slice().reverse().find(l => time.days >= l.days) || LEVELS[0])
    : LEVELS[0];
  
  const nextLevel = activeChallenge 
    ? LEVELS.find(l => l.days > time.days)
    : null;
    
  const progress = nextLevel 
    ? ((time.days - currentLevel.days) / (nextLevel.days - currentLevel.days)) * 100 
    : 100;

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAdd(newTitle);
      setNewTitle("");
      setShowAddModal(false);
      // Янги қўшилганда, автоматик ўшанга ўтиш учун индексни янгилаймиз
      // Лекин бироз кутамиз, state янгилансин
      setTimeout(() => setActiveIndex(challenges.length), 100); 
    }
  };

  const handleDelete = () => {
    if (activeChallenge) {
      onDelete(activeChallenge.id);
      setActiveIndex(0); // Ўчиргандан кейин биринчисига қайтамиз
    }
  };

  const handleRelapse = () => {
    if (activeChallenge) {
      onReset(activeChallenge.id, relapseReason || "Сабабсиз");
      setShowRelapseModal(false);
      setRelapseReason("");
    }
  };

  const handleSOS = () => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setSosContent(randomQuote);
    setShowSOS(true);
  };

  // Агар умуман challenge бўлмаса
  if (!challenges || challenges.length === 0) {
    return (
      <div className={`p-8 rounded-3xl border border-dashed border-gray-400/30 text-center ${theme.card}`}>
        <Shield size={48} className="mx-auto mb-4 opacity-50"/>
        <h3 className="font-bold text-lg mb-2">Ҳали мақсад йўқ</h3>
        <button onClick={() => setShowAddModal(true)} className={`px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition ${theme.button}`}>
          + Янги Мақсад (Start)
        </button>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
             <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-lg">Янги Жанг</h3>
                  <button onClick={()=>setShowAddModal(false)}><X className="text-gray-500"/></button>
               </div>
               <input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Номи (мас: Нафс, TikTok...)" className="w-full p-4 rounded-xl bg-black/50 text-white border border-gray-600 mb-4 outline-none focus:border-emerald-500 transition"/>
               <button onClick={handleAdd} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/20 transition">Бошлаш</button>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-3xl p-6 mb-8 transition-all duration-700 relative overflow-hidden group ${theme.card}`}>
      
      {/* 1. TABS (Glass Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        {challenges.map((c, idx) => (
          <button 
            key={c.id} 
            onClick={() => setActiveIndex(idx)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
              idx === safeIndex 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-105' 
                : 'bg-white/10 text-current border border-current/10 hover:bg-white/20'
            }`}
          >
            {c.title}
          </button>
        ))}
        {/* Қўшиш кнопкаси - Энди доим ишлайди */}
        <button 
          onClick={() => { setNewTitle(""); setShowAddModal(true); }} 
          className="px-3 py-1.5 rounded-full bg-white/5 border border-current/10 hover:bg-emerald-500 hover:text-white transition flex items-center shrink-0"
        >
          <Plus size={14}/>
        </button>
      </div>

      {/* 2. HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <div className={`p-1.5 rounded-lg ${currentLevel.color.replace('text', 'bg')}/10`}>
                <currentLevel.icon size={18} className={currentLevel.color}/>
             </div>
             <h3 className={`font-black text-xl tracking-tight ${theme.text}`}>{activeChallenge.title}</h3>
           </div>
           <p className={`text-[10px] font-bold uppercase tracking-widest pl-1 ${currentLevel.color}`}>
             {currentLevel.title}
           </p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition"><Trash2 size={16}/></button>
           <button onClick={() => setShowRelapseModal(true)} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition">СРЫВ</button>
        </div>
      </div>

      {/* 3. CRYSTAL TIMER (Кичрайтирилган ва чиройли) */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/40 shadow-xl group-hover:shadow-2xl transition-all duration-500">
        
        {/* Glass Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent backdrop-blur-md z-0"></div>
        
        {/* Content */}
        <div className="relative z-10 flex justify-center items-baseline space-x-2 sm:space-x-4 py-6 px-2 font-mono">
           <div className="text-center">
              {/* ФОНТЛАР КИЧРАЙТИРИЛДИ: text-3xl sm:text-4xl */}
              <div className={`text-3xl sm:text-4xl font-black drop-shadow-sm ${theme.text}`}>{time.days}</div>
              <div className="text-[8px] font-bold uppercase opacity-50 tracking-[0.2em]">Кун</div>
           </div>
           <div className={`text-2xl font-light opacity-30 ${theme.text}`}>:</div>
           <div className="text-center">
              <div className={`text-3xl sm:text-4xl font-black drop-shadow-sm ${theme.text}`}>{time.hours}</div>
              <div className="text-[8px] font-bold uppercase opacity-50 tracking-[0.2em]">Соат</div>
           </div>
           <div className={`text-2xl font-light opacity-30 ${theme.text}`}>:</div>
           <div className="text-center">
              <div className={`text-3xl sm:text-4xl font-black drop-shadow-sm ${theme.text}`}>{time.minutes}</div>
              <div className="text-[8px] font-bold uppercase opacity-50 tracking-[0.2em]">Мин</div>
           </div>
           <div className={`text-2xl font-light opacity-30 ${theme.text}`}>:</div>
           <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black drop-shadow-sm text-emerald-500">{time.seconds}</div>
              <div className="text-[8px] font-bold uppercase opacity-50 tracking-[0.2em]">Сек</div>
           </div>
        </div>
      </div>

      {/* 4. PROGRESS BAR */}
      <div className="mb-6 relative">
        <div className="flex justify-between text-[10px] font-bold opacity-60 mb-2 px-1">
          <span>{currentLevel.desc}</span>
          <span>{nextLevel ? `${time.days} / ${nextLevel.days} кун` : 'MAX LEVEL'}</span>
        </div>
        <div className="w-full h-2 bg-gray-200/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
          <div className={`h-full transition-all duration-1000 shadow-[0_0_10px_currentColor] ${currentLevel.color.replace('text', 'bg')}`} style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* 5. SOS BUTTON */}
      <button onClick={handleSOS} className="w-full py-4 bg-gradient-to-r from-red-500/10 to-red-900/10 border border-red-500/30 text-red-500 font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center hover:from-red-500 hover:to-red-600 hover:text-white transition-all group-hover:shadow-lg shadow-red-500/10">
        <AlertTriangle size={16} className="mr-2 animate-pulse"/> SOS (Тезкор Ёрдам)
      </button>

      {/* --- MODALS --- */}
      
      {/* SOS MODAL */}
      {showSOS && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-sm text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            <Shield size={56} className="mx-auto text-emerald-500 mb-6 animate-bounce"/>
            <h2 className="text-3xl font-black text-white mb-4">Тўхта!</h2>
            <p className="text-lg text-emerald-100 mb-8 italic font-serif leading-relaxed opacity-90">
              "{sosContent}"
            </p>
            <button 
              onClick={() => setShowSOS(false)} 
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/30 transition transform active:scale-95"
            >
              Ўзимга келдим.
            </button>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
             <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
               <h3 className="text-white font-bold mb-4 flex items-center"><Plus size={18} className="mr-2"/> Янги Трекер</h3>
               <input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Номи (мас: TikTok, Шакар...)" className="w-full p-3 rounded-xl bg-black text-white border border-gray-600 mb-4 outline-none focus:border-emerald-500 transition"/>
               <div className="flex gap-2">
                 <button onClick={()=>setShowAddModal(false)} className="flex-1 py-3 text-gray-400 font-bold">Бекор қилиш</button>
                 <button onClick={handleAdd} className="flex-1 bg-emerald-600 py-3 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/20">Қўшиш</button>
               </div>
             </div>
          </div>
      )}

      {/* RELAPSE MODAL */}
      {showRelapseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-black border border-red-500/50 p-6 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.5)]">
            <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center"><RefreshCw size={20} className="mr-2"/> Срыв бўлдими?</h3>
            <p className="text-xs text-gray-400 mb-4">Ростгўйлик — даволашнинг биринчи шарти.</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['Зерикиш', 'Стресс', 'Ижтимоий тармоқ', 'Уйқусизлик'].map(reason => (
                <button key={reason} onClick={() => setRelapseReason(reason)} className={`p-2 text-xs rounded border transition ${relapseReason === reason ? 'bg-red-600 border-red-500 text-white' : 'border-gray-800 bg-gray-900 text-gray-400'}`}>{reason}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowRelapseModal(false)} className="flex-1 py-3 bg-gray-800 rounded-xl text-sm font-bold text-gray-300">Йўқ</button>
              <button onClick={handleRelapse} disabled={!relapseReason} className="flex-1 py-3 bg-red-600 disabled:opacity-50 rounded-xl text-white text-sm font-bold shadow-lg shadow-red-600/30">Ҳа, Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
