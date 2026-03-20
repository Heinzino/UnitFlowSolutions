'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PropertySelector } from '@/components/layout/property-selector';

interface PMDashboardProps {
  assignedProperties: string[];
  displayName: string;
  role?: string;
  children: React.ReactNode;
}

const ROLE_TITLES: Record<string, string> = {
  exec: 'Executive Dashboard',
  rm: 'Regional Dashboard',
  pm: 'Property Manager Dashboard',
};

export function PMDashboard({
  assignedProperties,
  displayName,
  role = 'pm',
  children,
}: PMDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProperty = searchParams.get('property') ?? '';

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'All Properties' || value === '') {
      params.delete('property');
    } else {
      params.set('property', value);
    }
    const qs = params.toString();
    router.push(`/property${qs ? `?${qs}` : ''}`);
  }

  // Show filter for all roles except PM with only one property
  const showFilter = role !== 'pm' || assignedProperties.length > 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div>
        <h1 className="font-heading font-bold text-xl text-white">
          {ROLE_TITLES[role] ?? 'Dashboard'}
        </h1>
        <p className="text-white/70 text-sm mt-0.5">
          Welcome, {displayName}
        </p>
      </div>

      {/* Property filter — hidden only for PM with a single property */}
      {showFilter && (
        <div>
          <PropertySelector
            properties={['All Properties', ...assignedProperties]}
            selectedProperty={selectedProperty === '' ? 'All Properties' : selectedProperty}
            onSelect={handleSelect}
          />
        </div>
      )}

      {/* Server-rendered KPIs and turn list passed as children */}
      {children}
    </div>
  );
}
