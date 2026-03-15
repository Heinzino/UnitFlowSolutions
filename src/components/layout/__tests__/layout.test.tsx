import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock radix-ui Tooltip to render children directly
vi.mock("radix-ui", () => ({
  Tooltip: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Content: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Arrow: () => null,
  },
}));

import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { AppShell } from "@/components/layout/app-shell";

/* ─── Sidebar ──────────────────────────────────────────────────── */
describe("Sidebar", () => {
  it("renders navigation links", () => {
    render(<Sidebar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(4);
    // Check for Dashboard link
    expect(links.some((link) => link.getAttribute("href") === "/")).toBe(true);
  });

  it("does not render a Notifications link", () => {
    render(<Sidebar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/notifications")).toBe(false);
  });
});

/* ─── BottomTabBar ─────────────────────────────────────────────── */
describe("BottomTabBar", () => {
  it("renders navigation links", () => {
    render(<BottomTabBar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(4);
    expect(links.some((link) => link.getAttribute("href") === "/property")).toBe(true);
  });

  it("does not render a Notifications link", () => {
    render(<BottomTabBar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/notifications")).toBe(false);
  });
});

/* ─── AppShell ─────────────────────────────────────────────────── */
describe("AppShell", () => {
  it("renders children content", () => {
    render(<AppShell>Test Content</AppShell>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });
});
