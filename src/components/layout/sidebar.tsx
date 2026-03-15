"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Building2, label: "Properties", href: "/property" },
  { icon: Users, label: "Vendors", href: "/vendors" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
  activePath: string;
}

export function Sidebar({ activePath }: SidebarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex flex-col w-[220px] h-[calc(100vh-1.5rem)] bg-white rounded-[20px] shadow-lg border border-white/30">
      {/* Logo */}
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-forest rounded-badge flex items-center justify-center">
            <span className="text-chartreuse font-heading font-bold text-sm">UF</span>
          </div>
          <span className="font-heading font-bold text-lg text-text-primary">UnitFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors w-full"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
