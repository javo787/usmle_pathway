'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Home as IconHome, BarChart2, Settings as IconSettings, Save, Wallet, Headphones, X, Check, Flame, Calendar as IconCalendar, Moon, Cloud, CloudOff, Loader } from 'lucide-react';
import { themes } from '@/lib/themeUtils';
import { calculateScore, determineMode } from '@/lib/gameLogic';
import { Zap } from 'lucide-react';

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
import MoneyWidget from '@/components/MoneyWidget';
import MoneyManager from '@/components/MoneyManager';

import { useSession } from 'next-auth/react';
import LoginScreen from '@/components/LoginScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

const TODAY = () => new Date().toISOString().split('T')[0];
 
const EMPTY_DATA = (dateStr) => ({
  date: dateStr,
  planning: {
    schedule: '',
    prohibitions: '',
    tomorrowPlans: ['', '', '', '', ''],
    reflection: '',
    coreIdea: '',
  },
  academic: {
    // Немецкий язык
    germanMinutes: 0,
    germanPractice: false,      // говорил вслух / с репетитором
    // Университет / кафедра
    uniHours: 0,
    clinicVisit: false,         // был в нейрохир. отделении
    researchMeeting: false,     // встреча с науч. руководителем
    // Anki
    ankiDone: 0,
    ankiRepetition: false,
    // Публикация / статья
    pubHours: 0,
    focusSessions: 0,
    teachBack: '',
  },
  spiritual: {
    prayersDone: 0,
    prayers: {},
    zikr: false,
    zikrs: [],
    tahajjud: false,
    quranPages: 0,
    quranNote: '',
    sleepOnTime: false,
    sleepQuality: 0,
    nafsRelapse: false,
    qazoDone: false,
    zulm: '',
    sadaqa: false,
    silaiRahm: false,
  },
  english: { essay: '', aiFeedback: '', practiced: false },
  sport: { type: '', duration: 0, details: '', didSport: false, intensity: '' },
  penaltyDebt: 0,
  debtCreatedAt: null,
});

export default function Home() {
  const { data: session, status } = useSession();

  const [view, setView] = useState('journal');
  const [showPodcast, setShowPodcast] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showQazoModal, setShowQazoModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [mode, setMode] = useState('stable');
  const [score, setScore] = useState(0);
  const [isPlanLocked, setIsPlanLocked] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState({
    enableNotifications: false,
    smallReward: '+50с ҳалол!',
    bigReward: 'Тоғга чиқиш',
    punishment: '50с Эҳсон',
  });
  const [goals, setGoals] = useState({
  germanMinutes: 45,   // мин немецкого в день
  anki: 50,            // карточек Anki
  uniHours: 4,         // часов учёбы/кафедры
});
  const [challenges, setChallenges] = useState([]);
  const [data, setData] = useState(EMPTY_DATA(TODAY()));

  // ── ПРОФИЛ ЮКЛАШ ──────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) return;
      const { profile } = await res.json();
      if (!profile) return;
      if (profile.settings)           setSettings(profile.settings);
      if (profile.goals)              setGoals(profile.goals);
      if (profile.challenges?.length) setChallenges(profile.challenges);
      if (profile.penaltyDebt != null) {
        setData(prev => ({
          ...prev,
          penaltyDebt:   profile.penaltyDebt || 0,
          debtCreatedAt: profile.debtCreatedAt || null,
        }));
      }
    } catch (e) { console.error('loadProfile:', e); }
  }, []);

  // ── АВТОМАТИК ЖАРИМА ──────────────────────────
  const checkAutoPenalty = useCallback(async (todayStr, prevData) => {
    const key = `auto_penalty_applied_${todayStr}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');

    const hadPlan  = prevData?.planning?.schedule?.trim().length > 5;
    const hadTasks = prevData?.planning?.tomorrowPlans?.some(t => t?.trim().length > 2);
    if (hadPlan || hadTasks) return;

    const PENALTY = 50;
    setData(prev => {
      const newDebt  = (prev.penaltyDebt || 0) + PENALTY;
      const ts       = prev.penaltyDebt === 0 ? new Date().toISOString() : prev.debtCreatedAt;
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penaltyDebt: newDebt, debtCreatedAt: ts }),
      });
      const yDate = new Date(); yDate.setDate(yDate.getDate()-1);
      const yStr  = yDate.toISOString().split('T')[0];
      setTimeout(() => alert(`⚠️ АВТОМАТИК ЖАРИМА!\n\nКеча (${yStr}) режа тузилмади.\n\nЖарима: +${PENALTY} сомони қарзга қўшилди!`), 1000);
      return { ...prev, penaltyDebt: newDebt, debtCreatedAt: ts };
    });
  }, []);

  // ── КУН МАЪЛУМОТИНИ ЮКЛАШ ────────────────────
  const loadDataForDate = useCallback(async (dateStr) => {
    const isToday = dateStr === TODAY();
    try {
      const res   = await fetch(`/api/journal?date=${dateStr}`);
      const saved = await res.json();

      if (saved?.date) {
        setData(prev => ({ ...prev, ...saved, date: dateStr }));
        const hasPlan = saved.planning?.schedule?.trim().length > 5;
        setIsPlanLocked(isToday && !hasPlan);
      } else {
        // Янги кун — кечадан ўтказиш
        const d = new Date(dateStr);
        d.setDate(d.getDate() - 1);
        const prevStr = d.toISOString().split('T')[0];
        let prevData  = null;
        try {
          const pr = await fetch(`/api/journal?date=${prevStr}`);
          prevData = await pr.json();
        } catch {}

        let initSchedule = '';
        const tasks = prevData?.planning?.tomorrowPlans?.filter(t => t?.trim()) || [];
        if (tasks.length) {
          initSchedule = 'Кечадан қолган муҳим вазифалар:\n' + tasks.map((t,i) => `${i+1}. ${t}`).join('\n');
        }

        setIsPlanLocked(isToday && initSchedule.trim().length < 5);
        setData(prev => ({
          ...EMPTY_DATA(dateStr),
          planning: { ...EMPTY_DATA(dateStr).planning, schedule: initSchedule },
          penaltyDebt:   prev.penaltyDebt,
          debtCreatedAt: prev.debtCreatedAt,
        }));

        if (isToday) await checkAutoPenalty(dateStr, prevData);
      }
    } catch (e) {
      console.error('loadDataForDate:', e);
      setData(EMPTY_DATA(dateStr));
      if (isToday) setIsPlanLocked(true);
    }
  }, [checkAutoPenalty]);

  // ── БИРИНЧИ ЮКЛАШ ────────────────────────────
  useEffect(() => {
  if (status === 'loading') return;

  if (status === 'unauthenticated') {
    setIsLoading(false);
    return;
  }

  // status === 'authenticated'
  const load = async () => {
    setIsLoading(true); // на случай переподключения
    try {
      await Promise.race([
        (async () => {
          await loadProfile();
          await loadDataForDate(TODAY());
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 15000)
        ),
      ]);
    } catch (err) {
      console.error('Load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  load();
}, [status, loadProfile, loadDataForDate]);

  // ── SCORE ─────────────────────────────────────
  useEffect(() => {
    const s = calculateScore(data, goals);
    const m = determineMode(s, data.penaltyDebt);
    setScore(s);
    setMode(m);
  }, [data, goals]);

  const currentTheme = themes[mode];
  const updateSection = (section, value) => setData(prev => ({ ...prev, [section]: value }));

  // ── САҚЛАШ ───────────────────────────────────
  const saveData = async () => {
    setSyncStatus('saving');
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, score, challenges, settings, goals }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus('idle'), 2500);
    } catch (e) {
      console.error('saveData:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // ── CHALLENGES ───────────────────────────────
  const syncChallenges = (updated) => fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenges: updated }),
  }).catch(console.error);

  const addCh = (title) => {
    const ch = { id: Date.now(), title, start: new Date().toISOString(), relapseHistory: [] };
    const updated = [...challenges, ch];
    setChallenges(updated);
    syncChallenges(updated);
  };

  const resetCh = (id, reason) => {
    const now = new Date().toISOString();
    const updated = challenges.map(c => c.id === id
      ? { ...c, start: now, relapseHistory: [...(c.relapseHistory||[]), { date: now, reason }] }
      : c);
    setChallenges(updated);
    syncChallenges(updated);

    const newDebt = (data.penaltyDebt || 0) + 50;
    const ts = data.penaltyDebt === 0 ? now : data.debtCreatedAt;
    setData(prev => ({ ...prev, penaltyDebt: newDebt, debtCreatedAt: ts }));
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ penaltyDebt: newDebt, debtCreatedAt: ts, challenges: updated }),
    }).catch(console.error);
    alert(`⚠️ СРЫВ! Жарима +50 сомони.`);
  };

  const delCh = (id) => {
    if (!confirm('Ушбу трекерни ўчириб ташлайми?')) return;
    const updated = challenges.filter(c => c.id !== id);
    setChallenges(updated);
    syncChallenges(updated);
  };

  // ── SETTINGS & GOALS ─────────────────────────
  const updateSettings = (field, value) => {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: updated }),
    }).catch(console.error);
  };

  const updateGoals = (field, value) => {
    const updated = { ...goals, [field]: value };
    setGoals(updated);
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals: updated }),
    }).catch(console.error);
  };

  // ── ПЛАН ОЧИШ ────────────────────────────────
  const handleUnlockPlan = (tasks) => {
    const formatted = tasks.filter(t => t.trim());
    const schedule  = 'Бугунги асосий вазифалар:\n' + formatted.map((t,i) => `${i+1}. ${t}`).join('\n');
    const planning  = { ...data.planning, schedule };
    setData(prev => ({ ...prev, planning }));
    setIsPlanLocked(false);
    fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, planning, score }),
    }).catch(console.error);
  };

  // ── ЖАРИМА ТЎЛАШ ─────────────────────────────
  const handlePayDebt = () => {
    const amount  = parseInt(payAmount);
    if (!amount) return;
    const newDebt = Math.max(0, data.penaltyDebt - amount);
    const ts      = newDebt === 0 ? null : data.debtCreatedAt;
    setData(prev => ({ ...prev, penaltyDebt: newDebt, debtCreatedAt: ts }));
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ penaltyDebt: newDebt, debtCreatedAt: ts }),
    }).catch(console.error);
    setPayAmount('');
    setShowPayModal(false);
  };

  // ── ҚАЗО НАМОЗ ───────────────────────────────
  const handleSaveCheck = () => {
    const prayers = data.spiritual.prayers || {};
    const missed  = ['fajr','dhuhr','asr','maghrib','isha'].filter(k => !prayers[k]);
    if (missed.length && !data.spiritual.qazoDone) {
      setShowQazoModal(true);
    } else {
      saveData();
    }
  };

  const confirmQazo = (didPray) => {
    setShowQazoModal(false);
    if (didPray) {
        setData(prev => {
            const updated = { ...prev, spiritual: { ...prev.spiritual, qazoDone: true } };
            // сохраняем уже обновлённые данные
            fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updated, score, challenges, settings, goals }),
            }).catch(console.error);
            return updated;
        });
    } else {
        saveData();
    }
};

  // ── SYNC ИНДИКАТОР ────────────────────────────
  const SyncIndicator = () => syncStatus === 'idle' ? null : (
    <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold shadow-lg transition-all ${
      syncStatus === 'saving' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-500' :
      syncStatus === 'saved'  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-500' :
                                'bg-red-500/20 border border-red-500/40 text-red-500'
    }`}>
      {syncStatus === 'saving' && <><Loader size={12} className="animate-spin"/> Сақланавотти...</>}
      {syncStatus === 'saved'  && <><Cloud size={12}/> Сақланди ✓</>}
      {syncStatus === 'error'  && <><CloudOff size={12}/> Хатолик — қайта уриниш</>}
    </div>
  );

  // ── RENDER ────────────────────────────────────
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F0E8] gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-[#0D5C4C]/20 border-t-[#0D5C4C] animate-spin"/>
        <p className="text-xs text-[#0D5C4C]/50 font-bold uppercase tracking-widest">
          Юкланавотти... ({status})
        </p>
        <p className="text-xs text-red-400">
          isLoading: {String(isLoading)}
        </p>
      </div>
    );
  }

  if (status === 'unauthenticated') return <LoginScreen />;
  if (isPlanLocked) return <DailyFocusLock onUnlock={handleUnlockPlan} />;

  return (
   <ErrorBoundary>
    <div className={`min-h-screen pb-28 transition-all duration-700 ${currentTheme.appBg} ${currentTheme.text}`}>

      <SyncIndicator />

      {/* Фон безаклари */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-[0.06] blur-3xl ${mode === 'critical' ? 'bg-red-500' : mode === 'legend' ? 'bg-amber-400' : 'bg-emerald-500'}`}/>
        <div className={`absolute top-1/2 -left-24 w-64 h-64 rounded-full opacity-[0.04] blur-3xl ${mode === 'critical' ? 'bg-red-700' : mode === 'legend' ? 'bg-yellow-500' : 'bg-teal-400'}`}/>
      </div>


      {/* HEADER */}
      <header className="relative z-10 px-5 pt-12 pb-5">
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-1">{data.date}</p>
            <h1 className="font-display text-2xl font-bold opacity-90 leading-tight">Сабр ва Ҳаракат</h1>
            <p className="text-[11px] opacity-40 mt-0.5 font-medium tracking-wide">
              {mode === 'legend' ? '✦ Афсона режими' : mode === 'critical' ? '⚡ Ҳаракат керак' : '◈ Барқарор'}
            </p>
          </div>

          <div className="flex gap-2">
            {data.planning.coreIdea && (
              <div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl p-3 px-4 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                <Zap size={18} className="text-amber-500 animate-pulse fill-amber-500" />
                <div className="text-[7px] font-black text-amber-600 uppercase tracking-tighter mt-1">COMPRESSED</div>
              </div>
            )}

            {data.penaltyDebt > 0 ? (
              <button onClick={() => setShowPayModal(true)} className="bg-red-500/15 border border-red-500/50 rounded-2xl p-3 px-4 animate-breathe">
                <div className="text-[9px] text-red-400 font-bold uppercase tracking-widest flex items-center justify-end gap-1 mb-0.5">Қарз <Wallet size={9}/></div>
                <div className="text-2xl font-black text-red-400 font-display">{data.penaltyDebt}с</div>
              </button>
            ) : (
              <div className={`border rounded-2xl p-3 px-4 flex flex-col items-center gap-1 ${mode === 'legend' ? 'bg-amber-500/10 border-amber-400/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'}`}>
                {mode === 'legend' ? <Flame size={18} className="animate-float"/> : <Check size={16}/>}
                <div className="text-[9px] font-black uppercase tracking-widest">{mode === 'legend' ? 'ЛЕГЕНД' : 'ТОЗА'}</div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Кунлик балл</span>
            <span className={`text-sm font-black ${mode === 'critical' ? 'text-red-400' : mode === 'legend' ? 'text-amber-500' : 'text-emerald-600'}`}>{score}%</span>
          </div>
          <div className={`w-full rounded-full h-3 overflow-hidden border ${mode === 'critical' ? 'bg-red-950/50 border-red-900/30' : mode === 'legend' ? 'bg-amber-100 border-amber-200' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className={`h-full rounded-full progress-bar ${mode === 'critical' ? 'bg-gradient-to-r from-red-700 to-red-500' : mode === 'legend' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-emerald-600 to-teal-400'}`} style={{ width: `${Math.max(4, score)}%` }}/>
          </div>
        </div>
        <div className="ornament-line mt-5"/>
      </header>

      {/* MAIN */}
      <main className="relative z-10 px-5 space-y-4">
        {view === 'journal' && (
          <div>
            <div className="card-enter card-enter-1"><Quitzilla challenges={challenges} onAdd={addCh} onReset={resetCh} onDelete={delCh} theme={currentTheme}/></div>
            <div className="card-enter card-enter-2"><DayPlan data={data.planning} updateData={updateSection} theme={currentTheme}/></div>
            <div className="card-enter card-enter-3"><AcademicBattle data={data.academic} updateData={updateSection} theme={currentTheme}/></div>
            <div className="card-enter card-enter-4"><SpiritualShield data={data.spiritual} updateData={updateSection} theme={currentTheme}/></div>
            <div className="card-enter card-enter-5"><EnglishTutor data={data.english} updateData={updateSection} theme={currentTheme}/></div>
            <div className="card-enter card-enter-6"><SportsTracker data={data.sport} academicData={data.academic} updateData={updateSection} theme={currentTheme}/></div>
            <div className="card-enter card-enter-6"><MoneyWidget theme={currentTheme} onOpenMoney={() => setView('money')}/></div>
            <div className="card-enter card-enter-6 mt-2 mb-6">
              <button onClick={handleSaveCheck} disabled={syncStatus === 'saving'} className={`w-full py-4 text-white rounded-3xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all ${currentTheme.button} ${syncStatus === 'saving' ? 'opacity-70' : ''}`}>
                {syncStatus === 'saving' ? <><Loader size={18} className="animate-spin"/> Сақланавотти...</> : <><Save size={18}/> Кунликни Сақлаш</>}
              </button>
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <CalendarView selectedDate={data.date} onSelectDate={(d) => { loadDataForDate(d); setView('journal'); }} theme={currentTheme}/>
        )}
        {view === 'stats'    && <StatsDashboard data={data} score={score} goals={goals} challenges={challenges} theme={currentTheme}/>}
        {view === 'settings' && <Settings settings={settings} updateSettings={updateSettings} goals={goals} updateGoals={updateGoals} theme={currentTheme}/>}
        {view === 'money' && <MoneyManager theme={currentTheme} onClose={() => setView('journal')}/>}
      </main>

      {/* NAV */}
      {view !== 'money' && <nav className={`fixed bottom-0 left-0 right-0 border-t pb-safe z-40 transition-all duration-700 glass ${currentTheme.nav}`}>
        <div className="flex justify-around items-center h-16 px-2">
          {[
            { id: 'journal',  icon: IconHome,     label: 'Журнал'  },
            { id: 'calendar', icon: IconCalendar,  label: 'Тарих'   },
            { id: 'stats',    icon: BarChart2,     label: 'Статс'   },
            { id: 'settings', icon: IconSettings,  label: 'Созлама' },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setView(id)} className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 min-w-[60px] ${view === id ? 'scale-110 opacity-100 font-black' : 'opacity-40 hover:opacity-70'}`}>
              <Icon size={20}/>
              <span className="text-[9px] font-bold mt-1 tracking-wide">{label}</span>
              {view === id && <div className={`w-1 h-1 rounded-full mt-0.5 ${mode === 'critical' ? 'bg-red-400' : mode === 'legend' ? 'bg-amber-400' : 'bg-emerald-500'}`}/>}
            </button>
          ))}
        </div>
      </nav>}

      {showPodcast && <SmartPodcast onClose={() => setShowPodcast(false)} data={data} score={score}/>}
      <button onClick={() => setShowPodcast(true)} className="fixed bottom-24 left-5 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-xl z-40"><Headphones size={24}/></button>

      {/* ҚАЗО MODAL */}
      {showQazoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/50">
              <Moon size={32} className="text-indigo-400"/>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Намозлар тўлиқ эмас!</h2>
            <p className="text-sm text-slate-300 mb-6">
              {Object.values(data.spiritual.prayers || {}).filter(v => !v).length} та намоз кам. Қазосини ўқиб қўйдингизми?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => confirmQazo(false)} className="w-full bg-slate-800 text-slate-400 py-3 rounded-xl font-bold">Йўқ, кейин</button>
              <button onClick={() => confirmQazo(true)}  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Ҳа, ўқидим</button>
            </div>
          </div>
        </div>
      )}

      {/* ЖАРИМА ТЎЛАШ */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Қарзни сўндириш</h3>
              <button onClick={() => setShowPayModal(false)}><X className="text-gray-400"/></button>
            </div>
            <input type="number" className="w-full bg-slate-950 border border-slate-600 rounded-xl p-3 text-lg text-white mb-4" value={payAmount} onChange={e => setPayAmount(e.target.value)}/>
            <button onClick={handlePayDebt} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Тўладим</button>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
