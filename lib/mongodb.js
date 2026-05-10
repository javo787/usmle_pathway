import mongoose from 'mongoose';

// ─────────────────────────────────────────────
// Валидация
// ─────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ [MongoDB] MONGODB_URI environment variable is not set!');
}

// ─────────────────────────────────────────────
// Глобальный кэш (Next.js hot-reload safe)
// ─────────────────────────────────────────────
const globalCache = global;

if (!globalCache.mongoose) {
  globalCache.mongoose = { conn: null, promise: null };
}

const cached = globalCache.mongoose;

// ─────────────────────────────────────────────
// Опции подключения
// ─────────────────────────────────────────────
const CONNECT_OPTIONS = {
  bufferCommands:            false,
  serverSelectionTimeoutMS:  10_000,  // 10 сек
  connectTimeoutMS:          10_000,
  socketTimeoutMS:           45_000,
  maxPoolSize:               10,
  minPoolSize:               2,
};

// ─────────────────────────────────────────────
// Логируем URI без пароля
// ─────────────────────────────────────────────
function getSafeUri(uri) {
  return uri.replace(/:([^@]+)@/, ':***@');
}

// ─────────────────────────────────────────────
// Основная функция
// ─────────────────────────────────────────────
async function dbConnect() {
  if (!MONGODB_URI) {
    console.error('❌ [MongoDB] Cannot connect — MONGODB_URI is missing');
    return null;
  }

  // Уже подключены
  if (cached.conn) {
    console.log('✅ [MongoDB] Using cached connection');
    return cached.conn;
  }

  // Создаём новое подключение
  if (!cached.promise) {
    console.log('🔄 [MongoDB] Connecting to:', getSafeUri(MONGODB_URI));

    cached.promise = mongoose
      .connect(MONGODB_URI, CONNECT_OPTIONS)
      .then((m) => {
        console.log('✅ [MongoDB] Connected successfully');

        // Слушаем события соединения
        mongoose.connection.on('disconnected', () => {
          console.warn('⚠️ [MongoDB] Disconnected');
          cached.conn    = null;
          cached.promise = null;
        });

        mongoose.connection.on('error', (err) => {
          console.error('❌ [MongoDB] Connection error:', err.message);
          cached.conn    = null;
          cached.promise = null;
        });

        return m;
      })
      .catch((err) => {
        console.error('❌ [MongoDB] Connection failed:', err.message);
        // Сбрасываем чтобы следующий вызов мог попробовать снова
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default dbConnect;
