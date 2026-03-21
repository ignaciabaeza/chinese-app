import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "汉语学习 · Chinese Learning",
  description: "HSK 1–6 flashcards with spaced repetition and AI tutor",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600;700&family=Cinzel:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          <Navigation />
          <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
