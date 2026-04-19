import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import NotificationManager from '@/components/NotificationManager';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const viewport = {
  themeColor: '#047857',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata = {
  title: 'Muslim Doctor V2',
  description: 'USMLE va Iymon yuksalishi uchun',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
