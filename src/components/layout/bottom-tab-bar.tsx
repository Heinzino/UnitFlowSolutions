"use client";

import Link from "next/link";
import {
  Building2,
  Users,
} from "lucide-react";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface TabItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const tabItems: TabItem[] = [
  { icon: Building2, label: "Properties", href: "/property" },
  { icon: Users, label: "Vendors", href: "/vendors" },
];

interface BottomTabBarProps {
  activePath: string;
}

export function BottomTabBar({ activePath }: BottomTabBarProps) {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-forest/95 backdrop-blur-sm rounded-2xl px-2 py-2 flex justify-around items-center shadow-2xl z-50">
      {tabItems.map((item) => {
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
    </nav>
  );
}
