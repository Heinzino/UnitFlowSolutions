import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export default async function DistrictPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const property_ids: string[] = user.app_metadata?.property_ids ?? [];
  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown';

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
          District Manager Dashboard
        </h1>
        <p className="text-text-secondary text-sm mb-4">
          Welcome, {displayName}
        </p>

        <p className="text-text-secondary text-sm">
          You have {property_ids.length} propert{property_ids.length === 1 ? 'y' : 'ies'} assigned.
        </p>

        <p className="text-text-secondary text-sm mt-4">
          Portfolio overview coming in Phase 6.
        </p>
      </Card>
    </div>
  );
}
