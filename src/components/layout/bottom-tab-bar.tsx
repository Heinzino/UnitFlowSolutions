"use client";

import Link from "next/link";
import {
  Building2,
  Users,
  LayoutDashboard,
  UserPlus,
  DoorOpen,
} from "lucide-react";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/lib/types/auth";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const ADMIN_EMAILS = ["heinz@readymation.com", "jgiles@cdvsolutions.com"] as const;

interface TabItem {
  icon: LucideIcon;
  label: string;
  href: string;
  roles?: UserRole[];
}

const tabItems: TabItem[] = [
  { icon: LayoutDashboard, label: "Executive", href: "/executive", roles: ["exec"] },
  { icon: Building2, label: "Properties", href: "/property" },
  { icon: Users, label: "Vendors", href: "/vendors" },
  { icon: DoorOpen, label: "Add Off Market", href: "/vacant" },
];

interface BottomTabBarProps {
  activePath: string;
}

export function BottomTabBar({ activePath }: BottomTabBarProps) {
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

  const visibleItems = tabItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-forest/95 backdrop-blur-sm rounded-2xl px-2 py-2 flex justify-around items-center shadow-2xl z-50">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePath === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
              isActive
                ? "bg-emerald text-white"
                : "text-white/60"
            )}
            aria-label={item.label}
          >
            <Icon size={20} />
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          href="/admin/create-user"
          className={clsx(
            "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
            activePath === "/admin/create-user"
              ? "bg-emerald text-white"
              : "text-white/60"
          )}
          aria-label="Create User"
        >
          <UserPlus size={20} />
        </Link>
      )}
    </nav>
  );
}
