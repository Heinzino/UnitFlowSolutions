'use client'

export default function CompletedJobsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading font-bold text-xl text-white">Completed Jobs</h1>
        <p className="text-white/70 text-sm mt-1">Full history of completed jobs across your properties</p>
      </div>
      <div className="rounded-lg border border-card-border bg-card p-6 text-center">
        <h3 className="font-heading font-semibold text-text-primary mb-1">
          Unable to load completed jobs
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Refresh the page or contact support if the problem persists.
        </p>
        <button
          onClick={() => reset()}
          className="text-sm text-emerald hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
