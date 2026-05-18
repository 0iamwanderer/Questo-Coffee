export function UrunKartiSkeleton() {
  return (
    <article className="flex items-start gap-3 py-3">
      <div className="anim-shimmer size-20 shrink-0 rounded-2xl border" />
      <div className="flex-1 min-w-0 space-y-2 pt-1">
        <div className="anim-shimmer h-4 w-2/3 rounded-md" />
        <div className="anim-shimmer h-3 w-full rounded-md" />
        <div className="anim-shimmer h-3 w-1/2 rounded-md" />
        <div className="anim-shimmer mt-1 h-4 w-16 rounded-md" />
      </div>
      <div className="anim-shimmer h-7 w-16 shrink-0 rounded-full" />
    </article>
  );
}

export function MenuSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-hidden pb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="anim-shimmer h-8 w-24 shrink-0 rounded-full"
          />
        ))}
      </div>
      <div className="divide-y divide-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <UrunKartiSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
