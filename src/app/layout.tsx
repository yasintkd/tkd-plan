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
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
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
          <header className="bg-blue-900 text-white shadow-md">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="text-lg md:text-xl font-bold tracking-tight">
                TKD Plan
              </Link>
              <nav className="flex gap-3 md:gap-4 text-sm font-medium items-center">
                <NavLinks />
                <AuthNav />
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 md:py-6 safe-area-bottom">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}