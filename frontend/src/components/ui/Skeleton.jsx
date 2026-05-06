/**
 * Presentational skeleton primitives — no data fetching.
 */

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`app-skeleton min-h-[0.75rem] ${className}`}
      aria-hidden
    />
  );
}

/** Board + header layout while tasks load */
export function TasksBoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-[70vw]" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-[7.5rem]" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 min-w-[12rem] flex-1" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-14 rounded-full" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden pb-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-[min(18rem,calc(100vw-2rem))] shrink-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm sm:w-72"
          >
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-7 rounded-full" />
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-[4.25rem] w-full" />
              <Skeleton className="h-[4.25rem] w-full" />
              <Skeleton className="h-[4.25rem] w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-page auth bootstrap */
export function AuthLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-muted)] ring-1 ring-[var(--color-border)]">
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="mx-auto h-5 w-48" />
          <Skeleton className="mx-auto h-3 w-64 max-w-full" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="mx-auto h-10 w-full max-w-xs rounded-[var(--radius-md)]" />
          <Skeleton className="mx-auto h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

/** Project shell while project document loads */
export function ProjectPageSkeleton() {
  return (
    <div className="flex h-full min-h-[240px] flex-col">
      <div className="flex flex-wrap items-center gap-4 border-b border-[var(--color-border)] px-6 py-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-48 max-w-[60vw]" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[88%]" />
          <Skeleton className="h-4 w-[72%]" />
        </div>
      </div>
    </div>
  );
}
