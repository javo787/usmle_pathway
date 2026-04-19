'use client';
import React, { useState } from 'react';
import { Heart, Moon, MessageCircle, Clock, BookOpen, Star, X, Plus, Minus, Check } from 'lucide-react';

// ============================================
// НАМОЗ ВАҚТЛАРИ
// ============================================
const PRAYERS = [
  { key: 'fajr',    label: 'Бомдод' },
  { key: 'dhuhr',   label: 'Пешин'  },
  { key: 'asr',     label: 'Аср'    },
  { key: 'maghrib', label: 'Шом'    },
  { key: 'isha',    label: 'Хуфтон' },
];

// ============================================
// ТАЙЁР ЗИКРЛАР
// ============================================
const DEFAULT_ZIKRS = [
  { id: 'subhan',   label: 'Субҳаналлоҳ',        count: 0, target: 33 },
  { id: 'alhamd',   label: 'Алҳамдулиллаҳ',       count: 0, target: 33 },
  { id: 'akbar',    label: 'Аллоҳу Акбар',         count: 0, target: 33 },
  { id: 'astaghfir',label: 'Астағфируллоҳ',        count: 0, target: 100 },
  { id: 'salavot',  label: 'Саловот',              count: 0, target: 100 },
  { id: 'lailaha',  label: 'Ла илаҳа иллаллоҳ',   count: 0, target: 100 },
];

// ============================================
// ЗИКР МОДАЛИ
// ============================================
function ZikrModal({ zikrs, onClose, onUpdate, theme }) {
  const [newLabel, setNewLabel] = useState('');
  const total = zikrs.reduce((s, z) => s + z.count, 0);

  const updateCount = (id, delta) => {
    onUpdate(zikrs.map(z => z.id === id ? { ...z, count: Math.max(0, z.count + delta) } : z));
  };

  const addCustom = () => {
    if (!newLabel.trim()) return;
    onUpdate([...zikrs, { id: Date.now().toString(), label: newLabel.trim(), count: 0, target: 100 }]);
    setNewLabel('');
  };

  const removeZikr = (id) => {
    onUpdate(zikrs.filter(z => z.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom-4 duration-300 ${
        theme.card.includes('1A0F') ? 'bg-[#1A1210]' : theme.card.includes('white/90') ? 'bg-[#FBF6EC]' : 'bg-white'
      } border-t ${theme.card.includes('red') ? 'border-red-800/30' : theme.card.includes('E8C9') ? 'border-amber-200/50' : 'border-emerald-100'}`}>
        
        {/* Тутқич */}
        <div className="w-10 h-1 rounded-full bg-current opacity-20 mx-auto mb-5"/>

        {/* Сарлавҳа */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className={`font-black text-lg font-display ${theme.text}`}>Зикр</h3>
            <p className="text-xs opacity-40 mt-0.5">Умумий: <span className="font-black">{total}</span> та</p>
          </div>
          <button onClick={onClose} className={`w-9 h-9 rounded-2xl flex items-center justify-center opacity-50 hover:opacity-100 transition ${theme.input}`}>
            <X size={16}/>
          </button>
        </div>

        {/* Зикрлар рўйхати */}
        <div className="space-y-2.5 mb-5 max-h-64 overflow-y-auto">
          {zikrs.map(z => {
            const pct = Math.min(100, (z.count / z.target) * 100);
            const done = z.count >= z.target;
            return (
              <div key={z.id} className={`rounded-2xl p-3 border ${theme.input} ${done ? 'opacity-100' : 'opacity-80'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {done && <Check size={12} className={theme.icon}/>}
                    <span className={`text-sm font-bold truncate ${theme.text}`}>{z.label}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => updateCount(z.id, -1)} className={`w-7 h-7 rounded-xl flex items-center justify-center opacity-60 hover:opacity-100 transition ${theme.input}`}>
                      <Minus size={12}/>
                    </button>
                    <span className={`text-sm font-black w-10 text-center font-display ${theme.text}`}>{z.count}</span>
                    <button onClick={() => updateCount(z.id, 1)} className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold transition ${theme.button}`}>
                      <Plus size={12}/>
                    </button>
                    <button onClick={() => removeZikr(z.id)} className="w-6 h-6 flex items-center justify-center opacity-30 hover:opacity-70 transition ml-1">
                      <X size={11}/>
                    </button>
                  </div>
                </div>
                {/* Прогресс */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme.card.includes('1A0F') ? 'bg-white/10' : 'bg-black/5'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      done
                        ? 'bg-emerald-500'
                        : theme.icon.includes('red') ? 'bg-red-500' : theme.icon.includes('C49A') ? 'bg-amber-500' : 'bg-[#0D5C4C]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[9px] opacity-30 mt-1 text-right">{z.count} / {z.target}</p>
              </div>
            );
          })}
        </div>

        {/* Янги зикр қўшиш */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="Янги зикр қўшиш..."
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none ${theme.input}`}
          />
          <button
            onClick={addCustom}
            disabled={!newLabel.trim()}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold transition ${newLabel.trim() ? theme.button : theme.input + ' opacity-40'}`}
          >
            <Plus size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ҚУРЪОН МОДАЛИ
// ============================================
function QuranModal({ data, onClose, onUpdate, theme }) {
  const [pages, setPages] = useState(data.quranPages || 0);
  const [note, setNote] = useState(data.quranNote || '');

  const save = () => {
    onUpdate({ quranPages: pages, quranNote: note });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative w-full max-w-md rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom-4 duration-300 ${
        theme.card.includes('1A0F') ? 'bg-[#1A1210]' : theme.card.includes('white/90') ? 'bg-[#FBF6EC]' : 'bg-white'
      } border-t ${theme.card.includes('red') ? 'border-red-800/30' : theme.card.includes('E8C9') ? 'border-amber-200/50' : 'border-emerald-100'}`}>
        
        <div className="w-10 h-1 rounded-full bg-current opacity-20 mx-auto mb-5"/>
        
        <div className="flex items-center justify-between mb-6">
          <h3 className={`font-black text-lg font-display ${theme.text}`}>Қуръон тиловати</h3>
          <button onClick={onClose} className={`w-9 h-9 rounded-2xl flex items-center justify-center opacity-50 ${theme.input}`}>
            <X size={16}/>
          </button>
        </div>

        {/* Бет счётчики */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={() => setPages(p => Math.max(0, p - 1))}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black transition ${theme.input} opacity-70 hover:opacity-100`}
          >−</button>
          <div className="text-center">
            <div className={`text-5xl font-black font-display ${theme.text}`}>{pages}</div>
            <div className="text-xs opacity-40 mt-1">бет ўқилди</div>
          </div>
          <button
            onClick={() => setPages(p => p + 1)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black transition ${theme.button}`}
          >+</button>
        </div>

        {/* Қайси жой */}
        <div className="mb-5">
          <label className="text-[10px] opacity-40 font-bold uppercase tracking-widest block mb-2">Қайси жойдан (ихтиёрий)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Масалан: Бақара сураси, 50-оят..."
            className={`w-full rounded-2xl px-4 py-3 text-sm outline-none ${theme.input}`}
          />
        </div>

        <button onClick={save} className={`w-full py-3.5 rounded-2xl font-bold text-sm transition ${theme.button}`}>
          ✓ Сақлаш
        </button>
      </div>
    </div>
  );
}

// ============================================
// АСОСИЙ КОМПОНЕНТ
// ============================================
export default function SpiritualShield({ data, updateData, theme }) {
  const [showZikr, setShowZikr] = useState(false);
  const [showQuran, setShowQuran] = useState(false);

  // Намоз ҳолатлари: { fajr: 'onTime'|'qaza'|null, ... }
  const prayers = data.prayers || {};

  const cyclePrayer = (key) => {
    const current = prayers[key] || null;
    const next = current === null ? 'onTime' : current === 'onTime' ? 'qaza' : null;
    updateData('spiritual', {
      ...data,
      prayers: { ...prayers, [key]: next },
      // prayersDone — мавжуд логика билан мослик учун
      prayersDone: Object.values({ ...prayers, [key]: next }).filter(v => v !== null).length,
    });
  };

  // Зикрлар
  const zikrs = data.zikrs || DEFAULT_ZIKRS;
  const totalZikr = zikrs.reduce((s, z) => s + z.count, 0);

  const updateZikrs = (newZikrs) => {
    updateData('spiritual', { ...data, zikrs: newZikrs });
  };

  const updateQuran = ({ quranPages, quranNote }) => {
    updateData('spiritual', { ...data, quranPages, quranNote });
  };

  const onTimeDone = Object.values(prayers).filter(v => v === 'onTime').length;
  const qazaDone  = Object.values(prayers).filter(v => v === 'qaza').length;

  return (
    <div className={`p-5 mb-4 relative overflow-hidden ${theme.card}`}>
      <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-[0.05] bg-current"/>

      <h3 className={`font-bold flex items-center mb-5 gap-2 ${theme.cardTitle}`}>
        <Heart size={14} className={theme.icon}/> Руҳий Қалқон
      </h3>

      {/* ---- НАМОЗ ---- */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">5 Вақт Намоз</p>
          <div className="flex gap-2 text-[9px] opacity-50">
            {onTimeDone > 0 && <span className="text-emerald-500 font-black">✓ {onTimeDone} вақтида</span>}
            {qazaDone  > 0 && <span className="text-amber-500 font-black">⏱ {qazaDone} қарз</span>}
          </div>
        </div>

        <div className="flex gap-2">
          {PRAYERS.map(({ key, label }) => {
            const status = prayers[key] || null;
            return (
              <button
                key={key}
                onClick={() => cyclePrayer(key)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-300 ${
                  status === 'onTime'
                    ? theme.button + ' border-transparent'
                    : status === 'qaza'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                    : theme.input + ' opacity-40'
                }`}
              >
                {status === 'onTime' && <Check size={13}/>}
                {status === 'qaza'   && <Clock size={13}/>}
                {status === null     && <Star size={13} className="opacity-40"/>}
                <span className="text-[7.5px] font-black leading-tight">{label}</span>
                {status === 'qaza' && (
                  <span className="text-[6px] font-black uppercase tracking-wide opacity-70">қарз</span>
                )}
              </button>
            );
          })}
        </div>

        {onTimeDone === 5 && (
          <p className="text-center text-xs mt-2 opacity-40 font-medium">✦ Барча намозлар вақтида адо этилди</p>
        )}
      </div>

      {/* ---- АМАЛЛАР GRID ---- */}
      <div className="grid grid-cols-3 gap-2">

        {/* Таҳажжуд */}
        {[
          { key: 'tahajjud',   label: 'Таҳажжуд', icon: Moon },
          { key: 'sleepOnTime',label: '23:00 Уйқу', icon: Clock },
          { key: 'sadaqa',     label: 'Садақа',    icon: Heart },
          { key: 'silaiRahm',  label: 'Силаи раҳм', icon: Star },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => updateData('spiritual', { ...data, [key]: !data[key] })}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
              data[key] ? theme.button + ' border-transparent' : theme.input + ' opacity-50 hover:opacity-80'
            }`}
          >
            <Icon size={15}/>
            <span className="text-[8px] font-black text-center leading-tight">{label}</span>
          </button>
        ))}

        {/* Зикр тугмаси */}
        <button
          onClick={() => setShowZikr(true)}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
            totalZikr > 0 ? theme.button + ' border-transparent' : theme.input + ' opacity-50 hover:opacity-80'
          }`}
        >
          <MessageCircle size={15}/>
          <span className="text-[8px] font-black">Зикр</span>
          {totalZikr > 0 && (
            <span className="text-[8px] font-black opacity-80">{totalZikr}</span>
          )}
        </button>

        {/* Қуръон тугмаси */}
        <button
          onClick={() => setShowQuran(true)}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
            (data.quranPages || 0) > 0 ? theme.button + ' border-transparent' : theme.input + ' opacity-50 hover:opacity-80'
          }`}
        >
          <BookOpen size={15}/>
          <span className="text-[8px] font-black">Қуръон</span>
          {(data.quranPages || 0) > 0 && (
            <span className="text-[8px] font-black opacity-80">{data.quranPages} бет</span>
          )}
        </button>

      </div>

      {/* Модаллар */}
      {showZikr && (
        <ZikrModal
          zikrs={zikrs}
          onClose={() => setShowZikr(false)}
          onUpdate={updateZikrs}
          theme={theme}
        />
      )}
      {showQuran && (
        <QuranModal
          data={data}
          onClose={() => setShowQuran(false)}
          onUpdate={updateQuran}
          theme={theme}
        />
      )}
    </div>
  );
}
