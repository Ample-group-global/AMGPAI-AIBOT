import type { Metadata } from 'next';
import { MasterDataProvider } from '@/contexts/MasterDataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Amg AI PAI Bot',
  description: 'AI-powered sustainable investment assessment by Ample Group Global',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <MasterDataProvider>
            {children}
          </MasterDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
