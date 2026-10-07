//#region lib/format.ts
/**
* Pure formatting/serialization helpers.
*
* These used to live in `lib/prisma.ts`, which meant every client component that
* merely wanted to render a prize amount (`formatINR`) imported that module — and
* with it `@prisma/client`, dragging Prisma's ~43 KB browser runtime into the
* client bundle for *every* page. Ten client components did exactly that
* (`ResultCard`, `PrizeTable`, `HeroTodayCard`, the whole results tree), and
* because the navbar's search modal was one of them, the document-chrome chunk
* pulled Prisma in too.
*
* They have no dependency on the database, so they belong in a module with no
* `@prisma/client` import at all. `lib/prisma.ts` re-exports them so existing
* server-side imports keep working unchanged.
*/
/** Converts BigInt values to numbers so a payload can cross a JSON boundary. */
function serializeData(data) {
	return JSON.parse(JSON.stringify(data, (_, value) => typeof value === "bigint" ? Number(value) : value));
}
/** Compact Indian-format currency, e.g. `₹1 Crore`, `₹50 Lakh`, `₹5,000`. */
function formatINR(amount) {
	if (amount === null || amount === void 0) return "₹0";
	const num = typeof amount === "bigint" ? Number(amount) : Number(amount);
	if (isNaN(num)) return "₹0";
	if (num >= 1e7) return `₹${(num / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Crore`;
	if (num >= 1e5) return `₹${(num / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Lakh`;
	return `₹${num.toLocaleString("en-IN")}`;
}
/** Exact Indian-format currency, e.g. `₹1,00,00,000`. */
function formatINRExact(amount) {
	if (amount === null || amount === void 0) return "₹0";
	const num = typeof amount === "bigint" ? Number(amount) : Number(amount);
	if (isNaN(num)) return "₹0";
	return `₹${num.toLocaleString("en-IN")}`;
}
//#endregion
export { formatINRExact as n, serializeData as r, formatINR as t };
