import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Heavy CJS deps stay in the runtime layer instead of being bundled
  // into every one of the 100+ server functions.
  serverExternalPackages: [
    "stripe",
    "razorpay",
    "nodemailer",
    "resend",
    "google-auth-library",
    "better-sqlite3",
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
  ],
  // Barrel imports (lucide-react = hundreds of icons) resolve to only
  // the icons actually used, shrinking both server and client bundles.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@gsap/react", "gsap", "animejs"],
  },
  // Turbopack otherwise walks up to C:\Users\tejas (package-lock.json outside
  // the repo), which both spams warnings and slows file resolution.
  turbopack: {
    root: __dirname,
  },
  images: {
    qualities: [75, 100],
    // Serve modern formats and cache optimized variants for a month; uploaded
    // files get unique names so content never changes behind a URL.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "**.stripe.com" },
      { protocol: "https", hostname: "**.razorpay.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.vercel-storage.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
