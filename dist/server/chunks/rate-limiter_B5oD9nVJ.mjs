//#region lib/rate-limiter.ts
var memoryStore = /* @__PURE__ */ new Map();
/**
* Checks if an IP or identifier has exceeded the max allowed requests within windowMs
*/
function checkRateLimit(identifier, limit = 30, windowMs = 6e4) {
	const now = Date.now();
	const record = memoryStore.get(identifier);
	if (!record || now > record.resetAt) {
		memoryStore.set(identifier, {
			count: 1,
			resetAt: now + windowMs
		});
		return {
			allowed: true,
			remaining: limit - 1,
			resetInMs: windowMs
		};
	}
	if (record.count >= limit) return {
		allowed: false,
		remaining: 0,
		resetInMs: Math.max(0, record.resetAt - now)
	};
	record.count++;
	return {
		allowed: true,
		remaining: limit - record.count,
		resetInMs: Math.max(0, record.resetAt - now)
	};
}
//#endregion
export { checkRateLimit as t };
