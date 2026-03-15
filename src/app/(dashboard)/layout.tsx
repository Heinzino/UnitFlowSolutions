import { connection } from "next/server";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { UserHeader } from "@/components/layout/user-header";
import { Skeleton } from "@/components/ui";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  return (
    <AppShell
      userHeader={
        <Suspense fallback={<Skeleton className="w-32 h-8" />}>
          <UserHeader />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
