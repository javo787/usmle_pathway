'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Target, CheckCircle2, Lock, ArrowRight, Clock,
  AlertTriangle, Loader, Shield, SkipForward, RefreshCw,
  ChevronDown,
} from 'lucide-react';

const MIN_TASK_LENGTH = 15;
const REQUIRED_TASKS  = 3;
const AI_TIMEOUT_MS   = 20_000; // 20s — abort if AI hangs
const MAX_AI_RETRIES  = 2;       // after this many rejections user can force-unlock

// ─── helpers ────────────────────────────────────────────────────────────────

function validCount(tasks) {
  return tasks.filter(t => t.trim().length >= MIN_TASK_LENGTH).length;
}

function isWeakTask(task, weakList = []) {
  if (!weakList.length) return false;
  return weakList.some(w => {
    const rx = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return rx.test(task);
  });
}

// ─── component ──────────────────────────────────────────────────────────────

export default function DailyFocusLock({ onUnlock }) {
  const [tasks,     setTasks]     = useState(['', '', '', '', '']);
  const [startTime, setStartTime] = useState('');
  const [showWarn,  setShowWarn]  = useState(false);

  // AI state
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiResult,   setAiResult]   = useState(null);   // { approved, critique, islamic_note, weak_tasks }
  const [aiError,    setAiError]    = useState('');
  const [aiAttempts, setAiAttempts] = useState(0);      // how many times AI rejected

  const abortRef = useRef(null);
  const bottomRef = useRef(null); // scroll-to-bottom anchor

  // cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // auto-scroll to AI result so user sees feedback without manual scrolling
  useEffect(() => {
    if ((aiResult || aiError) && bottomRef.current) {
      setTimeout(() => bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }, [aiResult, aiError]);

  // ── derived ──────────────────────────────────────────────────────────────
  const valid     = validCount(tasks);
  const hasTime   = startTime.trim().length >= 4;
  const canSubmit = valid >= REQUIRED_TASKS && hasTime && !aiLoading;
  const remaining = Math.max(0, REQUIRED_TASKS - valid);
  // After MAX_AI_RETRIES rejections the user may force-unlock (escape hatch)
  const canForce  = aiAttempts >= MAX_AI_RETRIES;

  // ── task change ──────────────────────────────────────────────────────────
  const handleTask = useCallback((i, v) => {
    setTasks(prev => { const n = [...prev]; n[i] = v; return n; });
    setAiResult(null);
    setAiError('');
    setShowWarn(false);
  }, []);

  // ── force unlock (no AI) ─────────────────────────────────────────────────
  const handleForceUnlock = useCallback(() => {
    const formatted = tasks
      .filter(t => t.trim().length >= MIN_TASK_LENGTH)
      .map(t => `[${startTime || '??:??'}] ${t}`);
    onUnlock(formatted);
  }, [tasks, startTime, onUnlock]);

  // ── AI check + unlock ────────────────────────────────────────────────────
  const handleCheck = useCallback(async () => {
    if (!canSubmit) { setShowWarn(true); return; }
    setShowWarn(false);
    setAiResult(null);
    setAiError('');
    setAiLoading(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // race: fetch vs timeout
    const fetchPromise = fetch('/api/ai-coach', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'validate_plan',
        data: { tasks: tasks.filter(t => t.trim().length > 0) },
      }),
      signal: ctrl.signal,
    });

    const timeoutId = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);

    try {
      const res  = await fetchPromise;
      clearTimeout(timeoutId);

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || `Сервер: ${res.status}`);

      let result = json;
      if (typeof json.result === 'string') {
        try { result = JSON.parse(json.result); }
        catch { throw new Error('AI жавоби нотўғри форматда'); }
      }

      if (result.approved) {
        // ✅ approved — unlock immediately
        const formatted = tasks
          .filter(t => t.trim().length >= MIN_TASK_LENGTH)
          .map(t => `[${startTime}] ${t}`);
        setAiLoading(false);
        abortRef.current = null;
        onUnlock(formatted);
        return;
      }

      // ❌ rejected
      setAiAttempts(prev => prev + 1);
      setAiResult(result);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        // timeout or manual abort
        setAiError('AI жавоб бермади (20 сония). Вазифаларни яхшилаб қайта уриниб кўринг ёки "Мажбурий очиш" тугмасини босинг.');
        setAiAttempts(prev => prev + 1);
      } else {
        setAiError('AI текширувда хатолик: ' + (err.message || 'Номаълум хато'));
        setAiAttempts(prev => prev + 1);
      }
    } finally {
      if (abortRef.current === ctrl) {
        setAiLoading(false);
        abortRef.current = null;
      }
    }
  }, [canSubmit, tasks, startTime, onUnlock]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(135deg,#1e293b 0%,#0f172a 50%,#1a2744 100%)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Кунлик режа қулфи"
    >
      {/* decorative glows — pointer-events none so they don't block scroll */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle,#10b981,transparent)' }}/>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle,#6366f1,transparent)' }}/>
      </div>

      {/* scrollable card wrapper */}
      <div className="relative z-10 min-h-screen flex items-start justify-center p-4 py-8">
        <div
          className="w-full max-w-md"
          style={{
            background:   'rgba(30,41,59,0.9)',
            backdropFilter: 'blur(20px)',
            border:        '1px solid rgba(148,163,184,0.15)',
            borderRadius:  '24px',
            boxShadow:     '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* rainbow top bar */}
          <div className="h-1 rounded-t-3xl"
            style={{ background: 'linear-gradient(90deg,#10b981,#6366f1,#f59e0b)' }}/>

          <div className="p-6 space-y-5">

            {/* ── HEADER ── */}
            <header className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)' }}>
                <Lock size={28} className="text-red-400"/>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">🔒 Кун Блок</h2>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed max-w-xs">
                Бугун ишлашни бошлашдан олдин — режа тузинг.{' '}
                <span className="text-red-400 font-bold">Камида {REQUIRED_TASKS} та вазифа</span>,{' '}
                ҳар бири камида{' '}
                <span className="text-yellow-400 font-bold">{MIN_TASK_LENGTH} та ҳарф</span>.
                Умумий сўзлар (<span className="text-red-400">"ўқиш"</span>) қабул қилинмайди.
              </p>
            </header>

            {/* ── TIME INPUT ── */}
            <div>
              <label htmlFor="start-time"
                className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                <Clock size={12}/> Бугун қачондан бошлайсиз?
              </label>
              <input
                id="start-time"
                type="time"
                className="w-full rounded-xl py-3 px-4 text-lg font-bold outline-none transition-all"
                style={{
                  background: 'rgba(15,23,42,.6)',
                  border: hasTime
                    ? '1px solid rgba(16,185,129,.6)'
                    : '1px solid rgba(100,116,139,.3)',
                  color: hasTime ? '#6ee7b7' : 'white',
                }}
                value={startTime}
                onChange={e => { setStartTime(e.target.value); setAiResult(null); setAiError(''); }}
                aria-required="true"
              />
            </div>

            {/* ── TASKS ── */}
            <fieldset className="space-y-2">
              <legend className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mb-1">
                <Target size={12}/> Бугунги аниқ вазифалар
              </legend>

              {tasks.map((task, i) => {
                const isValid   = task.trim().length >= MIN_TASK_LENGTH;
                const isReq     = i < REQUIRED_TASKS;
                const weak      = isValid && isWeakTask(task, aiResult?.weak_tasks);
                const tooShort  = task.trim().length > 0 && !isValid;
                const inputId   = `task-${i}`;

                return (
                  <div key={inputId} className="relative">
                    <label htmlFor={inputId} className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {weak      ? <AlertTriangle size={14} className="text-orange-400"/> :
                       isValid   ? <CheckCircle2  size={14} className="text-emerald-400"/> :
                       <span className={`text-xs font-black w-4 text-center ${isReq ? 'text-red-400' : 'text-slate-600'}`}>{i + 1}</span>}
                    </label>

                    <input
                      id={inputId}
                      type="text"
                      placeholder={
                        i === 0 ? 'Немецкий: Nicos Weg — 2 бўлим ёзма'   :
                        i === 1 ? 'Anki: 50 та карточка такрорлаш'         :
                        i === 2 ? 'Патфизиология: 15 бет ўқиб конспект'   :
                        i === 3 ? '4. Ихтиёрий вазифа...'                  :
                                  '5. Ихтиёрий вазифа...'
                      }
                      className="w-full rounded-xl py-3 pl-8 pr-14 text-white text-sm outline-none transition-all duration-200"
                      style={{
                        background: weak      ? 'rgba(234,88,12,.08)'   :
                                    isValid   ? 'rgba(16,185,129,.08)'  :
                                    isReq     ? 'rgba(239,68,68,.08)'   :
                                                'rgba(30,41,59,.5)',
                        border: weak      ? '1px solid rgba(234,88,12,.5)'    :
                                isValid   ? '1px solid rgba(16,185,129,.4)'   :
                                isReq     ? '1px solid rgba(239,68,68,.3)'    :
                                            '1px solid rgba(100,116,139,.2)',
                      }}
                      value={task}
                      onChange={e => handleTask(i, e.target.value)}
                      aria-required={isReq}
                    />

                    {tooShort && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-orange-400 font-bold pointer-events-none">
                        {MIN_TASK_LENGTH - task.trim().length} ҳарф кам
                      </span>
                    )}
                  </div>
                );
              })}
            </fieldset>

            {/* ── PROGRESS BAR ── */}
            <div aria-live="polite">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Тайёрлик</span>
                <span className={valid >= REQUIRED_TASKS ? 'text-emerald-400 font-bold' : 'text-orange-400'}>
                  {valid}/{REQUIRED_TASKS} вазифа ✓
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background:'rgba(15,23,42,.6)' }}
                role="progressbar" aria-valuenow={valid} aria-valuemin={0} aria-valuemax={REQUIRED_TASKS}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100,(valid/REQUIRED_TASKS)*100)}%`,
                    background: valid >= REQUIRED_TASKS
                      ? 'linear-gradient(90deg,#10b981,#34d399)'
                      : 'linear-gradient(90deg,#f59e0b,#fbbf24)',
                  }}/>
              </div>
            </div>

            {/* ── WARNING ── */}
            {showWarn && !aiResult && (
              <div className="rounded-xl p-3 flex items-start gap-2 text-xs text-red-300"
                style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)' }}
                role="alert">
                <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0"/>
                <div className="space-y-0.5">
                  {!hasTime && <div>⏰ Бошланиш вақтини киритинг!</div>}
                  {remaining > 0 && <div>📝 Яна {remaining} та аниқ вазифа ёзинг ({MIN_TASK_LENGTH}+ ҳарф)</div>}
                </div>
              </div>
            )}

            {/* ── AI RESULT ── */}
            {aiResult && (
              <div className="rounded-2xl p-4 space-y-3"
                style={{
                  background: aiResult.approved ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)',
                  border: `1px solid ${aiResult.approved ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`,
                }}
                role="alert">

                <div className="flex items-center gap-2">
                  {aiResult.approved
                    ? <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0"/>
                    : <AlertTriangle size={16} className="text-red-400 flex-shrink-0"/>}
                  <span className={`text-sm font-black ${aiResult.approved ? 'text-emerald-400' : 'text-red-400'}`}>
                    {aiResult.approved ? 'Режа тасдиқланди ✓' : 'Режа рад этилди — юқорига чиқиб ўзгартиринг'}
                  </span>
                </div>

                {aiResult.critique && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Баҳо</p>
                    <p className="text-xs text-slate-200 leading-relaxed">{aiResult.critique}</p>
                  </div>
                )}

                {aiResult.islamic_note && (
                  <div className="rounded-xl p-3"
                    style={{ background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)' }}>
                    <div className="flex items-start gap-2">
                      <Shield size={12} className="text-indigo-400 mt-0.5 flex-shrink-0"/>
                      <p className="text-xs text-indigo-200 leading-relaxed">{aiResult.islamic_note}</p>
                    </div>
                  </div>
                )}

                {aiResult.weak_tasks?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Суст вазифалар</p>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.weak_tasks.map((w, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background:'rgba(234,88,12,.15)', color:'#fb923c', border:'1px solid rgba(234,88,12,.3)' }}>
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* scroll hint — reminds user they can scroll up to edit */}
                {!aiResult.approved && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] pt-1">
                    <ChevronDown size={11} className="rotate-180 opacity-60"/>
                    <span>Юқорига айланиб, вазифаларни тўғрилаш мумкин</span>
                  </div>
                )}
              </div>
            )}

            {/* ── AI ERROR ── */}
            {aiError && (
              <div className="rounded-xl p-3 text-xs text-red-300"
                style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)' }}
                role="alert">
                ⚠️ {aiError}
              </div>
            )}

            {/* scroll-to anchor so we can auto-scroll to feedback */}
            <div ref={bottomRef}/>

            {/* ── PRIMARY BUTTON ── */}
            <button
              onClick={handleCheck}
              disabled={!canSubmit || aiLoading}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 group"
              style={{
                background: !canSubmit
                  ? 'rgba(15,23,42,.6)'
                  : aiResult && !aiResult.approved
                    ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                    : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color:      !canSubmit ? '#64748b' : '#fff',
                boxShadow:  canSubmit ? '0 4px 24px rgba(99,102,241,.4)' : 'none',
                cursor:     (!canSubmit || aiLoading) ? 'not-allowed' : 'pointer',
              }}
              aria-busy={aiLoading}
            >
              {aiLoading ? (
                <><Loader size={18} className="animate-spin"/> AI текширмоқда...</>
              ) : aiResult && !aiResult.approved ? (
                <><RefreshCw size={16}/> Яхшилаб қайта текшир</>
              ) : (
                <>Бисмиллаҳ, бошладик <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/></>
              )}
            </button>

            {/* ── ESCAPE HATCH: force unlock after N rejections ── */}
            {canForce && (
              <div className="space-y-2">
                <div className="text-center text-[10px] text-slate-500 flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-700"/>
                  {aiAttempts >= MAX_AI_RETRIES ? `${aiAttempts} марта рад этилди` : 'ёки'}
                  <div className="flex-1 h-px bg-slate-700"/>
                </div>
                <button
                  onClick={handleForceUnlock}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'rgba(239,68,68,.08)',
                    border: '1px solid rgba(239,68,68,.3)',
                    color: '#f87171',
                  }}
                >
                  <SkipForward size={15}/>
                  Мажбурий очиш (AI'сиз)
                </button>
                <p className="text-center text-[9px] text-slate-600 leading-relaxed">
                  AI'сиз очсангиз — 50 сомони автоматик жарима! Фақат техник муаммода ишлатинг.
                </p>
              </div>
            )}

            <p className="text-center text-[10px] text-slate-500">
              Режасиз кун = автоматик жарима 50 сомони
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
