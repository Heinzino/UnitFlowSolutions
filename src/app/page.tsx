import {
  KPICard,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import {
  ShoppingCart,
  DollarSign,
  Users,
  MoreHorizontal,
  ChevronDown,
  Pencil,
} from "lucide-react";

const mockDeals = [
  { name: "Mr. Jahir", category: "Development", email: "example@gmail.com", location: "82619 Arne Spring", date: "11/18/2024" },
  { name: "Arshad", category: "Representative", email: "example@gmail.com", location: "Halvorsoncester", date: "11/18/2024" },
  { name: "Mickel Moc", category: "Sales Director", email: "example@gmail.com", location: "115 N 9th Street", date: "11/18/2024" },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-3">
      {/* KPI Cards Row — each card floats on green */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPICard
          icon={ShoppingCart}
          label="Total order"
          value="$84.00K"
          variant="highlighted"
          trend={{ direction: "up", percentage: 17.5 }}
        />
        <KPICard
          icon={DollarSign}
          label="Total income"
          value="$59.00K"
          trend={{ direction: "up", percentage: 17.5 }}
        />
        <KPICard
          icon={Users}
          label="Total customers"
          value="12.00K"
          trend={{ direction: "down", percentage: 17.5 }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Order Statistics */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-semibold text-text-primary">Order statistics</h3>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs text-text-secondary bg-surface px-3 py-1.5 rounded-pill border border-card-border">
                This month <ChevronDown size={12} />
              </button>
              <button className="text-text-secondary hover:text-text-primary">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-end gap-3 h-48 px-2">
            {[
              { label: "Jan", heights: [40, 55] },
              { label: "Mar", heights: [50, 45] },
              { label: "May", heights: [60, 70] },
              { label: "Jul", heights: [90, 80], peak: true },
              { label: "Sep", heights: [45, 50] },
              { label: "Nov", heights: [55, 60] },
            ].map((bar) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative flex gap-1 items-end w-full justify-center" style={{ height: "160px" }}>
                  {bar.peak && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-forest text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                      $50.00K
                    </div>
                  )}
                  <div
                    className="w-3 rounded-t-sm bg-emerald/20"
                    style={{ height: `${bar.heights[0]}%` }}
                  />
                  <div
                    className="w-3 rounded-t-sm bg-emerald"
                    style={{ height: `${bar.heights[1]}%` }}
                  />
                </div>
                <span className="text-xs text-text-secondary">{bar.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer Satisfaction */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-text-primary">Customer satisfaction</h3>
            <button className="text-text-secondary hover:text-text-primary">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="flex items-center justify-center mb-2">
            <div className="bg-surface rounded-pill px-3 py-1 flex items-center gap-1 text-xs">
              <span className="text-emerald">🏆</span>
              <span className="text-text-secondary">Top</span>
              <span className="text-emerald font-semibold">Performance</span>
              <span className="text-text-secondary">of this month</span>
            </div>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <div className="w-48 h-24 overflow-hidden">
                <div
                  className="w-48 h-48 rounded-full border-[16px] border-emerald/20"
                  style={{
                    borderTopColor: "#22C55E",
                    borderRightColor: "#22C55E",
                    borderBottomColor: "transparent",
                    transform: "rotate(-10deg)",
                  }}
                />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <p className="text-4xl font-heading font-bold text-text-primary">550</p>
                <p className="text-xs text-text-secondary">Response this month</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-forest" />
              <span className="text-xs text-text-secondary">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald/30" />
              <span className="text-xs text-text-secondary">Low</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Deals Table */}
      <Card variant="flush">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="font-heading font-semibold text-text-primary">Deals Static</h3>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs text-text-secondary bg-surface px-3 py-1.5 rounded-pill border border-card-border">
              This month <ChevronDown size={12} />
            </button>
            <button className="w-8 h-8 rounded-lg bg-surface border border-card-border flex items-center justify-center text-text-secondary hover:text-text-primary">
              <Pencil size={14} />
            </button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockDeals.map((deal, i) => (
              <TableRow key={i}>
                <TableCell>
                  <input type="checkbox" className="w-4 h-4 rounded accent-emerald" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-semibold text-text-primary">
                      {deal.name.charAt(0)}
                    </div>
                    <span className="font-medium">{deal.name}</span>
                  </div>
                </TableCell>
                <TableCell>{deal.category}</TableCell>
                <TableCell>
                  <a href="#" className="text-link hover:underline">{deal.email}</a>
                </TableCell>
                <TableCell>{deal.location}</TableCell>
                <TableCell>{deal.date}</TableCell>
                <TableCell>
                  <button className="text-text-secondary hover:text-text-primary">
                    <MoreHorizontal size={16} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
