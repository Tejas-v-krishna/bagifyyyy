import type { Metadata } from "next";
import "./globals.css";
import "./monochrome.css";

// NOTE: next/font Google faces (Instrument_Sans/Urbanist) were removed —
// their CSS variables were never consumed; every token resolves to the
// self-hosted ITCAvantGardeStd face.

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bagifyyyy.in"),
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  title: {
     default: "BAGIFYYYY (Bagify) | Y2K Streetwear & Vintage Finds",
    template: "%s | BAGIFYYYY",
  },
   description: "BAGIFYYYY makes small-run Y2K streetwear and finds one-off vintage pieces in India. Shop oversized tees, cargos, denim, and more.",
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
     title: "BAGIFYYYY (Bagify) | Y2K Streetwear & Vintage Finds",
     description: "Small-run Y2K streetwear and one-off vintage pieces from BAGIFYYYY.",
    siteName: "BAGIFYYYY",
  },
  twitter: {
    card: "summary_large_image",
     title: "BAGIFYYYY (Bagify) | Y2K Streetwear",
     description: "Small-run Y2K streetwear from BAGIFYYYY.",
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
import CartDrawer from "@/components/cart/CartDrawer";
import Preloader from "@/components/layout/Preloader";
import AuthModal from "@/components/auth/AuthModal";
import GsapScrollAnimations from "@/components/ui/GsapScrollAnimations";
import LenisProvider from "@/components/ui/LenisProvider";
import GlobalAnimator from "@/components/ui/GlobalAnimator";
import PageTransitionLoader from "@/components/ui/PageTransitionLoader";
import PageTransitionProvider from "@/components/ui/PageTransitionProvider";
import SmoothCursor from "@/components/ui/SmoothCursor";
import InteractionGuard from "@/components/ui/InteractionGuard";

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
      className="antialiased"
      suppressHydrationWarning
    >
      <head>
        {/* Ties the brand-name searches (BAGIFYYYY / Bagify / Bagifyy) to one entity. */}
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={webSiteJsonLd()} />
      </head>
      <body
        className="monochrome-site min-h-screen flex flex-col bg-y2k-ice text-y2k-gunmetal font-sans"
        suppressHydrationWarning
      >
        <InteractionGuard />
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
            <CartDrawer />
          </LenisProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
