'use client';
import React, { useState } from 'react';
import { Calendar, Ban, ListTodo, Zap, CheckCircle2, Mic, MicOff, PenTool } from 'lucide-react';

export default function DayPlan({ data, updateData, theme }) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const updateTomorrowPlan = (index, value) => {
    const newPlans = [...(data.tomorrowPlans || ["", "", "", "", ""])];
    newPlans[index] = value;
    updateData('planning', { ...data, tomorrowPlans: newPlans });
  };

  // --- AI PLAN CHECK ---
  const analyzePlan = async () => {
    const hasPlan = data.tomorrowPlans.some(p => p && p.length > 3);
    if (!hasPlan && (!data.schedule || data.schedule.length < 5)) {
      alert("Сначала напишите план!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'plan', data: data })
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setAiAnalysis(result);
    } catch (e) {
      alert("AI Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- VOICE TO TEXT ---
  const handleVoiceInput = () => {
    // Браузер қўллаб-қувватлашини текшириш
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Браузерингиз овозли ёзишни қўллаб-қувватламайди. Chrome ишлатинг.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ'; // Ўзбек тили
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // Бор матнга қўшиб қўямиз
      const currentText = data.reflection || "";
      const newText = currentText ? currentText + " " + transcript : transcript;
      updateData('planning', { ...data, reflection: newText });
    };

    recognition.start();
  };

  return (
    <div className={`rounded-2xl p-5 mb-6 transition-colors duration-500 ${theme.card}`}>
       
       {/* 1. SCHEDULE & AI CHECK */}
       <div className="flex justify-between items-start mb-4">
         <h3 className={`font-bold flex items-center ${theme.cardTitle}`}>
           <Calendar size={18} className={`mr-2 ${theme.icon}`}/> Кун Режаси
         </h3>
         <button 
           onClick={analyzePlan}
           disabled={loading}
           className="text-[10px] bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/30"
         >
           {loading ? "..." : <><Zap size={12} className="mr-1"/> AI Check</>}
         </button>
       </div>

       {/* AI Feedback Box */}
       {aiAnalysis && (
         <div className="mb-4 bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-indigo-500 uppercase">AI Verdict</span>
              <span className="text-xs font-black bg-indigo-500 text-white px-1.5 rounded">{aiAnalysis.rating}</span>
            </div>
            <p className="text-sm font-medium opacity-90 mb-2">{aiAnalysis.critique}</p>
            <div className="flex items-start gap-2 text-xs opacity-70 bg-indigo-500/5 p-2 rounded">
               <CheckCircle2 size={12} className="mt-0.5 text-indigo-500"/>
               <span>{aiAnalysis.suggestion}</span>
            </div>
         </div>
       )}
       
       {/* Schedule Input */}
       <div className="mb-4">
         <textarea 
           value={data.schedule || ""} onChange={(e) => updateData('planning', { ...data, schedule: e.target.value })}
           className={`w-full rounded-xl p-3 text-sm h-20 outline-none ${theme.input}`}
           placeholder="08:00 - First Aid..."
         />
       </div>

       {/* Daily Compression */}
       <div className="mb-6">
         <label className={`text-[10px] font-black uppercase tracking-widest opacity-40 block mb-2 ml-1`}>
           Бугунги 1 ta главная идея
         </label>
         <div className="relative">
            <input
              value={data.coreIdea || ""}
              onChange={(e) => updateData('planning', { ...data, coreIdea: e.target.value })}
              className={`w-full rounded-xl p-3 pl-10 text-sm outline-none border transition-all duration-300 ${data.coreIdea ? 'border-amber-500/50 bg-amber-500/5' : theme.input}`}
              placeholder="Бир жумла билан..."
            />
            <Zap size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${data.coreIdea ? 'text-amber-500' : 'opacity-20'}`} />
         </div>
       </div>
       
       <div className="mb-6">
         <div className="flex items-center space-x-2">
           <Ban size={18} className="text-red-500 flex-shrink-0"/>
           <input 
             value={data.prohibitions || ""} onChange={(e) => updateData('planning', { ...data, prohibitions: e.target.value })}
             className={`w-full rounded-xl p-3 text-sm outline-none ${theme.input}`}
             placeholder="Тақиқлар (No Instagram)..."
           />
         </div>
       </div>

       {/* 2. TOMORROW TASKS */}
       <div className={`pt-4 border-t ${theme.input.includes('border') ? 'border-gray-200/10' : 'border-gray-200'}`}>
         <h4 className={`font-bold flex items-center mb-3 text-sm opacity-80 ${theme.text}`}>
           <ListTodo size={16} className="mr-2"/> Эртанги 5 муҳим вазифа
         </h4>
         <div className="space-y-2 mb-6">
           {[0, 1, 2, 3, 4].map((idx) => (
             <div key={idx} className="flex items-center">
               <span className="text-xs font-bold w-4 mr-2 opacity-50">{idx + 1}.</span>
               <input 
                 type="text" value={(data.tomorrowPlans && data.tomorrowPlans[idx]) || ""}
                 onChange={(e) => updateTomorrowPlan(idx, e.target.value)}
                 className={`w-full rounded-lg p-2 text-sm outline-none ${theme.input}`}
                 placeholder="Муҳим иш..."
               />
             </div>
           ))}
         </div>
       </div>

       {/* 3. DAILY REFLECTION (VOICE INPUT) */}
       <div className={`pt-4 border-t ${theme.input.includes('border') ? 'border-gray-200/10' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3">
             <h4 className={`font-bold flex items-center text-sm opacity-80 ${theme.text}`}>
               <PenTool size={16} className="mr-2"/> Кунлик Таҳлил
             </h4>
             <button 
               onClick={handleVoiceInput}
               className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
               title="Овозли ёзиш"
             >
               {isListening ? <MicOff size={16}/> : <Mic size={16}/>}
             </button>
          </div>
          <textarea 
             value={data.reflection || ""} 
             onChange={(e) => updateData('planning', { ...data, reflection: e.target.value })}
             className={`w-full rounded-xl p-3 text-sm h-24 outline-none ${theme.input}`}
             placeholder="Бугун нима яхши бўлди? Нима ёмон? (Микрофонни босиб гапиринг)"
           />
       </div>

    </div>
  );
}
