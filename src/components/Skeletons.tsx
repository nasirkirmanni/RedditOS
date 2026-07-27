// Shared loading placeholders. Rendered instantly by route-level loading.tsx
// files while the server component fetches, so navigation never feels stuck.

export function SkeletonLine({ w = "100%", h = 14 }: { w?: string; h?: number }) {
  return <div className="skeleton" style={{ width: w, height: h }} />;
}

export function SkeletonTiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-2 px-4 py-3">
          <SkeletonLine w="60%" h={10} />
          <SkeletonLine w="45%" h={24} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card px-4 py-3">
      <div className="mb-3">
        <SkeletonLine w="140px" h={14} />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-7 w-7 shrink-0 rounded-full" />
            <SkeletonLine w="22%" />
            <SkeletonLine w="14%" />
            <SkeletonLine w="12%" />
            <SkeletonLine w="18%" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <SkeletonLine w="55%" />
              <SkeletonLine w="35%" h={10} />
            </div>
          </div>
          <SkeletonLine h={44} />
          <SkeletonLine w="70%" h={10} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPanel({ h = 200 }: { h?: number }) {
  return (
    <div className="card px-5 py-4">
      <div className="mb-3">
        <SkeletonLine w="160px" h={14} />
      </div>
      <SkeletonLine h={h} />
    </div>
  );
}

export function PageHeading({ title }: { title: string }) {
  return <h1 className="text-2xl font-bold tracking-tight">{title}</h1>;
}
