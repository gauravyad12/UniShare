import { TempoInit } from "@/components/tempo-init";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSync } from "@/components/theme-sync";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UniShare - Academic Resource Sharing Platform",
  description:
    "An exclusive platform for university students to collaborate, share academic resources, and form study groups in a secure environment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body
        className={`${inter.className} min-h-screen flex flex-col bg-background`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeSync />
          {children}
          <TempoInit />
        </ThemeProvider>
      </body>
    </html>
  );
}
