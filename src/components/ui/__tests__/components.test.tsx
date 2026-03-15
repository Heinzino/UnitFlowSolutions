import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Button,
  Card,
  Badge,
  Input,
  Skeleton,
  StatusBadge,
  TrendIndicator,
  CurrencyDisplay,
  KPICard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { Activity } from "lucide-react";

/* ─── Button ───────────────────────────────────────────────────── */
describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    render(<Button variant="cta">CTA</Button>);
    const btn = screen.getByRole("button", { name: "CTA" });
    expect(btn.className).toContain("bg-chartreuse");
  });

  it("handles click", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Press</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Press" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

/* ─── Card ─────────────────────────────────────────────────────── */
describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });
});

/* ─── Badge ────────────────────────────────────────────────────── */
describe("Badge", () => {
  it("renders with text", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies variant", () => {
    render(<Badge variant="emerald">Emerald</Badge>);
    expect(screen.getByText("Emerald").className).toContain("emerald");
  });
});

/* ─── Input ────────────────────────────────────────────────────── */
describe("Input", () => {
  it("renders", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("accepts value", async () => {
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText("Type here");
    await userEvent.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("shows label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows error", () => {
    render(<Input label="Name" error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
  });
});

/* ─── Skeleton ─────────────────────────────────────────────────── */
describe("Skeleton", () => {
  it("renders with aria-hidden", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

/* ─── StatusBadge ──────────────────────────────────────────────── */
describe("StatusBadge", () => {
  it.each([
    ["completed", "Completed"],
    ["ready", "Ready"],
    ["attention", "NEEDS ATTENTION"],
    ["blocked", "Blocked"],
    ["in-progress", "In Progress"],
  ] as const)("renders correct label for %s status", (status, expected) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders with correct role", () => {
    render(<StatusBadge status="completed" role="status" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

/* ─── TrendIndicator ───────────────────────────────────────────── */
describe("TrendIndicator", () => {
  it("renders percentage", () => {
    render(<TrendIndicator direction="up" percentage={8.5} />);
    expect(screen.getByText("8.5%")).toBeInTheDocument();
  });

  it("shows correct icon direction", () => {
    const { container } = render(<TrendIndicator direction="down" percentage={3.1} />);
    // The container span should have the text-negative class for down
    expect(container.firstChild).toHaveClass("text-negative");
  });

  it("isGood=true (default): up direction renders text-positive", () => {
    const { container } = render(<TrendIndicator direction="up" percentage={5} isGood={true} />);
    expect(container.firstChild).toHaveClass("text-positive");
  });

  it("isGood=false: up direction renders text-negative (inverted)", () => {
    const { container } = render(<TrendIndicator direction="up" percentage={5} isGood={false} />);
    expect(container.firstChild).toHaveClass("text-negative");
  });

  it("isGood=false: down direction renders text-positive (inverted)", () => {
    const { container } = render(<TrendIndicator direction="down" percentage={5} isGood={false} />);
    expect(container.firstChild).toHaveClass("text-positive");
  });
});

/* ─── CurrencyDisplay ──────────────────────────────────────────── */
describe("CurrencyDisplay", () => {
  it('formats 1500 as "$1,500"', () => {
    render(<CurrencyDisplay amount={1500} />);
    expect(screen.getByText("$1,500")).toBeInTheDocument();
  });

  it('formats 0 as "$0"', () => {
    render(<CurrencyDisplay amount={0} />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });
});

/* ─── KPICard ──────────────────────────────────────────────────── */
describe("KPICard", () => {
  it("renders label and value", () => {
    render(<KPICard icon={Activity} label="Active Units" value={42} />);
    expect(screen.getByText("Active Units")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders skeleton when loading", () => {
    const { container } = render(
      <KPICard icon={Activity} label="Loading" value={0} loading />
    );
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThan(0);
  });

  it("renders alert variant", () => {
    const { container } = render(
      <KPICard icon={Activity} label="Past Target" value={3} variant="alert-past" />
    );
    expect(container.firstChild).toHaveClass("bg-alert-past-target");
  });
});

/* ─── Table compound ───────────────────────────────────────────── */
describe("Table", () => {
  it("renders with header and rows", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Oak Estates</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Oak Estates")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
