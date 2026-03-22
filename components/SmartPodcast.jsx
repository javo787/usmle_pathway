'use client';
import React, { useState, useEffect } from 'react';
import { Headphones, X, Play, Plus, Trash2, Sparkles, Search, Loader2 } from 'lucide-react';

export default function SmartPodcast({ onClose, data, score }) {
  const [podcasts, setPodcasts] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState("");
  const [category, setCategory] = useState("ilm");
  
  // AI State
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('smart_podcasts');
    if (saved) setPodcasts(JSON.parse(saved));
  }, []);

  // ФУНКЦИЯ: Запрос к реальному AI
  const getAiRecommendation = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'podcast', 
          data: { mood: data.mood, energy: data.energy, score: score, penaltyDebt: data.penaltyDebt } 
        })
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setAiRecommendation(result);
    } catch (e) {
      alert("AI Error: " + e.message);
    } finally {
      setLoadingAi(false);
    }
  };

  const addPodcast = () => {
    if (!newTitle || !newLink) return;
    const newPod = { id: Date.now(), title: newTitle, url: newLink, cat: category };
    const updated = [...podcasts, newPod];
    setPodcasts(updated);
    localStorage.setItem('smart_podcasts', JSON.stringify(updated));
    setNewTitle(""); setNewLink("");
  };

  const deletePodcast = (id) => {
    const updated = podcasts.filter(p => p.id !== id);
    setPodcasts(updated);
    localStorage.setItem('smart_podcasts', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-md h-[80vh] rounded-2xl border border-slate-700 flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-indigo-900/50 border-b border-indigo-500/30 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center">
            <Headphones size={20} className="mr-2 text-indigo-400"/> Ақлли Подкаст
          </h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* AI Блок */}
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-1 rounded-xl border border-indigo-500 shadow-lg relative overflow-hidden group">
             {!aiRecommendation ? (
               <div className="p-4 text-center">
                 <h4 className="text-white font-bold mb-2">Что послушать?</h4>
                 <p className="text-xs text-indigo-200 mb-4">Gemini проанализирует твое состояние (Mood: {data.mood}, Energy: {data.energy}) и подберет контент.</p>
                 <button 
                   onClick={getAiRecommendation} 
                   disabled={loadingAi}
                   className="bg-white text-indigo-900 px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition flex items-center justify-center mx-auto"
                 >
                   {loadingAi ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2"/>}
                   AI Подбор
                 </button>
               </div>
             ) : (
               <div className="p-4 relative z-10 animate-in zoom-in">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center">
                      <Sparkles size={10} className="mr-1"/> AI RECOMENDATION
                    </div>
                    <button onClick={() => setAiRecommendation(null)} className="text-white/50 hover:text-white"><X size={14}/></button>
                  </div>
                  
                  <h2 className="text-lg font-bold text-white mb-2 leading-tight">"{aiRecommendation.title}"</h2>
                  <p className="text-xs text-indigo-100 italic mb-4 border-l-2 border-indigo-400 pl-2">
                    {aiRecommendation.reason}
                  </p>
                  
                  <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(aiRecommendation.searchQuery)}`} 
                    target="_blank" 
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center w-full hover:bg-red-500 transition"
                  >
                    <Search size={16} className="mr-2"/> Найти в YouTube
                  </a>
               </div>
             )}
          </div>

          {/* Ручное добавление */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Добавить свое</h4>
             <div className="space-y-2">
               <input type="text" placeholder="Название..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"/>
               <input type="text" placeholder="Ссылка..." value={newLink} onChange={e=>setNewLink(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"/>
               <div className="flex gap-2">
                 <select value={category} onChange={e=>setCategory(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white flex-1">
                   <option value="ilm">Илм</option>
                   <option value="ruhiy">Руҳий</option>
                   <option value="motivatsiya">Мотивация</option>
                 </select>
                 <button onClick={addPodcast} className="bg-emerald-600 px-3 rounded text-white"><Plus size={20}/></button>
               </div>
             </div>
          </div>

          {/* Список */}
          <div className="space-y-2">
            {podcasts.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div className="overflow-hidden">
                   <div className="text-sm font-bold text-slate-200 truncate">{p.title}</div>
                   <div className="text-[10px] text-slate-500 uppercase">{p.cat}</div>
                </div>
                <div className="flex gap-2">
                  <a href={p.url} target="_blank" className="bg-indigo-600/20 text-indigo-400 p-2 rounded-full hover:bg-indigo-600 hover:text-white transition"><Play size={14}/></a>
                  <button onClick={()=>deletePodcast(p.id)} className="text-slate-600 hover:text-red-500 p-2"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
