/**
 * Immediate route fallback for the Results hub and its Full Result children.
 *
 * Next streams this before the database work for the destination route has
 * finished, giving the click a visible response instead of a blank pause.
 */
export default function ResultsLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10"
    >
      <div className="flex items-center gap-3 text-[#0B3B32]" role="status">
        <span className="w-5 h-5 rounded-full border-2 border-[#0B3B32]/25 border-t-[#0B3B32] animate-spin" />
        <span className="text-sm font-bold">Loading latest lottery results…</span>
      </div>

      <div className="h-10 w-72 max-w-full rounded-xl bg-[#E2E7E3] animate-pulse" />

      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-5">
        <div className="h-5 w-52 rounded bg-[#E2E7E3] animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-20 rounded-2xl bg-[#F1F4F2] animate-pulse" />
          ))}
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-[#E2E7E3] shadow-xs divide-y divide-[#E2E7E3] overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="px-6 sm:px-8 py-5 flex items-center justify-between gap-5">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-14 w-[72px] rounded-2xl bg-[#F1F4F2] animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded bg-[#E2E7E3] animate-pulse" />
                <div className="h-5 w-48 max-w-full rounded bg-[#E2E7E3] animate-pulse" />
              </div>
            </div>
            <div className="h-9 w-28 rounded-xl bg-[#E2E7E3] animate-pulse" />
          </div>
        ))}
      </section>
    </div>
  );
}
