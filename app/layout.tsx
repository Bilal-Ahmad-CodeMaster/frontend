import './globals.css';
import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

export const viewport: Viewport = {
  themeColor: '#ef4444',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Madad | AI Emergency Response',
  description: 'Voice-first AI first-aid and dispatch system.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen" suppressHydrationWarning>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}