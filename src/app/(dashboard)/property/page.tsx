export const dynamic = 'force-dynamic'

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PMDashboard } from './_components/pm-dashboard';
import { PMKPIs } from './_components/pm-kpis';
import { PMKPISkeleton } from './_components/pm-kpi-skeleton';
import { PMTurnList } from './_components/pm-turn-list';
import { PMTurnListSkeleton } from './_components/pm-turn-list-skeleton';

export default async function PropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const assignedProperties: string[] = user.app_metadata?.property_ids ?? [];
  const role: string = user.app_metadata?.role ?? 'pm';
  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown';

  const { property } = await searchParams;
  const effectiveProperties =
    property && assignedProperties.includes(property)
      ? [property]
      : assignedProperties;

  // Key forces Suspense remount when property filter changes
  const filterKey = property ?? 'all';

  return (
    <PMDashboard
      assignedProperties={assignedProperties}
      displayName={displayName}
    >
      <Suspense key={`kpis-${filterKey}`} fallback={<PMKPISkeleton />}>
        <PMKPIs assignedProperties={effectiveProperties} role={role} />
      </Suspense>

      <Suspense key={`turns-${filterKey}`} fallback={<PMTurnListSkeleton />}>
        <PMTurnList assignedProperties={effectiveProperties} role={role} />
      </Suspense>
    </PMDashboard>
  );
}
