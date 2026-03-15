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

interface VendorChartData {
  vendorName: string
  days: number
}

function getBarColor(days: number): string {
  if (days > 14) return '#b91c1c' // red — slow
  if (days > 7) return '#2563eb'  // blue — moderate
  return '#16803c'                 // green — fast
}

export function VendorCompletionChart({ data }: { data: VendorChartData[] }) {
  const height = Math.max(200, data.length * 36)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
      >
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          fontSize={10}
          tick={{ fill: '#6b7280' }}
        />
        <YAxis
          type="category"
          dataKey="vendorName"
          width={120}
          fontSize={10}
          tick={{ fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value} days`, 'Avg Completion']}
          contentStyle={{
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #e4e2dc',
          }}
        />
        <Bar dataKey="days" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.days)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
