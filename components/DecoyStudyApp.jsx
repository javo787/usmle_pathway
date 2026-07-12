'use client';

import React, { useState } from 'react';
import { BookOpen, TrendingUp, Calendar, CheckCircle, GraduationCap } from 'lucide-react';

// Decoy Study App uses totally separate state and is completely self-contained.
// No next-auth imports, no /api/* routes, light theme, believable side-project USMLE tracker.

const SUBJECTS_DATA = [
  { id: 'cardio', name: 'Cardiology', done: 120, total: 200, color: 'bg-rose-500' },
  { id: 'pharm', name: 'Pharmacology', done: 145, total: 250, color: 'bg-indigo-500' },
  { id: 'biochem', name: 'Biochemistry', done: 85, total: 180, color: 'bg-amber-500' },
  { id: 'path', name: 'Pathology', done: 210, total: 300, color: 'bg-emerald-500' },
  { id: 'neuro', name: 'Neurology', done: 95, total: 150, color: 'bg-sky-500' },
];

const SCORES_DATA = [
  { id: 'nbme26', name: 'NBME Form 26', date: 'June 14', score: 62 },
  { id: 'nbme27', name: 'NBME Form 27', date: 'June 28', score: 67 },
  { id: 'nbme28', name: 'NBME Form 28', date: 'July 10', score: 71 },
];

const CALENDAR_DATA = [
  { day: 'Today', tasks: ['Review 40 Pathology Flashcards', 'Complete Cardiology Block (20 Qs)', 'Anki reviews - 150 cards'] },
  { day: 'Tomorrow', tasks: ['High-yield Biostatistics Review', 'Pharmacology Mechanism of Action Drill', 'NBME Form 29 Practice Test'] },
];

export default function DecoyStudyApp() {
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'progress' | 'calendar'
  const [completedTasks, setCompletedTasks] = useState({});

  const toggleTask = (taskName) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskName]: !prev[taskName]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans">
      {/* Decoy Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="text-emerald-600" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-tight">USMLE Pathway</h1>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Step 1 · подготовка</p>
          </div>
        </div>
        <div className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-bold">
          Active Prep
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-5 pb-24">

        {/* Flashcards Tab Content */}
        {activeTab === 'flashcards' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="font-extrabold text-gray-900 text-base mb-1">Subject Progress</h2>
              <p className="text-xs text-gray-500 mb-4">Complete study decks to reach high efficiency.</p>

              <div className="space-y-4">
                {SUBJECTS_DATA.map((subject) => {
                  const percentage = Math.round((subject.done / subject.total) * 100);
                  return (
                    <div key={subject.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>{subject.name}</span>
                        <span className="text-gray-500">{subject.done} / {subject.total} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${subject.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-extrabold text-gray-900 text-sm mb-3">Study Advice</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Consistency is key for Step 1. Focus on understanding the pathophysiology mechanisms rather than purely memorizing answers. High-yield systems like Cardiology and Pathology carry the most weight.
              </p>
            </div>
          </div>
        )}

        {/* Progress Chart Tab Content */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="font-extrabold text-gray-900 text-base mb-1">NBME Practice Exams</h2>
              <p className="text-xs text-gray-500 mb-6">Target a score &gt; 65% for a highly probable pass.</p>

              {/* Simplified Pure Tailwind Bar Chart */}
              <div className="flex items-end justify-around h-44 border-b border-gray-200 pb-2 mb-4 px-4">
                {SCORES_DATA.map((data) => {
                  return (
                    <div key={data.id} className="flex flex-col items-center space-y-2 w-16">
                      <span className="text-xs font-extrabold text-emerald-600">{data.score}%</span>
                      <div
                        className="w-8 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all duration-500 shadow-sm"
                        style={{ height: `${data.score * 1.5}px` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Legend and Dates */}
              <div className="space-y-2.5">
                {SCORES_DATA.map((data) => (
                  <div key={data.id} className="flex justify-between items-center text-xs font-bold border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-800">{data.name}</span>
                    <span className="text-gray-400 font-medium">{data.date}</span>
                    <span className="text-emerald-600">{data.score}% Pass Prob</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-extrabold text-gray-900 text-sm mb-2">Step 1 Strategy</h3>
              <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Review all incorrect answers thoroughly.</li>
                <li>Ensure you get 7-8 hours of sleep before mock tests.</li>
                <li>Spaced repetition keeps high-yield facts accessible.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Calendar / Study Plan Tab Content */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="font-extrabold text-gray-900 text-base mb-1">Weekly Plan</h2>
              <p className="text-xs text-gray-500 mb-5">Tick off finished study objectives daily.</p>

              <div className="space-y-5">
                {CALENDAR_DATA.map((section) => (
                  <div key={section.day} className="space-y-2.5">
                    <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">{section.day}</h3>
                    <div className="space-y-2">
                      {section.tasks.map((task, idx) => {
                        const isDone = completedTasks[task];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleTask(task)}
                            className="flex items-start space-x-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition cursor-pointer select-none"
                          >
                            <CheckCircle
                              size={18}
                              className={`mt-0.5 transition-colors ${isDone ? 'text-emerald-500 fill-emerald-50' : 'text-gray-300'}`}
                            />
                            <span className={`text-xs font-semibold ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Persistent Bottom Tab Navigator */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 shadow-lg z-20">
        <div className="max-w-md mx-auto flex justify-around">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex flex-col items-center space-y-1 transition-all ${
              activeTab === 'flashcards' ? 'text-emerald-600 scale-105 font-bold' : 'text-gray-400 font-medium'
            }`}
          >
            <BookOpen size={20} />
            <span className="text-[10px]">Карточки</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex flex-col items-center space-y-1 transition-all ${
              activeTab === 'progress' ? 'text-emerald-600 scale-105 font-bold' : 'text-gray-400 font-medium'
            }`}
          >
            <TrendingUp size={20} />
            <span className="text-[10px]">Прогресс</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center space-y-1 transition-all ${
              activeTab === 'calendar' ? 'text-emerald-600 scale-105 font-bold' : 'text-gray-400 font-medium'
            }`}
          >
            <Calendar size={20} />
            <span className="text-[10px]">Календарь</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
