"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Plus, Package, LogOut, Mail, ShoppingBag, Layers, Camera } from "lucide-react";

const navItems = [
  { href: "/studio", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/studio/products/new", label: "Add Product", icon: Plus },
  { href: "/studio/bundles", label: "Bundles", icon: Layers },
  { href: "/studio/orders", label: "Orders", icon: ShoppingBag },
  { href: "/studio/instagram", label: "Instagram Feed", icon: Camera },
  { href: "/studio/marketing", label: "Drop Marketing", icon: Mail },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: any;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 text-[9px] font-bold uppercase tracking-widest transition-all ${
        isActive
          ? "text-white bg-white/10"
          : "text-gray-500 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
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
      className="flex items-center gap-3 px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:text-white hover:bg-white/5 transition-all w-full"
    >
      <LogOut className="w-4 h-4 shrink-0" />
      Log Out
    </button>
  );
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/5 fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="px-4 py-6 border-b border-white/5">
          <p className="text-[7px] uppercase tracking-[0.4em] text-gray-600 mb-1">
            BAGIFYYYY
          </p>
          <h2 className="text-white font-medium text-base tracking-tight">
            Studio
          </h2>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 py-4 flex-1">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 py-2">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 min-h-screen">{children}</main>
    </div>
  );
}
