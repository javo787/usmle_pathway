'use client';
import React, { useState, useEffect } from 'react';
import { Home as IconHome, BarChart2, Settings as IconSettings, Save, Wallet, Headphones, X, Check, Flame, Calendar as IconCalendar, Moon, AlertTriangle } from 'lucide-react';
import { themes } from '@/lib/themeUtils';
import { calculateScore, determineMode } from '@/lib/gameLogic';

import Quitzilla from '@/components/Quitzilla';
import DayPlan from '@/components/DayPlan';
import AcademicBattle from '@/components/AcademicBattle';
import SpiritualShield from '@/components/SpiritualShield';
import EnglishTutor from '@/components/EnglishTutor';
import SportsTracker from '@/components/SportsTracker';
import SmartPodcast from '@/components/SmartPodcast';
import Settings from '@/components/Settings';
import StatsDashboard from '@/components/StatsDashboard';
import CalendarView from '@/components/CalendarView';
import DailyFocusLock from '@/components/DailyFocusLock';

import { useSession } from 'next-auth/react';
import LoginScreen from '@/components/LoginScreen';

export default function Home() {
  const { data: session, status } = useSession();

  const [view, setView] = useState('journal');
  const [showPodcast, setShowPodcast] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showQazoModal, setShowQazoModal] = useState(false); 
  const [payAmount, setPayAmount] = useState("");
  const [mode, setMode] = useState('stable');
  const [score, setScore] = useState(0);
  const [isPlanLocked, setIsPlanLocked] = useState(false);

  const [settings, setSettings] = useState({ 
    enableNotifications: false, 
    smallReward: "+50с ҳалол!", bigReward: "Тоғга чиқиш", punishment: "50с Эҳсон" 
  });
  const [goals, setGoals] = useState({ firstAid: 15, uWorld: 40, anki: 50 });

  const [data, setData] = useState({
    date: new Date().toISOString().split('T')[0],
    planning: { schedule: "", prohibitions: "", tomorrowPlans: ["", "", "", "", ""], reflection: "" },
    academic: { firstAidDone: 0, uWorldDone: 0, ankiDone: 0, repetition: false, additionalResource: false },
    spiritual: { 
      prayersDone: 0, zikr: false, tahajjud: false, quranPages: 0, 
      sleepOnTime: false, nafsRelapse: false, qazoDone: false,
      zulm: "", sadaqa: false, silaiRahm: false 
    },
    english: { essay: "", aiFeedback: "", practiced: false },
    sport: { type: "", duration: 0, details: "", didSport: false },
    penaltyDebt: 0,
    debtCreatedAt: null, // ЯНГИ: Таймер бошланиши
  });

  const [challenges, setChallenges] = useState([]);

  // --- 1. ЮКЛАШ ---
  useEffect(() => {
    const savedChallenges = localStorage.getItem('quitzilla_challenges');
    if (savedChallenges) setChallenges(JSON.parse(savedChallenges));
    else {
      const defaultCh = [{ id: 1, title: "Нафс", start: new Date().toISOString() }];
      setChallenges(defaultCh);
      localStorage.setItem('quitzilla_challenges', JSON.stringify(defaultCh));
    }
    
    const savedSettings = localStorage.getItem('journal_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    
    const savedGoals = localStorage.getItem('journal_goals');
    if (savedGoals) setGoals(JSON.parse(savedGoals));

    // Қарз ва таймер вақтини тиклаш
    const savedDebt = localStorage.getItem('penalty_debt');
    const savedDebtDate = localStorage.getItem('debt_created_at');
    let currentDebt = savedDebt ? parseInt(savedDebt) : 0;
    let currentDebtDate = savedDebtDate || null;

    // --- АВТОМАТИК ЖАРИМА: КЕЧА РЕЖА ТУЗИЛМАГАНМИ? ---
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const yesterdayDataJSON = localStorage.getItem(`journal_${yesterdayStr}`);
    const autoPenaltyKey = `auto_penalty_applied_${todayStr}`;
    const alreadyApplied = localStorage.getItem(autoPenaltyKey);

    if (!alreadyApplied && yesterdayDataJSON) {
      const yesterdayData = JSON.parse(yesterdayDataJSON);
      const hadPlan = yesterdayData.planning?.schedule && yesterdayData.planning.schedule.trim().length > 5;
      const hadTomorrowTasks = yesterdayData.planning?.tomorrowPlans?.some(t => t && t.trim().length > 2);

      if (!hadPlan && !hadTomorrowTasks) {
        // Кеча умуман режа тузилмаган — жарима 50 сомони
        const PENALTY = 50;
        currentDebt = currentDebt + PENALTY;
        const timestamp = currentDebt === PENALTY ? new Date().toISOString() : currentDebtDate;
        currentDebtDate = timestamp;
        localStorage.setItem('penalty_debt', currentDebt);
        if (timestamp) localStorage.setItem('debt_created_at', timestamp);
        localStorage.setItem(autoPenaltyKey, '1');
        // Огоҳлантириш keyinroq setData dan keyin ko'rsatiladi
        setTimeout(() => {
          alert(`⚠️ АВТОМАТИК ЖАРИМА!\n\nКеча (${yesterdayStr}) режа тузилмади.\n\nЖарима: +${PENALTY} сомони қарзга қўшилди!`);
        }, 1000);
      } else {
        localStorage.setItem(autoPenaltyKey, '1');
      }
    } else if (!alreadyApplied && !yesterdayDataJSON) {
      // Кеча умуман очилмаган — режа ҳам йўқ
      const PENALTY = 50;
      currentDebt = currentDebt + PENALTY;
      const timestamp = currentDebt === PENALTY ? new Date().toISOString() : currentDebtDate;
      currentDebtDate = timestamp;
      localStorage.setItem('penalty_debt', currentDebt);
      if (timestamp) localStorage.setItem('debt_created_at', timestamp);
      localStorage.setItem(autoPenaltyKey, '1');
      setTimeout(() => {
        alert(`⚠️ АВТОМАТИК ЖАРИМА!\n\nКеча (${yesterdayStr}) илова очилмади ва режа тузилмади.\n\nЖарима: +${PENALTY} сомони қарзга қўшилди!`);
      }, 1000);
    }

    if (currentDebt > 0) {
      setData(prev => ({ 
        ...prev, 
        penaltyDebt: currentDebt,
        debtCreatedAt: currentDebtDate 
      }));
    }
    
    loadDataForDate(todayStr);
  }, []);

  // --- 2. DATA HANDLERS ---
  const loadDataForDate = (dateStr) => {
    const key = `journal_${dateStr}`;
    const savedDaily = localStorage.getItem(key);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    
    if (savedDaily) {
       const parsedData = JSON.parse(savedDaily);
       setData(prev => ({ ...prev, ...parsedData, date: dateStr }));

       if (isToday && (!parsedData.planning.schedule || parsedData.planning.schedule.trim().length < 5)) {
         setIsPlanLocked(true);
       } else {
         setIsPlanLocked(false);
       }
    } else {
       const d = new Date(dateStr);
       d.setDate(d.getDate() - 1);
       const prevDateStr = d.toISOString().split('T')[0];
       const prevDataJSON = localStorage.getItem(`journal_${prevDateStr}`);
       
       let initialSchedule = "";
       
       if (prevDataJSON) {
         const prevData = JSON.parse(prevDataJSON);
         if (prevData.planning?.tomorrowPlans) {
           const tasks = prevData.planning.tomorrowPlans.filter(t => t && t.trim().length > 0);
           if (tasks.length > 0) {
             initialSchedule = "Кечадан қолган муҳим вазифалар:\n" + tasks.map((t, i) => `${i+1}. ${t}`).join('\n');
           }
         }
       }

       if (isToday && initialSchedule.trim().length < 5) {
         setIsPlanLocked(true);
       } else {
         setIsPlanLocked(false);
       }

       setData(prev => ({
         date: dateStr,
         planning: { schedule: initialSchedule, prohibitions: "", tomorrowPlans: ["", "", "", "", ""], reflection: "" }, 
         academic: { firstAidDone: 0, uWorldDone: 0, ankiDone: 0, repetition: false, additionalResource: false },
         spiritual: { 
           prayersDone: 0, zikr: false, tahajjud: false, quranPages: 0, 
           sleepOnTime: false, nafsRelapse: false, qazoDone: false,
           zulm: "", sadaqa: false, silaiRahm: false 
         },
         english: { essay: "", aiFeedback: "", practiced: false },
         sport: { type: "", duration: 0, details: "", didSport: false },
         penaltyDebt: prev.penaltyDebt,
         debtCreatedAt: prev.debtCreatedAt 
       }));
    }
  };

  const handleUnlockPlan = (tasks) => {
    const formattedTasks = tasks.filter(t => t.trim() !== "");
    const newSchedule = "Бугунги асосий вазифалар:\n" + formattedTasks.map((t, i) => `${i+1}. ${t}`).join('\n');
    
    const updatedPlanning = { ...data.planning, schedule: newSchedule };
    const updatedData = { ...data, planning: updatedPlanning };
    setData(updatedData);
    setIsPlanLocked(false);

    localStorage.setItem(`journal_${data.date}`, JSON.stringify({ ...updatedData, score }));
  };

  useEffect(() => {
    const newScore = calculateScore(data, goals);
    const newMode = determineMode(newScore, data.penaltyDebt);
    setScore(newScore);
    setMode(newMode);
  }, [data, goals]);

  const currentTheme = themes[mode];

  const updateSection = (section, value) => setData(prev => ({ ...prev, [section]: value }));

  // --- ЯДРОВИЙ ПРОТОКОЛ: ҚАРЗНИ ОШИРИШ ---
  const increaseDebt = (amount) => {
    setData(prev => {
      const newDebt = (prev.penaltyDebt || 0) + amount;
      // Агар қарз нол бўлса, таймерни ҳозирги вақтдан бошлаймиз
      const timestamp = prev.penaltyDebt === 0 ? new Date().toISOString() : prev.debtCreatedAt;
      
      localStorage.setItem('penalty_debt', newDebt);
      if (timestamp) localStorage.setItem('debt_created_at', timestamp);
      
      return { ...prev, penaltyDebt: newDebt, debtCreatedAt: timestamp };
    });
  };

  const updateSettings = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    localStorage.setItem('journal_settings', JSON.stringify(newSettings));
  };

  const updateGoals = (field, value) => {
    const newGoals = { ...goals, [field]: value };
    setGoals(newGoals);
    localStorage.setItem('journal_goals', JSON.stringify(newGoals));
  };

  const handleSaveCheck = () => {
    if (data.spiritual.prayersDone < 5 && !data.spiritual.qazoDone) {
      setShowQazoModal(true);
    } else {
      saveData();
    }
  };

  const confirmQazo = (didPrayQazo) => {
    if (didPrayQazo) {
      const updatedSpiritual = { ...data.spiritual, qazoDone: true };
      const updatedData = { ...data, spiritual: updatedSpiritual };
      setData(updatedData);
      localStorage.setItem(`journal_${data.date}`, JSON.stringify({ ...updatedData, score }));
      alert("✅ Қабул бўлсин! Сақланди.");
    } else {
      saveData();
    }
    setShowQazoModal(false);
  };

  const saveData = () => {
    const dataToSave = { ...data, score };
    localStorage.setItem(`journal_${data.date}`, JSON.stringify(dataToSave));
    alert("✅ Маълумотлар сақланди!");
  };

  // --- ҚАРЗНИ ТЎЛАШ ВА ТАЙМЕРНИ ЎЧИРИШ ---
  const handlePayDebt = () => {
    const amount = parseInt(payAmount);
    if (!amount) return;
    
    setData(prev => {
       const newDebt = Math.max(0, prev.penaltyDebt - amount);
       // Агар қарз тўлиқ узилган бўлса, таймерни бекор қиламиз
       const newTimestamp = newDebt === 0 ? null : prev.debtCreatedAt;
       
       localStorage.setItem('penalty_debt', newDebt);
       if (newTimestamp) {
           localStorage.setItem('debt_created_at', newTimestamp);
       } else {
           localStorage.removeItem('debt_created_at');
       }
       
       return { ...prev, penaltyDebt: newDebt, debtCreatedAt: newTimestamp };
    });

    setPayAmount(""); 
    setShowPayModal(false);
  };

  const addCh = (title) => {
    const newCh = { id: Date.now(), title: title, start: new Date().toISOString() };
    const updated = [...challenges, newCh];
    setChallenges(updated);
    localStorage.setItem('quitzilla_challenges', JSON.stringify(updated));
  };
  
  const resetCh = (id, reason) => {
    const penalty = 50;
    // increaseDebt функциясини чақирамиз (Таймер ҳам қўшилади)
    increaseDebt(penalty);
    
    const updatedChallenges = challenges.map(c => c.id === id ? { ...c, start: new Date().toISOString() } : c);
    setChallenges(updatedChallenges);
    localStorage.setItem('quitzilla_challenges', JSON.stringify(updatedChallenges));
    alert(`⚠️ СРЫВ! Жарима +${penalty} сомони. 24 соатлик таймер ишга тушди!`);
  };
  
  const delCh = (id) => {
    if(!confirm("Ушбу трекерни ўчириб ташлайми?")) return;
    const updated = challenges.filter(c => c.id !== id);
    setChallenges(updated);
    localStorage.setItem('quitzilla_challenges', JSON.stringify(updated));
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <LoginScreen />;
  }

  if (isPlanLocked) {
    return <DailyFocusLock onUnlock={handleUnlockPlan} />;
  }

  return (
    <div className={`min-h-screen pb-28 transition-all duration-700 ${currentTheme.appBg} ${currentTheme.text}`}>
      
      {/* Фон безаги — юмшоқ геометрик доиралар */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-[0.06] blur-3xl ${mode === 'critical' ? 'bg-red-500' : mode === 'legend' ? 'bg-amber-400' : 'bg-emerald-500'}`}/>
        <div className={`absolute top-1/2 -left-24 w-64 h-64 rounded-full opacity-[0.04] blur-3xl ${mode === 'critical' ? 'bg-red-700' : mode === 'legend' ? 'bg-yellow-500' : 'bg-teal-400'}`}/>
      </div>

      <header className="relative z-10 px-5 pt-12 pb-5">
        
        {/* Сана ва режим */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-1">{data.date}</p>
            <h1 className="font-display text-2xl font-bold opacity-90 leading-tight">
              Сабр ва Ҳаракат
            </h1>
            <p className="text-[11px] opacity-40 mt-0.5 font-medium tracking-wide">
              {mode === 'legend' ? '✦ Афсона режими' : mode === 'critical' ? '⚡ Ҳаракат керак' : '◈ Барқарор'}
            </p>
          </div>
           
          {data.penaltyDebt > 0 ? (
            <button 
              onClick={() => setShowPayModal(true)} 
              className="bg-red-500/15 border border-red-500/50 rounded-2xl p-3 px-4 animate-breathe"
            >
              <div className="text-[9px] text-red-400 font-bold uppercase tracking-widest flex items-center justify-end gap-1 mb-0.5">
                Қарз <Wallet size={9}/>
              </div>
              <div className="text-2xl font-black text-red-400 font-display">{data.penaltyDebt}с</div>
            </button>
          ) : (
            <div className={`border rounded-2xl p-3 px-4 flex flex-col items-center gap-1 ${
              mode === 'legend' 
                ? 'bg-amber-500/10 border-amber-400/30 text-amber-500' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
            }`}>
              {mode === 'legend' 
                ? <Flame size={18} className="animate-float"/> 
                : <Check size={16}/>
              }
              <div className="text-[9px] font-black uppercase tracking-widest">
                {mode === 'legend' ? 'ЛЕГЕНД' : 'ТОЗА'}
              </div>
            </div>
          )}
        </div>

        {/* Прогресс */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Кунлик балл</span>
            <span className={`text-sm font-black ${mode === 'critical' ? 'text-red-400' : mode === 'legend' ? 'text-amber-500' : 'text-emerald-600'}`}>
              {score}%
            </span>
          </div>
          <div className={`w-full rounded-full h-3 overflow-hidden ${mode === 'critical' ? 'bg-red-950/50' : mode === 'legend' ? 'bg-amber-100' : 'bg-emerald-50'} border ${mode === 'critical' ? 'border-red-900/30' : mode === 'legend' ? 'border-amber-200' : 'border-emerald-100'}`}>
            <div 
              className={`h-full rounded-full progress-bar relative overflow-hidden ${
                mode === 'critical' 
                  ? 'bg-gradient-to-r from-red-700 to-red-500' 
                  : mode === 'legend' 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-400'
              }`} 
              style={{ width: `${Math.max(4, score)}%` }}
            >
              {/* Ялтироқ эффект */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"/>
            </div>
          </div>
        </div>

        {/* Безак чизиқ */}
        <div className="ornament-line mt-5"/>
      </header>

      <main className="relative z-10 px-5 space-y-4">
        
        {view === 'journal' && (
        <div>
          <div className="card-enter card-enter-1"><Quitzilla challenges={challenges} onAdd={addCh} onReset={resetCh} onDelete={delCh} theme={currentTheme} /></div>
          <div className="card-enter card-enter-2"><DayPlan data={data.planning} updateData={updateSection} theme={currentTheme} /></div>
          <div className="card-enter card-enter-3"><AcademicBattle data={data.academic} updateData={updateSection} theme={currentTheme} /></div>
          <div className="card-enter card-enter-4"><SpiritualShield data={data.spiritual} updateData={updateSection} theme={currentTheme} /></div>
          <div className="card-enter card-enter-5"><EnglishTutor data={data.english} updateData={updateSection} theme={currentTheme} /></div>
          <div className="card-enter card-enter-6"><SportsTracker data={data.sport} academicData={data.academic} updateData={updateSection} theme={currentTheme} /></div>

          <div className="card-enter card-enter-6 mt-2 mb-6">
            <button onClick={handleSaveCheck} className={`w-full py-4 text-white rounded-3xl font-bold text-base flex items-center justify-center active:scale-95 transition-all ${currentTheme.button}`}>
              <Save size={18} className="mr-2"/> Кунликни Сақлаш
            </button>
          </div>
        </div>
        )}

        {view === 'calendar' && (
            <CalendarView 
                selectedDate={data.date} 
                onSelectDate={(d) => { loadDataForDate(d); setView('journal'); }} 
                theme={currentTheme} 
            />
        )}

        {view === 'stats' && <StatsDashboard data={data} goals={goals} challenges={challenges} theme={currentTheme} />}
        
        {view === 'settings' && (
           <Settings 
             settings={settings} updateSettings={updateSettings}
             goals={goals} updateGoals={updateGoals}
             theme={currentTheme} 
           />
        )}

      </main>

      <nav className={`fixed bottom-0 left-0 right-0 border-t pb-safe z-40 transition-all duration-700 glass ${currentTheme.nav}`}>
        <div className="flex justify-around items-center h-16 px-2">
           {[
             { id: 'journal', icon: IconHome, label: 'Журнал' },
             { id: 'calendar', icon: IconCalendar, label: 'Тарих' },
             { id: 'stats', icon: BarChart2, label: 'Статс' },
             { id: 'settings', icon: IconSettings, label: 'Созлама' },
           ].map(({ id, icon: Icon, label }) => (
             <button 
               key={id}
               onClick={() => setView(id)} 
               className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 min-w-[60px] ${
                 view === id 
                   ? `scale-110 opacity-100 font-black` 
                   : 'opacity-40 hover:opacity-70'
               }`}
             >
               <Icon size={20}/>
               <span className="text-[9px] font-bold mt-1 tracking-wide">{label}</span>
               {view === id && (
                 <div className={`w-1 h-1 rounded-full mt-0.5 ${mode === 'critical' ? 'bg-red-400' : mode === 'legend' ? 'bg-amber-400' : 'bg-emerald-500'}`}/>
               )}
             </button>
           ))}
        </div>
      </nav>

      {showPodcast && <SmartPodcast onClose={() => setShowPodcast(false)} data={data} score={score}/>}
      
      {showQazoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl">
             <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/50">
               <Moon size={32} className="text-indigo-400" />
             </div>
             <h2 className="text-xl font-bold text-white mb-2">Намозлар тўлиқ эмас!</h2>
             <p className="text-sm text-slate-300 mb-6">
               Бугун <span className="text-indigo-400 font-bold">{5 - data.spiritual.prayersDone} та</span> намоз кам. 
               <br/>Қазосини ўқиб қўйдингизми?
             </p>
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => confirmQazo(false)} className="w-full bg-slate-800 text-slate-400 py-3 rounded-xl font-bold hover:bg-slate-700">Йўқ, кейин</button>
                 <button onClick={() => confirmQazo(true)} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-500">Ҳа, ўқидим</button>
             </div>
           </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm">
             <div className="flex justify-between items-center mb-4"><h3 className="text-white font-bold">Қарзни сўндириш</h3><button onClick={()=>setShowPayModal(false)}><X className="text-gray-400"/></button></div>
             <input type="number" className="w-full bg-slate-950 border border-slate-600 rounded-xl p-3 text-lg text-white mb-4" value={payAmount} onChange={e => setPayAmount(e.target.value)}/>
             <button onClick={handlePayDebt} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Тўладим</button>
           </div>
        </div>
      )}
      
      <button onClick={() => setShowPodcast(true)} className="fixed bottom-24 left-5 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-xl z-40"><Headphones size={24}/></button>
    </div>
  );
}
