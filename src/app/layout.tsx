import type { Metadata } from "next";
import { Instrument_Sans, Urbanist } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bagifyyyy.in"),
  title: {
    default: "BAGIFYYYY (Bagify) | Premium Y2K Streetwear & Archive Fashion",
    template: "%s | BAGIFYYYY",
  },
  description: "Shop BAGIFYYYY (Bagify) for premium Y2K streetwear, archive fashion, and exclusive limited-edition drops. High-quality oversized tees, cyber cargos, and heavy denim. No restocks, no replicas.",
  keywords: [
    "BAGIFYYYY",
    "Bagify",
    "Bagifyy",
    "streetwear",
    "Y2K fashion",
    "vintage archive",
    "archive fashion",
    "oversized tees",
    "heavyweight hoodies",
    "cyber cargos",
    "drop culture",
    "luxury streetwear",
    "avant-garde fashion",
    "opium fashion",
    "streetwear brands india",
    "premium apparel"
  ],
  authors: [{ name: "BAGIFYYYY" }],
  creator: "BAGIFYYYY",
  publisher: "BAGIFYYYY",
  alternates: {
    canonical: "https://bagifyyyy.in",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bagifyyyy.in",
    title: "BAGIFYYYY (Bagify) | Y2K Archive & Premium Streetwear",
    description: "Discover BAGIFYYYY (Bagify). Y2K-era streetwear drop culture. No restocks, no replicas. Wear history.",
    siteName: "BAGIFYYYY",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "BAGIFYYYY (Bagify) Premium Y2K Archive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BAGIFYYYY (Bagify) | Premium Y2K Streetwear",
    description: "Discover BAGIFYYYY (Bagify). Y2K-era streetwear drop culture. Wear history.",
    images: ["/logo.png"],
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
  // Set GOOGLE_SITE_VERIFICATION to the token from Search Console. Left unset,
  // the tag is omitted rather than shipping a placeholder token on every page.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import Preloader from "@/components/layout/Preloader";
import AuthModal from "@/components/auth/AuthModal";
import GsapScrollAnimations from "@/components/ui/GsapScrollAnimations";
import LenisProvider from "@/components/ui/LenisProvider";
import GlobalAnimator from "@/components/ui/GlobalAnimator";
import PageTransitionLoader from "@/components/ui/PageTransitionLoader";
import PageTransitionProvider from "@/components/ui/PageTransitionProvider";
import SmoothCursor from "@/components/ui/SmoothCursor";

import GoogleAuthProvider from "@/components/auth/GoogleAuthProvider";
import JsonLd from "@/components/seo/JsonLd";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${urbanist.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://db.onlinewebfonts.com/c/88f10bf18a36407ef36bf30bc25a3618?family=SuisseIntl-Regular" />
        {/* Ties the brand-name searches (BAGIFYYYY / Bagify / Bagifyy) to one entity. */}
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={webSiteJsonLd()} />
      </head>
      <body
        className="min-h-screen flex flex-col bg-y2k-ice text-y2k-gunmetal font-sans"
        suppressHydrationWarning
      >
        <SmoothCursor />
        <GoogleAuthProvider>
          <LenisProvider>
            <PageTransitionLoader />
            <GlobalAnimator />
            <GsapScrollAnimations />
            <Preloader />
            <AuthModal />
            <Header />
            <main className="flex-1 flex flex-col">
              <PageTransitionProvider>{children}</PageTransitionProvider>
            </main>
            <Footer />
            <CartDrawer />
          </LenisProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
