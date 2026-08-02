import type { Metadata, Viewport } from 'next';
import PwaRegistry from '@/components/pwa-registry';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nora - Gestion de Pressing et Blanchisserie',
  description: 'Logiciel SaaS de gestion de pressing, facturation client PDF, suivi des commandes et comptabilité pour l\'Afrique francophone.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nora Pressing',
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className="antialiased selection:bg-[#2563EB] selection:text-white"
        suppressHydrationWarning
      >
        <PwaRegistry />
        {children}
      </body>
    </html>
  );
}
