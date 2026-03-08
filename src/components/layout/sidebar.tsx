"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { Tooltip } from "radix-ui";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Building2, label: "Properties", href: "/property" },
  { icon: Users, label: "Vendors", href: "/vendors" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
  activePath: string;
}

function SidebarIcon({
  icon: Icon,
  label,
  href,
  isActive,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Link
          href={href}
          className={clsx(
            "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
            isActive
              ? "bg-emerald text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          <Icon size={20} />
        </Link>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="bg-text-primary text-white text-sm px-3 py-1.5 rounded-badge shadow-lg z-[100]"
        >
          {label}
          <Tooltip.Arrow className="fill-text-primary" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function Sidebar({ activePath }: SidebarProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 flex-col items-center py-6 gap-2 bg-forest border-r border-white/10 z-50">
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) => (
            <SidebarIcon
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={activePath === item.href}
            />
          ))}
        </nav>

        <div className="mt-auto">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => {
                  /* Logout handler -- to be implemented */
                }}
              >
                <LogOut size={20} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="right"
                sideOffset={8}
                className="bg-text-primary text-white text-sm px-3 py-1.5 rounded-badge shadow-lg z-[100]"
              >
                Logout
                <Tooltip.Arrow className="fill-text-primary" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </aside>
    </Tooltip.Provider>
  );
}
