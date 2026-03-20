'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export interface ChartDataPoint {
  propertyName: string
  days: number
}

export function getBarColor(days: number): string {
  if (days > 14) return '#b91c1c' // red
  if (days >= 7) return '#d97706' // amber
  return '#16803c'                 // green
}

export function AvgTurnTimeChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 0 }}>
        <XAxis
          type="category"
          dataKey="propertyName"
          fontSize={10}
          tick={{ fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          angle={-35}
          textAnchor="end"
          tickFormatter={(value: string) => value.length > 16 ? value.slice(0, 16) + '...' : value}
        />
        <YAxis
          type="number"
          fontSize={10}
          tick={{ fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value) => [`${value} days`, 'Avg Turn Time']}
          contentStyle={{
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #e4e2dc',
          }}
        />
        <Bar dataKey="days" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.days)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
