import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchJobById } from '@/lib/airtable/tables/jobs'
import { JobDetailView } from './_components/job-detail-view'

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const jobId = parseInt(id, 10)
  if (isNaN(jobId)) {
    notFound()
  }

  const job = await fetchJobById(jobId)
  if (!job) {
    notFound()
  }

  return <JobDetailView job={job} />
}
