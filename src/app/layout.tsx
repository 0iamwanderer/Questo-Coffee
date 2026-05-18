import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Manrope, Playfair_Display } from 'next/font/google';
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

// Spec: Playfair Display başlıklar (regular + medium + semibold + italic)
const serif = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

// Spec: JetBrains Mono küçük eyebrow'lar (micro-caps)
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Questo Coffea Co. — Manisa',
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
  themeColor: '#F4ECD3',
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
      className={cn(manrope.variable, serif.variable, mono.variable)}
    >
      <body className="min-h-screen bg-background bg-paper text-foreground antialiased font-sans">
        {children}
        <Toaster richColors position="top-center" closeButton />
        <SwRegister />
      </body>
    </html>
  );
}
