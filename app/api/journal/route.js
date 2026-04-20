import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import DayLog from '@/models/DayLog';
import { getMasterEmail, getOrCreateProfile } from '@/lib/getMasterEmail';
import UserProfile from '@/models/UserProfile';

// ================================================
// GET — маълумот юклаш
// ================================================
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const masterEmail = await getMasterEmail(session.user.email);
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  try {
    if (date) {
      const log = await DayLog.findOne({ userId: masterEmail, date });
      return NextResponse.json(log || {});
    } else {
      // Oxirgi 30 kun + profil ma'lumotlari
      const [logs, profile] = await Promise.all([
        DayLog.find({ userId: masterEmail }).sort({ date: -1 }).limit(30),
        getOrCreateProfile(masterEmail),
      ]);
      return NextResponse.json({ logs, profile });
    }
  } catch (err) {
    console.error('GET journal error:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

// ================================================
// POST — маълумот сақлаш
// ================================================
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const masterEmail = await getMasterEmail(session.user.email);

  try {
    const body = await req.json();
    if (!body.date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 });
    }

    // DayLog saqlaymiz
    const log = await DayLog.findOneAndUpdate(
      { userId: masterEmail, date: body.date },
      { 
        ...body, 
        userId: masterEmail,
        lastUpdated: new Date() 
      },
      { new: true, upsert: true }
    );

    // Profildagi challenges, settings, goals ni ham yangilaymiz
    const profileUpdate = {};
    if (body.challenges)     profileUpdate.challenges   = body.challenges;
    if (body.settings)       profileUpdate.settings     = body.settings;
    if (body.goals)          profileUpdate.goals        = body.goals;
    if (body.penaltyDebt !== undefined) {
      profileUpdate.penaltyDebt   = body.penaltyDebt;
      profileUpdate.debtCreatedAt = body.debtCreatedAt || null;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await UserProfile.findOneAndUpdate(
        { masterEmail },
        { $set: profileUpdate },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, log });
  } catch (err) {
    console.error('POST journal error:', err);
    return NextResponse.json({ error: 'Save error' }, { status: 500 });
  }
}
