'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Target, CheckCircle2, Lock, ArrowRight, Clock, AlertTriangle, Loader, Shield } from 'lucide-react';

const MIN_TASK_LENGTH = 15;
const REQUIRED_TASKS = 3;

/**
 * DailyFocusLock – кунлик вазифаларни AI ёрдамида тасдиқловчи компонент.
 *
 * @param {object}   props
 * @param {function} props.onUnlock - тасдиқланган вазифалар рўйхати билан чақирилади.
 */
export default function DailyFocusLock({ onUnlock }) {
  const [tasks, setTasks] = useState(['', '', '', '', '']);
  const [startTime, setStartTime] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  // AI текширув ҳолати
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { approved, critique, islamic_note, weak_tasks }
  const [aiError, setAiError] = useState('');

  // Сўровларни бошқариш учун AbortController
  const abortControllerRef = useRef(null);

  // ── Ёрдамчи ҳисоб-китоблар ──────────────────────────────
  const validTasks = tasks.filter(t => t.trim().length >= MIN_TASK_LENGTH);
  const validTasksCount = validTasks.length;
  const hasTime = startTime.trim().length >= 4;
  const canCheck = validTasksCount >= REQUIRED_TASKS && hasTime && !aiLoading;

  const remaining = Math.max(0, REQUIRED_TASKS - validTasksCount);

  // ── “Суст” вазифани текшириш (сўз чегараси билан) ──────
  const isWeakTask = useCallback(
    (task) => {
      if (!aiResult?.weak_tasks?.length) return false;
      // Ҳар бир weak сўзни \b билан текширамиз
      return aiResult.weak_tasks.some(w => {
        const regex = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(task);
      });
    },
    [aiResult]
  );

  // ── AI текширув ва бошлаш ──────────────────────────────
  const handleUnlock = async () => {
    if (!canCheck) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    setAiLoading(true);
    setAiResult(null);
    setAiError('');

    // Эски сўровни бекор қилиш
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const filledTasks = tasks.filter(t => t.trim().length > 0);
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'validate_plan',
          data: { tasks: filledTasks },
        }),
        signal: controller.signal,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `Сервер хатоси: ${res.status}`);
      }

      // API жавобини парс қилиш: { approved, critique, islamic_note, weak_tasks }
      let result = json;
      if (typeof json.result === 'string') {
        try {
          result = JSON.parse(json.result);
        } catch {
          throw new Error('AI натижа формати нотўғри');
        }
      }

      // Агар маъқулланган бўлса – дарров очиш
      if (result.approved) {
        const formattedTasks = tasks
          .filter(t => t.trim().length >= MIN_TASK_LENGTH)
          .map(t => `[${startTime}] ${t}`);
        onUnlock(formattedTasks);
        return;
      }

      // Акс ҳолда танқидни кўрсатиш
      setAiResult(result);
    } catch (err) {
      if (err.name === 'AbortError') return; // бекор қилинди
      setAiError('AI текширувда хатолик: ' + (err.message || 'Номаълум хато'));
    } finally {
      setAiLoading(false);
      abortControllerRef.current = null;
    }
  };

  // ── Инпут ўзгарганда AI натижани тозалаш ──────────────
  const handleTaskChange = (index, value) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
    setShowWarning(false);
    setAiResult(null);
    setAiError('');
  };

  const handleTimeChange = (e) => {
    setStartTime(e.target.value);
    setShowWarning(false);
    setAiResult(null);
    setAiError('');
  };

  // ── Рендер ─────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 overflow-y-auto fixed inset-0 z-50"
      style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1a2744 100%)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Кунлик режа қулфи"
    >
      {/* Фон нур эффекти */}
      <div
        className="absolute w-96 h-96 rounded-full blur-[120px] top-10 left-10 opacity-20"
        style={{ background: 'radial-gradient(circle, #10b981, transparent)' }}
        aria-hidden="true"
      />
      <div
        className="absolute w-96 h-96 rounded-full blur-[120px] bottom-10 right-10 opacity-15"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-md my-4"
        style={{
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }}
      >
        {/* Юқори чизиқ */}
        <div
          className="h-1 w-full rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, #10b981, #6366f1, #f59e0b)' }}
          aria-hidden="true"
        />

        <div className="p-6">
          {/* САРЛАВҲА */}
          <header className="flex flex-col items-center text-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <Lock size={28} className="text-red-400" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">🔒 Кун Блок</h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Бугун ишлашни бошлашдан олдин — режа тузинг.{' '}
              <span className="text-red-400 font-bold">Камида {REQUIRED_TASKS} та вазифа</span>,{' '}
              ҳар бири камида{' '}
              <span className="text-yellow-400 font-bold">{MIN_TASK_LENGTH} та ҳарф</span>.
              Умумий сўзлар (<span className="text-red-400">"ўқиш"</span>) қабул қилинмайди.
            </p>
          </header>

          {/* БОШЛАНИШ ВАҚТИ */}
          <div className="mb-4">
            <label
              htmlFor="start-time"
              className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1"
            >
              <Clock size={12} aria-hidden="true" /> Бугун қачондан бошлайсиз?
            </label>
            <input
              id="start-time"
              type="time"
              className={`w-full rounded-xl py-3 px-4 text-lg font-bold outline-none transition-all ${
                hasTime ? 'text-emerald-300' : 'text-white'
              }`}
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: hasTime
                  ? '1px solid rgba(16,185,129,0.6)'
                  : '1px solid rgba(100,116,139,0.3)',
              }}
              value={startTime}
              onChange={handleTimeChange}
              aria-required="true"
              aria-invalid={!hasTime}
              aria-describedby="time-error"
            />
          </div>

          {/* ВАЗИФАЛАР */}
          <fieldset className="space-y-2.5 mb-5">
            <legend className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Target size={12} aria-hidden="true" /> Бугунги аниқ вазифалар
            </legend>
            {tasks.map((task, index) => {
              const isValid = task.trim().length >= MIN_TASK_LENGTH;
              const isRequired = index < REQUIRED_TASKS;
              const isWeak = isValid && isWeakTask(task);

              const inputId = `task-${index}`;
              return (
                <div key={inputId} className="relative group">
                  <label htmlFor={inputId} className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isWeak ? (
                      <AlertTriangle size={15} className="text-orange-400" aria-label="Суст вазифа" />
                    ) : isValid ? (
                      <CheckCircle2 size={15} className="text-emerald-400" aria-label="Тўғри вазифа" />
                    ) : (
                      <span
                        className={`text-xs font-black w-4 text-center ${
                          isRequired ? 'text-red-400' : 'text-slate-600'
                        }`}
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                    )}
                  </label>
                  <input
                    id={inputId}
                    type="text"
                    placeholder={
                      index === 0
                        ? "Немецкий: Nicos Weg — 2 бўлим ёзма"
                        : index === 1
                        ? "Anki: 50 та карточка такрорлаш"
                        : index === 2
                        ? "Патфизиология: 15 бет ўқиб конспект"
                        : index === 3
                        ? "4. Ихтиёрий вазифа..."
                        : "5. Ихтиёрий вазифа..."
                    }
                    className={`w-full rounded-xl py-3 pl-8 pr-16 text-white text-sm outline-none transition-all duration-300 ${
                      isWeak
                        ? 'bg-orange-900/10 border border-orange-500/50'
                        : isValid
                        ? 'bg-emerald-900/10 border border-emerald-500/40'
                        : isRequired
                        ? 'bg-red-900/10 border border-red-500/30'
                        : 'bg-slate-800/50 border border-slate-600/20'
                    }`}
                    value={task}
                    onChange={(e) => handleTaskChange(index, e.target.value)}
                    aria-required={isRequired}
                    aria-invalid={!isValid && isRequired}
                    aria-describedby={task.trim().length > 0 && task.trim().length < MIN_TASK_LENGTH ? `task-${index}-hint` : undefined}
                  />
                  {task.trim().length > 0 && task.trim().length < MIN_TASK_LENGTH && (
                    <div
                      id={`task-${index}-hint`}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-orange-400 font-bold"
                      role="alert"
                    >
                      {MIN_TASK_LENGTH - task.trim().length} ҳарф кам
                    </div>
                  )}
                </div>
              );
            })}
          </fieldset>

          {/* ПРОГРЕСС */}
          <div className="mb-4" aria-live="polite">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Тайёрлик</span>
              <span
                className={validTasksCount >= REQUIRED_TASKS ? 'text-emerald-400 font-bold' : 'text-orange-400'}
                aria-atomic="true"
              >
                {validTasksCount}/{REQUIRED_TASKS} вазифа ✓
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(15,23,42,0.6)' }}
              role="progressbar"
              aria-valuenow={validTasksCount}
              aria-valuemin={0}
              aria-valuemax={REQUIRED_TASKS}
              aria-label="Вазифалар тўлдирилганлик даражаси"
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (validTasksCount / REQUIRED_TASKS) * 100)}%`,
                  background:
                    validTasksCount >= REQUIRED_TASKS
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                }}
              />
            </div>
          </div>

          {/* AI НАТИЖА */}
          {aiResult && (
            <div
              className="mb-4 rounded-2xl p-4 space-y-3"
              style={{
                background: aiResult.approved
                  ? 'rgba(16,185,129,0.08)'
                  : 'rgba(239,68,68,0.08)',
                border: `1px solid ${
                  aiResult.approved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'
                }`,
              }}
              role="alert"
              aria-live="assertive"
            >
              {/* Статус */}
              <div className="flex items-center gap-2">
                {aiResult.approved ? (
                  <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                )}
                <span
                  className={`text-sm font-black ${
                    aiResult.approved ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {aiResult.approved ? 'Режа тасдиқланди ✓' : 'Режа рад этилди — қайта ёзинг'}
                </span>
              </div>

              {/* Танқид */}
              {aiResult.critique && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Баҳо
                  </p>
                  <p className="text-xs text-slate-200 leading-relaxed">{aiResult.critique}</p>
                </div>
              )}

              {/* Ислом эслатма */}
              {aiResult.islamic_note && (
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Shield size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <p className="text-xs text-indigo-200 leading-relaxed">{aiResult.islamic_note}</p>
                  </div>
                </div>
              )}

              {/* Суст вазифалар */}
              {aiResult.weak_tasks?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">
                    Суст/умумий вазифалар
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {aiResult.weak_tasks.map((w, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(234,88,12,0.15)',
                          color: '#fb923c',
                          border: '1px solid rgba(234,88,12,0.3)',
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI ХАТО */}
          {aiError && (
            <div
              className="mb-4 rounded-xl p-3 text-xs text-red-300"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
              role="alert"
            >
              ⚠️ {aiError}
            </div>
          )}

          {/* ОГОҲЛАНТИРИШ */}
          {showWarning && !aiResult && (
            <div
              className="mb-4 rounded-xl p-3 flex items-start gap-2"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
              role="alert"
            >
              <AlertTriangle size={15} className="text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="text-xs text-red-300">
                {!hasTime && <div>⏰ Бошланиш вақтини киритинг!</div>}
                {remaining > 0 && (
                  <div>
                    📝 Яна {remaining} та аниқ вазифа ёзинг (камида {MIN_TASK_LENGTH} ҳарф)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ЯГОНА ТУГМА */}
          <button
            onClick={handleUnlock}
            disabled={!canCheck || aiLoading}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-500 group ${
              !canCheck && !aiLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              background: canCheck
                ? aiResult?.approved
                  ? 'linear-gradient(135deg, #059669, #10b981)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(15,23,42,0.6)',
              color: canCheck ? '#fff' : '#64748b',
              boxShadow: canCheck ? '0 4px 24px rgba(16,185,129,0.4)' : 'none',
            }}
            aria-busy={aiLoading}
            aria-label={
              aiLoading
                ? 'AI текширмоқда, кутинг'
                : aiResult?.approved
                ? 'Режа тасдиқланди, бошлаш'
                : 'Режани текшириб, бошлаш'
            }
          >
            {aiLoading ? (
              <>
                <Loader size={18} className="animate-spin" aria-hidden="true" />
                AI текширмоқда...
              </>
            ) : aiResult && !aiResult.approved ? (
              <>
                <AlertTriangle size={18} aria-hidden="true" />
                Яхшилаб қайта ёзиб, уриниб кўринг
              </>
            ) : (
              <>
                Бисмиллаҳ, бошладик
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-500 mt-3">
            Режасиз кун = автоматик жарима 50 сомони
          </p>
        </div>
      </div>
    </div>
  );
}
