import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export default async function ExecutivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown';

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
          Executive Dashboard
        </h1>
        <p className="text-text-secondary text-sm mb-4">
          Welcome, {displayName}
        </p>

        <p className="text-text-secondary text-sm">
          All Properties
        </p>

        <p className="text-text-secondary text-sm mt-4">
          Executive KPIs coming in Phase 4.
        </p>
      </Card>
    </div>
  );
}
