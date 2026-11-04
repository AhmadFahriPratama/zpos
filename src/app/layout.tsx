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
  title: "zPos — Kasir & Manajemen Ritel",
  description:
    "Suite manajemen ritel offline-first dengan server lokal: kasir cepat, produk, stok, pembelian & supplier, pelanggan, keuangan, promo, multi-outlet, shift kasir, laporan lengkap, dan monitoring perangkat — dalam satu aplikasi desktop yang elegan.",
  keywords: ["zPos", "POS", "aplikasi kasir", "kasir", "point of sale", "manajemen ritel", "inventaris", "iPos", "KeToko"],
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
