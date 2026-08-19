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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bagifyyyy.com"),
  title: {
    default: "BAGIFYYYY | Y2K Streetwear & Archive",
    template: "%s | BAGIFYYYY",
  },
  description: "Y2K-era streetwear drop culture. No restocks, no replicas. 1-of-1 curated vintage archive garments.",
  keywords: ["Y2K fashion", "streetwear", "archive fashion", "vintage clothing", "bagifyyyy", "oversized tees", "cargos"],
  authors: [{ name: "BAGIFYYYY ARCHIVE" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bagifyyyy.com",
    title: "BAGIFYYYY | Y2K Streetwear & Archive",
    description: "Y2K-era streetwear drop culture. No restocks, no replicas.",
    siteName: "BAGIFYYYY",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "BAGIFYYYY Y2K Archive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BAGIFYYYY | Y2K Streetwear & Archive",
    description: "Y2K-era streetwear drop culture. No restocks, no replicas.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
