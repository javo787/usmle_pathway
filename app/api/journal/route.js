import dbConnect from '@/lib/mongodb';
import DayLog from '@/models/DayLog';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route'; // Убедитесь, что путь правильный

export async function GET(req) {
  await dbConnect();
  
  // 1. Текширамиз: Фойдаланувчи тизимга кирганми?
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  // Фойдаланувчининг email манзилини унинг уникал ID си сифатида ишлатамиз
  const userEmail = session.user.email; 

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  try {
    if (date) {
      // 2. Фақат шу фойдаланувчига тегишли бўлган шу санадаги маълумотни олиш
      const log = await DayLog.findOne({ userId: userEmail, date });
      return NextResponse.json(log || {});
    } else {
      // Статистика учун охирги 30 кунлик маълумотлар - ФАҚАТ ШУ ФОЙДАЛАНУВЧИНИКИ
      const logs = await DayLog.find({ userId: userEmail }).sort({ date: -1 }).limit(30);
      return NextResponse.json(logs);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Базага уланишда хато' }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  
  // 1. Текширамиз: Фойдаланувчи тизимга кирганми?
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userEmail = session.user.email;

  try {
    const body = await req.json();
    
    // Сана бўлиши шарт
    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // 2. Базага ёзиш ёки янгилаш (Upsert) - userId БИЛАН БИРГА
    const log = await DayLog.findOneAndUpdate(
      { userId: userEmail, date: body.date }, // Ищем по двум параметрам!
      { ...body, userId: userEmail, lastUpdated: new Date() }, // Обязательно сохраняем userId
      { new: true, upsert: true } 
    );

    return NextResponse.json(log);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Сақлашда хатолик' }, { status: 500 });
  }
}