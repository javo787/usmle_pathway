
'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Moon, MessageCircle, Clock, BookOpen, Star, X, Plus, Minus, Check, ShieldCheck } from 'lucide-react';

const PRAYERS = [
  { key: 'fajr',    label: 'Бомдод' },
  { key: 'dhuhr',   label: 'Пешин'  },
  { key: 'asr',     label: 'Аср'    },
  { key: 'maghrib', label: 'Шом'    },
  { key: 'isha',    label: 'Хуфтон' },
];

const DEFAULT_ZIKRS = [
  { id: 'subhan',    label: 'Субҳаналлоҳ',       count: 0, target: 33  },
  { id: 'alhamd',    label: 'Алҳамдулиллаҳ',     count: 0, target: 33  },
  { id: 'akbar',     label: 'Аллоҳу Акбар',       count: 0, target: 33  },
  { id: 'astaghfir', label: 'Астағфируллоҳ',      count: 0, target: 100 },
  { id: 'salavot',   label: 'Саловот',            count: 0, target: 100 },
  { id: 'lailaha',   label: 'Ла илаҳа иллаллоҳ',  count: 0, target: 100 },
];

// ============================================
// ЗИКР МОДАЛИ
// ============================================
function ZikrModal({ zikrs: initialZikrs, onClose, onUpdate, theme }) {
  const [newLabel, setNewLabel] = useState('');
  const [zikrs, setZikrs] = useState(initialZikrs);

  useEffect(() => {
    // Load custom zikrs from localStorage
    const savedCustom = JSON.parse(localStorage.getItem('custom_zikrs') || '[]');
    // Filter out defaults that might be in savedCustom to avoid duplicates,
    // but actually we want to merge them.
    // The requirement is: merge defaults + saved custom ones.
    const merged = [...DEFAULT_ZIKRS];
    savedCustom.forEach(cz => {
      if (!merged.find(mz => mz.id === cz.id)) {
        merged.push(cz);
      }
    });

    // Also need to merge counts from initialZikrs (which come from DB/parent state)
    const finalZikrs = merged.map(mz => {
      const stateZikr = initialZikrs.find(iz => iz.id === mz.id || iz.label === mz.label);
      return stateZikr ? { ...mz, count: stateZikr.count, target: stateZikr.target || mz.target } : mz;
    });

    setZikrs(finalZikrs);
  }, []);

  const total = zikrs.reduce((s, z) => s + z.count, 0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleUpdate = (newList) => {
    setZikrs(newList);
    onUpdate(newList);

    // Save only custom zikrs to localStorage
    const customOnly = newList.filter(z => !DEFAULT_ZIKRS.find(dz => dz.id === z.id));
    localStorage.setItem('custom_zikrs', JSON.stringify(customOnly));
  };

  const updateCount = (id, value) => {
    handleUpdate(zikrs.map(z => z.id === id ? { ...z, count: Math.max(0, value) } : z));
  };

  const updateTarget = (id, target) => {
    handleUpdate(zikrs.map(z => z.id === id ? { ...z, target: Math.max(1, target) } : z));
  };

  const addCustom = () => {
    if (!newLabel.trim()) return;
    const newZikr = { id: Date.now().toString(), label: newLabel.trim(), count: 0, target: 100 };
    handleUpdate([...zikrs, newZikr]);
    setNewLabel('');
  };

  const removeZikr = (id) => handleUpdate(zikrs.filter(z => z.id !== id));

  const bgColor = theme.card.includes('1A0F') ? 'bg-[#1A1210]' : theme.card.includes('white/90') ? 'bg-[#FBF6EC]' : 'bg-white';
  const borderColor = theme.card.includes('red') ? 'border-red-800/30' : theme.card.includes('E8C9') ? 'border-amber-200/50' : 'border-emerald-100';

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 0 }}
        onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
      />
      {/* Panel */}
      <div
        className={`relative w-full max-w-md rounded-t-3xl px-5 pt-5 pb-10 ${bgColor} border-t ${borderColor}`}
        style={{ zIndex: 1 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Тутқич */}
        <div className="w-10 h-1 rounded-full bg-current opacity-20 mx-auto mb-4"/>

        {/* Сарлавҳа + Ёпиш */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-black text-lg ${theme.text}`}>Зикр</h3>
            <p className="text-xs opacity-40">Умумий: <span className="font-black">{total}</span> та</p>
          </div>
          {/* X ТУГМА — алоҳида, кенглик кафолатланган */}
          <button
            onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
            style={{ minWidth: 40, minHeight: 40 }}
            className={`rounded-2xl flex items-center justify-center border transition ${theme.input}`}
          >
            <X size={20}/>
          </button>
        </div>

        {/* Зикрлар рўйхати — overflow scroll, max баландлик */}
        <div style={{ maxHeight: '52vh', overflowY: 'auto' }} className="space-y-4 mb-4 pr-1 custom-scrollbar">
          {zikrs.map(z => {
            const pct = Math.min(100, (z.count / (z.target || 1)) * 100);
            const done = z.count >= z.target;
            return (
              <div key={z.id} className={`rounded-2xl p-4 border transition-all ${done ? 'bg-emerald-500/5 border-emerald-500/20' : theme.input}`}>
                {/* Сатр 1: ном + target */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {done && <Check size={14} className="text-emerald-500 flex-shrink-0"/>}
                    <span className={`text-sm font-black truncate ${theme.text}`}>{z.label}</span>
                    <div className="flex items-center bg-current/5 rounded-lg px-2 py-0.5">
                      <span className="text-[10px] opacity-40 mr-1">мақсад:</span>
                      <input
                        type="number"
                        value={z.target}
                        onChange={(e) => updateTarget(z.id, parseInt(e.target.value) || 0)}
                        className="bg-transparent border-none outline-none text-[10px] font-bold w-10 p-0"
                      />
                    </div>
                  </div>
                  <button
                    onPointerDown={() => removeZikr(z.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center opacity-20 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  ><X size={14}/></button>
                </div>

                {/* Сатр 2: Slider + Number Input */}
                <div className="flex items-center gap-4 mb-3">
                   <input
                      type="range"
                      min="0"
                      max={Math.max(z.target * 1.5, z.count, 100)}
                      value={z.count}
                      onChange={(e) => updateCount(z.id, parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-current/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                   />
                   <input
                      type="number"
                      value={z.count}
                      onChange={(e) => updateCount(z.id, parseInt(e.target.value) || 0)}
                      className={`w-14 text-center font-black text-sm p-1.5 rounded-xl border ${theme.input}`}
                   />
                </div>

                {/* Прогресс бар */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme.card.includes('1A0F') ? 'bg-white/10' : 'bg-black/5'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      done ? 'bg-emerald-500'
                        : theme.icon.includes('red') ? 'bg-red-500'
                        : theme.icon.includes('C49A') ? 'bg-amber-500'
                        : 'bg-[#0D5C4C]'
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
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none border ${theme.input}`}
          />
          <button
            onPointerDown={addCustom}
            style={{ minWidth: 44, minHeight: 44 }}
            className={`rounded-2xl flex items-center justify-center font-bold transition ${newLabel.trim() ? theme.button : theme.input + ' opacity-40 border'}`}
          ><Plus size={18}/></button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// НАФЛ НАМОЗЛАРИ МОДАЛИ
// ============================================
function NaflModal({ selected = [], onClose, onUpdate, theme }) {
  const NAFL_TYPES = [
    'Таҳажжуд', 'Дуҳо', 'Авваабийн', 'Тасбеҳ', 'Истихора', 'Равотиб (суннат)'
  ];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const toggleNafl = (type) => {
    if (selected.includes(type)) {
      onUpdate(selected.filter(t => t !== type));
    } else {
      onUpdate([...selected, type]);
    }
  };

  const bgColor = theme.card.includes('1A0F') ? 'bg-[#1A1210]' : theme.card.includes('white/90') ? 'bg-[#FBF6EC]' : 'bg-white';
  const borderColor = theme.card.includes('red') ? 'border-red-800/30' : theme.card.includes('E8C9') ? 'border-amber-200/50' : 'border-emerald-100';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 9999 }}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 0 }}
        onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
      />
      <div
        className={`relative w-full max-w-md rounded-t-3xl px-5 pt-5 pb-10 ${bgColor} border-t ${borderColor}`}
        style={{ zIndex: 1 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-current opacity-20 mx-auto mb-4"/>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`font-black text-lg ${theme.text}`}>Нафл намозлари</h3>
          <button
            onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
            style={{ minWidth: 40, minHeight: 40 }}
            className={`rounded-2xl flex items-center justify-center border transition ${theme.input}`}
          ><X size={20}/></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {NAFL_TYPES.map(type => {
            const isSelected = selected.includes(type);
            return (
              <button
                key={type}
                onPointerDown={() => toggleNafl(type)}
                className={`p-4 rounded-2xl border text-sm font-bold transition-all duration-300 flex items-center justify-between ${
                  isSelected ? theme.button + ' border-transparent' : theme.input + ' opacity-60'
                }`}
              >
                <span>{type}</span>
                {isSelected && <Check size={14}/>}
              </button>
            );
          })}
        </div>

        <button onPointerDown={onClose} className={`w-full py-3.5 rounded-2xl font-bold text-sm transition ${theme.button}`}>
          ✓ Сақлаш
        </button>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// ҚУРЪОН МОДАЛИ
// ============================================
function QuranModal({ data, onClose, onUpdate, theme }) {
  const [pages, setPages] = useState(data.quranPages || 0);
  const [note, setNote] = useState(data.quranNote || '');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const save = () => {
    onUpdate({ quranPages: pages, quranNote: note });
    onClose();
  };

  const bgColor = theme.card.includes('1A0F') ? 'bg-[#1A1210]' : theme.card.includes('white/90') ? 'bg-[#FBF6EC]' : 'bg-white';
  const borderColor = theme.card.includes('red') ? 'border-red-800/30' : theme.card.includes('E8C9') ? 'border-amber-200/50' : 'border-emerald-100';

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 9999 }}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 0 }}
        onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
      />
      <div
        className={`relative w-full max-w-md rounded-t-3xl px-5 pt-5 pb-10 ${bgColor} border-t ${borderColor}`}
        style={{ zIndex: 1 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-current opacity-20 mx-auto mb-4"/>

        <div className="flex items-center justify-between mb-5">
          <h3 className={`font-black text-lg ${theme.text}`}>Қуръон тиловати</h3>
          <button
            onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
            style={{ minWidth: 40, minHeight: 40 }}
            className={`rounded-2xl flex items-center justify-center border transition ${theme.input}`}
          ><X size={20}/></button>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6">
          <button onPointerDown={() => setPages(p => Math.max(0, p - 1))} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black border transition ${theme.input}`}>−</button>
          <div className="text-center">
            <div className={`text-5xl font-black ${theme.text}`}>{pages}</div>
            <div className="text-xs opacity-40 mt-1">бет ўқилди</div>
          </div>
          <button onPointerDown={() => setPages(p => p + 1)} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black transition ${theme.button}`}>+</button>
        </div>

        <div className="mb-5">
          <label className="text-[10px] opacity-40 font-bold uppercase tracking-widest block mb-2">Қайси жойдан (ихтиёрий)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Масалан: Бақара сураси, 50-оят..."
            className={`w-full rounded-2xl px-4 py-3 text-sm outline-none border ${theme.input}`}
          />
        </div>

        <button onPointerDown={save} className={`w-full py-3.5 rounded-2xl font-bold text-sm transition ${theme.button}`}>
          ✓ Сақлаш
        </button>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// АСОСИЙ КОМПОНЕНТ
// ============================================
export default function SpiritualShield({ data, updateData, theme }) {
  const [showZikr, setShowZikr] = useState(false);
  const [showQuran, setShowQuran] = useState(false);
  const [showNafl, setShowNafl] = useState(false);

  const prayers = data.prayers || {};

  const cyclePrayer = (key) => {
    const current = prayers[key] || null;
    const next = current === null ? 'onTime' : current === 'onTime' ? 'qaza' : null;
    const updated = { ...prayers, [key]: next };
    updateData('spiritual', {
      ...data,
      prayers: updated,
      prayersDone: Object.values(updated).filter(v => v !== null).length,
    });
  };

  const zikrs = data.zikrs || DEFAULT_ZIKRS;
  const totalZikr = zikrs.reduce((s, z) => s + z.count, 0);

  const updateZikrs = (newZikrs) => updateData('spiritual', { ...data, zikrs: newZikrs });
  const updateQuran = ({ quranPages, quranNote }) => updateData('spiritual', { ...data, quranPages, quranNote });

  const onTimeDone = Object.values(prayers).filter(v => v === 'onTime').length;
  const qazaDone   = Object.values(prayers).filter(v => v === 'qaza').length;

  return (
    <div className={`p-5 mb-4 relative overflow-hidden ${theme.card}`}>
      <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-[0.05] bg-current"/>

      <h3 className={`font-bold flex items-center mb-5 gap-2 ${theme.cardTitle}`}>
        <Heart size={14} className={theme.icon}/> Руҳий Қалқон
      </h3>

      {/* НАМОЗ */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">5 Вақт Намоз</p>
          <div className="flex gap-2 text-[9px]">
            {onTimeDone > 0 && <span className="text-emerald-500 font-black">✓ {onTimeDone} вақтида</span>}
            {qazaDone   > 0 && <span className="text-amber-500 font-black">⏱ {qazaDone} қарз</span>}
          </div>
        </div>

        <div className="flex gap-1.5">
          {PRAYERS.map(({ key, label }) => {
            const status = prayers[key] || null;
            return (
              <button
                key={key}
                onClick={() => cyclePrayer(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all duration-300 ${
                  status === 'onTime' ? theme.button + ' border-transparent'
                    : status === 'qaza' ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                    : theme.input + ' opacity-40'
                }`}
              >
                {status === 'onTime' && <Check size={13}/>}
                {status === 'qaza'   && <Clock size={13}/>}
                {status === null     && <Star size={13} className="opacity-40"/>}
                <span className="text-[7.5px] font-black leading-tight">{label}</span>
                {status === 'qaza' && <span className="text-[6px] font-black uppercase opacity-70">қарз</span>}
              </button>
            );
          })}
        </div>

        {onTimeDone === 5 && (
          <p className="text-center text-xs mt-2 opacity-40 font-medium">✦ Барча намозлар вақтида адо этилди</p>
        )}
      </div>

      {/* АМАЛЛАР */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'sleepOnTime', label: '23:00 Уйқу',  icon: Clock },
          { key: 'sadaqa',      label: 'Садақа',      icon: Heart },
          { key: 'silaiRahm',   label: 'Силаи раҳм',  icon: Star  },
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

        {/* НАФЛ */}
        <button
          onClick={() => setShowNafl(true)}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
            (data.naflPrayers || []).length > 0 ? theme.button + ' border-transparent' : theme.input + ' opacity-50 hover:opacity-80'
          }`}
        >
          <Moon size={15}/>
          <span className="text-[8px] font-black text-center leading-tight">Нафл</span>
          {(data.naflPrayers || []).length > 0 && (
            <span className="text-[8px] font-black opacity-80">{(data.naflPrayers || []).length}</span>
          )}
        </button>

        {/* Sleep Quality */}
        <div className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 ${theme.input}`}>
          <span className="text-[7px] font-black uppercase opacity-40">Уйқу сифати</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => updateData('spiritual', { ...data, sleepQuality: star })}
                className="transition-transform active:scale-125"
              >
                <Star
                  size={10}
                  fill={(data.sleepQuality || 0) >= star ? "#F59E0B" : "none"}
                  className={(data.sleepQuality || 0) >= star ? "text-amber-500" : "opacity-20"}
                />
              </button>
            ))}
          </div>
          <span className="text-[9px] font-black text-amber-500">{data.sleepQuality || 0}</span>
        </div>

        {/* ЗИКР */}
        <button
          onClick={() => setShowZikr(true)}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
            totalZikr > 0 ? theme.button + ' border-transparent' : theme.input + ' opacity-50 hover:opacity-80'
          }`}
        >
          <MessageCircle size={15}/>
          <span className="text-[8px] font-black">Зикр</span>
          {totalZikr > 0 && <span className="text-[8px] font-black opacity-80">{totalZikr}</span>}
        </button>

        {/* ҚУРЪОН */}
        <button
          onClick={() => setShowQuran(true)}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
            (data.quranPages || 0) > 0 ? theme.button + ' border-transparent' : theme.input + ' opacity-50 hover:opacity-80'
          }`}
        >
          <BookOpen size={15}/>
          <span className="text-[8px] font-black">Қуръон</span>
          {(data.quranPages || 0) > 0 && <span className="text-[8px] font-black opacity-80">{data.quranPages} бет</span>}
        </button>
      </div>

      {showZikr  && <ZikrModal  zikrs={zikrs} onClose={() => setShowZikr(false)}  onUpdate={updateZikrs} theme={theme}/>}
      {showQuran && <QuranModal data={data}   onClose={() => setShowQuran(false)} onUpdate={updateQuran} theme={theme}/>}
      {showNafl  && (
        <NaflModal
          selected={data.naflPrayers || []}
          onClose={() => setShowNafl(false)}
          onUpdate={(val) => updateData('spiritual', { ...data, naflPrayers: val })}
          theme={theme}
        />
      )}

      {/* Daily Muhasaba (Stoic & Islamic Self-Examination) */}
      <div className="mt-6 pt-5 border-t border-current/10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-3 flex items-center gap-2">
          <ShieldCheck size={12} className="text-amber-500"/> Кунлик Муҳосаба
        </h4>
        <div className="bg-black/20 rounded-2xl p-4 border border-amber-500/20">
          <p className="text-[9px] text-amber-500/80 font-bold mb-2 uppercase tracking-wider">
            Бугун нималарни қойиллатдингиз ва нимани эртага бошқача қиласиз?
          </p>
          <textarea
            value={data.muhasaba || ''}
            onChange={(e) => updateData('spiritual', { ...data, muhasaba: e.target.value })}
            className={`w-full bg-transparent text-xs outline-none min-h-[80px] leading-relaxed italic ${theme.card.includes('1A0F') ? 'text-amber-100/90' : 'text-[#2C1A08]/80'}`}
            placeholder="Ўз-ўзини тафтиш қилиш..."
          />
          <div className="flex justify-end mt-2">
             <span className="text-[8px] font-bold text-amber-500/40 uppercase tracking-widest">Marcus Aurelius framing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
