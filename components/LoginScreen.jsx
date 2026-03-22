'use client';

import React from 'react';
import { signIn } from 'next-auth/react';
import { Heart, Activity, BookOpen, Shield } from 'lucide-react';

export default function LoginScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center border border-emerald-100 dark:border-gray-800">
        
        {/* Логотип қисми */}
        <div className="flex justify-center mb-6 relative">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center relative shadow-inner">
            <Heart size={40} className="text-emerald-600 dark:text-emerald-400" />
            <Activity size={24} className="text-teal-500 absolute bottom-3 right-2" />
          </div>
        </div>

        {/* Сарлавҳа */}
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
          Muslim Doctor
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm">
          USMLE ва Иймон юксалиши учун кундалик
        </p>

        {/* Google орқали кириш тугмаси */}
        <button
          onClick={() => signIn('google')}
          className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white py-3.5 px-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-emerald-200 transition-all shadow-sm font-semibold group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Google орқали тизимга кириш</span>
        </button>

        {/* Қадриятлар */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800/50">
           <div className="flex justify-center space-x-6 text-xs text-gray-400 font-medium">
             <span className="flex flex-col items-center"><BookOpen size={16} className="mb-1 text-emerald-500/70"/> Илм</span>
             <span className="flex flex-col items-center"><Activity size={16} className="mb-1 text-emerald-500/70"/> Амал</span>
             <span className="flex flex-col items-center"><Shield size={16} className="mb-1 text-emerald-500/70"/> Ихлос</span>
           </div>
        </div>
      </div>
    </div>
  );
}