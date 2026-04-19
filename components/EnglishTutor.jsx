
'use client';
import React, { useState } from 'react';
import { Brain, BookOpen, MessageSquare, Languages, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';

// ============================================
// РЕЖИМЛАР
// ============================================
const MODES = [
  { id: 'analysis',  label: 'Кун таҳлили', icon: Brain,        desc: 'Бугун нима яхши/ёмон?' },
  { id: 'plan',      label: 'Режа',         icon: BookOpen,     desc: 'Эртанги режани текшир' },
  { id: 'chat',      label: 'Савол',        icon: MessageSquare,desc: 'Тезкор маслаҳат' },
  { id: 'language',  label: 'Тил машқи',   icon: Languages,    desc: 'EN / DE / AR' },
];

const LANGUAGES = [
  { id: 'english', label: 'English',  flag: '🇬🇧', prompt_lang: 'English' },
  { id: 'german',  label: 'Deutsch',  flag: '🇩🇪', prompt_lang: 'German'  },
  { id: 'arabic',  label: 'Арабча',   flag: '🇸🇦', prompt_lang: 'Arabic'  },
];

export default function EnglishTutor({ data, updateData, theme }) {
  const [mode, setMode] = useState('analysis');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [selectedLang, setSelectedLang] = useState('english');

  const accentColor = theme.icon.includes('red') ? 'bg-red-500' : theme.icon.includes('C49A') ? 'bg-amber-500' : 'bg-[#0D5C4C]';
  const accentText  = theme.icon.includes('red') ? 'text-red-500' : theme.icon.includes('C49A') ? 'text-amber-500' : 'text-[#0D5C4C]';
  const accentBorder = theme.icon.includes('red') ? 'border-red-500/40' : theme.icon.includes('C49A') ? 'border-amber-500/40' : 'border-[#0D5C4C]/40';

  const callAI = async () => {
    if (mode === 'language' && (!userInput || userInput.trim().length < 2)) {
      alert('Камида бир жумла ёзинг!');
      return;
    }
    if (mode === 'chat' && (!userInput || userInput.trim().length < 5)) {
      alert('Саволни ёзинг!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mode,
          data: {
            ...data,
            userInput,
            selectedLang,
          },
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setResult(json);
      if (mode !== 'language') {
        updateData('english', { ...data, practiced: true, aiFeedback: JSON.stringify(json) });
      } else {
        updateData('english', { ...data, practiced: true });
      }
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setUserInput(''); };

  return (
    <div className={`p-5 mb-4 relative overflow-hidden ${theme.card}`}>
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.04] bg-current"/>

      {/* Сарлавҳа */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold flex items-center gap-2 ${theme.cardTitle}`}>
          <Brain size={14} className={theme.icon}/> AI Мураббий
        </h3>
        {data.practiced && (
          <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${accentBorder} ${accentText}`}>
            ✓ Бугун ишлатилди
          </span>
        )}
      </div>

      {/* Режим танлаш */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setMode(id); setResult(null); }}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border transition-all duration-300 ${
              mode === id
                ? theme.button + ' border-transparent'
                : theme.input + ' opacity-50 hover:opacity-80'
            }`}
          >
            <Icon size={14}/>
            <span className="text-[7.5px] font-black leading-tight text-center">{label}</span>
          </button>
        ))}
      </div>

      {/* ===== КУН ТАҲЛИЛИ ===== */}
      {mode === 'analysis' && !result && (
        <div className={`rounded-2xl p-4 border mb-3 ${theme.input}`}>
          <p className="text-xs opacity-50 mb-3">AI бугунги маълумотларингизни таҳлил қилади:</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between opacity-60">
              <span>📚 UWorld</span><span className="font-black">{data?.academic?.uWorldDone || 0} та</span>
            </div>
            <div className="flex justify-between opacity-60">
              <span>🕌 Намоз</span><span className="font-black">{data?.spiritual?.prayersDone || 0}/5</span>
            </div>
            <div className="flex justify-between opacity-60">
              <span>🏃 Спорт</span><span className="font-black">{data?.sport?.didSport ? '✓' : '—'}</span>
            </div>
          </div>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder="Бугун ўзингиз ҳақингизда нимадир қўшинг (ихтиёрий)..."
            className={`w-full mt-3 rounded-xl px-3 py-2 text-xs outline-none resize-none h-16 border ${theme.input}`}
          />
        </div>
      )}

      {/* ===== РЕЖА ТЕКШИРУВИ ===== */}
      {mode === 'plan' && !result && (
        <div className={`rounded-2xl p-4 border mb-3 ${theme.input}`}>
          <p className="text-xs opacity-50 mb-2">Эртанги режангиз:</p>
          {(data?.tomorrowPlans || []).filter(t => t?.trim()).length > 0 ? (
            <div className="space-y-1 mb-3">
              {(data.tomorrowPlans || []).filter(t => t?.trim()).map((t, i) => (
                <div key={i} className="text-xs opacity-70 flex items-start gap-1.5">
                  <span className={`font-black ${accentText}`}>{i + 1}.</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs opacity-40 italic mb-3">Ҳали режа тузилмаган...</p>
          )}
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder="Қўшимча режа ёки мақсад ёзинг..."
            className={`w-full rounded-xl px-3 py-2 text-xs outline-none resize-none h-16 border ${theme.input}`}
          />
        </div>
      )}

      {/* ===== ЭРКИН САВОЛ ===== */}
      {mode === 'chat' && !result && (
        <textarea
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder="Масалан: Бугун кардиология қийин бўлди, нимадан бошлайин?..."
          className={`w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none h-24 border mb-3 ${theme.input}`}
        />
      )}

      {/* ===== ТИЛ МАШҚИ ===== */}
      {mode === 'language' && !result && (
        <div className="mb-3">
          {/* Тил танлаш */}
          <div className="flex gap-2 mb-3">
            {LANGUAGES.map(({ id, label, flag }) => (
              <button
                key={id}
                onClick={() => setSelectedLang(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                  selectedLang === id
                    ? theme.button + ' border-transparent'
                    : theme.input + ' opacity-50'
                }`}
              >
                <span>{flag}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Топшириқ */}
          <div className={`rounded-2xl p-3 border mb-3 ${theme.input}`}>
            <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mb-1">Бугунги топшириқ</p>
            <p className="text-xs opacity-70">
              {selectedLang === 'english' && '🇬🇧 Бугун нима ўргандингиз — инглизча ёзинг (1-2 жумла)'}
              {selectedLang === 'german'  && '🇩🇪 Бугунги кунингизни немисча тасвирланг (1-2 жумла)'}
              {selectedLang === 'arabic'  && '🇸🇦 Бугун нима қилдингиз — арабча ёзинг (1-2 жумла)'}
            </p>
          </div>

          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder={
              selectedLang === 'english' ? 'Today I studied cardiology...'
              : selectedLang === 'german' ? 'Heute habe ich gelernt...'
              : 'اليوم تعلمت...'
            }
            className={`w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none h-24 border ${theme.input} ${selectedLang === 'arabic' ? 'text-right' : ''}`}
            dir={selectedLang === 'arabic' ? 'rtl' : 'ltr'}
          />
        </div>
      )}

      {/* ===== НАТИЖА ===== */}
      {result && !result.error && (
        <div className={`rounded-2xl p-4 border mb-3 ${theme.input}`}>

          {/* Кун таҳлили натижаси */}
          {mode === 'analysis' && (
            <div className="space-y-3">
              {result.score !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-50">Кун баҳоси</span>
                  <span className={`text-lg font-black ${accentText}`}>{result.score}/10</span>
                </div>
              )}
              {result.good && (
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">✓ Яхши</p>
                  <p className="text-xs opacity-80">{result.good}</p>
                </div>
              )}
              {result.bad && (
                <div>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">✗ Яхшиланади</p>
                  <p className="text-xs opacity-80">{result.bad}</p>
                </div>
              )}
              {result.tomorrow && (
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${accentText}`}>→ Эртага</p>
                  <p className="text-xs opacity-80">{result.tomorrow}</p>
                </div>
              )}
            </div>
          )}

          {/* Режа натижаси */}
          {mode === 'plan' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-50">Режа баҳоси</span>
                <span className={`text-lg font-black ${accentText}`}>{result.rating}</span>
              </div>
              {result.critique && <p className="text-xs opacity-80">{result.critique}</p>}
              {result.suggestion && (
                <div className={`flex items-start gap-2 p-2.5 rounded-xl border ${accentBorder}`}>
                  <ChevronRight size={12} className={`${accentText} mt-0.5 flex-shrink-0`}/>
                  <p className="text-xs opacity-90">{result.suggestion}</p>
                </div>
              )}
            </div>
          )}

          {/* Савол натижаси */}
          {mode === 'chat' && (
            <p className="text-sm opacity-90 leading-relaxed">{result.text || result.answer}</p>
          )}

          {/* Тил машқи натижаси */}
          {mode === 'language' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-50">Daraja / Level</span>
                <span className={`text-sm font-black px-2 py-0.5 rounded-lg border ${accentBorder} ${accentText}`}>
                  {result.level}
                </span>
              </div>
              {result.corrected && (
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">✓ Тўғри вариант</p>
                  <p className={`text-sm font-bold ${theme.text} ${selectedLang === 'arabic' ? 'text-right' : ''}`} dir={selectedLang === 'arabic' ? 'rtl' : 'ltr'}>
                    {result.corrected}
                  </p>
                </div>
              )}
              {result.feedback && (
                <div>
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Изоҳ</p>
                  <p className="text-xs opacity-80">{result.feedback}</p>
                </div>
              )}
              {result.tip && (
                <div className={`flex items-start gap-2 p-2.5 rounded-xl border ${accentBorder}`}>
                  <Sparkles size={11} className={`${accentText} mt-0.5 flex-shrink-0`}/>
                  <p className="text-xs opacity-90">{result.tip}</p>
                </div>
              )}
              {result.newWord && (
                <div className={`p-2.5 rounded-xl border ${accentBorder}`}>
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">🔤 Бугунги сўз</p>
                  <p className={`text-sm font-black ${accentText}`}>{result.newWord}</p>
                  {result.newWordMeaning && <p className="text-xs opacity-60 mt-0.5">{result.newWordMeaning}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Хато */}
      {result?.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 mb-3 text-xs text-red-400">
          ⚠️ {result.error}
        </div>
      )}

      {/* Тугмалар */}
      <div className="flex gap-2">
        {result ? (
          <button onClick={reset} className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition ${theme.input} opacity-70`}>
            <RotateCcw size={14}/> Қайта
          </button>
        ) : (
          <button
            onClick={callAI}
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition ${loading ? theme.input + ' opacity-50' : theme.button}`}
          >
            {loading
              ? <><Sparkles size={14} className="animate-spin"/> Ўйлевотти...</>
              : <><Brain size={14}/>
                  {mode === 'analysis' ? 'Таҳлил қил' :
                   mode === 'plan'     ? 'Текшир' :
                   mode === 'chat'     ? 'Жавоб бер' :
                                        'Текшир'}
                </>
            }
          </button>
        )}
      </div>
    </div>
  );
}
