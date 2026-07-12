import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import NotificationManager from '@/components/NotificationManager';
import PinGate from '@/components/PinGate';
import DecoyStudyApp from '@/components/DecoyStudyApp';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const viewport = {
  themeColor: '#047857',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata = {
  title: 'USMLE Pathway',
  description: 'USMLE Step 1 study tracker',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body className={inter.className}>
        <AuthProvider>
          <PinGate decoyChildren={<DecoyStudyApp />}>
            <NotificationManager />
            {children}
          </PinGate>
        </AuthProvider>
      </body>
    </html>
  );
}
