interface HealthGaugeProps {
  score: number | null
  size?: number
}

function getColor(score: number | null): string {
  if (score === null) return '#9ca3af' // gray for no data
  if (score >= 88) return '#16803c'    // green — Healthy
  if (score >= 75) return '#b45309'    // amber — At Risk
  return '#b91c1c'                     // red — Critical
}

function getLabel(score: number | null): string {
  if (score === null) return 'No Data'
  if (score >= 88) return 'Healthy'
  if (score >= 75) return 'At Risk'
  return 'Critical'
}

export function HealthGauge({ score, size = 128 }: HealthGaugeProps) {
  const r = 52
  const cx = 64
  const cy = 64
  const circ = 2 * Math.PI * r
  const dash = circ * 0.75 // 75% visible arc (bottom-opening semi-circle)
  const fill = dash * ((score ?? 0) / 100)
  const color = getColor(score)
  const label = getLabel(score)

  return (
    <div className="bg-card rounded-card p-4 shadow-sm flex flex-col items-center gap-2">
      <h3 className="font-heading font-semibold text-sm text-text-primary">
        Turn Health Score
      </h3>
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        aria-label={`Health gauge: ${score !== null ? `${score}%` : 'No data'}`}
      >
        {/* Track arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e4e2dc"
          strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Fill arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Score number */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="24"
          fontWeight="bold"
          fill={color}
        >
          {score !== null ? score : '—'}
        </text>
        {/* Label */}
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="#6b7280"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}
