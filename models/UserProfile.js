import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
  // Асосий аккаунт email — барча linked accountlar учун ягона ID
  masterEmail: { 
    type: String, 
    required: true, 
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },

  // Боғланган аккаунтлар рўйхати
  linkedEmails: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // Profil ma'lumotlari
  displayName: { type: String, default: '' },
  avatarUrl:   { type: String, default: '' },

  // Sozlamalar
  settings: {
    enableNotifications: { type: Boolean, default: false },
    smallReward:  { type: String, default: '+50с ҳалол!' },
    bigReward:    { type: String, default: 'Тоғга чиқиш' },
    punishment:   { type: String, default: '50с Эҳсон'   },
  },

  goals: {
    firstAid: { type: Number, default: 15 },
    uWorld:   { type: Number, default: 40 },
    anki:     { type: Number, default: 50 },
  },

  // Quitzilla challenges — barcha qurilmalarda bir xil
  challenges: [{
    id:    { type: Number },
    title: { type: String },
    start: { type: String },
    relapseHistory: [{
      date:   { type: String },
      reason: { type: String },
    }],
  }],

  // Umumiy jarimalar
  penaltyDebt:   { type: Number, default: 0  },
  debtCreatedAt: { type: Date,   default: null },

}, { timestamps: true });

// Linked email orqali master emailni topish uchun
UserProfileSchema.statics.findByAnyEmail = async function(email) {
  const lower = email.toLowerCase().trim();
  return this.findOne({
    $or: [
      { masterEmail: lower },
      { linkedEmails: lower }
    ]
  });
};

export default mongoose.models.UserProfile 
  || mongoose.model('UserProfile', UserProfileSchema);
