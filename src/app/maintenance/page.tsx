import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * Maintenance takeover.
 *
 * Deliberately a server component with no data access: it must render even
 * when Turso is unreachable or the catalogue is degraded, which is precisely
 * when a maintenance page is needed. Nothing here touches Prisma.
 *
 * Copy is kept short on purpose. A holding page has three jobs — say the shop
 * is down, say it won't be long, say where to write — and padding it with
 * reassurance reads worse than saying almost nothing.
 */
export const metadata: Metadata = {
  // `absolute` opts out of the root layout's "%s | BAGIFYYYY" template, which
  // would otherwise render the brand twice.
  title: { absolute: "Back soon | BAGIFYYYY" },
  description: "BAGIFYYYY is offline for maintenance. Back soon.",
  // A holding page must never end up in search results.
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#f5f5f2] px-4 py-8 font-sans text-black selection:bg-black selection:text-white sm:px-6 sm:py-10 lg:px-10">
      {/* Faint hairline grid, the same quiet structural motif used on the
          storefront's editorial sections. Decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(11,11,11,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,11,11,0.045) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* ── Top bar: wordmark left, status right ───────────────────────── */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 border-b border-black/10 pb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bagifyyyy-wordmark.webp"
          alt="BAGIFYYYY"
          width={613}
          height={140}
          className="h-8 w-auto object-contain sm:h-10"
        />

        <span className="inline-flex shrink-0 items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.2em] text-black/50 sm:text-[10px]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40 motion-reduce:animate-none" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-black" />
          </span>
          Closed
        </span>
      </header>

      {/* ── Centre: the actual message ──────────────────────────────────── */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 items-center py-14 sm:py-20">
        <div className="w-full max-w-3xl">
          <h1 className="font-microgramma text-[clamp(2.6rem,10vw,7rem)] font-bold uppercase leading-[0.86] tracking-tight text-[#050505]">
            Back
            <br />
            soon
          </h1>

          <div className="mt-8 h-px w-full max-w-md bg-black/15" />

          <p className="mt-8 max-w-md text-[13px] leading-relaxed text-black/60 sm:text-sm">
            Shop&rsquo;s offline while we fix something. Shouldn&rsquo;t be
            long.
          </p>
        </div>
      </main>

      {/* ── Bottom bar: one escape hatch ───────────────────────────────── */}
      <footer className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">
          For anything urgent
        </p>

        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 self-start border-b border-black/30 pb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:border-black sm:self-auto"
        >
          Contact us
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
