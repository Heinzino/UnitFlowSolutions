import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ExecutiveKPIs } from './_components/executive-kpis';
import { ExecutiveKPISkeleton } from './_components/executive-kpi-skeleton';

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-text-primary">
          Executive Dashboard
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Welcome, {displayName} &mdash; {today}
        </p>
      </div>

      <Suspense fallback={<ExecutiveKPISkeleton />}>
        <ExecutiveKPIs />
      </Suspense>
    </div>
  );
}
