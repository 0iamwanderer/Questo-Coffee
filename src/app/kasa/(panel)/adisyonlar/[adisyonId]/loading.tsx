export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="space-y-2 text-right">
          <div className="ml-auto h-3 w-12 animate-pulse rounded bg-muted/70" />
          <div className="ml-auto h-7 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="space-y-2 rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted/70" />
            </div>
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted/60" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted/60" />
          </li>
        ))}
      </ul>
    </div>
  );
}
