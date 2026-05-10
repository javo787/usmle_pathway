export default async function TestPage() {
  let dbStatus = '❌ Не подключено';
  let dbError = '';
  let collections = [];

  try {
    const { default: dbConnect } = await import('@/lib/mongodb');
    const conn = await dbConnect();
    if (conn) {
      dbStatus = '✅ Подключено';
      collections = await conn.connection.db.listCollections().toArray();
    }
  } catch (err) {
    dbError = err.message;
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 14 }}>
      <h2>MongoDB статус: {dbStatus}</h2>
      {dbError && (
        <p style={{ color: 'red' }}>Ошибка: {dbError}</p>
      )}
      {collections.length > 0 && (
        <div>
          <p>Коллекции:</p>
          <ul>
            {collections.map(c => <li key={c.name}>{c.name}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
