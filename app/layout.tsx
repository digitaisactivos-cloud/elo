import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Nav } from '@/components/nav';
import { Toaster } from '@/components/ui/toaster';
import { SmsModalProvider } from '@/components/sms-modal-provider';

export const metadata: Metadata = {
  title: 'Acompanha+ — Follow-up da Igreja',
  description: 'Gestão de follow-up dos membros via SMS manual.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Acompanha+' },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7C3AED" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-mist text-ink antialiased">
        <SmsModalProvider>
          <div className="mx-auto flex min-h-screen w-full max-w-6xl">
            <Nav />
            <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1.1rem+env(safe-area-inset-top,0px))] md:mx-0 md:max-w-none md:px-8 md:pb-10 md:pl-64 md:pt-6">
              {children}
            </main>
          </div>
          <Toaster />
        </SmsModalProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </body>
    </html>
  );
}
