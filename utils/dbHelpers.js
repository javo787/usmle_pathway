// utils/dbHelpers.js — FIXED with logging
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
    console.log(`[dbHelpers] Created new DayLog for ${masterEmail} on ${date}`);
  }
  return log;
}

/**
 * Syncs penalty debt from DayLog/bot to UserProfile (which the website reads).
 * Added verbose logging to diagnose sync failures.
 */
async function syncDebtToProfile(masterEmail, penaltyDebt, debtCreatedAt) {
  await getModels();
  try {
    console.log(`[syncDebtToProfile] Syncing debt for ${masterEmail}: debt=${penaltyDebt}, createdAt=${debtCreatedAt}`);

    const result = await UserProfile.findOneAndUpdate(
      { masterEmail },
      { $set: { penaltyDebt, debtCreatedAt: debtCreatedAt || null } },
      { upsert: true, new: true }
    );

    if (result) {
      console.log(`[syncDebtToProfile] ✅ Success — profile penaltyDebt is now: ${result.penaltyDebt}`);
    } else {
      console.error(`[syncDebtToProfile] ❌ findOneAndUpdate returned null for ${masterEmail}`);
    }

    return result;
  } catch (e) {
    console.error(`[syncDebtToProfile] ❌ ERROR for ${masterEmail}:`, e.message);
    console.error(e.stack);
    return null;
  }
}

module.exports = { getOrCreateLog, syncDebtToProfile };
