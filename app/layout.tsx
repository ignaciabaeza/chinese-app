import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "汉语学习 · Chinese Learning",
  description: "HSK Standard Course — structured lessons, vocabulary, grammar, characters, mock exams, and an AI tutor.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        {/* Ink & Cream type system: Noto Serif SC (hanzi), Ma Shan Zheng (calligraphy),
            Cormorant Garamond (display/pinyin), Spectral (body).
            Cinzel + Lora are kept loaded so any not-yet-migrated inline font strings
            keep rendering during the find-replace (see INTEGRATION.md step 4). */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700&family=Ma+Shan+Zheng&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&family=Cinzel:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          <Navigation />
          <div className="seigaiha-band" />
          <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">{children}</main>
          <div className="seigaiha-band flip" />
        </AuthProvider>
      </body>
    </html>
  );
}
