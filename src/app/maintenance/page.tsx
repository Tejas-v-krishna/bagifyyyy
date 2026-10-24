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
 * Visually it borrows the storefront's monochrome editorial language — paper
 * canvas (#f5f5f2), ink type, hairline rules, no shadows — so it reads as part
 * of the brand rather than a generic holding screen.
 */
export const metadata: Metadata = {
  // `absolute` opts out of the root layout's "%s | BAGIFYYYY" template, which
  // would otherwise render the brand twice.
  title: { absolute: "Back shortly | BAGIFYYYY" },
  description:
    "BAGIFYYYY is temporarily closed for maintenance. The archive reopens shortly.",
  // A holding page must never end up in search results.
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#f5f5f2] px-4 py-8 font-sans text-black selection:bg-black selection:text-white sm:px-6 sm:py-10 lg:px-10">
      {/* Faint hairline grid — the same quiet structural motif used on the
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
          Closed for maintenance
        </span>
      </header>

      {/* ── Centre: the actual message ──────────────────────────────────── */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 items-center py-14 sm:py-20">
        <div className="w-full max-w-3xl">
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.24em] text-black/45">
            Temporary closure
          </p>

          <h1 className="font-microgramma text-[clamp(2.6rem,10vw,7rem)] font-bold uppercase leading-[0.86] tracking-tight text-[#050505]">
            Back
            <br />
            shortly
          </h1>

          <div className="mt-8 h-px w-full max-w-md bg-black/15" />

          <p className="mt-8 max-w-lg text-[13px] leading-relaxed text-black/60 sm:text-sm">
            We&rsquo;re making a few changes behind the counter. The archive is
            closed while we work — every piece is still one of one, and nothing
            has been sold in your absence.
          </p>

          <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-black/60 sm:text-sm">
            Browsing and checkout return the moment we reopen.
          </p>

          {/* Status strip — reads as a ledger row, matching the storefront's
              data-first typography. */}
          <dl className="mt-10 grid w-full max-w-lg grid-cols-2 gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 sm:max-w-xl">
            <div className="bg-white px-4 py-3.5">
              <dt className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-black/45">
                Status
              </dt>
              <dd className="mt-1 text-[12.5px] font-medium text-black">
                Maintenance in progress
              </dd>
            </div>
            <div className="bg-white px-4 py-3.5">
              <dt className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-black/45">
                Store
              </dt>
              <dd className="mt-1 text-[12.5px] font-medium text-black">
                Reopening soon
              </dd>
            </div>
          </dl>
        </div>
      </main>

      {/* ── Bottom bar: one escape hatch ───────────────────────────────── */}
      <footer className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">
          Need something now? We&rsquo;re still reading messages.
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
