import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeContextProvider } from "@/components/theme-context";
import AppilixRootIdentity from "@/components/appilix-root-identity";
import AppilixHeadScript from "@/components/appilix-head-script";

import { NavigationEvents } from "@/components/navigation-events";
import GlobalLoadingSpinner from "@/components/global-loading-spinner";
import { GlobalStylesProvider } from "@/components/global-styles-provider";
import { MobileAwareToaster } from "@/components/mobile-aware-toaster";
import KeyboardAwareLayout from "@/components/keyboard-aware-layout";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import ViewportWarningWrapper from "@/components/viewport-warning-wrapper";
import { Toaster } from "@/components/ui/toaster";
import WarningSuppressor from "@/components/warning-suppressor";
// Force dynamic rendering for all pages
import "./force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UniShare | Academic Resource Sharing Platform",
  description:
    "An exclusive platform for university students to collaborate, share academic resources, and form study groups in a secure environment.",
  metadataBase: new URL(process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`),
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
    url: process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`,
    title: "UniShare | Academic Resource Sharing Platform",
    description: "An exclusive platform for university students to collaborate, share academic resources, and form study groups in a secure environment.",
    siteName: "UniShare",
    images: [
      {
        url: `${process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`}/api/og/default`,
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
    images: [`${process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 3000}` : `https://${process.env.NEXT_PUBLIC_DOMAIN}`}/api/og/default`],
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
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
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
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <AppilixHeadScript />
      </head>

      <Script src="/sw-register.js" strategy="afterInteractive" />
      <body
        className={`${inter.className} min-h-screen flex flex-col bg-background`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeContextProvider>
            <WarningSuppressor />
            <GlobalStylesProvider />
            <GlobalLoadingSpinner />
            <KeyboardAwareLayout />
            <AppilixRootIdentity />
            <ViewportWarningWrapper 
              minWidth={365} 
              minHeight={400}
              enableMobileOptimization={true}
              strictMode={false}
            >
              {children}
            </ViewportWarningWrapper>
            <NavigationEvents />
            <MobileAwareToaster />

            <SpeedInsights />
            <Analytics />

            {/* Hidden element for accessibility */}
            <div id="global-dialog-description" className="sr-only">
              Dialog content for accessibility
            </div>
          </ThemeContextProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
