"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { BottomTabBar } from "./bottom-tab-bar";
import { Search, Mail, Bell, User } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
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
        <header className="flex items-center justify-between px-6 py-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald/10 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-1 h-1 rounded-full bg-emerald" />
                <div className="w-1 h-1 rounded-full bg-emerald" />
                <div className="w-1 h-1 rounded-full bg-emerald" />
                <div className="w-1 h-1 rounded-full bg-emerald" />
              </div>
            </div>
            <h1 className="text-lg font-heading font-semibold text-emerald">Overview</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search here"
                className="pl-9 pr-4 py-2 bg-surface border border-card-border rounded-pill text-sm text-text-primary placeholder:text-text-secondary w-48 focus:outline-none focus:ring-2 focus:ring-emerald/30"
              />
            </div>
            <button className="w-9 h-9 rounded-full bg-forest flex items-center justify-center text-white hover:bg-forest-light transition-colors">
              <Mail size={16} />
            </button>
            <button className="w-9 h-9 rounded-full bg-forest flex items-center justify-center text-white hover:bg-forest-light transition-colors">
              <Bell size={16} />
            </button>
            <div className="w-9 h-9 rounded-full bg-emerald/20 flex items-center justify-center">
              <User size={18} className="text-emerald" />
            </div>
          </div>
        </header>

        {/* Page content — cards render directly, green shows between them */}
        {children}
      </div>

      <BottomTabBar activePath={pathname} />
    </div>
  );
}
