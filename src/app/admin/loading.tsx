export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
