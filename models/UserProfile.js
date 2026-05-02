import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
  masterEmail: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },

  linkedEmails: [{ type: String, lowercase: true, trim: true }],

  displayName: { type: String, default: '' },
  avatarUrl:   { type: String, default: '' },

  settings: {
    enableNotifications: { type: Boolean, default: false },
    smallReward: { type: String, default: '+50с ҳалол!' },
    bigReward:   { type: String, default: 'Германияга бориш' },
    punishment:  { type: String, default: '50с Эҳсон' },
  },

  // Germany Path мақсадлари
  goals: {
    germanMinutes: { type: Number, default: 45 },  // мин немецкого в день
    anki:          { type: Number, default: 50 },   // карточек Anki
    uniHours:      { type: Number, default: 4  },   // часов учёбы/кафедры
  },

  challenges: [{
    id:    { type: Number },
    title: { type: String },
    start: { type: String },
    relapseHistory: [{
      date:   { type: String },
      reason: { type: String },
    }],
  }],

  penaltyDebt:   { type: Number, default: 0    },
  debtCreatedAt: { type: Date,   default: null  },

}, { timestamps: true });

UserProfileSchema.statics.findByAnyEmail = async function (email) {
  const lower = email.toLowerCase().trim();
  return this.findOne({
    $or: [{ masterEmail: lower }, { linkedEmails: lower }],
  });
};

export default mongoose.models.UserProfile
  || mongoose.model('UserProfile', UserProfileSchema);
