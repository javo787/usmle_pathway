'use client';
import React, { useState } from 'react';
import { Package, ShieldAlert, Zap, XCircle } from 'lucide-react';

export default function WorryBox({ data, updateData, theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);

  const worryData = data?.worryAnalysis || { worry: '', worstCase: '', controllable: '' };

  const handleChange = (field, value) => {
    updateData('planning', {
      ...data,
      worryAnalysis: { ...worryData, [field]: value }
    });
  };

  const handleCloseBox = () => {
    setShowAffirmation(true);
    setTimeout(() => {
      setShowAffirmation(false);
      setIsOpen(false);
    }, 5000);
  };

  return (
    <div className={`rounded-3xl p-5 mb-6 transition-all duration-500 ${theme.card} ${isOpen ? 'ring-2 ring-indigo-500/30' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold flex items-center ${theme.cardTitle}`}>
          <Package size={18} className={`mr-2 ${theme.icon}`}/> Хавотирлар қутиси
        </h3>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="text-[10px] bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition"
          >
            Очиш
          </button>
        )}
      </div>

      {isOpen ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1.5 ml-1">
              Нима безовта қиляпти?
            </label>
            <textarea
              value={worryData.worry || ''}
              onChange={(e) => handleChange('worry', e.target.value)}
              className={`w-full rounded-xl p-3 text-sm h-16 outline-none ${theme.input}`}
              placeholder="Хавотирингизни ёзинг..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1.5 ml-1">
                Енг ёмон нима бўлиши мумкин?
              </label>
              <textarea
                value={worryData.worstCase || ''}
                onChange={(e) => handleChange('worstCase', e.target.value)}
                className={`w-full rounded-xl p-3 text-sm h-16 outline-none ${theme.input}`}
                placeholder="Энг ёмон сценарий..."
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1.5 ml-1">
                Мен назорат қила оладиган нарса нима?
              </label>
              <textarea
                value={worryData.controllable || ''}
                onChange={(e) => handleChange('controllable', e.target.value)}
                className={`w-full rounded-xl p-3 text-sm h-16 outline-none ${theme.input}`}
                placeholder="Ҳозирги ҳаракатингиз..."
              />
            </div>
          </div>

          {showAffirmation ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl animate-in zoom-in duration-300">
              <p className="text-xs font-medium text-emerald-600 text-center leading-relaxed">
                "Сен фақат бугун учун яшайсан. Хавотир эртанги кунни ўгирмайди — у бугунни ўгиради."
              </p>
            </div>
          ) : (
            <button
              onClick={handleCloseBox}
              className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 ${theme.button}`}
            >
              <XCircle size={16}/> Қутини ёпиш
            </button>
          )}
        </div>
      ) : (
        <p className="text-[10px] opacity-40 italic">Хавотирларни таҳлил қилиш ва назоратга олиш учун қутини очинг.</p>
      )}
    </div>
  );
}
