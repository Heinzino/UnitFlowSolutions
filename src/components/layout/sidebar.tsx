"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  LayoutDashboard,
  LogOut,
  UserPlus,
  DoorOpen,
  ClipboardCheck,
  Map,
} from "lucide-react";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types/auth";
import { useEffect, useState } from "react";

const ADMIN_EMAILS = ["heinz@readymation.com", "jgiles@cdvsolutions.com"] as const;

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Executive", href: "/executive", roles: ["exec"] },
  { icon: Map, label: "Regional Dashboard", href: "/regional", roles: ["rm"] },
  { icon: Building2, label: "Properties", href: "/property" },
  { icon: ClipboardCheck, label: "Completed Jobs", href: "/property/completed-jobs" },
  { icon: Users, label: "Vendors", href: "/vendors" },
  { icon: DoorOpen, label: "Add Off Market", href: "/vacant" },
];

interface SidebarProps {
  activePath: string;
}

export function Sidebar({ activePath }: SidebarProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("pm");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setRole((user.app_metadata?.role as UserRole) ?? "pm");
          setIsAdmin(ADMIN_EMAILS.includes(user.email ?? ""));
        }
      }).catch(() => {});
    } catch {
      // Supabase client unavailable (e.g. missing env vars in tests)
    }
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

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
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/regional' ? activePath.startsWith('/regional') : activePath === item.href;
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

      {/* Admin Section */}
      {isAdmin && (
        <>
          <div className="mx-3 border-t border-gray-100" />
          <div className="px-3 py-1">
            <Link
              href="/admin/create-user"
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                activePath === "/admin/create-user"
                  ? "bg-emerald text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              )}
            >
              <UserPlus size={18} />
              <span>Create User</span>
            </Link>
          </div>
          <div className="mx-3 border-t border-gray-100" />
        </>
      )}

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
