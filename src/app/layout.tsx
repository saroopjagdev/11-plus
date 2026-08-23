import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AttributionCapture } from "@/components/AttributionCapture";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ace 11+ | Adaptive 11+ Preparation for Grammar Schools",
  description: "Personalized 11+ preparation for GL, CEM, and ISEB exams. Adaptive tutoring, full mock exams, and real-time performance tracking for Year 4 and Year 5 students.",
  keywords: ["11 plus", "grammar school exam", "GL Assessment", "CEM 11+", "Eleven Plus tutor", "Year 4 11+", "Year 5 11+"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Ace 11+",
    "url": "https://ace11plus.org",
    "description": "Adaptive 11+ preparation platform for GL, CEM, and ISEB exams.",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    }
  };

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        {children}
        <Analytics />
        <AttributionCapture />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
