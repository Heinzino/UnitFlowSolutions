import { fetchTurnRequests } from '@/lib/airtable/tables/turn-requests'
import { fetchVendors } from '@/lib/airtable/tables/vendors'
import { computeHealthScore } from '@/lib/kpis/health-score'
import { HealthGauge } from './health-gauge'
import { VendorCompletionChart } from './vendor-completion-chart'
import { Card } from '@/components/ui/card'

export async function ExecutiveCharts() {
  const [turnRequests, vendors] = await Promise.all([
    fetchTurnRequests(),
    fetchVendors(),
  ])

  const healthScore = computeHealthScore(turnRequests)

  const chartData = vendors
    .filter(v => v.avgCompletionTimeDays !== null)
    .sort((a, b) => (b.avgCompletionTimeDays ?? 0) - (a.avgCompletionTimeDays ?? 0))
    .map(v => ({ vendorName: v.vendorName, days: v.avgCompletionTimeDays! }))

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading font-semibold text-lg text-white">Analytics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HealthGauge score={healthScore} />
        <Card className="p-4">
          <h3 className="font-heading font-semibold text-sm text-text-primary mb-3">
            Avg Completion Time by Vendor (Days)
          </h3>
          {chartData.length > 0 ? (
            <VendorCompletionChart data={chartData} />
          ) : (
            <p className="text-text-secondary text-sm">No vendor data available</p>
          )}
        </Card>
      </div>
    </div>
  )
}
