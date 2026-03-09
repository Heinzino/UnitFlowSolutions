import {
  Button,
  Card,
  KPICard,
  Badge,
  StatusBadge,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TrendIndicator,
  CurrencyDisplay,
  Skeleton,
} from "@/components/ui";
import type { Status } from "@/components/ui";
import {
  Activity,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
} from "lucide-react";

const mockTurnData: {
  property: string;
  unit: string;
  status: Status;
  readyDate: string;
  price: number;
}[] = [
  { property: "Oakwood Estates", unit: "Unit 204", status: "completed", readyDate: "Mar 1, 2026", price: 1850 },
  { property: "Pine Ridge Apts", unit: "Unit 112", status: "in-progress", readyDate: "Mar 10, 2026", price: 25000 },
  { property: "Maple Gardens", unit: "Unit 305", status: "blocked", readyDate: "Mar 15, 2026", price: 1500 },
  { property: "Cedar Heights", unit: "Unit 401", status: "attention", readyDate: "Mar 20, 2026", price: 3200 },
];

export default function ComponentsPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="font-heading text-3xl text-text-primary mb-8">Component Library</h1>

      {/* Buttons */}
      <Section title="Buttons">
        <div className="flex flex-wrap gap-3 items-center">
          {(["primary", "secondary", "ghost", "cta"] as const).map((variant) =>
            (["sm", "md", "lg"] as const).map((size) => (
              <Button key={`${variant}-${size}`} variant={variant} size={size}>
                {variant} {size}
              </Button>
            ))
          )}
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-heading font-semibold text-lg mb-2">Default Card</h3>
            <p className="text-text-secondary text-sm">This is a default card with padding and rounded corners.</p>
          </Card>
          <Card variant="flush">
            <div className="p-6">
              <h3 className="font-heading font-semibold text-lg mb-2">Flush Card</h3>
              <p className="text-text-secondary text-sm">Flush variant removes internal padding for custom layouts.</p>
            </div>
          </Card>
        </div>
      </Section>

      {/* KPI Cards */}
      <Section title="KPI Cards">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            icon={Activity}
            label="Active Make Readys"
            value={12}
            trend={{ direction: "up", percentage: 8.5 }}
          />
          <KPICard
            icon={Clock}
            label="Avg Completion Time"
            value="4.2 days"
            trend={{ direction: "down", percentage: 3.1 }}
          />
          <KPICard
            icon={AlertTriangle}
            label="Past Target Time"
            value={3}
            variant="alert-past"
          />
          <KPICard
            icon={DollarSign}
            label="Total Spend"
            value="$42,500"
            trend={{ direction: "up", percentage: 12.3 }}
          />
          <KPICard
            icon={TrendingUp}
            label="On-Time Rate"
            value="87%"
            trend={{ direction: "up", percentage: 2.1 }}
          />
          <KPICard icon={Building2} label="Loading State" value="" loading />
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <div className="flex gap-2 items-center">
          <Badge>Default</Badge>
          <Badge variant="emerald">Emerald</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      {/* Status Badges */}
      <Section title="Status Badges">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="completed" />
          <StatusBadge status="ready" />
          <StatusBadge status="in-progress" />
          <StatusBadge status="attention" />
          <StatusBadge status="blocked" />
        </div>
      </Section>

      {/* Input */}
      <Section title="Input">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
          <Input placeholder="Default input" />
          <Input label="With Label" placeholder="Enter value" />
          <Input label="With Error" placeholder="Invalid" error="This field is required" />
        </div>
      </Section>

      {/* Table */}
      <Section title="Table">
        <Card variant="flush">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ready Date</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTurnData.map((row) => (
                <TableRow key={`${row.property}-${row.unit}`}>
                  <TableCell className="font-medium">{row.property}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>{row.readyDate}</TableCell>
                  <TableCell>
                    <CurrencyDisplay amount={row.price} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Section>

      {/* Trend Indicator */}
      <Section title="Trend Indicator">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="text-text-primary text-sm">Up:</span>
            <TrendIndicator direction="up" percentage={8.5} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-primary text-sm">Down:</span>
            <TrendIndicator direction="down" percentage={3.1} />
          </div>
        </div>
      </Section>

      {/* Currency Display */}
      <Section title="Currency Display">
        <div className="flex gap-6 items-center">
          {[0, 1500, 25000, 1234567].map((amount) => (
            <div key={amount} className="text-center">
              <CurrencyDisplay amount={amount} className="text-text-primary text-lg font-semibold" />
              <p className="text-text-secondary text-xs mt-1">({amount})</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Skeleton */}
      <Section title="Skeleton">
        <div className="flex gap-4 items-end">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-48 h-4" />
          <Skeleton className="w-full h-20" />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-heading text-xl text-text-primary mb-4 border-b border-card-border pb-2">{title}</h2>
      {children}
    </section>
  );
}
