'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Zap, Activity, Brain, Plus, Trash2, RefreshCw, X, Wind, Dumbbell, Moon, ChevronRight, Clock } from 'lucide-react';

// ============================================
// МАЪЛУМОТЛАР
// ============================================
const QUOTES = [
  { text: "Зинога яқинлашманглар! У фаҳш иш ва ёмон йўлдир.", source: "Қуръон, Исро: 32" },
  { text: "Сабр қил. Албатта, Аллоҳнинг ваъдаси ҳақдир.", source: "Қуръон, Рум: 60" },
  { text: "Ким нафсини тия олса — у чинакам қаҳрамондир.", source: "Ҳадис" },
  { text: "Дофамин 'очлиги' ўртача 15 дақиқа давом этади. Шунчаки чидаб бер.", source: "Нейрология" },
  { text: "Сен келажакда инсон миясини операция қиласан. Ўз миянгни бошқара олмасанг, беморникини қандай бошқарасан?", source: "Ўз-ўзингга эслатма" },
];

const ALTERNATIVES = [
  { icon: Dumbbell, label: "20 та берпи қил",    desc: "Энергияни бошқа йўналтир" },
  { icon: Wind,     label: "Нафас машқи",         desc: "4-7-8 техникаси" },
  { icon: Moon,     label: "2 ракаат намоз ўқи",  desc: "Аллоҳга муrojaat қил" },
  { icon: Brain,    label: "Совуқ сув ич",        desc: "Вагус нерви тинчитади" },
];

const LEVELS = [
  { days: 0,  title: "Дофамин Ломкаси",   desc: "Энг қийин давр. Сабр!", color: "text-red-500",     bg: "bg-red-500",     icon: AlertTriangle },
  { days: 3,  title: "Гормонал Тикланиш", desc: "Рецепторлар уйғонмоқда.", color: "text-orange-500", bg: "bg-orange-500",  icon: Activity      },
  { days: 7,  title: "Тестостерон Чўққи", desc: "Энергия: 145% UP 🚀",    color: "text-yellow-500", bg: "bg-yellow-500",  icon: Zap           },
  { days: 30, title: "Нейропластиклик",   desc: "Мия қайта қурилди.",     color: "text-emerald-500",bg: "bg-emerald-500", icon: Brain         },
  { days: 90, title: "Мутлақ Ҳокимлик",  desc: "Нафс жиловланди.",       color: "text-blue-500",   bg: "bg-blue-500",    icon: Shield        },
];

const RELAPSE_REASONS = ['Зерикиш', 'Стресс', 'Уйқусизлик', 'Ижтимоий тармоқ', 'Ёлғизлик', 'Бошқа'];

// ============================================
// SOS МОДАЛИ — 3 қатламли
// ============================================
function SOSModal({ onClose, theme }) {
  const [step, setStep] = useState(1); // 1=цитата, 2=нафас, 3=альтернатива
  const [breathPhase, setBreathPhase] = useState('inhale'); // inhale|hold|exhale
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(4);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const intervalRef = useRef(null);

  // Нафас машқи логикаси (4-7-8)
  useEffect(() => {
    if (step !== 2) return;
    const phases = { inhale: 4, hold: 7, exhale: 8 };
    const order = ['inhale', 'hold', 'exhale'];
    let current = 0;
    let timeLeft = phases[order[0]];
    setBreathPhase(order[0]);
    setBreathTimer(timeLeft);

    intervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setBreathTimer(timeLeft);
      if (timeLeft <= 0) {
        current = (current + 1) % 3;
        if (current === 0) setBreathCount(c => c + 1);
        timeLeft = phases[order[current]];
        setBreathPhase(order[current]);
        setBreathTimer(timeLeft);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [step]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const phaseLabel = { inhale: 'Нафас ол', hold: 'Ушлаб тур', exhale: 'Нафас чиқар' };
  const phaseScale = { inhale: 'scale-110', hold: 'scale-110', exhale: 'scale-90' };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onPointerDown={onClose}/>
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ zIndex: 1 }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Декоратив чизиқ */}
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500"/>

        <div className="bg-[#0A0A0A] p-6">
          {/* Қадамлар */}
          <div className="flex items-center gap-2 mb-5">
            {[1,2,3].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-emerald-500' : 'bg-white/10'}`}/>
            ))}
            <button onPointerDown={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ml-1">
              <X size={14} className="text-white/60"/>
            </button>
          </div>

          {/* ===== ҚАДАМ 1: ЦИТАТА ===== */}
          {step === 1 && (
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                <Shield size={32} className="text-emerald-400"/>
              </div>
              <h2 className="text-2xl font-black text-white mb-4">Тўхта!</h2>
              <blockquote className="text-base text-emerald-100/90 italic leading-relaxed mb-2">
                "{QUOTES[quoteIdx].text}"
              </blockquote>
              <p className="text-xs text-white/30 mb-6">{QUOTES[quoteIdx].source}</p>
              <div className="bg-white/5 rounded-2xl p-3 mb-5 text-xs text-white/50">
                ⏱ Бу ҳис <span className="text-amber-400 font-black">15 дақиқа</span> давом этади. Кейин ўтади.
              </div>
              <button
                onPointerDown={() => setStep(2)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
              >
                Нафас машқи <ChevronRight size={16}/>
              </button>
            </div>
          )}

          {/* ===== ҚАДАМ 2: НАФАС МАШҚИ ===== */}
          {step === 2 && (
            <div className="text-center py-2">
              <h2 className="text-lg font-black text-white mb-1">4-7-8 Нафас</h2>
              <p className="text-xs text-white/40 mb-6">{breathCount} марта бажарилди</p>

              {/* Анимация доира */}
              <div className="relative flex items-center justify-center mb-6">
                <div className={`w-32 h-32 rounded-full border-4 border-emerald-500/30 flex items-center justify-center transition-all duration-1000 ${phaseScale[breathPhase]}`}
                  style={{ boxShadow: breathPhase === 'inhale' ? '0 0 40px rgba(16,185,129,0.3)' : breathPhase === 'exhale' ? '0 0 10px rgba(16,185,129,0.05)' : '0 0 25px rgba(16,185,129,0.2)' }}
                >
                  <div className={`w-20 h-20 rounded-full transition-all duration-1000 flex flex-col items-center justify-center ${breathPhase === 'inhale' ? 'bg-emerald-500/20' : breathPhase === 'hold' ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                    <span className="text-2xl font-black text-white">{breathTimer}</span>
                    <span className="text-[9px] text-white/50">{phaseLabel[breathPhase]}</span>
                  </div>
                </div>
              </div>

              <p className={`text-lg font-bold mb-6 ${breathPhase === 'inhale' ? 'text-emerald-400' : breathPhase === 'hold' ? 'text-amber-400' : 'text-blue-400'}`}>
                {phaseLabel[breathPhase]}
              </p>

              {breathCount >= 3 && (
                <button onPointerDown={() => setStep(3)} className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 mb-2">
                  Яхши бўляпти <ChevronRight size={16}/>
                </button>
              )}
              <button onPointerDown={() => setStep(3)} className="w-full py-2 text-white/30 text-xs">
                Ўтказиб юбориш →
              </button>
            </div>
          )}

          {/* ===== ҚАДАМ 3: АЛЬТЕРНАТИВА ===== */}
          {step === 3 && (
            <div className="py-2">
              <h2 className="text-lg font-black text-white mb-1 text-center">Энди нима қилиш керак?</h2>
              <p className="text-xs text-white/40 text-center mb-5">Бир нарсани танланг ва бажаринг</p>
              <div className="space-y-2.5 mb-5">
                {ALTERNATIVES.map(({ icon: Icon, label, desc }) => (
                  <button
                    key={label}
                    onPointerDown={onClose}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-emerald-400"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-[10px] text-white/40">{desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-white/20 ml-auto"/>
                  </button>
                ))}
              </div>
              <button onPointerDown={onClose} className="w-full py-3 bg-emerald-600 rounded-2xl font-bold text-white text-sm">
                ✓ Ўзимга келдим
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// СРЫВ МОДАЛИ
// ============================================
function RelapseModal({ challenge, onConfirm, onCancel, theme }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md" onPointerDown={onCancel}/>
      <div
        className="relative w-full max-w-sm bg-black border border-red-500/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(220,38,38,0.3)]"
        style={{ zIndex: 1 }}
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-red-600 rounded-full mb-5 -mx-0"/>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <RefreshCw size={22} className="text-red-400"/>
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Срыв бўлдими?</h3>
            <p className="text-xs text-white/40">"{challenge?.title}" трекери тозаланади</p>
          </div>
        </div>

        <p className="text-xs text-white/50 mb-3">Сабабини белгиланг — кейин таҳлил қиламиз:</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {RELAPSE_REASONS.map(r => (
            <button
              key={r}
              onPointerDown={() => setReason(r)}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all ${
                reason === r
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-red-500/30'
              }`}
            >{r}</button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onPointerDown={onCancel} className="flex-1 py-3 rounded-2xl bg-white/5 text-white/50 font-bold text-sm">
            Йўқ
          </button>
          <button
            onPointerDown={() => reason && onConfirm(reason)}
            disabled={!reason}
            className="flex-1 py-3 rounded-2xl bg-red-600 disabled:opacity-30 text-white font-bold text-sm shadow-lg shadow-red-600/30"
          >
            Ҳа, Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// АСОСИЙ КОМПОНЕНТ
// ============================================
export default function Quitzilla({ challenges = [], onAdd, onReset, onDelete, theme }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showRelapse, setShowRelapse] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [pulse, setPulse] = useState(false);

  const safeIndex = challenges[activeIndex] ? activeIndex : 0;
  const activeChallenge = challenges[safeIndex] || null;

  // Таймер
  useEffect(() => {
    if (!activeChallenge) return;
    const update = () => {
      const diff = Math.max(0, Date.now() - new Date(activeChallenge.start).getTime());
      setTime({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
      setPulse(p => !p);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeChallenge]);

  const currentLevel = activeChallenge
    ? ([...LEVELS].reverse().find(l => time.days >= l.days) || LEVELS[0])
    : LEVELS[0];
  const nextLevel = LEVELS.find(l => l.days > time.days);
  const progress = nextLevel
    ? ((time.days - currentLevel.days) / (nextLevel.days - currentLevel.days)) * 100
    : 100;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim());
    setNewTitle('');
    setShowAddModal(false);
    setTimeout(() => setActiveIndex(challenges.length), 100);
  };

  const handleRelapse = (reason) => {
    if (activeChallenge) {
      onReset(activeChallenge.id, reason);
      setShowRelapse(false);
    }
  };

  // Бўш ҳолат
  if (!challenges.length) {
    return (
      <div className={`p-8 rounded-3xl text-center mb-4 border border-dashed ${theme.card}`}>
        <Shield size={40} className={`mx-auto mb-3 opacity-30 ${theme.icon}`}/>
        <p className={`text-sm opacity-50 mb-4 ${theme.text}`}>Ҳали трекер йўқ</p>
        <button onClick={() => setShowAddModal(true)} className={`px-6 py-3 rounded-2xl font-bold text-sm ${theme.button}`}>
          + Янги трекер
        </button>
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className="absolute inset-0 bg-black/80" onPointerDown={() => setShowAddModal(false)}/>
            <div className="relative bg-slate-900 border border-slate-700 p-6 rounded-3xl w-full max-w-sm" style={{ zIndex: 1 }} onPointerDown={e => e.stopPropagation()}>
              <h3 className="text-white font-bold mb-4">Янги трекер</h3>
              <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Масалан: Нафс, TikTok..." className="w-full p-3 rounded-2xl bg-black text-white border border-slate-700 mb-4 outline-none focus:border-emerald-500"/>
              <button onClick={handleAdd} className="w-full py-3 bg-emerald-600 rounded-2xl text-white font-bold">Бошлаш</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-5 mb-4 relative overflow-hidden ${theme.card}`}>

      {/* Фон безак */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.06] blur-2xl ${currentLevel.bg}`}/>

      {/* Табlar */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        {challenges.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActiveIndex(i)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${
              i === safeIndex
                ? `${currentLevel.bg} text-white shadow-lg`
                : theme.input + ' opacity-50'
            }`}
          >{c.title}</button>
        ))}
        <button
          onClick={() => setShowAddModal(true)}
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${theme.input} opacity-50 hover:opacity-100`}
        ><Plus size={13}/></button>
      </div>

      {/* Сарлавҳа */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <currentLevel.icon size={16} className={currentLevel.color}/>
            <h3 className={`font-black text-lg ${theme.text}`}>{activeChallenge.title}</h3>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${currentLevel.color}`}>
            {currentLevel.title}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setShowRelapse(true)} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black rounded-xl hover:bg-red-500 hover:text-white transition">
            СРЫВ
          </button>
          <button onClick={() => onDelete(activeChallenge.id)} className={`w-8 h-8 rounded-xl flex items-center justify-center opacity-30 hover:opacity-70 transition ${theme.input}`}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>

      {/* Таймер */}
      <div className={`rounded-2xl p-4 mb-4 border relative overflow-hidden ${theme.input}`}>
        <div className={`absolute inset-0 opacity-[0.03] ${currentLevel.bg}`}/>
        <div className="relative flex justify-center items-baseline gap-3">
          {[
            { val: time.days,    label: 'Кун'  },
            { val: time.hours,   label: 'Соат' },
            { val: time.minutes, label: 'Мин'  },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <div className={`text-3xl font-black font-display ${theme.text}`}>
                {String(val).padStart(2, '0')}
              </div>
              <div className="text-[8px] opacity-40 font-bold uppercase tracking-widest">{label}</div>
            </div>
          ))}
          <div className={`text-xl font-light opacity-20 ${theme.text} self-start mt-1`}>:</div>
          <div className="text-center">
            <div className={`text-3xl font-black font-display transition-all duration-300 ${pulse ? currentLevel.color : theme.text}`}>
              {String(time.seconds).padStart(2, '0')}
            </div>
            <div className="text-[8px] opacity-40 font-bold uppercase tracking-widest">Сек</div>
          </div>
        </div>
      </div>

      {/* Прогресс */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] opacity-40 font-bold mb-1.5">
          <span>{currentLevel.desc}</span>
          <span>{nextLevel ? `${nextLevel.days} кунга ${nextLevel.days - time.days} кун қолди` : '🏆 MAX'}</span>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden ${theme.card.includes('1A0F') ? 'bg-white/10' : 'bg-black/5'}`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ${currentLevel.bg}`}
            style={{ width: `${Math.max(2, progress)}%` }}
          />
        </div>
        {/* Level белгилари */}
        <div className="flex justify-between mt-1.5">
          {LEVELS.map(l => (
            <div key={l.days} className={`text-[7px] font-black ${time.days >= l.days ? currentLevel.color : 'opacity-20'}`}>
              {l.days === 0 ? '0' : l.days + 'к'}
            </div>
          ))}
        </div>
      </div>

      {/* SOS тугма */}
      <button
        onClick={() => setShowSOS(true)}
        className="w-full py-3 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/15 transition"
      >
        <AlertTriangle size={14} className="animate-pulse"/> SOS — Тезкор Ёрдам
      </button>

      {/* МОДАЛЛАР */}
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} theme={theme}/>}
      {showRelapse && <RelapseModal challenge={activeChallenge} onConfirm={handleRelapse} onCancel={() => setShowRelapse(false)} theme={theme}/>}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onPointerDown={() => setShowAddModal(false)}/>
          <div className="relative bg-slate-900 border border-slate-700 p-6 rounded-3xl w-full max-w-sm" style={{ zIndex: 1 }} onPointerDown={e => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Plus size={16}/> Янги трекер</h3>
            <input
              autoFocus value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Масалан: Нафс, TikTok, Шакар..."
              className="w-full p-3 rounded-2xl bg-black text-white border border-slate-700 mb-4 outline-none focus:border-emerald-500 transition"
            />
            <div className="flex gap-2">
              <button onPointerDown={() => setShowAddModal(false)} className="flex-1 py-3 rounded-2xl bg-white/5 text-white/50 font-bold text-sm">Бекор</button>
              <button onPointerDown={handleAdd} className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm">Бошлаш</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
