'use client'

import { useState, useMemo } from 'react'
import { PropertyMultiSelect, type PropertyOption } from '@/components/ui/property-multi-select'
import { ActiveJobsTable } from '../../_components/active-jobs-table'
import type { Job } from '@/lib/types/airtable'

type CompletedJob = Job & { unitNumber?: string; turnRequestId?: number; propertyName?: string }

interface CompletedJobsClientProps {
  jobs: CompletedJob[]
  propertyNames: string[]
}

export function CompletedJobsClient({ jobs, propertyNames }: CompletedJobsClientProps) {
  const propertyOptions: PropertyOption[] = propertyNames.map((name) => ({ name, streetAddress: '' }))
  const [selectedProperties, setSelectedProperties] = useState<PropertyOption[]>([])

  const filteredJobs = useMemo(() => {
    if (selectedProperties.length === 0) return jobs
    const selectedNames = new Set(selectedProperties.map((p) => p.name))
    return jobs.filter((j) => j.propertyName && selectedNames.has(j.propertyName))
  }, [jobs, selectedProperties])

  return (
    <div className="flex flex-col gap-4">
      {propertyOptions.length > 1 && (
        <div className="max-w-sm">
          <PropertyMultiSelect
            properties={propertyOptions}
            selected={selectedProperties}
            onChange={setSelectedProperties}
            placeholder="Filter by property"
          />
        </div>
      )}
      <ActiveJobsTable jobs={filteredJobs} title="Completed Jobs" />
    </div>
  )
}
