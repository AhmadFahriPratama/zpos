import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "zPos — Master Plan Sistem Kasir Multi-Platform",
  description:
    "Perencanaan lengkap zPos: aplikasi POS offline-first multi-platform (Windows, macOS, Android, iOS) dengan server utama di PC/homeserver, tersambung via WiFi/LAN, dan dashboard monitoring terpusat.",
  keywords: ["zPos", "POS", "aplikasi kasir", "kasir offline", "LAN", "POS multi-platform", "homeserver"],
  openGraph: {
    title: "zPos — Master Plan Sistem Kasir Multi-Platform",
    description:
      "Aplikasi POS generasi baru: server lokal di PC/homeserver, multi-platform, offline-first, tanpa biaya cloud.",
    siteName: "zPos Master Plan",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
