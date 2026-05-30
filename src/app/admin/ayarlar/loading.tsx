export default function Loading() {
  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <div className="h-8 w-52 animate-pulse rounded-md bg-muted" />
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-3 w-64 animate-pulse rounded bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
