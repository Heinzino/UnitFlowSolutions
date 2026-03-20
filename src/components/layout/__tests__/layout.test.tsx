import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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

// Mock Supabase client — configurable per test via mockGetUser
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => mockGetUser(),
      signOut: vi.fn().mockResolvedValue({}),
    },
  }),
}));

import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { AppShell } from "@/components/layout/app-shell";

/* ─── Sidebar ──────────────────────────────────────────────────── */
describe("Sidebar", () => {
  it("renders exactly 4 navigation links (Properties, Completed Jobs, Vendors, Add Off Market)", () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    render(<Sidebar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(4);
    expect(links.some((link) => link.getAttribute("href") === "/property")).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === "/property/completed-jobs")).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === "/vendors")).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === "/vacant")).toBe(true);
  });

  it("does not render a Dashboard or Settings link", () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    render(<Sidebar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/")).toBe(false);
    expect(links.some((link) => link.getAttribute("href") === "/settings")).toBe(false);
  });

  it("does not render a Notifications link", () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    render(<Sidebar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/notifications")).toBe(false);
  });

  it("renders 'Create User' link when user email is in admin allowlist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "heinz@readymation.com", app_metadata: { role: "exec" } } },
    });
    render(<Sidebar activePath="/" />);
    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.some((link) => link.getAttribute("href") === "/admin/create-user")).toBe(true);
    });
  });

  it("does not render 'Create User' link for non-admin email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "pm@example.com", app_metadata: { role: "pm" } } },
    });
    render(<Sidebar activePath="/" />);
    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.some((link) => link.getAttribute("href") === "/admin/create-user")).toBe(false);
    });
  });

  it("renders 'Add Off Market' link for PM user (non-admin, non-exec)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "pm@example.com", app_metadata: { role: "pm" } } },
    });
    render(<Sidebar activePath="/" />);
    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.some((link) => link.getAttribute("href") === "/vacant")).toBe(true);
    });
  });
});

/* ─── BottomTabBar ─────────────────────────────────────────────── */
describe("BottomTabBar", () => {
  it("renders exactly 3 tab items (Properties, Vendors, Add Off Market)", () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    render(<BottomTabBar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(3);
    expect(links.some((link) => link.getAttribute("href") === "/property")).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === "/vendors")).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === "/vacant")).toBe(true);
  });

  it("does not render a Dashboard or Settings tab", () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    render(<BottomTabBar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/")).toBe(false);
    expect(links.some((link) => link.getAttribute("href") === "/settings")).toBe(false);
  });

  it("does not render a Notifications link", () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    render(<BottomTabBar activePath="/" />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/notifications")).toBe(false);
  });

  it("renders 'Create User' tab when user email is in admin allowlist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "heinz@readymation.com", app_metadata: { role: "exec" } } },
    });
    render(<BottomTabBar activePath="/" />);
    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.some((link) => link.getAttribute("href") === "/admin/create-user")).toBe(true);
    });
  });

  it("does not render 'Create User' tab for non-admin email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "pm@example.com", app_metadata: { role: "pm" } } },
    });
    render(<BottomTabBar activePath="/" />);
    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.some((link) => link.getAttribute("href") === "/admin/create-user")).toBe(false);
    });
  });

  it("renders 'Add Off Market' tab for PM user (non-admin, non-exec)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: "pm@example.com", app_metadata: { role: "pm" } } },
    });
    render(<BottomTabBar activePath="/" />);
    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.some((link) => link.getAttribute("href") === "/vacant")).toBe(true);
    });
  });
});

/* ─── AppShell ─────────────────────────────────────────────────── */
describe("AppShell", () => {
  it("renders children content", () => {
    render(<AppShell>Test Content</AppShell>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });
});
