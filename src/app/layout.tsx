import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Manrope } from 'next/font/google';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import { SwRegister } from './sw-register';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Questo — QR Sipariş',
  description: 'QR Kodlu Sipariş ve Adisyon Sistemi',
  applicationName: 'Questo',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Questo',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f1ead8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={cn(manrope.variable, serif.variable)}
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
        <Toaster richColors position="top-center" closeButton />
        <SwRegister />
      </body>
    </html>
  );
}
