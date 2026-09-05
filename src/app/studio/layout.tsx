"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Plus, 
  Package, 
  LogOut, 
  Mail, 
  ShoppingBag, 
  Layers, 
  Camera, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const navItems = [
  { href: "/studio", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/studio/products", label: "Products & Catalog", icon: Package },
  { href: "/studio/products/new", label: "Add Product", icon: Plus },
  { href: "/studio/bundles", label: "Bundles", icon: Layers },
  { href: "/studio/orders", label: "Orders", icon: ShoppingBag },
  { href: "/studio/instagram", label: "Instagram Feed", icon: Camera },
  { href: "/studio/marketing", label: "Email Marketing", icon: Mail },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all rounded-none ${
        isActive
          ? "text-white bg-y2k-gunmetal shadow-xs"
          : "text-y2k-gunmetal/75 hover:text-black hover:bg-y2k-ice/80"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </div>
      {isActive && <span className="text-[10px]">→</span>}
    </Link>
  );
}

function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/studio/logout", { method: "POST" });
    router.push("/studio/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-all w-full text-left cursor-pointer"
    >
      <LogOut className="w-4 h-4 shrink-0 text-red-600" />
      <span>Sign Out</span>
    </button>
  );
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // If on studio/login, render without sidebar layout
  if (pathname === "/studio/login") {
    return <div className="min-h-screen bg-y2k-ice text-y2k-gunmetal font-sans">{children}</div>;
  }

  const currentNav = navItems.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)));

  return (
    <div className="min-h-screen bg-y2k-ice text-y2k-gunmetal font-sans relative">
      {/* Desktop sidebar; mobile keeps the same navigation in a horizontal rail. */}
      <aside className="hidden w-64 fixed top-0 left-0 bottom-0 h-screen z-50 lg:flex flex-col border-r border-y2k-gunmetal/15 bg-white shadow-xs select-none overflow-hidden">
        {/* Brand Studio Header */}
        <div className="px-5 py-6 border-b border-y2k-gunmetal/15 bg-white shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate">
              BAGIFYYYY
            </span>
            <span className="inline-flex items-center gap-1 bg-y2k-gunmetal/5 px-2 py-0.5 border border-y2k-gunmetal/15 text-[8px] font-bold uppercase tracking-wider text-y2k-gunmetal">
              <ShieldCheck className="w-3 h-3" /> ADMIN
            </span>
          </div>
          <h2 className="font-display font-medium text-2xl uppercase tracking-[-0.03em] text-y2k-gunmetal">
            ADMIN PANEL
          </h2>
          <p className="text-[10px] text-y2k-gunmetal/60 mt-0.5">
            Store Management &amp; Controls
          </p>

          {/* Quick Return to Store Button */}
          <Link
            href={process.env.NEXT_PUBLIC_APP_URL || "/"}
            target="_blank"
            className="mt-4 flex items-center justify-between w-full bg-y2k-ice border border-y2k-gunmetal/10 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-y2k-gunmetal hover:bg-y2k-gunmetal hover:text-white transition-all cursor-pointer shadow-xs"
          >
            <span>VIEW PUBLIC STORE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Navigation Menu (Scrolls internally if menu items exceed height) */}
        <nav className="flex flex-col gap-1 py-4 flex-1 min-h-0 overflow-y-auto px-2">
          <span className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-y2k-slate mb-1">
            NAVIGATION
          </span>
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        {/* Studio Footer / Logout */}
        <div className="border-t border-y2k-gunmetal/15 p-2 bg-white shrink-0">
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main Studio Workspace ───────────────────────────────────────────── */}
      <div className="min-h-screen flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Top Control Bar */}
        <header className="h-16 border-b border-y2k-gunmetal/15 bg-white px-8 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-y2k-gunmetal">
            <Link href="/studio" className="lg:hidden text-y2k-gunmetal" aria-label="Studio dashboard">
              <LayoutDashboard className="h-4 w-4" />
            </Link>
            <span className="text-y2k-slate">ADMIN</span>
            <span className="text-y2k-gunmetal/30">/</span>
            <span className="text-y2k-gunmetal">{currentNav?.label || "DASHBOARD"}</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-y2k-gunmetal/80">
            <div className="flex items-center gap-2 bg-y2k-ice border border-y2k-gunmetal/15 px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>SYSTEM ONLINE</span>
            </div>
            <Link
              href={process.env.NEXT_PUBLIC_APP_URL || "/"}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-y2k-slate hover:text-black transition-colors"
            >
              <span>View Store Front</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <nav className="flex gap-1 overflow-x-auto border-b border-y2k-gunmetal/15 bg-white px-3 py-2 lg:hidden" aria-label="Studio navigation">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
        <main className="flex-1 bg-y2k-ice p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
