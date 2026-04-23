import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { getMasterEmail } from '@/lib/getMasterEmail';

// GET — /api/expenses?range=day|week|month&date=YYYY-MM-DD
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const userId = await getMasterEmail(session.user.email);
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || 'month';
  const date  = searchParams.get('date') || new Date().toISOString().split('T')[0];

  let startDate, endDate;
  const d = new Date(date);

  if (range === 'day') {
    startDate = date;
    endDate   = date;
  } else if (range === 'week') {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    startDate = start.toISOString().split('T')[0];
    endDate   = end.toISOString().split('T')[0];
  } else {
    // month
    startDate = `${date.slice(0, 7)}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    endDate = lastDay.toISOString().split('T')[0];
  }

  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ createdAt: -1 });

  // Daily totals for chart
  const dailyMap = {};
  expenses.forEach(e => {
    dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
  });

  return NextResponse.json({ expenses, dailyMap });
}

// POST — add expense
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const userId = await getMasterEmail(session.user.email);
  const body = await req.json();
  const { amount, category, note, date, isAutomatic } = body;

  if (!amount || !category) return NextResponse.json({ error: 'amount and category required' }, { status: 400 });

  const expense = await Expense.create({
    userId,
    date: date || new Date().toISOString().split('T')[0],
    amount: Number(amount),
    category,
    note: note || '',
    isAutomatic: !!isAutomatic,
  });

  return NextResponse.json({ expense });
}

// DELETE — /api/expenses?id=xxx
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const userId = await getMasterEmail(session.user.email);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  await Expense.deleteOne({ _id: id, userId });
  return NextResponse.json({ ok: true });
}
