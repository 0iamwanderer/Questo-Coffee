export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border bg-card"
          />
        ))}
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 animate-pulse rounded-md border bg-card"
              />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded-lg border bg-card" />
        </div>
      </section>
    </div>
  );
}
