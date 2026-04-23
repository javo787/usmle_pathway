import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  userId:      { type: String, required: true, index: true },
  date:        { type: String, required: true }, // 'YYYY-MM-DD'
  amount:      { type: Number, required: true },
  category:    { type: String, required: true },
  note:        { type: String, default: '' },
  isAutomatic: { type: Boolean, default: false }, // Quitzilla penalty
}, { timestamps: true });

ExpenseSchema.index({ userId: 1, date: 1 });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
