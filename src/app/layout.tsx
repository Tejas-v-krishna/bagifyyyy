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
  title: "BAGIFYYYY | Y2K Streetwear & Archive",
  description: "Y2K-era streetwear drop culture. No restocks, no replicas.",
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/helvetica-neue-55" />
      </head>
      <body
        className="min-h-screen flex flex-col bg-y2k-ice text-y2k-gunmetal font-sans"
        suppressHydrationWarning
      >
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
