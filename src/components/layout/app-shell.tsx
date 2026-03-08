"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { BottomTabBar } from "./bottom-tab-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-forest">
      <Sidebar activePath={pathname} />

      <main className="md:ml-16 p-4 md:p-6 lg:p-8 pb-24 md:pb-6">
        {children}
      </main>

      <BottomTabBar activePath={pathname} />
    </div>
  );
}
