import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchVendors } from '@/lib/airtable/tables/vendors'
import { VendorTable } from './_components/vendor-table'
import { VendorTableSkeleton } from './_components/vendor-table-skeleton'

async function VendorTableData() {
  const vendors = await fetchVendors()
  return <VendorTable vendors={vendors} />
}

export default async function VendorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="font-heading font-bold text-xl text-white">Vendor Performance</h1>
        <p className="text-white/70 text-sm mt-0.5">All vendors across properties</p>
      </div>
      <Suspense fallback={<VendorTableSkeleton />}>
        <VendorTableData />
      </Suspense>
    </div>
  )
}
