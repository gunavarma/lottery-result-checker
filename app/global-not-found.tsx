import Link from 'next/link';

// Rendered for any URL that matches no route in either root layout.
// Because the two root layouts (en route group and /[locale]) both render the
// full document shell, this global fallback must carry its own <html> tree.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#F7F7F4] text-[#17201D] font-sans p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E2E7E3] shadow-lg text-center space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block">
              KeralaDraws
            </span>
            <h1 className="text-2xl font-extrabold text-[#17201D] tracking-tight">
              Page not found
            </h1>
            <p className="text-xs text-[#68736E] leading-relaxed">
              The page you are looking for does not exist.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-xs transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </body>
    </html>
  );
}
