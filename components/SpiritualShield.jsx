'use client';
import React from 'react';
import { Heart, Moon, MessageCircle, Clock, BookOpen, Star } from 'lucide-react';

const PRAYERS = ['Бомдод', 'Пешин', 'Аср', 'Шом', 'Хуфтон'];

export default function SpiritualShield({ data, updateData, theme }) {
  return (
    <div className={`p-5 mb-4 relative overflow-hidden ${theme.card}`}>
      <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-[0.05] bg-current"/>

      <h3 className={`font-bold flex items-center mb-5 gap-2 ${theme.cardTitle}`}>
        <Heart size={14} className={theme.icon}/> Руҳий Қалқон
      </h3>

      <div className="mb-5">
        <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mb-3">5 Вақт Намоз</p>
        <div className="flex justify-between gap-2">
          {PRAYERS.map((name, i) => {
            const done = i < data.prayersDone;
            return (
              <button
                key={name}
                onClick={() => updateData('spiritual', {
                  ...data,
                  prayersDone: data.prayersDone === i + 1 ? i : i + 1
                })}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-300 ${
                  done ? theme.button + ' border-transparent' : theme.input + ' opacity-50'
                }`}
              >
                <Star size={14} fill={done ? 'currentColor' : 'none'}/>
                <span className="text-[8px] font-black">{name}</span>
              </button>
            );
          })}
        </div>
        {data.prayersDone === 5 && (
          <p className="text-center text-xs mt-2 opacity-50 font-medium">✦ Барча намозлар адо этилди</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'tahajjud', label: 'Таҳажжуд', icon: Moon },
          { key: 'zikr', label: 'Зикр', icon: MessageCircle },
          { key: 'sleepOnTime', label: '23:00 Уйқу', icon: Clock },
          { key: 'sadaqa', label: 'Садақа', icon: Heart },
          { key: 'silaiRahm', label: 'Силаи раҳм', icon: Star },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => updateData('spiritual', { ...data, [key]: !data[key] })}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
              data[key] ? theme.button + ' border-transparent' : theme.input + ' opacity-50 hover:opacity-80'
            }`}
          >
            <Icon size={16}/>
            <span className="text-[8px] font-black text-center leading-tight">{label}</span>
          </button>
        ))}

        <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 ${theme.input}`}>
          <BookOpen size={16} className={`${theme.icon} opacity-60`}/>
          <span className="text-[8px] font-black opacity-50">Қуръон</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => updateData('spiritual', { ...data, quranPages: Math.max(0, data.quranPages - 1) })} className="opacity-50 hover:opacity-100 text-sm font-bold w-5 h-5 flex items-center justify-center">−</button>
            <span className={`text-base font-black font-display ${theme.text}`}>{data.quranPages}</span>
            <button onClick={() => updateData('spiritual', { ...data, quranPages: data.quranPages + 1 })} className="opacity-50 hover:opacity-100 text-sm font-bold w-5 h-5 flex items-center justify-center">+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
