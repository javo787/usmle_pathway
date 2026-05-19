'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Ban, ListTodo, Zap, CheckCircle2, Mic, MicOff, PenTool, Star, LayoutGrid, Plus, Trash2, X, ChevronRight } from 'lucide-react';

const ScheduleTaskItem = ({ task, onToggle, onChange, onDelete, theme }) => (
  <div className="flex items-center gap-2 group">
    <button
      onClick={() => onToggle(task.id)}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${task.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-current opacity-30 hover:opacity-60'}`}
    >
      {task.done && <CheckCircle2 size={12} />}
    </button>
    <input
      type="text"
      value={task.text}
      onChange={(e) => onChange(task.id, e.target.value)}
      className={`flex-1 bg-transparent border-none outline-none text-sm transition-all ${task.done ? 'line-through opacity-40' : ''} ${theme.text}`}
      placeholder="Вазифа..."
    />
    <button
      onClick={() => onDelete(task.id)}
      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 transition-all rounded-lg"
    >
      <Trash2 size={14} />
    </button>
  </div>
);

const TomorrowPlansModal = ({ data, updateTomorrowPlan, updateData, theme, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
        className={`relative w-full max-w-md rounded-t-3xl px-5 pt-5 pb-10 ${bgColor} border-t ${borderColor} shadow-2xl animate-in slide-in-from-bottom duration-300`}
        style={{ zIndex: 1 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-current opacity-20 mx-auto mb-6"/>

        <div className="flex items-center justify-between mb-6">
          <h3 className={`font-black text-xl flex items-center ${theme.text}`}>
            <ListTodo size={20} className="mr-2 text-indigo-500"/> Эртанги режа
          </h3>
          <button
            onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition ${theme.input}`}
          >
            <X size={20}/>
          </button>
        </div>

        <div style={{ maxHeight: '65vh', overflowY: 'auto' }} className="space-y-6 pr-1 custom-scrollbar">
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">5 муҳим вазифа</label>
             {[0, 1, 2, 3, 4].map((idx) => (
               <div key={idx} className="flex items-center gap-3">
                 <span className={`text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border ${theme.input} opacity-40`}>{idx + 1}</span>
                 <input
                   type="text"
                   value={(data.tomorrowPlans && data.tomorrowPlans[idx]) || ""}
                   onChange={(e) => updateTomorrowPlan(idx, e.target.value)}
                   className={`flex-1 rounded-2xl p-3 text-sm outline-none border transition-all ${theme.input} focus:border-indigo-500`}
                   placeholder="Муҳим иш номи..."
                 />
               </div>
             ))}
          </div>

          <CoveyMatrixWidget
            tasks={data.tomorrowPlans || []}
            coveyMatrix={data.coveyMatrix}
            onChange={(newMatrix) => updateData('planning', { ...data, coveyMatrix: newMatrix })}
            theme={theme}
          />

          <button
            onPointerDown={onClose}
            className={`w-full py-4 rounded-2xl font-black text-sm transition shadow-lg shadow-indigo-500/20 ${theme.button}`}
          >
            ✓ Сақлаш ва Ёпиш
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const CoveyMatrixWidget = ({ tasks, coveyMatrix, onChange, theme }) => {
  const quadrants = [
    { id: 'Q1', label: 'Q1: Муҳим + Шошилинч', color: 'bg-red-500/10 text-red-500', border: 'border-red-500/20', chip: 'bg-red-500 text-white' },
    { id: 'Q2', label: 'Q2: Муҳим + Шош. эмас', color: 'bg-emerald-500/10 text-emerald-500', border: 'border-emerald-500/20', chip: 'bg-emerald-500 text-white' },
    { id: 'Q3', label: 'Q3: Шошилинч (Бекорчи)', color: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/20', chip: 'bg-amber-500 text-white' },
    { id: 'Q4', label: 'Q4: Муҳим эмас (Вақт ўғриси)', color: 'bg-slate-500/10 text-slate-500', border: 'border-slate-500/20', chip: 'bg-slate-500 text-white' },
  ];

  const toggleTask = (qId, taskIdx) => {
    const newMatrix = { ...(coveyMatrix || { Q1: [], Q2: [], Q3: [], Q4: [] }) };
    // Remove from all quadrants first (a task belongs to one)
    Object.keys(newMatrix).forEach(k => {
      if (!k.endsWith('_custom')) {
        newMatrix[k] = (newMatrix[k] || []).filter(idx => idx !== taskIdx);
      }
    });
    // Add to selected
    if (!coveyMatrix?.[qId]?.includes(taskIdx)) {
      newMatrix[qId] = [...(newMatrix[qId] || []), taskIdx];
    }
    onChange(newMatrix);
  };

  const addCustomTask = (qId, text) => {
    if (!text.trim()) return;
    const key = `${qId}_custom`;
    const newMatrix = { ...(coveyMatrix || { Q1: [], Q2: [], Q3: [], Q4: [] }) };
    newMatrix[key] = [...(newMatrix[key] || []), text.trim()];
    onChange(newMatrix);
  };

  const removeCustomTask = (qId, textIdx) => {
    const key = `${qId}_custom`;
    const newMatrix = { ...(coveyMatrix || { Q1: [], Q2: [], Q3: [], Q4: [] }) };
    newMatrix[key] = newMatrix[key].filter((_, idx) => idx !== textIdx);
    onChange(newMatrix);
  };

  const activeTasks = tasks.filter(t => t && t.trim().length > 0);

  return (
    <div className="mt-4">
      <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 flex items-center">
        <LayoutGrid size={12} className="mr-1"/> Covey Time Matrix (Вазифаларни тақсимланг)
      </div>
      <div className="grid grid-cols-2 gap-2">
        {quadrants.map(q => (
          <div key={q.id} className={`p-2 rounded-xl border ${q.border} ${q.color} min-h-[100px] flex flex-col`}>
            <div className="text-[8px] font-black uppercase mb-2 border-b border-current/10 pb-1">{q.label}</div>
            <div className="space-y-1 mb-2 flex-1">
              {tasks.map((t, idx) => t.trim() && (
                <button
                  key={idx}
                  onClick={() => toggleTask(q.id, idx)}
                  className={`w-full text-left text-[9px] p-1 rounded transition-all leading-tight ${coveyMatrix?.[q.id]?.includes(idx) ? 'bg-current text-white font-bold shadow-sm' : 'opacity-30 hover:opacity-50'}`}
                >
                  {t.substring(0, 25)}{t.length > 25 ? '...' : ''}
                </button>
              ))}

              {/* Custom entries */}
              {(coveyMatrix?.[`${q.id}_custom`] || []).map((ct, cidx) => (
                <div key={cidx} className={`flex items-center justify-between gap-1 p-1 rounded ${q.chip} text-[8px] font-bold`}>
                   <span className="truncate">{ct}</span>
                   <button onPointerDown={() => removeCustomTask(q.id, cidx)} className="hover:scale-110 transition-transform">
                     <X size={8}/>
                   </button>
                </div>
              ))}
            </div>

            <input
              type="text"
              placeholder="+"
              className="w-full bg-current/5 border-none outline-none text-[9px] p-1 rounded placeholder:text-current/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCustomTask(q.id, e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>
        ))}
      </div>
      {coveyMatrix?.Q2?.length === 0 && activeTasks.length > 0 && (
        <p className="text-[9px] text-emerald-600 font-bold mt-2 animate-pulse">
          ⚠️ Q2 да ҳеч нарса йўқ! Нейрохирурглар айнан Q2 да етишади.
        </p>
      )}
    </div>
  );
};

export default function DayPlan({ data, updateData, theme }) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTomorrowModal, setShowTomorrowModal] = useState(false);

  // --- SCHEDULE TASKS LOGIC ---
  const scheduleTasks = data.scheduleTasks || (data.schedule ? data.schedule.split('\n').filter(l => l.trim()).map((line, i) => {
    const done = line.startsWith('[x]');
    const text = line.replace(/^\[[ x]\]\s*/, '');
    return { id: `task-${i}-${Date.now()}`, text, done };
  }) : []);

  const updateSchedule = (newTasks) => {
    const serialized = newTasks.map(t => `[${t.done ? 'x' : ' '}] ${t.text}`).join('\n');
    updateData('planning', { ...data, scheduleTasks: newTasks, schedule: serialized });
  };

  const addTask = () => {
    const newTasks = [...scheduleTasks, { id: Date.now().toString(), text: '', done: false }];
    updateSchedule(newTasks);
  };

  const toggleTask = (id) => {
    const newTasks = scheduleTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    updateSchedule(newTasks);
  };

  const changeTask = (id, text) => {
    const newTasks = scheduleTasks.map(t => t.id === id ? { ...t, text } : t);
    updateSchedule(newTasks);
  };

  const deleteTask = (id) => {
    const newTasks = scheduleTasks.filter(t => t.id !== id);
    updateSchedule(newTasks);
  };

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

       {/* Identity Statement */}
       <div className="mb-6">
         <label className={`text-[10px] font-black uppercase tracking-widest opacity-40 block mb-2 ml-1`}>
           Core Identity Statement (Napoleon Hill & Atomic Habits)
         </label>
         <div className="relative">
            <input
              value={data.identityStatement || ""}
              onChange={(e) => updateData('planning', { ...data, identityStatement: e.target.value })}
              className={`w-full rounded-xl p-3 pl-10 text-sm outline-none border transition-all duration-300 font-bold ${data.identityStatement ? 'border-indigo-500/50 bg-indigo-500/5 text-indigo-600' : theme.input}`}
              placeholder="Бугун мен... (Масалан: Бугун мен интизомли нейрохирургман)"
            />
            <Star size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${data.identityStatement ? 'text-indigo-500' : 'opacity-20'}`} />
         </div>
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
       <div className="mb-6">
         <div className="space-y-3 mb-4">
           {scheduleTasks.length > 0 ? scheduleTasks.map(task => (
             <ScheduleTaskItem
               key={task.id}
               task={task}
               onToggle={toggleTask}
               onChange={changeTask}
               onDelete={deleteTask}
               theme={theme}
             />
           )) : (
             <p className="text-[10px] opacity-30 italic text-center py-4 border-2 border-dashed rounded-2xl border-current/10">Рўйхат бўш. Янги вазифа қўшинг.</p>
           )}
         </div>
         <button
           onClick={addTask}
           className={`w-full py-3 rounded-xl border-2 border-dashed border-current opacity-20 hover:opacity-100 hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${theme.text}`}
         >
           <Plus size={14}/> Вазифа қўшиш
         </button>
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
         <button
            onClick={() => setShowTomorrowModal(true)}
            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${theme.input} group hover:border-indigo-500/50`}
         >
            <div className="flex items-center">
              <div className={`p-2 rounded-xl bg-indigo-500/10 text-indigo-500 mr-3 group-hover:bg-indigo-500 group-hover:text-white transition-colors`}>
                <ListTodo size={18}/>
              </div>
              <div className="text-left">
                <span className={`block font-bold text-sm ${theme.text}`}>Эртанги 5 муҳим вазифа</span>
                <span className="text-[10px] opacity-40 uppercase tracking-wider font-black">Режа қилиш ва тақсимлаш</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
               {data.tomorrowPlans?.filter(p => p.trim()).length > 0 && (
                 <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                   {data.tomorrowPlans.filter(p => p.trim()).length}
                 </span>
               )}
               <ChevronRight size={18} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
            </div>
         </button>

         {showTomorrowModal && (
           <TomorrowPlansModal
             data={data}
             updateTomorrowPlan={updateTomorrowPlan}
             updateData={updateData}
             theme={theme}
             onClose={() => setShowTomorrowModal(false)}
           />
         )}
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
