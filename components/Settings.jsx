'use client';
import React, { useState } from 'react';
import { Settings as IconSettings, Download, Upload, Target, Gift, AlertTriangle, Server } from 'lucide-react';

export default function Settings({ settings, updateSettings, goals, updateGoals, theme }) {
  
  const handleExport = () => {
    const allData = {};
    for(let i=0; i<localStorage.length; i++) { 
      const key = localStorage.key(i); 
      if(key.startsWith('journal_') || key === 'quitzilla_challenges' || key === 'penalty_debt') {
        allData[key] = localStorage.getItem(key); 
      }
    }
    const blob = new Blob([JSON.stringify(allData)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `muslim_doctor_backup_${new Date().toISOString().split('T')[0]}.json`; 
    a.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { 
      try { 
        const imported = JSON.parse(e.target.result); 
        Object.keys(imported).forEach(key => localStorage.setItem(key, imported[key])); 
        alert("✅ Маълумотлар тикланди! Саҳифа янгиланади."); 
        window.location.reload(); 
      } catch(err) { 
        alert("Хатолик: Файл бузуқ."); 
      } 
    };
    reader.readAsText(file);
  };

  return (
    <div className={`rounded-2xl p-6 mb-6 animate-in slide-in-from-right-4 duration-500 ${theme.card}`}>
      <h2 className={`text-xl font-bold mb-6 flex items-center ${theme.text}`}>
        <IconSettings className="mr-2"/> Созламалар
      </h2>

      {/* 1. API KEY INFO (Только инфо, без ввода) */}
      <div className="mb-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
          <Server size={20}/>
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-600">AI Server Mode</h4>
          <p className="text-[10px] opacity-70">Gemini API калит Vercel Environment Variables орқали уланган.</p>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="notif"
            checked={settings.enableNotifications || false} 
            onChange={e => updateSettings('enableNotifications', e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          <label htmlFor="notif" className="text-sm font-bold opacity-80">Уведомлениелар (23:00 да)</label>
        </div>
      </div>

      {/* 2. MAQSADLAR */}
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase mb-3 flex items-center gap-2 text-emerald-600">
          <Target size={16}/> Кунлик Мақсадлар
        </h3>
        <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold block mb-1 opacity-60">First Aid (бет)</label>
              <input type="number" className={`w-full rounded-lg p-2 text-sm ${theme.input}`} value={goals.firstAid} onChange={e=>updateGoals('firstAid', parseInt(e.target.value)||0)}/>
            </div>
            <div>
              <label className="text-[10px] font-bold block mb-1 opacity-60">UWorld (тест)</label>
              <input type="number" className={`w-full rounded-lg p-2 text-sm ${theme.input}`} value={goals.uWorld} onChange={e=>updateGoals('uWorld', parseInt(e.target.value)||0)}/>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold block mb-1 opacity-60">Anki (карта)</label>
              <input type="number" className={`w-full rounded-lg p-2 text-sm ${theme.input}`} value={goals.anki} onChange={e=>updateGoals('anki', parseInt(e.target.value)||0)}/>
            </div>
        </div>
      </div>

      {/* 3. MUKOFOT VA JAZO */}
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase mb-3 flex items-center gap-2 text-amber-600">
          <Gift size={16}/> Мукофот ва Жазо
        </h3>
        <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold block mb-1 opacity-60">Кичик Мукофот (3 кун streak)</label>
              <input type="text" className={`w-full rounded-lg p-2 text-sm ${theme.input}`} value={settings.smallReward || ""} onChange={e=>updateSettings('smallReward', e.target.value)}/>
            </div>
            <div>
              <label className="text-[10px] font-bold block mb-1 opacity-60">Катта Мукофот (Ҳафта 90%+)</label>
              <input type="text" className={`w-full rounded-lg p-2 text-sm ${theme.input}`} value={settings.bigReward || ""} onChange={e=>updateSettings('bigReward', e.target.value)}/>
            </div>
            <div>
              <label className="text-[10px] font-bold block mb-1 text-red-500 flex items-center gap-1"><AlertTriangle size={10}/> Жазо (Провал)</label>
              <input type="text" className="w-full rounded-lg p-2 text-sm bg-red-500/10 border border-red-500/30 text-red-500 placeholder-red-300 focus:outline-none" value={settings.punishment || ""} onChange={e=>updateSettings('punishment', e.target.value)}/>
            </div>
        </div>
      </div>

      {/* 4. BACKUP */}
      <div className="pt-4 border-t border-gray-200/10 grid grid-cols-2 gap-3">
        <button onClick={handleExport} className="flex items-center justify-center py-3 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-xs font-bold transition">
          <Download size={16} className="mr-2"/> Скачать (Backup)
        </button>
        <label className="flex items-center justify-center py-3 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-xs font-bold transition cursor-pointer">
          <Upload size={16} className="mr-2"/> Юклаш (Restore)
          <input type="file" onChange={handleImport} className="hidden" accept=".json"/>
        </label>
      </div>
      
    </div>
  );
}
