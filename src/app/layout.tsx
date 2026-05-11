import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ace 11+ | The AI-Powered 11+ Tutor for Top Grammar Schools",
  description: "Personalized 11+ preparation for GL, CEM, and ISEB exams. Instant AI tutoring, full mock exams, and real-time performance tracking to help your child secure their place.",
  keywords: ["11 plus", "grammar school exam", "GL Assessment", "CEM 11+", "Eleven Plus tutor", "AI education"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
