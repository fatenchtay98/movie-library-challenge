export function MovieCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="aspect-[2/3] animate-pulse bg-zinc-800" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-zinc-800" />
        <div className="mt-1 flex gap-1">
          <div className="h-4 w-12 animate-pulse rounded-full bg-zinc-800" />
          <div className="h-4 w-14 animate-pulse rounded-full bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
