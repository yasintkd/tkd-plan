import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth";
import AuthNav from "@/components/auth-nav";
import NavLinks from "@/components/nav-links";

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
        <div className="bg-blue-900 safe-area-top" />
        <AuthProvider>
          <header className="bg-blue-900 text-white shadow-md safe-area-top">
            <div className="max-w-4xl mx-auto px-3 py-2 md:py-3">
              <div className="flex items-center justify-between mb-1 md:mb-0">
                <Link href="/" className="text-base md:text-xl font-bold tracking-tight touch-target flex items-center">
                  TKD Plan
                </Link>
                <div className="flex items-center gap-1 md:gap-2">
                  <AuthNav />
                </div>
              </div>
              <nav className="flex gap-1 md:gap-2 text-xs md:text-sm font-medium items-center overflow-x-auto pb-0.5 scrollbar-none" style={{scrollbarWidth:'none'}}>
                <NavLinks />
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-3 md:px-4 md:py-6 safe-area-bottom pb-[max(env(safe-area-inset-bottom,0px),0.75rem)]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}