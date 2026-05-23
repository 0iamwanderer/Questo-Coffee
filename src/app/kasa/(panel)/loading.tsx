// Kasa paneli alt rotalarının ortak iskeleti — Link tıklanır tıklanmaz
// görünür, server fetch'i beklemeden tepki hissi verir.
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-lg border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
