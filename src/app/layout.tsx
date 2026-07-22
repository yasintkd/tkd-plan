import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth";
import AuthNav from "@/components/auth-nav";
import { NavLinks, MobileNavLinks } from "@/components/nav-links";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TKD Plan - Taekwondo Antrenman Planlayıcı",
  description: "Taekwondo antrenmanlarını planla, arşivle ve takvimle.",
  appleWebApp: {
    capable: true,
    title: "TKD Plan",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e3a8a",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TKD Plan" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-dvh flex flex-col bg-gray-50 text-gray-900">
        <Script
          id="service-worker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
        <AuthProvider>
          {/* Desktop header */}
          <header className="hidden md:block bg-blue-900/85 backdrop-blur-lg text-white shadow-sm border-b border-white/10 sticky top-0 z-50 safe-area-top">
            <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-lg font-bold tracking-tight">
                  TKD Plan
                </Link>
                <nav className="flex items-center gap-1">
                  <NavLinks />
                </nav>
              </div>
              <AuthNav />
            </div>
          </header>

          {/* Mobile header */}
          <header className="md:hidden bg-blue-900/85 backdrop-blur-lg text-white border-b border-white/10 sticky top-0 z-50">
            <div className="safe-area-top" />
            <div className="flex items-center justify-between px-3 py-2">
              <Link href="/" className="text-base font-bold tracking-tight">
                TKD Plan
              </Link>
              <AuthNav />
            </div>
          </header>

          <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-3 md:px-4 md:py-6 pb-[max(env(safe-area-inset-bottom,0px),4.5rem)] md:pb-6 safe-area-bottom">
            {children}
          </main>

          {/* Mobile bottom tab bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/60 safe-area-bottom">
            <MobileNavLinks />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}