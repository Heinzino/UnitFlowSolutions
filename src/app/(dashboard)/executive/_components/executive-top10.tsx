import { fetchTurnRequests } from '@/lib/airtable/tables/turn-requests'
import { computePMKPIs } from '@/lib/kpis/pm-kpis'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { CurrencyDisplay } from '@/components/ui/currency-display'
import type { TurnRequest } from '@/lib/types/airtable'

export async function ExecutiveTop10() {
  const turnRequests = await fetchTurnRequests()

  // Group turn requests by propertyName
  const byProperty = new Map<string, TurnRequest[]>()
  for (const tr of turnRequests) {
    const group = byProperty.get(tr.propertyName) ?? []
    group.push(tr)
    byProperty.set(tr.propertyName, group)
  }

  // Compute per-property revenue exposure, filter > $0, sort desc, slice top 10
  const top10 = [...byProperty.entries()]
    .map(([propertyName, turns]) => ({
      propertyName,
      revenueExposure: computePMKPIs(turns).revenueExposure,
    }))
    .filter((p) => p.revenueExposure > 0)
    .sort((a, b) => b.revenueExposure - a.revenueExposure)
    .slice(0, 10)

  return (
    <Card variant="flush">
      <div className="px-6 py-3 border-b border-border">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          Top 10 Properties by Revenue Exposure
        </h2>
      </div>
      {top10.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-text-secondary">No properties with revenue exposure</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Property Name</TableHead>
              <TableHead className="text-right">Revenue Exposure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {top10.map((row) => (
              <TableRow key={row.propertyName}>
                <TableCell className="text-left">{row.propertyName}</TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={row.revenueExposure} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
