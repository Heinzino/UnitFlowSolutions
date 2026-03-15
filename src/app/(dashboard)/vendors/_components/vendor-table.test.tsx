import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Vendor } from '@/lib/types/airtable'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}))

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { VendorTable } from './vendor-table'

const mockVendors: Vendor[] = [
  {
    vendorName: 'Alpha Cleaning',
    vendorType: 'Cleaning',
    contactName: 'Alice',
    email: 'alice@example.com',
    phone: '555-0001',
    numJobsCompleted: 10,
    numJobsAssigned: 12,
    avgCompletionTimeDays: 3.5,
    jobIds: [52, 81, 82],
  },
  {
    vendorName: 'Beta Plumbing',
    vendorType: 'Plumbing',
    contactName: null,
    email: null,
    phone: null,
    numJobsCompleted: 5,
    numJobsAssigned: 6,
    avgCompletionTimeDays: null,
    jobIds: [],
  },
  {
    vendorName: 'Gamma Electric',
    vendorType: 'Electrical',
    contactName: 'Gina',
    email: 'gina@example.com',
    phone: '555-0003',
    numJobsCompleted: 20,
    numJobsAssigned: 22,
    avgCompletionTimeDays: 1.2,
    jobIds: [99],
  },
]

describe('VendorTable', () => {
  it('renders vendor names in the table', () => {
    render(<VendorTable vendors={mockVendors} />)
    expect(screen.getByText('Alpha Cleaning')).toBeInTheDocument()
    expect(screen.getByText('Beta Plumbing')).toBeInTheDocument()
    expect(screen.getByText('Gamma Electric')).toBeInTheDocument()
  })

  it('sorts by Jobs Completed descending by default (Gamma first)', () => {
    render(<VendorTable vendors={mockVendors} />)
    const rows = screen.getAllByRole('row')
    // rows[0] is the header row, rows[1] is first data row
    expect(rows[1]).toHaveTextContent('Gamma Electric')
  })

  it('clicking Jobs Completed header twice toggles sort direction', () => {
    render(<VendorTable vendors={mockVendors} />)
    const jobsCompletedHeader = screen.getByText(/Jobs Completed/)
    // Initially desc: Gamma(20), Alpha(10), Beta(5)
    let rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Gamma Electric')

    // First click toggles to asc: Beta(5), Alpha(10), Gamma(20)
    fireEvent.click(jobsCompletedHeader)
    rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Beta Plumbing')

    // Second click toggles back to desc: Gamma(20), Alpha(10), Beta(5)
    fireEvent.click(jobsCompletedHeader)
    rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Gamma Electric')
  })

  it('renders N/A for null avgCompletionTimeDays', () => {
    render(<VendorTable vendors={mockVendors} />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('renders job badge links with correct href', () => {
    render(<VendorTable vendors={mockVendors} />)
    const link52 = screen.getByRole('link', { name: '52' })
    const link81 = screen.getByRole('link', { name: '81' })
    const link82 = screen.getByRole('link', { name: '82' })
    expect(link52).toHaveAttribute('href', '/property/job/52')
    expect(link81).toHaveAttribute('href', '/property/job/81')
    expect(link82).toHaveAttribute('href', '/property/job/82')
  })

  it('renders dash for empty jobIds array', () => {
    render(<VendorTable vendors={mockVendors} />)
    // Beta Plumbing has empty jobIds — find the dash in the table
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})
