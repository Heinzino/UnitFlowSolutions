export default function TurnDetailLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-7 w-48 bg-white/10 rounded" />
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <div className="h-5 w-32 bg-white/10 rounded" />
        <div className="h-4 w-full bg-white/10 rounded" />
        <div className="h-4 w-3/4 bg-white/10 rounded" />
        <div className="h-4 w-1/2 bg-white/10 rounded" />
      </div>
    </div>
  );
}
