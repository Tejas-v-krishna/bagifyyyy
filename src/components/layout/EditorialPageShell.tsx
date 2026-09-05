import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type EditorialPageShellProps = {
  /** Kept for call-site compatibility; micro-kickers are no longer rendered. */
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  wide?: boolean;
  actions?: React.ReactNode;
};

export default function EditorialPageShell({
  title,
  description,
  children,
  backHref = "/",
  backLabel = "Back to store",
  wide = false,
  actions,
}: EditorialPageShellProps) {
  return (
    <div className="editorial-page min-h-screen bg-[#f5f5f2] px-4 py-8 font-sans text-black sm:px-6 sm:py-12 lg:px-10 selection:bg-black selection:text-white">
      <div className={`mx-auto w-full ${wide ? "max-w-[1440px]" : "max-w-[1180px]"}`}>
        {/* Navigation Bar */}
        <div className="mb-8 flex items-center justify-start border-b border-black/10 pb-3">
          <Link
            href={backHref}
            className="editorial-back inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/50 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {backLabel}
          </Link>
        </div>

        {/* Monumental Editorial Header */}
        <header className="editorial-page-header mb-8 border-b border-black/10 pb-6 sm:mb-12 sm:pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="max-w-[16ch] font-microgramma text-[clamp(2.1rem,6vw,5.5rem)] font-bold uppercase leading-[0.88] tracking-tight text-[#050505]">
                {title}
              </h1>
              {description && (
                <p className="mt-5 max-w-xl text-xs leading-relaxed text-black/60 sm:text-sm">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-5 sm:gap-7 self-start md:self-end flex-wrap pb-0.5 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

export function EditorialPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`editorial-panel rounded-xl border border-black/10 bg-white p-5 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] ${className}`}>
      {children}
    </section>
  );
}

export function EditorialLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">
      {children}
    </p>
  );
}
