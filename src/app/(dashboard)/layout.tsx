import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { UserHeader } from "@/components/layout/user-header";
import { Skeleton } from "@/components/ui";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AppShell
        userHeader={
          <Suspense fallback={<Skeleton className="w-32 h-8" />}>
            <UserHeader />
          </Suspense>
        }
      >
        <Suspense>{children}</Suspense>
      </AppShell>
    </Suspense>
  );
}
