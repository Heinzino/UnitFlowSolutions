import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PMTurnListSkeleton() {
  return (
    <Card>
      {/* Table header skeleton */}
      <Skeleton className="h-10 w-full mb-2" />
      {/* Row skeletons */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </Card>
  )
}
