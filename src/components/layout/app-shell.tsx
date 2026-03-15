"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { BottomTabBar } from "./bottom-tab-bar";
import { User } from "lucide-react";

export function AppShell({
  children,
  userHeader,
}: {
  children: React.ReactNode;
  userHeader?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen overflow-x-hidden relative z-10 flex">
      {/* Sidebar — floating white panel on green */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 p-3 z-50">
        <Sidebar activePath={pathname} />
      </div>

      {/* Main content — cards float directly on green */}
      <div className="flex-1 md:ml-[236px] p-3 pb-24 md:pb-3 min-h-screen">
        {/* Top header bar — its own floating card */}
        <header className="flex items-center justify-end px-6 py-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Search — commented out for now, may add later
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search here"
                className="pl-9 pr-4 py-2 bg-surface border border-card-border rounded-pill text-sm text-text-primary placeholder:text-text-secondary w-48 focus:outline-none focus:ring-2 focus:ring-emerald/30"
              />
            </div>
            */}
            {userHeader ?? (
              <div className="w-9 h-9 rounded-full bg-emerald/20 flex items-center justify-center">
                <User size={18} className="text-emerald" />
              </div>
            )}
          </div>
        </header>

        {/* Page content — cards render directly, green shows between them */}
        {children}
      </div>

      <BottomTabBar activePath={pathname} />
    </div>
  );
}
