import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TSLab",
  description: "TypeScript Notebook Environment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning aqui previne erros de extensões como Grammarly/ColorZilla
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning // <--- ADICIONADO AQUI TAMBÉM
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased bg-slate-50 dark:bg-slate-950`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}