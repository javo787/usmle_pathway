'use client';
import React, { useState, useEffect } from 'react';
import { Activity, Brain, Moon, TrendingUp, Shield, Languages, FileText } from 'lucide-react';

const ProgressBar = ({ label, value, max, color }) => {
  const safeMax = max || 1;
  const percent = Math.min(100, Math.round((value / safeMax) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1 font-bold opacity-80">
        <span>{label}</span>
        <span>{value}/{safeMax} ({percent}%)</span>
      </div>
      <div className="h-2 w-full bg-gray-200/20 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color} shadow-[0_0_10px_currentColor]`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default function StatsDashboard({ data, score, goals, challenges, theme }) {
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    if (challenges && challenges.length > 0) {
      const now = new Date();
      const streaks = challenges.map(ch => {
        const start = new Date(ch.start);
        const diffTime = Math.abs(now - start);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
      });
      setMaxStreak(Math.max(...streaks));
    } else {
      setMaxStreak(0);
    }
  }, [challenges]);

  // Energy = намоз + спорт + сон + немецкий - срыв
  const dopamineLevel = Math.max(0, Math.min(100,
    (data.spiritual.sleepOnTime ? 20 : 0) +
    (data.sport.didSport ? 20 : 0) +
    (data.spiritual.prayersDone * 8) +
    ((data.academic.germanMinutes || 0) > 30 ? 15 : 0) -
    (data.spiritual.nafsRelapse ? 50 : 0)
  ));

  // Germany Path Score — прогресс к цели
  const germanProgress = Math.min(100, Math.round(((data.academic.germanMinutes || 0) / (goals?.germanMinutes || 45)) * 100));

  return (
    <div className="space-y-4 animate-in fade-in zoom-in duration-300">

      {/* Сводка */}
      <div className={`p-5 rounded-3xl grid grid-cols-2 gap-4 ${theme.card}`}>
        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
          <Activity className="mx-auto mb-2 text-emerald-500" size={28} />
          <div className={`text-3xl font-black ${theme.text}`}>{dopamineLevel}%</div>
          <div className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Energy</div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
          <TrendingUp className="mx-auto mb-2 text-blue-500" size={28} />
          <div className={`text-3xl font-black ${theme.text}`}>{score || 0}%</div>
          <div className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Score</div>
        </div>
      </div>

      {/* Академик прогресс */}
      <div className={`p-6 rounded-3xl ${theme.card}`}>
        <h3 className={`font-bold flex items-center mb-6 text-lg ${theme.cardTitle}`}>
          <Brain size={20} className="mr-2" /> Ўқиш (KPI)
        </h3>
        <ProgressBar
          label="🇩🇪 Немецкий (мин)"
          value={data.academic.germanMinutes || 0}
          max={goals?.germanMinutes || 45}
          color="bg-blue-500"
        />
        <ProgressBar
          label="🔁 Anki (карточки)"
          value={data.academic.ankiDone || 0}
          max={goals?.anki || 50}
          color="bg-pink-500"
        />
        <ProgressBar
          label="🏥 Университет (ч)"
          value={data.academic.uniHours || 0}
          max={goals?.uniHours || 4}
          color="bg-indigo-500"
        />
        {(data.academic.pubHours || 0) > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 font-bold">
            ✍️ Бугун {data.academic.pubHours} соат мақола устида ишланди
          </div>
        )}
        {data.academic.researchMeeting && (
          <div className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-bold">
            📋 Илмий раҳбар билан учрашув бўлди ✓
          </div>
        )}
      </div>

      {/* Намозлар */}
      <div className={`p-6 rounded-3xl ${theme.card}`}>
        <h3 className={`font-bold flex items-center mb-4 text-lg ${theme.cardTitle}`}>
          <Moon size={20} className="mr-2" /> Намоз
        </h3>
        <ProgressBar
          label="Намозлар"
          value={data.spiritual.prayersDone || 0}
          max={5}
          color="bg-emerald-500"
        />
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { key: 'tahajjud',    label: 'Таҳажжуд' },
            { key: 'sleepOnTime', label: 'Ухлаш ⏰' },
            { key: 'sadaqa',      label: 'Садақа' },
          ].map(({ key, label }) => (
            <div
              key={key}
              className={`text-center p-2 rounded-xl text-[10px] font-bold border ${
                data.spiritual[key]
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                  : 'bg-white/5 border-white/10 opacity-40'
              }`}
            >
              {label} {data.spiritual[key] ? '✓' : '✗'}
            </div>
          ))}
        </div>
      </div>

      {/* Clean Streak */}
      <div className={`p-6 rounded-3xl ${theme.card}`}>
        <h3 className={`font-bold flex items-center mb-4 text-lg ${theme.cardTitle}`}>
          <Shield size={20} className="mr-2" /> Тозалик Стрики
        </h3>
        <div className="text-center">
          <div className={`text-6xl font-black font-display mb-2 ${theme.text}`}>{maxStreak}</div>
          <div className="text-[10px] uppercase font-bold opacity-40 tracking-widest">кун</div>
        </div>
        {challenges.length === 0 && (
          <p className="text-center text-xs opacity-40 mt-3">Quitzilla-да трекер қўшинг</p>
        )}
      </div>

      {/* Germany Path прогресс */}
      <div className={`p-6 rounded-3xl border-2 border-blue-500/20 ${theme.card}`}>
        <h3 className="font-bold flex items-center mb-4 text-lg text-blue-400">
          <Languages size={20} className="mr-2" /> 🗺️ Germany Path
        </h3>
        <div className="space-y-3 text-xs">
          {[
            { label: 'Немецкий мақсад (бугун)', value: germanProgress + '%', ok: germanProgress >= 100 },
            { label: 'Anki бугун',              value: `${data.academic.ankiDone || 0} карта`, ok: (data.academic.ankiDone || 0) >= (goals?.anki || 50) },
            { label: 'Спорт',                   value: data.sport.didSport ? 'Бажарилди ✓' : 'Йўқ', ok: data.sport.didSport },
            { label: 'Намозлар',                value: `${data.spiritual.prayersDone}/5`, ok: data.spiritual.prayersDone === 5 },
          ].map(({ label, value, ok }) => (
            <div key={label} className={`flex justify-between p-3 rounded-xl ${ok ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/10'}`}>
              <span className={ok ? 'text-emerald-400' : 'opacity-50'}>{label}</span>
              <span className={`font-bold ${ok ? 'text-emerald-400' : 'opacity-50'}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
