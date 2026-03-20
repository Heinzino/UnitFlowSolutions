'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PropertyMultiSelect, type PropertyOption } from '@/components/ui/property-multi-select';

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

  // Parse comma-separated properties from URL
  const propertiesParam = searchParams.get('properties') ?? '';
  const selectedNames = propertiesParam ? propertiesParam.split(',').map(decodeURIComponent) : [];

  const propertyOptions: PropertyOption[] = assignedProperties.map((name) => ({
    name,
    streetAddress: '',
  }));

  const selectedOptions = propertyOptions.filter((p) => selectedNames.includes(p.name));

  function handleChange(selected: PropertyOption[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (selected.length === 0) {
      params.delete('properties');
    } else {
      params.set('properties', selected.map((p) => encodeURIComponent(p.name)).join(','));
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

      {/* Property filter — searchable multi-select, same as completed-jobs */}
      {showFilter && (
        <div className="max-w-sm">
          <PropertyMultiSelect
            properties={propertyOptions}
            selected={selectedOptions}
            onChange={handleChange}
            placeholder="Filter by property"
          />
        </div>
      )}

      {/* Server-rendered KPIs and turn list passed as children */}
      {children}
    </div>
  );
}
