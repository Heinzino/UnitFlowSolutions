import { Home } from 'lucide-react'
import { KPICard } from '@/components/ui/kpi-card'

export function PMKPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <KPICard
          key={i}
          icon={Home}
          label=""
          value=""
          loading={true}
        />
      ))}
    </div>
  )
}
