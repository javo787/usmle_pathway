'use client';
import React from 'react';
import { BookOpen } from 'lucide-react';

export default function AcademicBattle({ data, updateData, theme }) {
  return (
    <div className={`rounded-2xl p-5 mb-6 transition-colors duration-500 ${theme.card}`}>
      <h3 className={`font-bold flex items-center mb-4 ${theme.cardTitle}`}>
        <BookOpen size={18} className={`mr-2 ${theme.icon}`}/> Академик Жанг
      </h3>
      <div className="space-y-4">
        <div>
          <div className={`flex justify-between text-xs font-bold mb-2 opacity-70 ${theme.text}`}>
             <span>First Aid (15 бет)</span>
             <span>{data.firstAidDone}</span>
          </div>
          <input 
            type="range" max="30" value={data.firstAidDone} 
            onChange={(e) => updateData('academic', { ...data, firstAidDone: parseInt(e.target.value) })} 
            className="w-full h-2 rounded-lg bg-gray-300 accent-current appearance-none cursor-pointer"
            style={{ color: theme.icon.includes('red') ? '#ef4444' : theme.icon.includes('amber') ? '#f59e0b' : '#3b82f6' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
           {['UWorld', 'Anki'].map((item) => {
             const key = item === 'UWorld' ? 'uWorldDone' : 'ankiDone';
             const step = item === 'UWorld' ? 5 : 10;
             return (
               <div key={item} className={`p-3 rounded-xl border text-center ${theme.input}`}>
                  <div className="text-[10px] opacity-60 font-bold uppercase">{item}</div>
                  <div className={`text-2xl font-black ${theme.text}`}>{data[key]}</div>
                  <div className="flex justify-center space-x-2 mt-1">
                    <button onClick={() => updateData('academic', { ...data, [key]: Math.max(0, data[key] - step) })} className="px-2 opacity-50 hover:opacity-100">-</button>
                    <button onClick={() => updateData('academic', { ...data, [key]: data[key] + step })} className={`px-2 rounded text-xs font-bold ${theme.button.replace('shadow-lg', '')}`}>+</button>
                  </div>
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );
}
