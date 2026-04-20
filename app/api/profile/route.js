import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { getMasterEmail, getOrCreateProfile } from '@/lib/getMasterEmail';
import UserProfile from '@/models/UserProfile';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const masterEmail = await getMasterEmail(session.user.email);
  const profile = await getOrCreateProfile(masterEmail);
  return NextResponse.json({
    masterEmail,
    currentEmail: session.user.email.toLowerCase(),
    isMaster: masterEmail === session.user.email.toLowerCase(),
    profile,
  });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const masterEmail = await getMasterEmail(session.user.email);
  try {
    const body = await req.json();
    const allowed = ['settings', 'goals', 'challenges', 'penaltyDebt', 'debtCreatedAt', 'displayName'];
    const update = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const profile = await UserProfile.findOneAndUpdate(
      { masterEmail },
      { $set: update },
      { new: true, upsert: true }
    );
    return NextResponse.json({ success: true, profile });
  } catch (err) {
    return NextResponse.json({ error: 'Update error' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const masterEmail = await getMasterEmail(session.user.email);
  if (masterEmail !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: 'Faqat asosiy akaunt linked email qo\'sha oladi' }, { status: 403 });
  }
  const { emailToLink } = await req.json();
  if (!emailToLink) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  const lower = emailToLink.toLowerCase().trim();
  if (lower === masterEmail) return NextResponse.json({ error: 'Bu allaqachon asosiy akaunt' }, { status: 400 });
  const profile = await UserProfile.findOneAndUpdate(
    { masterEmail },
    { $addToSet: { linkedEmails: lower } },
    { new: true }
  );
  return NextResponse.json({ success: true, profile });
}
