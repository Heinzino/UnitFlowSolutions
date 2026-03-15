export const dynamic = 'force-dynamic'

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ExecutiveKPIs } from './_components/executive-kpis';
import { ExecutiveKPISkeleton } from './_components/executive-kpi-skeleton';
import { ExecutiveCharts } from './_components/executive-charts';
import { ExecutiveChartsSkeleton } from './_components/executive-charts-skeleton';

export default async function ExecutivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="font-heading font-bold text-xl text-white">
          Executive Dashboard
        </h1>
        <p className="text-white/70 text-sm mt-0.5">
          Welcome, {displayName} &mdash; {today}
        </p>
      </div>

      <Suspense fallback={<ExecutiveKPISkeleton />}>
        <ExecutiveKPIs />
      </Suspense>

      <Suspense fallback={<ExecutiveChartsSkeleton />}>
        <ExecutiveCharts />
      </Suspense>
    </div>
  );
}
