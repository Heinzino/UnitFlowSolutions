import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ExecutiveChartsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="w-24 h-6" /> {/* "Analytics" heading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 flex flex-col items-center gap-2">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="w-20 h-4" />
        </Card>
        <Card className="p-4 flex flex-col gap-2">
          <Skeleton className="w-48 h-4" />
          <Skeleton className="w-full h-[200px]" />
        </Card>
      </div>
    </div>
  )
}
