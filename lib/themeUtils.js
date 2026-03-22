export const themes = {
  // 1. ХАВФ (CRITICAL) - "CODE RED"
  // Атмосфера: Ночная смена, тревога. Темный фон, чтобы не слепило, но красный неон создает напряжение.
  critical: {
    // Фон: Глубокий темный (почти черный), чтобы глаза отдыхали, но атмосфера была мрачной.
    appBg: "bg-slate-950",
    
    // Текст: Светло-серый (белый). Это единственный способ сделать текст читаемым на темном.
    text: "text-slate-100",
    
    // Карточка: Темная с красным свечением (Glow). Выглядит как приборная панель в опасности.
    card: "bg-slate-900/90 border border-red-500/50 backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.15)]",
    
    // Заголовок: Ярко-красный, капсом.
    cardTitle: "text-red-500 font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]",
    
    // Инпут: Черный внутри, красная рамка.
    input: "bg-black/50 border border-red-900/60 text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all",
    
    // Кнопка: "Кровавая" с подсветкой.
    button: "bg-red-600 hover:bg-red-500 text-white font-bold shadow-[0_0_25px_rgba(220,38,38,0.6)] border border-red-400/20 active:scale-95",
    
    icon: "text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]",
    
    // Навигация: Темная.
    nav: "bg-slate-900/95 border-t border-red-600/50 text-slate-400 shadow-[0_-10px_40px_rgba(220,38,38,0.1)]"
  },

  // 2. СТАБИЛ (STABLE) - "КЛИНИКА"
  // Чистый, светлый, стерильный дизайн.
  stable: {
    appBg: "bg-slate-50",
    text: "text-slate-800",
    
    card: "bg-white border border-slate-200 shadow-xl shadow-slate-200/60",
    cardTitle: "text-teal-700 font-bold flex items-center",
    
    input: "bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all",
    
    button: "bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold shadow-lg shadow-teal-500/30 active:scale-95",
    
    icon: "text-teal-600",
    nav: "bg-white/90 border-t border-slate-200 text-slate-500 backdrop-blur-lg"
  },

  // 3. АФСОНА (LEGEND) - "ЗОЛОТОЙ ВЕК"
  // Теплый кремовый фон (Paper White) и дорогой шоколадный текст.
  legend: {
    appBg: "bg-[#FDFBF7]", 
    text: "text-amber-950",
    
    card: "bg-white border border-amber-200 shadow-[0_10px_40px_rgba(217,119,6,0.1)]",
    cardTitle: "text-amber-700 font-bold",
    
    input: "bg-white border border-amber-200 text-amber-900 placeholder-amber-900/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-400 transition-all",
    
    button: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold shadow-lg shadow-amber-500/40 border border-white/20 active:scale-95",
    
    icon: "text-amber-600",
    nav: "bg-[#FFFBF2]/95 border-t border-amber-100 text-amber-800/70 backdrop-blur-lg"
  }
};
