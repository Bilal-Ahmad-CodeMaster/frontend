import './globals.css';
import type { Metadata, Viewport } from 'next';

// 1. Next.js 14 requires viewport/theme settings to be exported separately
export const viewport: Viewport = {
  themeColor: '#ef4444',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// 2. Standard Metadata
export const metadata: Metadata = {
  title: 'Madad | AI Emergency Response',
  description: 'Voice-first AI first-aid and dispatch system.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* 3. suppressHydrationWarning stops browser extensions from crashing the app */}
      <body className="bg-slate-900 text-white min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}