'use client';
import React from 'react';
import { Heart, Activity, Moon, MessageCircle, Clock, BookOpen } from 'lucide-react';

export default function SpiritualShield({ data, updateData, theme }) {
  return (
    <div className={`rounded-2xl p-5 mb-6 transition-colors duration-500 ${theme.card}`}>
      <h3 className={`font-bold flex items-center mb-4 ${theme.cardTitle}`}>
        <Heart size={18} className={`mr-2 ${theme.icon}`}/> Руҳий Қалқон
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
         <button 
           onClick={() => updateData('spiritual', { ...data, prayersDone: data.prayersDone >= 5 ? 0 : data.prayersDone + 1 })}
           className={`col-span-2 p-4 rounded-xl border flex items-center justify-between transition-all ${data.prayersDone === 5 ? 'bg-emerald-600 text-white border-emerald-500' : theme.input}`}
         >
           <span className="font-bold flex items-center"><Activity size={18} className="mr-2"/> 5 Вақт Намоз</span>
           <span className="text-xl font-bold">{data.prayersDone}/5</span>
         </button>
         
         {[
           { key: 'tahajjud', label: 'Таҳажжуд', icon: Moon },
           { key: 'zikr', label: 'Зикр', icon: MessageCircle },
           { key: 'sleepOnTime', label: '23:00 Уйқу', icon: Clock }
         ].map((item) => (
           <button key={item.key} onClick={() => updateData('spiritual', { ...data, [item.key]: !data[item.key] })} 
             className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${data[item.key] ? theme.button : theme.input}`}
           >
             <item.icon size={20} className="mb-1"/>
             <span className="text-[10px] font-bold">{item.label}</span>
           </button>
         ))}

         <div className={`p-3 rounded-xl border flex flex-col items-center justify-center ${theme.input}`}>
            <div className="flex items-center text-[10px] font-bold opacity-60 mb-1"><BookOpen size={10} className="mr-1"/> Қуръон</div>
            <div className="flex items-center space-x-2">
               <button onClick={() => updateData('spiritual', { ...data, quranPages: Math.max(0, data.quranPages - 1) })}>-</button>
               <span className={`text-lg font-bold ${theme.text}`}>{data.quranPages}</span>
               <button onClick={() => updateData('spiritual', { ...data, quranPages: data.quranPages + 1 })}>+</button>
            </div>
         </div>
      </div>
    </div>
  );
}
