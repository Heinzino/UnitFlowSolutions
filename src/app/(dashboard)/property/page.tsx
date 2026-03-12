import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export default async function PropertyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const property_ids: string[] = user.app_metadata?.property_ids ?? [];
  const role: string = user.app_metadata?.role ?? 'pm';
  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown';

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
          Property Manager Dashboard
        </h1>
        <p className="text-text-secondary text-sm mb-4">
          Welcome, {displayName} &mdash; Role: {role}
        </p>

        {property_ids.length === 0 ? (
          <p className="text-text-secondary text-sm">
            No properties assigned to your account. Contact your administrator.
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            You have {property_ids.length} propert{property_ids.length === 1 ? 'y' : 'ies'} assigned.
          </p>
        )}

        <p className="text-text-secondary text-sm mt-4">
          Dashboard content coming in Phase 5.
        </p>
      </Card>
    </div>
  );
}
