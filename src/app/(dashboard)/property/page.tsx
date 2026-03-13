import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PMDashboard } from './_components/pm-dashboard';

export default async function PropertyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const assignedProperties: string[] = user.app_metadata?.property_ids ?? [];
  const role: string = user.app_metadata?.role ?? 'pm';
  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown';

  return (
    <PMDashboard
      assignedProperties={assignedProperties}
      role={role}
      displayName={displayName}
    />
  );
}
