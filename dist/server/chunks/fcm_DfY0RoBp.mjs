import { t as prisma } from "./prisma_ButH08Qi.mjs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
//#region lib/firebase/admin.ts
var adminApp = null;
function getFirebaseAdminApp() {
	const existingApps = getApps();
	if (existingApps.length > 0) {
		adminApp = existingApps[0];
		return adminApp;
	}
	const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	let privateKey = process.env.FIREBASE_PRIVATE_KEY;
	if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");
	if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) try {
		const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
		adminApp = initializeApp({
			credential: cert(serviceAccount),
			projectId: serviceAccount.project_id || projectId
		});
		return adminApp;
	} catch (e) {
		console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", e);
	}
	if (projectId && clientEmail && privateKey) try {
		adminApp = initializeApp({
			credential: cert({
				projectId,
				clientEmail,
				privateKey
			}),
			projectId
		});
		return adminApp;
	} catch (e) {
		console.warn("Failed to initialize Firebase Admin with individual credentials:", e);
	}
	if (process.env.NODE_ENV !== "production") try {
		adminApp = initializeApp({ projectId: projectId || "kerala-lottery-results-dev" });
		return adminApp;
	} catch (devErr) {
		console.warn("Dev Firebase Admin fallback initialization:", devErr);
	}
	return null;
}
function isFirebaseAdminConfigured() {
	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	const privateKey = process.env.FIREBASE_PRIVATE_KEY;
	return !!(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || projectId && clientEmail && privateKey);
}
function getFirebaseMessaging() {
	const app = getFirebaseAdminApp();
	if (!app) return null;
	try {
		return getMessaging(app);
	} catch (err) {
		console.warn("Error obtaining Firebase messaging:", err);
		return null;
	}
}
//#endregion
//#region lib/firebase/fcm.ts
/**
* Dispatches FCM Web Push notifications to all subscribed browsers for a published official result
*/
async function sendResultPublishedPushNotification(event) {
	const summary = {
		totalEligible: 0,
		sent: 0,
		skipped: 0,
		failed: 0,
		invalidTokensRemoved: 0
	};
	try {
		const subscriptions = await prisma.pushSubscription.findMany({
			where: {
				status: "ACTIVE",
				OR: [{ lotterySubscriptions: { some: { lotteryId: event.lotteryId } } }, { lotterySubscriptions: { none: {} } }]
			},
			include: { lotterySubscriptions: true }
		});
		summary.totalEligible = subscriptions.length;
		if (subscriptions.length === 0) return summary;
		const existingDeliveries = await prisma.notificationDelivery.findMany({
			where: {
				resultId: event.drawId,
				status: "SENT",
				pushSubscriptionId: { in: subscriptions.map((s) => s.id) }
			},
			select: { pushSubscriptionId: true }
		});
		const alreadySentSet = new Set(existingDeliveries.map((d) => d.pushSubscriptionId));
		const pendingSubscriptions = subscriptions.filter((s) => {
			if (alreadySentSet.has(s.id)) {
				summary.skipped++;
				return false;
			}
			return true;
		});
		if (pendingSubscriptions.length === 0) return summary;
		const messaging = getFirebaseMessaging();
		if (!messaging || !isFirebaseAdminConfigured()) {
			console.log(`[FCM Mock Dispatch] Sending to ${pendingSubscriptions.length} subscriptions for ${event.lotteryName} (${event.drawNumber}) -> ${event.resultUrl}`);
			for (const sub of pendingSubscriptions) {
				await prisma.notificationDelivery.upsert({
					where: { resultId_pushSubscriptionId: {
						resultId: event.drawId,
						pushSubscriptionId: sub.id
					} },
					update: {
						status: "SENT",
						sentAt: /* @__PURE__ */ new Date()
					},
					create: {
						resultId: event.drawId,
						pushSubscriptionId: sub.id,
						status: "SENT",
						sentAt: /* @__PURE__ */ new Date()
					}
				});
				summary.sent++;
			}
			return summary;
		}
		const chunkSize = 500;
		for (let i = 0; i < pendingSubscriptions.length; i += chunkSize) {
			const chunk = pendingSubscriptions.slice(i, i + chunkSize);
			const payload = {
				tokens: chunk.map((s) => s.fcmToken),
				notification: {
					title: "Kerala Lottery Result",
					body: `${event.lotteryName} ${event.drawNumber} result has been published. 1st Prize: ${event.firstPrizeAmountFormatted}.`
				},
				data: {
					type: "RESULT_PUBLISHED",
					resultId: event.drawId,
					lotteryId: event.lotteryId,
					lotteryName: event.lotteryName,
					drawNumber: event.drawNumber,
					drawDate: event.drawDate,
					url: event.resultUrl
				},
				webpush: {
					fcmOptions: { link: event.resultUrl },
					notification: {
						icon: "/icon-192.png",
						badge: "/icon-192.png",
						clickAction: event.resultUrl
					}
				}
			};
			const response = await messaging.sendEachForMulticast(payload);
			for (let idx = 0; idx < response.responses.length; idx++) {
				const res = response.responses[idx];
				const sub = chunk[idx];
				if (res.success) {
					summary.sent++;
					await prisma.notificationDelivery.upsert({
						where: { resultId_pushSubscriptionId: {
							resultId: event.drawId,
							pushSubscriptionId: sub.id
						} },
						update: {
							status: "SENT",
							sentAt: /* @__PURE__ */ new Date(),
							errorMessage: null
						},
						create: {
							resultId: event.drawId,
							pushSubscriptionId: sub.id,
							status: "SENT",
							sentAt: /* @__PURE__ */ new Date()
						}
					});
				} else {
					summary.failed++;
					const errorCode = res.error?.code;
					if (errorCode === "messaging/registration-token-not-registered" || errorCode === "messaging/invalid-registration-token" || errorCode === "messaging/mismatched-credential") {
						await prisma.pushSubscription.update({
							where: { id: sub.id },
							data: { status: "INACTIVE" }
						});
						summary.invalidTokensRemoved++;
					}
					await prisma.notificationDelivery.upsert({
						where: { resultId_pushSubscriptionId: {
							resultId: event.drawId,
							pushSubscriptionId: sub.id
						} },
						update: {
							status: "FAILED",
							errorMessage: res.error?.message || errorCode || "FCM delivery failed"
						},
						create: {
							resultId: event.drawId,
							pushSubscriptionId: sub.id,
							status: "FAILED",
							errorMessage: res.error?.message || errorCode || "FCM delivery failed"
						}
					});
				}
			}
		}
		return summary;
	} catch (error) {
		console.error("Fatal error in sendResultPublishedPushNotification:", error);
		return summary;
	}
}
//#endregion
export { sendResultPublishedPushNotification as t };
