import mongoose from 'mongoose';

const DayLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date:   { type: String, required: true },

  planning: {
    schedule:     { type: String, default: '' },
    prohibitions: { type: String, default: '' },
    tomorrowPlans: [{ type: String }],
    reflection:   { type: String, default: '' },
    coreIdea:     { type: String, default: '' },
  },

  academic: {
    firstAidDone:       { type: Number,  default: 0     },
    uWorldDone:         { type: Number,  default: 0     },
    ankiDone:           { type: Number,  default: 0     },
    repetition:         { type: Boolean, default: false },
    additionalResource: { type: Boolean, default: false },
    focusSessions:      { type: Number,  default: 0     },
    teachBack:          { type: String,  default: ''    },
  },

  spiritual: {
    prayersDone:  { type: Number,  default: 0     },
    prayers:      { type: mongoose.Schema.Types.Mixed, default: {} }, // { fajr: 'onTime'|'qaza'|null }
    tahajjud:     { type: Boolean, default: false },
    zikr:         { type: Boolean, default: false },
    zikrs:        { type: mongoose.Schema.Types.Mixed, default: [] }, // [{id,label,count,target}]
    quranPages:   { type: Number,  default: 0     },
    quranNote:    { type: String,  default: ''    },
    sleepOnTime:  { type: Boolean, default: false },
    nafsRelapse:  { type: Boolean, default: false },
    qazoDone:     { type: Boolean, default: false },
    zulm:         { type: String,  default: ''    },
    sadaqa:       { type: Boolean, default: false },
    silaiRahm:    { type: Boolean, default: false },
    sleepQuality: { type: Number,  default: 0     },
  },

  english: {
    practiced:  { type: Boolean, default: false },
    essay:      { type: String,  default: ''    },
    aiFeedback: { type: String,  default: ''    },
  },

  sport: {
    didSport:  { type: Boolean, default: false },
    type:      { type: String,  default: ''    },
    duration:  { type: Number,  default: 0     },
    details:   { type: String,  default: ''    },
    intensity: { type: String,  default: ''    },
  },

  // Yadro protokol
  penaltyDebt:    { type: Number,  default: 0    },
  debtCreatedAt:  { type: Date,    default: null },
  warning20hSent: { type: Boolean, default: false },
  nukeTriggered:  { type: Boolean, default: false },

  planLockedAt:               { type: Date,    default: null  },
  planDeadlinePenaltyApplied: { type: Boolean, default: false },

  score:       { type: Number, default: 0 },

  
  lastUpdated: { type: Date,   default: Date.now },
}, { timestamps: true, strict: false }); // strict:false - qo'shimcha fieldlar ham saqlanadi

DayLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.DayLog || mongoose.model('DayLog', DayLogSchema);
