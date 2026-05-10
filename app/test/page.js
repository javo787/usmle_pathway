export default function TestPage() {
  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>Диагностика</h1>
      <p>MONGODB_URI: {process.env.MONGODB_URI ? '✅ Задан' : '❌ Не задан'}</p>
      <p>NEXTAUTH_URL: {process.env.NEXTAUTH_URL ? '✅ Задан' : '❌ Не задан'}</p>
      <p>GOOGLE_CLIENT_ID: {process.env.GOOGLE_CLIENT_ID ? '✅ Задан' : '❌ Не задан'}</p>
    </div>
  );
}
