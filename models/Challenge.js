import mongoose from 'mongoose';

const ChallengeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  lastRelapseDate: { type: Date, default: null },
  bestStreak: { type: Number, default: 0 }, 
  history: [{
    date: { type: Date, default: Date.now },
    cause: String,
    note: String
  }],
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema);
