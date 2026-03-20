import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ExecutiveTop10Skeleton() {
  return (
    <Card variant="flush">
      <div className="px-6 py-3 border-b border-border">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          Top 10 Properties by Revenue Exposure
        </h2>
      </div>
      <div className="flex flex-col gap-2 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </Card>
  )
}
