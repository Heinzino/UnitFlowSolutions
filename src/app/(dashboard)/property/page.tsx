import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchProperties } from '@/lib/airtable/tables/properties';
import { PMDashboard } from './_components/pm-dashboard';
import { PMKPIs } from './_components/pm-kpis';
import { PMKPISkeleton } from './_components/pm-kpi-skeleton';
import { PMTurnList } from './_components/pm-turn-list';
import { PMTurnListSkeleton } from './_components/pm-turn-list-skeleton';
import { ActiveJobs } from './_components/active-jobs';

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

  const role: string = user.app_metadata?.role ?? 'pm';
  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown';

  // Exec sees all properties; PM/RM see their assigned set
  let assignedProperties: string[] = user.app_metadata?.property_ids ?? [];
  if (role === 'exec' && assignedProperties.length === 0) {
    const allProps = await fetchProperties();
    assignedProperties = [...new Set(allProps.map((p) => p.propertyName))].sort();
  }

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
      role={role}
    >
      <Suspense key={`kpis-${filterKey}`} fallback={<PMKPISkeleton />}>
        <PMKPIs assignedProperties={effectiveProperties} role={role} />
      </Suspense>

      <Suspense key={`turns-${filterKey}`} fallback={<PMTurnListSkeleton />}>
        <PMTurnList assignedProperties={effectiveProperties} role={role} />
      </Suspense>

      <Suspense key={`jobs-${filterKey}`} fallback={<PMTurnListSkeleton />}>
        <ActiveJobs assignedProperties={effectiveProperties} role={role} />
      </Suspense>
    </PMDashboard>
  );
}
