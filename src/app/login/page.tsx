'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { login } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen bg-forest flex items-center justify-center">
      <Card className="w-full max-w-sm mx-4 p-8">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-1">
          ScheduleSimple
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Property management, simplified
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="you@company.com"
            autoComplete="off"
            required
          />
          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="********"
            autoComplete="off"
            required
          />

          {state?.error && (
            <p className="text-sm text-negative">{state.error}</p>
          )}

          <Button
            variant="cta"
            type="submit"
            disabled={pending}
            className="w-full mt-2"
          >
            {pending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
