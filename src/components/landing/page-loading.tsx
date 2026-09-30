/** Route loading state for the public pages: a thin progress bar and the outline of a page heading. */
export function PageLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="min-h-[70vh] bg-canvas pt-[var(--header-h)]" aria-busy="true">
      <div className="h-0.5 w-full overflow-hidden bg-line">
        <div className="animate-loading-bar h-full w-1/3 bg-signal" />
      </div>
      <p role="status" className="sr-only">
        Loading
      </p>
      <div className="mx-auto w-full max-w-7xl px-5 pt-12 sm:px-8 sm:pt-16 lg:px-10">
        <div className="h-11 w-2/3 max-w-xl rounded-md bg-tint motion-safe:animate-pulse sm:h-14" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="h-4 rounded bg-tint motion-safe:animate-pulse" style={{ width: `${Math.max(40, 92 - i * 14)}%`, maxWidth: "36rem" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
