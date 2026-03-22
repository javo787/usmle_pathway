import mongoose from 'mongoose';

const DayLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, 
  date: { type: String, required: true },
  
  challenges: [{
    id: Number,
    title: String,
    start: String 
  }],

  // --- ЯДРОВИЙ ПРОТОКОЛ (Қарз ва Таймер) ---
  penaltyDebt: { type: Number, default: 0 },
  debtCreatedAt: { type: Date, default: null }, // Қачон қарзга кирди? (Таймер бошланиши)
  warning20hSent: { type: Boolean, default: false }, // 20 соатлик огоҳлантириш кетдими?
  nukeTriggered: { type: Boolean, default: false },  // Бомба портладими?

  planning: {
    schedule: { type: String, default: "" },
    prohibitions: { type: String, default: "" },
    tomorrowPlans: [{ type: String }], 
    reflection: { type: String, default: "" },
  },

  academic: {
    firstAidDone: { type: Number, default: 0 },
    uWorldDone: { type: Number, default: 0 },
    ankiDone: { type: Number, default: 0 },
    repetition: { type: Boolean, default: false },
    additionalResource: { type: Boolean, default: false },
  },

  spiritual: {
    prayersDone: { type: Number, default: 0 },
    tahajjud: { type: Boolean, default: false },
    zikr: { type: Boolean, default: false },
    quranPages: { type: Number, default: 0 },
    sleepOnTime: { type: Boolean, default: false },
    nafsRelapse: { type: Boolean, default: false },
    qazoDone: { type: Boolean, default: false }, 
    zulm: { type: String, default: "" },         
    sadaqa: { type: Boolean, default: false },   
    silaiRahm: { type: Boolean, default: false } 
  },

  english: {
    practiced: { type: Boolean, default: false },
    essay: { type: String, default: "" },
    aiFeedback: { type: String, default: "" },
  },

  sport: {
    didSport: { type: Boolean, default: false },
    type: { type: String, default: "" },
    duration: { type: Number, default: 0 },
  },

  score: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

DayLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.DayLog || mongoose.model('DayLog', DayLogSchema);