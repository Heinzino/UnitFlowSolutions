export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchTurnRequestById } from '@/lib/airtable/tables/turn-requests'
import { TurnDetailView } from './_components/turn-detail-view'

interface TurnDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TurnDetailPage({ params }: TurnDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const requestId = parseInt(id, 10)
  if (isNaN(requestId)) {
    notFound()
  }

  const turn = await fetchTurnRequestById(requestId)
  if (!turn) {
    notFound()
  }

  return <TurnDetailView turn={turn} />
}
