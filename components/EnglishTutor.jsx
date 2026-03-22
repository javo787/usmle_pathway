'use client';
import React, { useState } from 'react';
import { Globe, PenTool, Bot, Sparkles, AlertCircle } from 'lucide-react';

export default function EnglishTutor({ data, updateData, theme }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAICheck = async () => {
    if (!data.essay || data.essay.length < 10) {
      alert("Please write at least 10 characters!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.essay }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect to AI');
      }

      // Формируем красивый отчет из JSON
      const feedbackFormatted = `
        📊 Level: ${result.level}
        
        ✅ Feedback: ${result.feedback}
        💡 Tip: ${result.tip}
      `;

      updateData('english', { ...data, aiFeedback: feedbackFormatted, practiced: true });

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl p-5 mb-6 transition-colors duration-500 ${theme.card}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold flex items-center ${theme.cardTitle}`}>
          <Globe size={18} className={`mr-2 ${theme.icon}`}/> AI Tutor
        </h3>
        <span className="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded-full">Real Gemini API</span>
      </div>

      <textarea
        className={`w-full rounded-xl p-3 text-sm min-h-[120px] outline-none font-mono ${theme.input}`}
        placeholder="Write here... (I want to be a surgeon...)"
        value={data.essay || ""}
        onChange={(e) => updateData('english', { ...data, essay: e.target.value })}
      />

      <div className="flex justify-between items-center mt-3">
        <div className="text-xs opacity-60 flex items-center gap-1">
          <Bot size={14}/> Powered by Gemini 1.5
        </div>
        <button 
          onClick={handleAICheck} 
          disabled={loading} 
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : theme.button}`}
        >
          {loading ? <Sparkles size={16} className="animate-spin"/> : <><PenTool size={16} className="mr-2"/> Check Real AI</>}
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-xs text-red-500 flex items-center">
          <AlertCircle size={16} className="mr-2"/> {error}
        </div>
      )}

      {data.aiFeedback && !error && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
          <div className={`p-4 rounded-xl text-sm whitespace-pre-line border-l-4 border-indigo-500 ${theme.input}`}>
            <h4 className="font-bold text-indigo-500 mb-1 flex items-center gap-2"><Sparkles size={14}/> AI Feedback:</h4>
            {data.aiFeedback}
          </div>
        </div>
      )}
    </div>
  );
}
