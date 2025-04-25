import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSync } from "@/components/theme-sync";

import { NavigationEvents } from "@/components/navigation-events";
import GlobalLoadingSpinner from "@/components/global-loading-spinner";
import { GlobalStylesProvider } from "@/components/global-styles-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
// Force dynamic rendering for all pages
import "./force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UniShare | Academic Resource Sharing Platform",
  description:
    "An exclusive platform for university students to collaborate, share academic resources, and form study groups in a secure environment.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://unishare.app'),
  keywords: [
    "university", "student", "academic", "resources", "study groups",
    "collaboration", "education", "learning", "college", "university resources"
  ],
  authors: [{ name: "UniShare Team" }],
  creator: "UniShare",
  publisher: "UniShare",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://unishare.app",
    title: "UniShare | Academic Resource Sharing Platform",
    description: "An exclusive platform for university students to collaborate, share academic resources, and form study groups in a secure environment.",
    siteName: "UniShare",
    images: [
      {
        url: "https://unishare.app/api/og/default",
        width: 1200,
        height: 630,
        alt: "UniShare - Academic Resource Sharing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UniShare | Academic Resource Sharing Platform",
    description: "An exclusive platform for university students to collaborate, share academic resources, and form study groups in a secure environment.",
    creator: "@useunishare",
    images: ["https://unishare.app/api/og/default"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <Script src="/sw-register.js" strategy="afterInteractive" />
      <body
        className={`${inter.className} min-h-screen flex flex-col bg-background`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeSync />
          <GlobalStylesProvider />
          <GlobalLoadingSpinner />
          {children}
          <NavigationEvents />

          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
