/** Route fallback for a date-specific result and its full prize table. */
export default function DateResultLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8"
    >
      <div className="flex items-center gap-3 text-[#0B3B32]" role="status">
        <span className="w-5 h-5 rounded-full border-2 border-[#0B3B32]/25 border-t-[#0B3B32] animate-spin" />
        <span className="text-sm font-bold">Fetching the full lottery result…</span>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-5">
        <div className="h-7 w-2/3 rounded bg-[#E2E7E3] animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-[#F1F4F2] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-[#F1F4F2] animate-pulse" />
          ))}
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-[#E2E7E3] shadow-xs overflow-hidden">
        <div className="h-16 bg-[#F1F4F2] animate-pulse" />
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-20 border-t border-[#E2E7E3] animate-pulse" />
        ))}
      </section>
    </div>
  );
}
