'use client';

import { Suspense, useState } from 'react';
import { PropertySelector } from '@/components/layout/property-selector';
import { PMKPIs } from './pm-kpis';
import { PMKPISkeleton } from './pm-kpi-skeleton';
import { PMTurnList } from './pm-turn-list';
import { PMTurnListSkeleton } from './pm-turn-list-skeleton';

interface PMDashboardProps {
  assignedProperties: string[];
  role: string;
  displayName: string;
}

export function PMDashboard({
  assignedProperties,
  role,
  displayName,
}: PMDashboardProps) {
  // "" sentinel = "All Properties"
  const [selectedProperty, setSelectedProperty] = useState('');

  // Compute effective scope for data fetching
  const effectiveProperties =
    selectedProperty === '' ? assignedProperties : [selectedProperty];

  function handleSelect(value: string) {
    if (value === 'All Properties') {
      setSelectedProperty('');
    } else {
      setSelectedProperty(value);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page header — dark green background, white text per Phase 4 pattern */}
      <div>
        <h1 className="font-heading font-bold text-xl text-white">
          Property Manager Dashboard
        </h1>
        <p className="text-white/70 text-sm mt-0.5">
          Welcome, {displayName}
        </p>
      </div>

      {/* Property filter — hidden when PM has only one property */}
      {assignedProperties.length > 1 && (
        <div>
          <PropertySelector
            properties={['All Properties', ...assignedProperties]}
            selectedProperty={selectedProperty === '' ? 'All Properties' : selectedProperty}
            onSelect={handleSelect}
          />
        </div>
      )}

      {/* KPI grid — keyed on selectedProperty to force remount on filter change */}
      <Suspense key={`kpis-${selectedProperty}`} fallback={<PMKPISkeleton />}>
        <PMKPIs assignedProperties={effectiveProperties} />
      </Suspense>

      {/* Turn list — keyed on selectedProperty to force remount on filter change */}
      <Suspense key={`turns-${selectedProperty}`} fallback={<PMTurnListSkeleton />}>
        <PMTurnList assignedProperties={effectiveProperties} role={role} />
      </Suspense>
    </div>
  );
}
