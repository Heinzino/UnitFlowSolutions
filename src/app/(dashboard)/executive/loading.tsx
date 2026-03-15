import { ExecutiveKPISkeleton } from './_components/executive-kpi-skeleton';

export default function ExecutiveLoading() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="h-7 w-48 bg-white/10 rounded animate-pulse" />
        <div className="h-4 w-64 bg-white/10 rounded animate-pulse mt-1" />
      </div>
      <ExecutiveKPISkeleton />
    </div>
  );
}
