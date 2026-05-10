// динамический импорт ES-модулей из CommonJS
let DayLog, UserProfile;
async function getModels() {
    if (!DayLog) {
        const dl = await import('../models/DayLog.js');
        DayLog = dl.default;
    }
    if (!UserProfile) {
        const up = await import('../models/UserProfile.js');
        UserProfile = up.default;
    }
}
const { getToday } = require('./dates');

async function getOrCreateLog(masterEmail) {
    await getModels();
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
    await getModels();
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
