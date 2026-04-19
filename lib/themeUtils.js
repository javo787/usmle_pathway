export const themes = {

  // 1. "САҲРО ТУНИ" — Critical режим
  critical: {
    appBg: "bg-[#0F1108]",
    text: "text-rose-50",
    card: "bg-[#1A0F0F]/90 border border-red-800/40 backdrop-blur-md shadow-[0_8px_32px_rgba(180,20,20,0.2)] rounded-3xl",
    cardTitle: "text-red-400 font-bold uppercase tracking-widest text-xs",
    input: "bg-black/40 border border-red-900/50 text-rose-50 placeholder-red-900 focus:border-red-500 focus:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all rounded-xl",
    button: "bg-gradient-to-br from-red-700 to-red-900 text-white font-bold shadow-[0_4px_20px_rgba(220,38,38,0.5)] border border-red-600/30 active:scale-95 rounded-2xl",
    icon: "text-red-400",
    nav: "bg-[#0F0A0A]/95 border-t border-red-900/40 text-red-300/60 backdrop-blur-xl",
    accent: "#b91c1c",
    glow: "shadow-[0_0_60px_rgba(180,20,20,0.15)]",
  },

  // 2. "БОҒ ЭРТАЛАБИ" — Stable режим
  stable: {
    appBg: "bg-[#F4F0E8]",
    text: "text-[#1C2B1A]",
    card: "bg-white/80 border border-[#C8D9C0]/60 backdrop-blur-sm shadow-[0_4px_24px_rgba(13,92,76,0.08)] rounded-3xl",
    cardTitle: "text-[#0D5C4C] font-bold uppercase tracking-widest text-xs",
    input: "bg-white/70 border border-[#B5C9B0] text-[#1C2B1A] placeholder-[#8AAB84] focus:border-[#0D5C4C] focus:shadow-[0_0_0_3px_rgba(13,92,76,0.1)] transition-all rounded-xl",
    button: "bg-gradient-to-br from-[#0D5C4C] to-[#0A4A3C] text-white font-bold shadow-[0_4px_20px_rgba(13,92,76,0.35)] active:scale-95 rounded-2xl",
    icon: "text-[#0D5C4C]",
    nav: "bg-white/90 border-t border-[#C8D9C0] text-[#4A7A5A] backdrop-blur-xl",
    accent: "#0D5C4C",
    glow: "shadow-[0_0_60px_rgba(13,92,76,0.08)]",
  },

  // 3. "ОЛТИН СОАТ" — Legend режим
  legend: {
    appBg: "bg-[#FBF6EC]",
    text: "text-[#2C1A08]",
    card: "bg-white/90 border border-[#E8C97A]/50 backdrop-blur-sm shadow-[0_4px_24px_rgba(180,130,30,0.12)] rounded-3xl",
    cardTitle: "text-[#9A6B00] font-bold uppercase tracking-widest text-xs",
    input: "bg-amber-50/50 border border-[#DDB96A]/40 text-[#2C1A08] placeholder-amber-300 focus:border-[#C49A00] focus:shadow-[0_0_0_3px_rgba(180,130,30,0.15)] transition-all rounded-xl",
    button: "bg-gradient-to-br from-[#C49A00] to-[#9A6B00] text-white font-bold shadow-[0_4px_20px_rgba(180,130,30,0.45)] border border-amber-300/20 active:scale-95 rounded-2xl",
    icon: "text-[#C49A00]",
    nav: "bg-[#FBF6EC]/95 border-t border-amber-200/60 text-amber-700/70 backdrop-blur-xl",
    accent: "#C49A00",
    glow: "shadow-[0_0_60px_rgba(180,130,30,0.1)]",
  }
};
