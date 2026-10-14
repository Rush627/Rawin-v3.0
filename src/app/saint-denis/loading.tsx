export default function AdminLoading() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-6 sm:gap-8 animate-pulse pointer-events-none select-none"
    >
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-line">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded-full bg-surface-2" />
          <div className="h-8 w-64 rounded-xl bg-surface-2" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-surface-2" />
      </div>

      {/* Content Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="h-40 rounded-2xl bg-surface-2/60 border border-line p-6 flex flex-col justify-between">
          <div className="h-4 w-24 rounded bg-surface-2" />
          <div className="h-8 w-16 rounded bg-surface-2" />
        </div>
        <div className="h-40 rounded-2xl bg-surface-2/60 border border-line p-6 flex flex-col justify-between">
          <div className="h-4 w-24 rounded bg-surface-2" />
          <div className="h-8 w-16 rounded bg-surface-2" />
        </div>
        <div className="h-40 rounded-2xl bg-surface-2/60 border border-line p-6 flex flex-col justify-between">
          <div className="h-4 w-24 rounded bg-surface-2" />
          <div className="h-8 w-16 rounded bg-surface-2" />
        </div>
      </div>

      {/* Main Panel Skeleton */}
      <div className="h-72 rounded-2xl bg-surface-2/60 border border-line p-6 flex flex-col gap-4">
        <div className="h-5 w-48 rounded bg-surface-2" />
        <div className="h-4 w-full rounded bg-surface-2/60" />
        <div className="h-4 w-5/6 rounded bg-surface-2/60" />
        <div className="h-4 w-4/6 rounded bg-surface-2/60" />
      </div>
    </div>
  );
}
