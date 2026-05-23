export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-3 px-2 py-2 sm:space-y-4 sm:px-4 sm:py-4">
      <div className="flex items-center gap-2 sm:hidden">
        <div className="size-8 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="hidden sm:block space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted/70" />
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-9 w-full animate-pulse rounded-md bg-muted/80" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-20 shrink-0 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="min-h-[8rem] animate-pulse rounded-xl border bg-card sm:min-h-[9rem]"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
