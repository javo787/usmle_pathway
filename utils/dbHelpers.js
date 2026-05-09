const DayLog = require('../models/DayLog');
const UserProfile = require('../models/UserProfile');
const { getToday } = require('./dates');

async function getOrCreateLog(masterEmail) {
  const date = getToday();
  let log = await DayLog.findOne({ userId: masterEmail, date });
  if (!log) {
    log = new DayLog({
      userId: masterEmail,
      date,
      hourlyResponses: [],
      academic: {}, spiritual: {}, sport: {}, english: {}, planning: {},
    });
    await log.save();
  }
  return log;
}

async function syncDebtToProfile(masterEmail, penaltyDebt, debtCreatedAt) {
  try {
    await UserProfile.findOneAndUpdate(
      { masterEmail },
      { $set: { penaltyDebt, debtCreatedAt: debtCreatedAt || null } },
      { upsert: true }
    );
  } catch (e) {
    console.error("syncDebtToProfile error:", e.message);
  }
}

module.exports = { getOrCreateLog, syncDebtToProfile };
