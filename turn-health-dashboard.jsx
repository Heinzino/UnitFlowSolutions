import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, AreaChart, Area
} from "recharts";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#f5f4f1",
  surface: "#ffffff",
  border: "#e4e2dc",
  borderDark: "#c8c4bc",
  navy: "#1b2a4a",
  navyLight: "#253660",
  slate: "#475569",
  muted: "#94a3b8",
  mutedLight: "#cbd5e1",
  green: "#16803c",
  greenBg: "#dcfce7",
  amber: "#b45309",
  amberBg: "#fef3c7",
  red: "#b91c1c",
  redBg: "#fee2e2",
  accent: "#2563eb",
  accentBg: "#eff6ff",
  text: "#0f172a",
  textSub: "#475569",
};

// ── Sample Data ───────────────────────────────────────────────────────────────
const markets = ["All Markets", "Atlanta", "Dallas", "Phoenix", "Charlotte", "Nashville", "Tampa", "Denver", "Austin", "Raleigh"];

const marketData = {
  "Atlanta":    { vrd: 8.2,  daysPast: 2.1, leakage: 48200,  mobilization: 1.4, adherence: 87, health: 81, turns: 42, target: 48, costPerTurn: 3840 },
  "Dallas":     { vrd: 6.9,  daysPast: 0.8, leakage: 21400,  mobilization: 0.9, adherence: 94, health: 91, turns: 61, target: 58, costPerTurn: 3210 },
  "Phoenix":    { vrd: 11.3, daysPast: 4.6, leakage: 89300,  mobilization: 2.8, adherence: 72, health: 63, turns: 28, target: 44, costPerTurn: 4680 },
  "Charlotte":  { vrd: 7.4,  daysPast: 1.3, leakage: 31700,  mobilization: 1.1, adherence: 91, health: 88, turns: 37, target: 40, costPerTurn: 3420 },
  "Nashville":  { vrd: 9.1,  daysPast: 3.2, leakage: 61800,  mobilization: 2.1, adherence: 79, health: 74, turns: 33, target: 42, costPerTurn: 4120 },
  "Tampa":      { vrd: 7.1,  daysPast: 0.6, leakage: 18900,  mobilization: 0.8, adherence: 96, health: 93, turns: 55, target: 52, costPerTurn: 3080 },
  "Denver":     { vrd: 8.8,  daysPast: 2.4, leakage: 53100,  mobilization: 1.7, adherence: 84, health: 79, turns: 29, target: 36, costPerTurn: 3960 },
  "Austin":     { vrd: 7.8,  daysPast: 1.8, leakage: 39200,  mobilization: 1.3, adherence: 89, health: 85, turns: 48, target: 50, costPerTurn: 3590 },
  "Raleigh":    { vrd: 6.5,  daysPast: 0.4, leakage: 14100,  mobilization: 0.7, adherence: 97, health: 95, turns: 44, target: 44, costPerTurn: 2980 },
};

const aggregate = {
  vrd: 8.1, daysPast: 1.9, leakage: 377700, mobilization: 1.4,
  adherence: 87, health: 83, turns: 377, target: 414, costPerTurn: 3653,
};

const trendData = [
  { week: "W1", vrd: 9.2, health: 78 },
  { week: "W2", vrd: 8.8, health: 80 },
  { week: "W3", vrd: 8.4, health: 82 },
  { week: "W4", vrd: 8.1, health: 83 },
  { week: "W5", vrd: 7.9, health: 85 },
  { week: "W6", vrd: 8.1, health: 83 },
  { week: "W7", vrd: 7.8, health: 86 },
  { week: "W8", vrd: 8.1, health: 83 },
];

const vendorCostData = [
  { vendor: "ProTech HVAC",     cost: 4820, turns: 88 },
  { vendor: "Allied Plumbing",  cost: 3210, turns: 74 },
  { vendor: "PaintPros LLC",    cost: 2980, turns: 143 },
  { vendor: "Elite Electrical", cost: 1840, turns: 62 },
  { vendor: "RoofRight Inc.",   cost: 5640, turns: 31 },
  { vendor: "CleanRight Svcs",  cost: 980,  turns: 199 },
];

const agingData = [
  { range: "0–3 days",  count: 94,  pct: 25 },
  { range: "4–7 days",  count: 138, pct: 37 },
  { range: "8–14 days", count: 89,  pct: 24 },
  { range: "15–21 days",count: 42,  pct: 11 },
  { range: "21+ days",  count: 14,  pct: 4  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const healthColor = (s) => s >= 88 ? C.green : s >= 75 ? C.amber : C.red;
const healthBg    = (s) => s >= 88 ? C.greenBg : s >= 75 ? C.amberBg : C.redBg;
const healthLabel = (s) => s >= 88 ? "Healthy" : s >= 75 ? "At Risk" : "Critical";

const fmt$ = (n) => n >= 1000000 ? `$${(n/1e6).toFixed(2)}M` : `$${(n/1000).toFixed(1)}k`;

// ── Sub-components ────────────────────────────────────────────────────────────
const Divider = () => <div style={{ height: 1, background: C.border, margin: "28px 0" }} />;

const Tag = ({ children, color, bg }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
    color, background: bg, padding: "2px 8px", borderRadius: 99,
  }}>{children}</span>
);

const MetricCard = ({ label, value, unit, sub, status, delta, wide }) => {
  const sc = status === "good" ? C.green : status === "warn" ? C.amber : status === "bad" ? C.red : C.accent;
  const sb = status === "good" ? C.greenBg : status === "warn" ? C.amberBg : status === "bad" ? C.redBg : C.accentBg;
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "22px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      gridColumn: wide ? "span 2" : undefined,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", bottom: 0, right: 0,
        width: 80, height: 80,
        background: sb,
        borderRadius: "80px 0 10px 0",
        opacity: 0.6,
      }} />
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", fontFamily: "'Barlow', 'DM Sans', sans-serif" }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>{unit}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {status && <Tag color={sc} bg={sb}>{status === "good" ? "On Track" : status === "warn" ? "Watch" : "Off Track"}</Tag>}
        {delta && <span style={{ fontSize: 11, color: C.muted }}>{delta}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: C.textSub, marginTop: 2, position: "relative", zIndex: 1 }}>{sub}</div>}
    </div>
  );
};

const HealthGauge = ({ score }) => {
  const color = healthColor(score);
  const bg = healthBg(score);
  const label = healthLabel(score);
  const pct = score / 100;
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.75;
  const fill = dash * pct;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "22px 24px", display: "flex",
      flexDirection: "column", alignItems: "center", gap: 4,
    }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", alignSelf: "flex-start" }}>Turn Health Score</div>
      <svg width="128" height="84" viewBox="0 0 128 84" style={{ overflow: "visible", marginTop: 4 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
        <text x={cx} y={cy - 2} textAnchor="middle" fill={C.text}
          style={{ fontSize: 22, fontWeight: 800, fontFamily: "Barlow, sans-serif" }}>{score}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill={color}
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{label}</text>
      </svg>
      <div style={{ fontSize: 11, color: C.textSub }}>Portfolio avg · Feb 2026</div>
    </div>
  );
};

const TurnsProgress = ({ turns, target }) => {
  const pct = Math.min((turns / target) * 100, 100);
  const over = turns > target;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px" }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>MTD Turns vs. Target</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: C.text, fontFamily: "'Barlow', sans-serif" }}>{turns}</span>
        <span style={{ fontSize: 13, color: C.muted }}>of <strong style={{ color: C.text }}>{target}</strong> target</span>
      </div>
      <div style={{ background: C.bg, borderRadius: 99, height: 10, overflow: "hidden", marginBottom: 8 }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 99,
          background: over ? C.green : pct >= 80 ? C.accent : C.amber,
          transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Tag color={over ? C.green : C.amber} bg={over ? C.greenBg : C.amberBg}>
          {over ? `+${turns - target} ahead` : `${target - turns} remaining`}
        </Tag>
        <span style={{ fontSize: 11, color: C.muted }}>{Math.round(pct)}% complete</span>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function TurnDashboard() {
  const [market, setMarket] = useState("All Markets");
  const d = market === "All Markets" ? aggregate : marketData[market];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: C.text, padding: "36px 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Operations Intelligence · February 2026
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.navy, letterSpacing: "-0.02em", fontFamily: "'Barlow', 'DM Sans', sans-serif" }}>
            Turn Health Dashboard
          </h1>
          <p style={{ margin: "6px 0 0", color: C.slate, fontSize: 13 }}>15,000 units · 9 markets · Real-time operations view</p>
        </div>

        {/* Market Selector */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <label style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Filter by Market</label>
          <select value={market} onChange={e => setMarket(e.target.value)} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "8px 14px", fontSize: 13, color: C.text, fontWeight: 600,
            cursor: "pointer", outline: "none", fontFamily: "inherit",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            {markets.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ── Section 1: 6 Core Metrics ── */}
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <span>Core Turn Metrics</span>
        <span style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        <MetricCard
          label="Avg Vacancy to Ready Duration"
          value={d.vrd}
          unit="days"
          status={d.vrd <= 7 ? "good" : d.vrd <= 10 ? "warn" : "bad"}
          delta="Portfolio target: ≤7 days"
          sub={`${d.vrd > 7 ? `${(d.vrd - 7).toFixed(1)} days over target` : "Within benchmark"}`}
        />
        <MetricCard
          label="Avg Days Past Target VRD"
          value={d.daysPast}
          unit="days"
          status={d.daysPast <= 1 ? "good" : d.daysPast <= 3 ? "warn" : "bad"}
          delta="Benchmark: ≤1 day"
          sub={d.daysPast <= 1 ? "Tracking to goal" : `${d.daysPast} avg overrun per unit`}
        />
        <MetricCard
          label="MTD Cost Leakage"
          value={fmt$(d.leakage)}
          status={d.leakage < 30000 ? "good" : d.leakage < 60000 ? "warn" : "bad"}
          delta="vs. $0 target"
          sub="Idle days × daily market rent"
        />
        <MetricCard
          label="Avg Mobilization Lag"
          value={d.mobilization}
          unit="days"
          status={d.mobilization <= 1 ? "good" : d.mobilization <= 2 ? "warn" : "bad"}
          delta="Vendor dispatch to on-site"
          sub={d.mobilization <= 1 ? "Vendors responding promptly" : "Delayed vendor dispatch detected"}
        />
        <MetricCard
          label="Schedule Adherence Rate"
          value={`${d.adherence}%`}
          status={d.adherence >= 90 ? "good" : d.adherence >= 80 ? "warn" : "bad"}
          delta="Target: ≥90%"
          sub="Work orders completed on scheduled date"
        />
        <HealthGauge score={d.health} />
      </div>

      <Divider />

      {/* ── Section 2: Turns Progress + Trend ── */}
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <span>MTD Turns & Trend</span>
        <span style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 28 }}>
        <TurnsProgress turns={d.turns} target={d.target} />
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 16 }}>8-Week VRD & Health Score Trend</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[6, 11]} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[70, 95]} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Line yAxisId="l" type="monotone" dataKey="vrd" stroke={C.amber} strokeWidth={2} dot={{ r: 3, fill: C.amber }} name="VRD (days)" />
              <Line yAxisId="r" type="monotone" dataKey="health" stroke={C.accent} strokeWidth={2} dot={{ r: 3, fill: C.accent }} name="Health Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Divider />

      {/* ── Section 3: Cost per Turn by Vendor + Work Order Aging ── */}
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <span>Cost per Turn & Work Order Aging</span>
        <span style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        {/* Cost per turn */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 16 }}>Cost per Turn by Vendor</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vendorCostData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
              <YAxis type="category" dataKey="vendor" tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                formatter={v => [`$${v.toLocaleString()}`, "Cost per Turn"]} />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                {vendorCostData.map((v, i) => (
                  <Cell key={i} fill={v.cost > 4500 ? C.red : v.cost > 3000 ? C.accent : C.green} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Work Order Aging */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 16 }}>Work Order Aging</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="range" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Open Work Orders">
                {agingData.map((d, i) => (
                  <Cell key={i} fill={i <= 1 ? C.green : i === 2 ? C.accent : i === 3 ? C.amber : C.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {agingData.map((a, i) => (
              <div key={i} style={{ fontSize: 11, color: C.textSub }}>
                <strong style={{ color: C.text }}>{a.count}</strong> {a.range} <span style={{ color: C.muted }}>({a.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Section 4: Market Comparison ── */}
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <span>Market Scorecard</span>
        <span style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {["Market", "Health Score", "VRD (days)", "Days Past VRD", "Cost Leakage", "Adherence", "Turns / Target"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(marketData).sort((a, b) => b[1].health - a[1].health).map(([name, m], i) => (
              <tr key={name} style={{ borderBottom: `1px solid ${C.border}`, background: market === name ? C.accentBg : i % 2 === 0 ? C.surface : "#fafafa", cursor: "pointer" }}
                onClick={() => setMarket(name)}>
                <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: C.navy }}>{name}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    fontWeight: 700, fontSize: 13,
                    color: healthColor(m.health),
                    background: healthBg(m.health),
                    padding: "2px 10px", borderRadius: 99, fontSize: 12,
                  }}>{m.health} — {healthLabel(m.health)}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: m.vrd <= 7 ? C.green : m.vrd <= 10 ? C.amber : C.red, fontWeight: 600 }}>{m.vrd}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: m.daysPast <= 1 ? C.green : m.daysPast <= 3 ? C.amber : C.red, fontWeight: 600 }}>{m.daysPast}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: m.leakage < 30000 ? C.green : m.leakage < 60000 ? C.amber : C.red }}>{fmt$(m.leakage)}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: m.adherence >= 90 ? C.green : m.adherence >= 80 ? C.amber : C.red, fontWeight: 600 }}>{m.adherence}%</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: m.turns >= m.target ? C.green : C.amber }}>{m.turns}</span>
                  <span style={{ color: C.muted }}> / {m.target}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: C.muted }}>
        Click any market row to filter dashboard · Data as of February 28, 2026
      </div>
    </div>
  );
}
