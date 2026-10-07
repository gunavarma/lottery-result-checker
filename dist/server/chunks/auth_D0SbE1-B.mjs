import { NextResponse } from "next/server.js";
import crypto from "crypto";
//#region lib/security/auth.ts
/** Secrets that were previously committed/exposed and must never be accepted. */
var COMPROMISED_SECRETS = /* @__PURE__ */ new Set([
	"kerala-lottery-cron-secure-token-2026",
	"admin-kerala-lottery-2026",
	"password",
	"secret",
	"changeme"
]);
var MIN_SECRET_LENGTH = 24;
/**
* Constant-time string comparison that tolerates differing lengths.
*/
function timingSafeEqualStr(a, b) {
	const bufA = Buffer.from(a, "utf8");
	const bufB = Buffer.from(b, "utf8");
	if (bufA.length !== bufB.length) {
		crypto.timingSafeEqual(bufA, bufA);
		return false;
	}
	return crypto.timingSafeEqual(bufA, bufB);
}
/**
* Extracts the presented credential from a request without ever returning it
* in a response or log.
*/
function extractPresentedToken(request) {
	const authHeader = request.headers.get("authorization");
	if (authHeader) {
		const bearer = authHeader.match(/^Bearer\s+(.+)$/i);
		if (bearer) return bearer[1].trim();
		return authHeader.trim();
	}
	try {
		return new URL(request.url).searchParams.get("secret");
	} catch {
		return null;
	}
}
function readConfiguredSecret(scope) {
	const trimmed = (scope === "cron" ? process.env.CRON_SECRET : process.env.ADMIN_SECRET)?.trim();
	return trimmed ? trimmed : null;
}
/**
* Evaluates whether a request may run a privileged operation.
*/
function evaluateAuth(request, scope) {
	const configured = readConfiguredSecret(scope);
	const isProduction = process.env.NODE_ENV === "production";
	if (!configured) {
		if (isProduction) {
			console.error(`[Auth] ${scope.toUpperCase()} secret is not configured. Refusing to run privileged endpoint in production.`);
			return {
				authorized: false,
				status: 503,
				reason: "Server misconfiguration: automation secret is not configured."
			};
		}
		console.warn(`[Auth] ${scope.toUpperCase()} secret not set — allowing request in non-production mode.`);
		return {
			authorized: true,
			status: 200
		};
	}
	if (isProduction && COMPROMISED_SECRETS.has(configured)) {
		console.error(`[Auth] ${scope.toUpperCase()} secret matches a previously exposed value and is rejected. Rotate it immediately.`);
		return {
			authorized: false,
			status: 503,
			reason: "Automation secret has been rotated out. Update the configured secret."
		};
	}
	if (isProduction && configured.length < MIN_SECRET_LENGTH) {
		console.error(`[Auth] ${scope.toUpperCase()} secret is too short to be considered safe.`);
		return {
			authorized: false,
			status: 503,
			reason: "Automation secret does not meet the minimum strength requirement."
		};
	}
	const presented = extractPresentedToken(request);
	if (!presented || !timingSafeEqualStr(presented, configured)) return {
		authorized: false,
		status: 401,
		reason: "Unauthorized"
	};
	return {
		authorized: true,
		status: 200
	};
}
/**
* ------------------------------------------------------------------
* Stored (rotatable) credential path
* ------------------------------------------------------------------
*
* The environment secret above is the primary credential. This second source
* exists because the frequent polling legs are driven by Supabase pg_cron
* (Vercel's Hobby plan rejects sub-daily cron expressions), and a secret shared
* between the database and the application has to live somewhere both can read.
*
* It also removes a real operational failure mode: rotating the environment
* secret requires a Vercel dashboard edit plus a redeploy, and when that step is
* missed the pipeline dies silently (every call returns 503) while the site
* still looks healthy. A stored credential can be rotated by an operator in one
* command with no deploy.
*
* Only the SHA-256 hash is stored, so a database read never reveals the secret.
* The comparison stays constant-time against the digested value.
*/
var CREDENTIAL_CACHE_TTL_MS = 3e4;
var credentialCache = /* @__PURE__ */ new Map();
function hashSecret(secret) {
	return crypto.createHash("sha256").update(secret, "utf8").digest("hex");
}
async function readStoredCredentialHash(scope) {
	const now = Date.now();
	const cached = credentialCache.get(scope);
	if (cached && cached.expiresAt > now) return cached.hash;
	try {
		const { prisma } = await import("./prisma_ButH08Qi.mjs").then((n) => n.n);
		const hash = (await prisma.automationCredential.findUnique({ where: { scope } }))?.hash ?? null;
		credentialCache.set(scope, {
			hash,
			expiresAt: now + CREDENTIAL_CACHE_TTL_MS
		});
		return hash;
	} catch (error) {
		console.error(`[Auth] Could not read the stored ${scope} credential: ${error?.message}`);
		credentialCache.set(scope, {
			hash: null,
			expiresAt: now + 5e3
		});
		return null;
	}
}
/**
* Full evaluation for privileged endpoints: the environment secret first (no
* I/O), then the stored credential.
*
* Status semantics when nothing matched:
*  - 503 only when *no* usable credential exists for the requested scopes
*    (missing/compromised/too-short env secret and no stored row). This keeps
*    the operator-visible "rotate me" signal instead of disguising a
*    misconfiguration as a plain 401.
*  - 401 otherwise, so an attacker learns nothing about the configuration.
*/
async function evaluatePrivilegedAuth(request, scopes) {
	let misconfigured = null;
	for (const scope of scopes) {
		const result = evaluateAuth(request, scope);
		if (result.authorized) return result;
		if (result.status === 503) misconfigured = result;
	}
	const presented = extractPresentedToken(request);
	if (presented) {
		const digest = hashSecret(presented);
		for (const scope of scopes) {
			const storedHash = await readStoredCredentialHash(scope);
			if (!storedHash) continue;
			if (timingSafeEqualStr(digest, storedHash)) return {
				authorized: true,
				status: 200
			};
		}
		if (misconfigured) return misconfigured;
		return {
			authorized: false,
			status: 401,
			reason: "Unauthorized"
		};
	}
	return misconfigured ?? {
		authorized: false,
		status: 401,
		reason: "Unauthorized"
	};
}
/**
* Async guard for privileged routes: returns a 401/503 response when the
* request may not proceed, or `null` when it is authorized.
*/
async function requirePrivileged(request, scopes) {
	const result = await evaluatePrivilegedAuth(request, Array.isArray(scopes) ? scopes : [scopes]);
	if (result.authorized) return null;
	return NextResponse.json({
		success: false,
		error: result.reason || "Unauthorized"
	}, { status: result.status });
}
//#endregion
export { requirePrivileged as t };
