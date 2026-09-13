import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AttributionCapture } from "@/components/AttributionCapture";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = "https://www.ace11plus.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ace 11+ | Adaptive 11+ Preparation for Grammar Schools",
    template: "%s | Ace 11+",
  },
  description: "Personalized 11+ preparation for GL, CEM, and ISEB exams. Adaptive tutoring, full mock exams, and real-time performance tracking for Year 4 and Year 5 students.",
  keywords: ["11 plus", "grammar school exam", "GL Assessment", "CEM 11+", "Eleven Plus tutor", "Year 4 11+", "Year 5 11+"],
  openGraph: {
    type: "website",
    siteName: "Ace 11+",
    url: siteUrl,
    title: "Ace 11+ | Adaptive 11+ Preparation for Grammar Schools",
    description: "Personalized 11+ preparation for GL, CEM, and ISEB exams. Adaptive tutoring, full mock exams, and real-time performance tracking for Year 4 and Year 5 students.",
    images: [{ url: "/logo-clear.png", width: 512, height: 512, alt: "Ace 11+" }],
  },
  twitter: {
    card: "summary",
    title: "Ace 11+ | Adaptive 11+ Preparation for Grammar Schools",
    description: "Personalized 11+ preparation for GL, CEM, and ISEB exams. Adaptive tutoring, full mock exams, and real-time performance tracking for Year 4 and Year 5 students.",
    images: ["/logo-clear.png"],
  },
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
    "url": siteUrl,
    "logo": `${siteUrl}/logo-clear.png`,
    "description": "Adaptive 11+ preparation platform for GL, CEM, and ISEB exams.",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    }
    // "sameAs": [ ... official Instagram/Facebook/YouTube/TikTok URLs ... ]
    // Add once we have the canonical profile URLs handy -- linking real,
    // active profiles here is what ties this Organization entity together
    // across the web for AI/Knowledge-Graph purposes; a placeholder or
    // stale link is worse than omitting the field.
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
