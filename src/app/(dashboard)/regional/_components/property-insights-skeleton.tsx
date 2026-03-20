import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PropertyInsightsSkeleton() {
  return (
    <>
      <Card>
        <div className="px-6 py-3 border-b border-border">
          <h2 className="font-heading text-xl font-bold text-text-primary">Property Insights</h2>
        </div>
        <div className="flex flex-col gap-2 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
      <Card>
        <div className="px-6 py-3 border-b border-border">
          <h2 className="font-heading text-xl font-bold text-text-primary">Avg Turn Time by Property</h2>
        </div>
        <div className="p-6">
          <Skeleton className="h-[220px] w-full" />
        </div>
      </Card>
    </>
  )
}
