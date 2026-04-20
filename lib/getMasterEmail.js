// lib/getMasterEmail.js
// Istalgan email orqali masterEmail qaytaradi
// Agar profil topilmasa — yangi yaratadi

import dbConnect from './mongodb';
import UserProfile from '@/models/UserProfile';

// Barcha emaillar -> master email mapping
const MASTER_MAP = {
  'javo.nur.2004@gmail.com':   'javo.nur.2004@gmail.com',
  'usmlest1.anki@gmail.com':   'javo.nur.2004@gmail.com',
  'user.dr04@gmail.com':       'javo.nur.2004@gmail.com',
};

export async function getMasterEmail(email) {
  if (!email) return null;
  const lower = email.toLowerCase().trim();

  // 1. Avval static map dan tekshiramiz (tez)
  if (MASTER_MAP[lower]) return MASTER_MAP[lower];

  // 2. MongoDB dan qidiramiz
  await dbConnect();
  const profile = await UserProfile.findByAnyEmail(lower);
  if (profile) return profile.masterEmail;

  // 3. Yangi foydalanuvchi — o'zi master bo'ladi
  return lower;
}

export async function getOrCreateProfile(email) {
  if (!email) return null;
  await dbConnect();

  const masterEmail = await getMasterEmail(email);

  let profile = await UserProfile.findOne({ masterEmail });

  if (!profile) {
    profile = await UserProfile.create({
      masterEmail,
      linkedEmails: [],
      displayName: email.split('@')[0],
    });
  }

  return profile;
}
