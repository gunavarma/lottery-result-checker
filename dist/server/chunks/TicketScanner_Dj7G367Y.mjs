import { useCallback, useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, Check, CheckCircle2, Hash, Lock, Plus, QrCode, RefreshCw, Upload, X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
//#region lib/lottery/normalize-ticket.ts
/**
* Parses any raw scanner string or manual input into a structured, validated ticket.
*/
function parseTicketCode(rawValue, detectedFormat) {
	if (!rawValue || typeof rawValue !== "string") return {
		ticketNumber: "",
		rawValue: rawValue || "",
		format: detectedFormat,
		valid: false,
		series: null,
		number: "",
		isFourDigit: false,
		reason: "Empty input"
	};
	let cleaned = rawValue.trim();
	if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) try {
		const url = new URL(cleaned);
		const ticketParam = url.searchParams.get("ticket") || url.searchParams.get("t") || url.searchParams.get("number") || url.searchParams.get("num") || url.searchParams.get("code");
		if (ticketParam) cleaned = ticketParam;
		else {
			const segments = url.pathname.split("/").filter(Boolean);
			const last = segments[segments.length - 1];
			if (last && last.length >= 4 && last.length <= 15) cleaned = last;
		}
	} catch {}
	if (cleaned.startsWith("{") && cleaned.endsWith("}")) try {
		const json = JSON.parse(cleaned);
		const val = json.ticket || json.ticketNumber || json.number || json.num || json.code;
		if (typeof val === "string") cleaned = val;
	} catch {}
	const normalizedStr = cleaned.replace(/[\r\n\t\-_/|,:]+/g, " ").replace(/\s+/g, " ").trim();
	const fullSeriesMatch = normalizedStr.match(/^([A-Za-z]{1,3})\s*(\d{6})$/);
	if (fullSeriesMatch) {
		const series = fullSeriesMatch[1].toUpperCase();
		const number = fullSeriesMatch[2];
		return {
			ticketNumber: `${series} ${number}`,
			rawValue,
			format: detectedFormat || "SERIES_6DIGIT",
			valid: true,
			series,
			number,
			isFourDigit: false
		};
	}
	const flexibleSeriesMatch = normalizedStr.match(/^([A-Za-z]{1,3})\s*(\d{4,8})$/);
	if (flexibleSeriesMatch) {
		const series = flexibleSeriesMatch[1].toUpperCase();
		const number = flexibleSeriesMatch[2];
		return {
			ticketNumber: `${series} ${number}`,
			rawValue,
			format: detectedFormat || "SERIES_FLEXIBLE",
			valid: true,
			series,
			number,
			isFourDigit: number.length === 4
		};
	}
	const fourDigitMatch = normalizedStr.match(/^\d{4}$/);
	if (fourDigitMatch) {
		const number = fourDigitMatch[0];
		return {
			ticketNumber: number,
			rawValue,
			format: detectedFormat || "4_DIGIT_SLIP",
			valid: true,
			series: null,
			number,
			isFourDigit: true
		};
	}
	const sixDigitMatch = normalizedStr.match(/^\d{6}$/);
	if (sixDigitMatch) {
		const number = sixDigitMatch[0];
		return {
			ticketNumber: number,
			rawValue,
			format: detectedFormat || "6_DIGIT",
			valid: true,
			series: null,
			number,
			isFourDigit: false
		};
	}
	const embeddedMatch = normalizedStr.match(/([A-Za-z]{1,3})\s*(\d{6})/);
	if (embeddedMatch) {
		const series = embeddedMatch[1].toUpperCase();
		const number = embeddedMatch[2];
		return {
			ticketNumber: `${series} ${number}`,
			rawValue,
			format: detectedFormat || "EMBEDDED_EXTRACTED",
			valid: true,
			series,
			number,
			isFourDigit: false
		};
	}
	const digitsOnly = normalizedStr.replace(/\D/g, "");
	if (digitsOnly.length >= 4 && digitsOnly.length <= 8) return {
		ticketNumber: digitsOnly,
		rawValue,
		format: detectedFormat || "DIGITS_FALLBACK",
		valid: true,
		series: null,
		number: digitsOnly,
		isFourDigit: digitsOnly.length === 4
	};
	return {
		ticketNumber: normalizedStr,
		rawValue,
		format: detectedFormat,
		valid: false,
		series: null,
		number: digitsOnly,
		isFourDigit: false,
		reason: "Ticket number must be 4 to 8 digits or 2-letter series with 6 digits (e.g. \"SK 320327\" or \"0327\")"
	};
}
//#endregion
//#region lib/ocr/ticket-ocr.ts
var LOTTERY_KEYWORDS = [
	{
		name: "Karunya Plus",
		slug: "karunya-plus",
		code: "KN",
		patterns: [/KARUNYA\s*PLUS/i, /\bKN\b/i]
	},
	{
		name: "Karunya",
		slug: "karunya",
		code: "KR",
		patterns: [/KARUNYA/i, /\bKR\b/i]
	},
	{
		name: "Suvarna Keralam",
		slug: "suvarna-keralam",
		code: "SK",
		patterns: [
			/SUVARNA\s*KERALAM/i,
			/SUVARNA/i,
			/\bSK\b/i
		]
	},
	{
		name: "Sthree Sakthi",
		slug: "sthree-sakthi",
		code: "SS",
		patterns: [
			/STHREE\s*SAKTHI/i,
			/STHREESAKTHI/i,
			/\bSS\b/i
		]
	},
	{
		name: "Bhagya Thara",
		slug: "bhagya-thara",
		code: "BT",
		patterns: [
			/BHAGYA\s*THARA/i,
			/BHAGYATHARA/i,
			/\bBT\b/i
		]
	},
	{
		name: "Samrudhi",
		slug: "samrudhi",
		code: "SM",
		patterns: [/SAMRUDHI/i, /\bSM\b/i]
	},
	{
		name: "Dhanalekshmi",
		slug: "dhanalekshmi",
		code: "DL",
		patterns: [/DHANALEKSHMI/i, /\bDL\b/i]
	},
	{
		name: "Fifty-Fifty",
		slug: "fifty-fifty",
		code: "FF",
		patterns: [
			/FIFTY\s*FIFTY/i,
			/50\s*50/i,
			/\bFF\b/i
		]
	},
	{
		name: "Nirmal",
		slug: "nirmal",
		code: "NR",
		patterns: [/NIRMAL/i, /\bNR\b/i]
	},
	{
		name: "Win-Win",
		slug: "win-win",
		code: "W",
		patterns: [/WIN\s*WIN/i, /\bW\b/i]
	},
	{
		name: "Thiruvonam Bumper",
		slug: "thiruvonam-bumper",
		code: "BR-99",
		patterns: [
			/THIRUVONAM/i,
			/ONAM\s*BUMPER/i,
			/\bBR-?99\b/i
		]
	},
	{
		name: "Vishu Bumper",
		slug: "vishu-bumper",
		code: "BR-109",
		patterns: [/VISHU\s*BUMPER/i, /\bBR-?109\b/i]
	},
	{
		name: "Pooja Bumper",
		slug: "pooja-bumper",
		code: "BR-102",
		patterns: [/POOJA\s*BUMPER/i, /\bBR-?102\b/i]
	},
	{
		name: "X'mas New Year Bumper",
		slug: "xmas-new-year-bumper",
		code: "BR-98",
		patterns: [
			/XMAS/i,
			/CHRISTMAS/i,
			/NEW\s*YEAR\s*BUMPER/i,
			/\bBR-?98\b/i
		]
	}
];
var NON_SERIES_WORDS = /* @__PURE__ */ new Set([
	"NO",
	"NR",
	"KL",
	"TV",
	"TH",
	"IN",
	"OF",
	"ON",
	"TO",
	"AT",
	"DT",
	"RS",
	"RE",
	"RD",
	"ST",
	"ND"
]);
/**
* Clean OCR text by fixing common character confusions in numeric zones
*/
function cleanNumericDigits(str) {
	return str.replace(/[Oo]/g, "0").replace(/[Il|!]/g, "1").replace(/[Zz]/g, "2").replace(/[Ss]/g, "5").replace(/[Bb]/g, "8").replace(/[Gg]/g, "6").replace(/\D/g, "");
}
/**
* Parse OCR raw string from Kerala lottery ticket into structured ticket elements
*/
function parseKeralaLotteryTicketOcr(rawText) {
	if (!rawText || rawText.trim().length === 0) return {
		rawText: "",
		series: null,
		ticketNumber: null,
		fullTicketDisplay: null,
		detectedLotterySlug: null,
		detectedLotteryName: null,
		confidence: 0
	};
	const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
	let detectedSeries = null;
	let detectedNumber = null;
	let detectedLotterySlug = null;
	let detectedLotteryName = null;
	for (const scheme of LOTTERY_KEYWORDS) {
		for (const p of scheme.patterns) if (p.test(rawText)) {
			detectedLotterySlug = scheme.slug;
			detectedLotteryName = scheme.name;
			break;
		}
		if (detectedLotterySlug) break;
	}
	const seriesLabelMatch = rawText.match(/SERIES\s*[:.\-]?\s*([A-Za-z]{2})\b/i);
	if (seriesLabelMatch && !NON_SERIES_WORDS.has(seriesLabelMatch[1].toUpperCase())) detectedSeries = seriesLabelMatch[1].toUpperCase();
	const standardTicketRegex = /\b([A-Za-z]{2})[\s\-.:]+([0-9OlISBb]{6})\b/g;
	let match;
	while ((match = standardTicketRegex.exec(rawText)) !== null) {
		const candidateSeries = match[1].toUpperCase();
		if (!NON_SERIES_WORDS.has(candidateSeries)) {
			if (!detectedSeries) detectedSeries = candidateSeries;
			detectedNumber = cleanNumericDigits(match[2]);
			break;
		} else detectedNumber = cleanNumericDigits(match[2]);
	}
	if (!detectedNumber) for (const line of lines) {
		const m = line.match(/([A-Za-z]{2})\s*([0-9OlISBb]{6})/i);
		if (m && !NON_SERIES_WORDS.has(m[1].toUpperCase())) {
			if (!detectedSeries) detectedSeries = m[1].toUpperCase();
			detectedNumber = cleanNumericDigits(m[2]);
			break;
		}
		const mDigits = line.match(/\b([0-9]{6})\b/);
		if (mDigits && !detectedNumber) detectedNumber = mDigits[1];
		const mSeries = line.match(/\b([A-Z]{2})\b/);
		if (mSeries && !detectedSeries && !NON_SERIES_WORDS.has(mSeries[1].toUpperCase())) detectedSeries = mSeries[1].toUpperCase();
	}
	if (!detectedNumber) {
		const m4 = rawText.match(/\b([0-9]{4})\b/);
		if (m4) detectedNumber = m4[1];
	}
	let fullTicketDisplay = null;
	if (detectedNumber) fullTicketDisplay = detectedSeries ? `${detectedSeries} ${detectedNumber}` : detectedNumber;
	const confidence = detectedNumber && detectedNumber.length >= 4 ? detectedSeries ? 95 : 75 : 30;
	return {
		rawText,
		series: detectedSeries,
		ticketNumber: detectedNumber,
		fullTicketDisplay,
		detectedLotterySlug,
		detectedLotteryName,
		confidence
	};
}
//#endregion
//#region components/lottery/TicketScanner.tsx
function TicketScanner({ open, onOpenChange, onTicketsScanned, initialTickets = [] }) {
	const [activeTab, setActiveTab] = useState("camera");
	const [scannedTickets, setScannedTickets] = useState(initialTickets);
	const [fourDigitInput, setFourDigitInput] = useState("");
	const [cameraState, setCameraState] = useState("IDLE");
	const [cameraError, setCameraError] = useState(null);
	const [toastMessage, setToastMessage] = useState(null);
	const scannerRef = useRef(null);
	/** Separate instance used only for decoding an uploaded image. */
	const fileScannerRef = useRef(null);
	/** Lazily created Tesseract worker (only fetched when OCR is actually needed). */
	const ocrWorkerRef = useRef(null);
	const lastScannedTimeRef = useRef(/* @__PURE__ */ new Map());
	const toastTimeoutRef = useRef(null);
	const containerId = "kerala-lottery-scanner-viewport";
	/**
	* `Html5Qrcode.scanFile()` reads `document.getElementById(elementId)` and
	* dereferences it without a null check, and it refuses to run while a camera
	* scan is active on that same instance. So file decoding needs its own
	* permanently mounted (but invisible) container and its own instance,
	* otherwise photo scanning throws in both entry points.
	*/
	const fileScanContainerId = "kerala-lottery-file-scan-viewport";
	const [isReadingPhoto, setIsReadingPhoto] = useState(false);
	const showToast = useCallback((text, type = "success") => {
		if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
		setToastMessage({
			text,
			type
		});
		toastTimeoutRef.current = setTimeout(() => {
			setToastMessage(null);
		}, 2500);
	}, []);
	const handleDetectedCode = useCallback((rawValue, type = "barcode") => {
		const parsed = parseTicketCode(rawValue);
		if (!parsed.valid || !parsed.ticketNumber) {
			showToast("Invalid ticket code format", "warning");
			return false;
		}
		const normalizedNumber = parsed.ticketNumber;
		const now = Date.now();
		if (now - (lastScannedTimeRef.current.get(normalizedNumber) || 0) < 1500) return false;
		lastScannedTimeRef.current.set(normalizedNumber, now);
		setScannedTickets((prev) => {
			if (prev.some((t) => t.ticketNumber === normalizedNumber)) {
				showToast(`Already scanned: ${normalizedNumber}`, "info");
				return prev;
			}
			const newTicket = {
				id: `${normalizedNumber}-${now}-${Math.random().toString(36).slice(2, 6)}`,
				ticketNumber: normalizedNumber,
				rawValue,
				type,
				scannedAt: now
			};
			showToast(`Ticket added: ${normalizedNumber}`, "success");
			return [...prev, newTicket];
		});
		return true;
	}, [showToast]);
	const stopCamera = useCallback(async () => {
		if (scannerRef.current) try {
			if (scannerRef.current.isScanning) await scannerRef.current.stop();
			await scannerRef.current.clear();
		} catch (err) {
			console.warn("Error stopping camera scanner:", err);
		} finally {
			scannerRef.current = null;
			setCameraState("IDLE");
		}
	}, []);
	/**
	* Returns the dedicated file-decoding instance. Kept separate from the camera
	* instance so an active camera scan never blocks photo decoding.
	*/
	const getFileScanner = useCallback(() => {
		if (!fileScannerRef.current) fileScannerRef.current = new Html5Qrcode(fileScanContainerId, { verbose: false });
		return fileScannerRef.current;
	}, []);
	const releaseFileScanner = useCallback(() => {
		const instance = fileScannerRef.current;
		fileScannerRef.current = null;
		if (instance) try {
			instance.clear();
		} catch {}
	}, []);
	/** Lazily creates the OCR worker; tesseract is only downloaded when needed. */
	const getOcrWorker = useCallback(async () => {
		if (!ocrWorkerRef.current) {
			const { createWorker } = await import("tesseract.js");
			ocrWorkerRef.current = await createWorker("eng");
		}
		return ocrWorkerRef.current;
	}, []);
	const terminateOcrWorker = useCallback(async () => {
		const worker = ocrWorkerRef.current;
		ocrWorkerRef.current = null;
		if (worker) try {
			await worker.terminate();
		} catch {}
	}, []);
	const startCamera = useCallback(async () => {
		if (typeof window === "undefined" || !open || activeTab !== "camera") return;
		if (!window.isSecureContext && window.location.hostname !== "localhost") {
			setCameraState("ERROR");
			setCameraError("Camera access requires HTTPS connection.");
			return;
		}
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			setCameraState("UNSUPPORTED");
			setCameraError("Camera access is not supported on this device/browser.");
			return;
		}
		setCameraState("STARTING");
		setCameraError(null);
		await stopCamera();
		try {
			const formatsToSupport = [
				Html5QrcodeSupportedFormats.QR_CODE,
				Html5QrcodeSupportedFormats.CODE_128,
				Html5QrcodeSupportedFormats.CODE_39,
				Html5QrcodeSupportedFormats.EAN_13,
				Html5QrcodeSupportedFormats.EAN_8,
				Html5QrcodeSupportedFormats.UPC_A,
				Html5QrcodeSupportedFormats.UPC_E,
				Html5QrcodeSupportedFormats.ITF,
				Html5QrcodeSupportedFormats.PDF_417
			];
			const html5QrCode = new Html5Qrcode(containerId, {
				formatsToSupport,
				verbose: false
			});
			scannerRef.current = html5QrCode;
			const config = {
				fps: 15,
				qrbox: (viewfinderWidth, viewfinderHeight) => {
					const minDim = Math.min(viewfinderWidth, viewfinderHeight);
					return {
						width: Math.floor(minDim * .85),
						height: Math.floor(minDim * .55)
					};
				},
				aspectRatio: 1.333334
			};
			const onScanSuccess = (decodedText, result) => {
				const type = (result?.result?.format?.formatName || "BARCODE").includes("QR") ? "qr" : "barcode";
				handleDetectedCode(decodedText, type);
			};
			const onScanError = () => {};
			const primaryFacing = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "environment" : "user";
			try {
				await html5QrCode.start({ facingMode: primaryFacing }, config, onScanSuccess, onScanError);
			} catch (firstErr) {
				console.warn(`Camera start with facingMode "${primaryFacing}" failed, trying alternate...`, firstErr);
				const altFacing = primaryFacing === "environment" ? "user" : "environment";
				try {
					await html5QrCode.start({ facingMode: altFacing }, config, onScanSuccess, onScanError);
				} catch (secondErr) {
					throw secondErr;
				}
			}
			setCameraState("SCANNING");
		} catch (err) {
			console.error("Camera initialization failed:", err);
			setCameraState("ERROR");
			const errStr = String(err?.message || err);
			if (err?.name === "NotAllowedError" || errStr.includes("Permission denied") || errStr.includes("NotAllowedError")) setCameraError("The browser blocked camera access. Check the camera icon in the address bar, and the browser/OS camera permission for this site.");
			else if (err?.name === "NotFoundError" || errStr.includes("Requested device not found")) setCameraError("No camera found on this device.");
			else setCameraError(errStr || "Unable to start camera scanner.");
		}
	}, [
		open,
		activeTab,
		handleDetectedCode,
		stopCamera
	]);
	useEffect(() => {
		if (open && activeTab === "camera") {
			const timer = setTimeout(() => {
				startCamera();
			}, 100);
			return () => clearTimeout(timer);
		} else stopCamera();
	}, [
		open,
		activeTab,
		startCamera,
		stopCamera
	]);
	useEffect(() => {
		return () => {
			stopCamera();
			releaseFileScanner();
			terminateOcrWorker();
			if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
		};
	}, [
		stopCamera,
		releaseFileScanner,
		terminateOcrWorker
	]);
	useEffect(() => {
		if (open) return;
		releaseFileScanner();
		terminateOcrWorker();
	}, [
		open,
		releaseFileScanner,
		terminateOcrWorker
	]);
	const handleClose = useCallback(async () => {
		await stopCamera();
		onOpenChange(false);
	}, [onOpenChange, stopCamera]);
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape" && open) handleClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, handleClose]);
	const handleDone = async () => {
		await stopCamera();
		onOpenChange(false);
		onTicketsScanned(scannedTickets);
	};
	const removeTicket = (id) => {
		setScannedTickets((prev) => prev.filter((t) => t.id !== id));
	};
	const fileInputRef = useRef(null);
	const requestPermissionDirectly = async () => {
		try {
			setCameraState("STARTING");
			setCameraError(null);
			(await navigator.mediaDevices.getUserMedia({ video: true })).getTracks().forEach((track) => track.stop());
			await startCamera();
		} catch (err) {
			console.error("Explicit permission request failed:", err);
			setCameraState("ERROR");
			const errStr = String(err?.message || err);
			setCameraError(errStr.includes("Permission denied") || errStr.includes("NotAllowedError") ? "Permission was denied. Please click the 🔒 lock/camera icon in your address bar to allow Camera access." : errStr);
		}
	};
	/**
	* Upload / snap-photo path.
	*
	* Two stages, because a ticket photo frequently has no machine-readable code:
	*   1. Decode a QR code or barcode from the image (fast, exact).
	*   2. Fall back to OCR of the printed ticket number.
	* OCR is the only way to read a photo of a ticket whose barcode is damaged,
	* cropped or simply not in frame, so without stage 2 those photos fail.
	*/
	const handleFileUpload = async (e) => {
		const input = e.target;
		const file = input.files?.[0];
		if (!file) return;
		try {
			try {
				showToast("Scanning ticket photo...", "info");
				const decoded = await getFileScanner().scanFile(file, false);
				if (handleDetectedCode(decoded, "barcode")) return;
			} catch (err) {
				console.warn("No barcode decoded from photo, trying OCR:", err);
			}
			setIsReadingPhoto(true);
			showToast("Reading ticket number from photo...", "info");
			const detected = parseKeralaLotteryTicketOcr((await (await getOcrWorker()).recognize(file))?.data?.text || "");
			if (!detected.ticketNumber) {
				showToast("No readable ticket number found in that photo", "warning");
				return;
			}
			const candidate = detected.series ? `${detected.series} ${detected.ticketNumber}` : detected.ticketNumber;
			if (!handleDetectedCode(candidate, "ocr")) showToast("Ticket number detected but could not be read reliably", "warning");
		} catch (err) {
			console.warn("Photo scan failed:", err);
			showToast("Could not read that photo. Try a sharper image, or type the digits.", "warning");
		} finally {
			setIsReadingPhoto(false);
			if (input) input.value = "";
		}
	};
	const handleAddFourDigit = (e) => {
		if (e) e.preventDefault();
		const clean = fourDigitInput.trim();
		if (/^\d{4}$/.test(clean)) {
			handleDetectedCode(clean, "slip");
			setFourDigitInput("");
		}
	};
	if (!open) return null;
	return /* @__PURE__ */ jsxs("div", {
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "scanner-modal-title",
		className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200",
		children: [/* @__PURE__ */ jsx("div", {
			id: fileScanContainerId,
			"aria-hidden": "true",
			className: "absolute w-0 h-0 overflow-hidden pointer-events-none opacity-0"
		}), /* @__PURE__ */ jsxs("div", {
			className: "relative w-full max-w-lg bg-[#10201D] text-white rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
						id: "scanner-modal-title",
						className: "text-base sm:text-lg font-extrabold text-white tracking-tight",
						children: "Scan tickets — one after another"
					}), /* @__PURE__ */ jsxs("p", {
						className: "text-[11px] text-slate-300",
						children: [
							scannedTickets.length,
							" ticket",
							scannedTickets.length === 1 ? "" : "s",
							" recorded in this batch"
						]
					})] }), /* @__PURE__ */ jsx("button", {
						onClick: handleClose,
						"aria-label": "Close scanner",
						className: "w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer",
						children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "px-6 pt-4 pb-2 bg-black/20",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex p-1 bg-black/40 rounded-xl border border-white/10 text-xs font-bold",
						children: [
							/* @__PURE__ */ jsxs("button", {
								onClick: () => setActiveTab("camera"),
								className: `flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "camera" ? "bg-[#0B3B32] text-white shadow-xs" : "text-slate-400 hover:text-white"}`,
								children: [/* @__PURE__ */ jsx(QrCode, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Barcode / QR" })]
							}),
							/* @__PURE__ */ jsxs("button", {
								onClick: () => setActiveTab("slip"),
								className: `flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "slip" ? "bg-[#0B3B32] text-white shadow-xs" : "text-slate-400 hover:text-white"}`,
								children: [/* @__PURE__ */ jsx(Hash, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "4-digit slip" })]
							}),
							/* @__PURE__ */ jsxs("button", {
								onClick: () => setActiveTab("upload"),
								className: `flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "upload" ? "bg-[#0B3B32] text-white shadow-xs" : "text-slate-400 hover:text-white"}`,
								children: [/* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Upload Photo" })]
							})
						]
					})
				}),
				isReadingPhoto && /* @__PURE__ */ jsxs("div", {
					className: "mx-6 mt-3 flex items-center gap-2 rounded-xl border border-[#C8A45D]/40 bg-[#C8A45D]/10 px-3 py-2 text-[11px] font-bold text-[#C8A45D]",
					children: [/* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5 animate-spin" }), /* @__PURE__ */ jsx("span", { children: "Reading the ticket number from your photo..." })]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex-1 overflow-y-auto px-6 py-3 space-y-4",
					children: [
						activeTab === "camera" && /* @__PURE__ */ jsxs("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center shadow-inner",
									children: [
										/* @__PURE__ */ jsx("div", {
											id: containerId,
											className: "w-full h-full overflow-hidden"
										}),
										cameraState === "SCANNING" && /* @__PURE__ */ jsx("div", {
											className: "absolute inset-0 pointer-events-none flex items-center justify-center p-6",
											children: /* @__PURE__ */ jsxs("div", {
												className: "relative w-4/5 h-3/5 border-2 border-[#16845B]/80 rounded-xl shadow-[0_0_15px_rgba(22,132,91,0.5)] flex flex-col justify-between p-2",
												children: [
													/* @__PURE__ */ jsx("span", { className: "absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#C8A45D]" }),
													/* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#C8A45D]" }),
													/* @__PURE__ */ jsx("span", { className: "absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#C8A45D]" }),
													/* @__PURE__ */ jsx("span", { className: "absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#C8A45D]" }),
													/* @__PURE__ */ jsx("div", { className: "w-full h-0.5 bg-gradient-to-r from-transparent via-[#74E3B7] to-transparent shadow-[0_0_8px_#74E3B7] animate-pulse" })
												]
											})
										}),
										cameraState === "STARTING" && /* @__PURE__ */ jsxs("div", {
											className: "absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 p-4 text-center",
											children: [/* @__PURE__ */ jsx(RefreshCw, { className: "w-8 h-8 text-[#C8A45D] animate-spin" }), /* @__PURE__ */ jsx("span", {
												className: "text-xs text-slate-300 font-medium",
												children: "Initializing camera..."
											})]
										}),
										(cameraState === "ERROR" || cameraState === "UNSUPPORTED") && /* @__PURE__ */ jsxs("div", {
											className: "absolute inset-0 bg-[#10201D] flex flex-col items-center justify-center p-5 text-center overflow-y-auto space-y-3 z-20",
											children: [
												/* @__PURE__ */ jsx("div", {
													className: "w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0",
													children: /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5" })
												}),
												/* @__PURE__ */ jsxs("div", {
													className: "space-y-1 max-w-sm",
													children: [/* @__PURE__ */ jsx("p", {
														className: "text-xs font-black text-white uppercase tracking-wider",
														children: "Camera Access Blocked or Denied"
													}), /* @__PURE__ */ jsx("p", {
														className: "text-[11px] text-slate-300 leading-relaxed",
														children: cameraError || "Camera could not be accessed on this device."
													})]
												}),
												/* @__PURE__ */ jsxs("div", {
													className: "bg-black/50 border border-white/10 rounded-xl p-3 text-[10px] text-left text-slate-300 max-w-xs space-y-1",
													children: [/* @__PURE__ */ jsxs("p", {
														className: "font-bold text-white flex items-center gap-1",
														children: [/* @__PURE__ */ jsx(Lock, { className: "w-3 h-3 text-[#C8A45D]" }), /* @__PURE__ */ jsx("span", { children: "How to enable in browser:" })]
													}), /* @__PURE__ */ jsxs("ol", {
														className: "list-decimal list-inside space-y-0.5 text-slate-300",
														children: [
															/* @__PURE__ */ jsxs("li", { children: [
																"Click the ",
																/* @__PURE__ */ jsx("strong", { children: "🔒 lock / camera icon" }),
																" in the browser address bar"
															] }),
															/* @__PURE__ */ jsxs("li", { children: [
																"Toggle ",
																/* @__PURE__ */ jsx("strong", { children: "Camera" }),
																" to ",
																/* @__PURE__ */ jsx("strong", { children: "Allow" })
															] }),
															/* @__PURE__ */ jsx("li", { children: "Mac users: Check System Settings → Privacy & Security → Camera" })
														]
													})]
												}),
												/* @__PURE__ */ jsxs("div", {
													className: "flex flex-wrap items-center justify-center gap-2 pt-1",
													children: [
														/* @__PURE__ */ jsx("button", {
															type: "button",
															onClick: requestPermissionDirectly,
															className: "px-4 py-2 rounded-xl bg-[#16845B] hover:bg-[#16845B]/90 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs",
															children: "Request Camera Access"
														}),
														/* @__PURE__ */ jsxs("button", {
															type: "button",
															onClick: () => fileInputRef.current?.click(),
															className: "px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer inline-flex items-center gap-1.5",
															children: [/* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ jsx("span", { children: "Upload Ticket Photo" })]
														}),
														/* @__PURE__ */ jsx("button", {
															type: "button",
															onClick: () => setActiveTab("slip"),
															className: "px-4 py-2 rounded-xl bg-black/40 border border-white/15 hover:bg-black/60 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer",
															children: "Use 4-digit slip"
														})
													]
												})
											]
										})
									]
								}),
								/* @__PURE__ */ jsx("input", {
									ref: fileInputRef,
									type: "file",
									accept: "image/*",
									capture: "environment",
									onChange: handleFileUpload,
									className: "hidden"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between text-[11px] text-slate-300 px-1",
									children: [/* @__PURE__ */ jsx("span", { children: "Align the barcode or QR code inside the green frame." }), /* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => fileInputRef.current?.click(),
										className: "font-bold text-[#C8A45D] hover:underline inline-flex items-center gap-1 cursor-pointer",
										children: [/* @__PURE__ */ jsx(Upload, { className: "w-3 h-3" }), /* @__PURE__ */ jsx("span", { children: "Snap / Upload Photo" })]
									})]
								})
							]
						}),
						activeTab === "slip" && /* @__PURE__ */ jsxs("div", {
							className: "space-y-4 py-2",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "bg-black/30 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4",
								children: [/* @__PURE__ */ jsxs("label", {
									className: "block space-y-1",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-xs font-bold text-slate-200",
										children: "Type last 4 digits"
									}), /* @__PURE__ */ jsx("span", {
										className: "text-[11px] text-slate-400 block",
										children: "Applicable for 3rd to 8th prizes and daily consolidation slips."
									})]
								}), /* @__PURE__ */ jsxs("form", {
									onSubmit: handleAddFourDigit,
									className: "flex gap-2",
									children: [/* @__PURE__ */ jsx("div", {
										className: "relative flex-1",
										children: /* @__PURE__ */ jsx("input", {
											type: "text",
											inputMode: "numeric",
											pattern: "[0-9]*",
											maxLength: 4,
											value: fourDigitInput,
											onChange: (e) => {
												const val = e.target.value.replace(/\D/g, "").slice(0, 4);
												setFourDigitInput(val);
											},
											placeholder: "e.g. 1234",
											className: "w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-xl font-mono font-bold tracking-widest text-center text-white placeholder:text-slate-600 focus:outline-none focus:border-[#C8A45D] font-tabular"
										})
									}), /* @__PURE__ */ jsxs("button", {
										type: "submit",
										disabled: fourDigitInput.trim().length !== 4,
										className: "px-5 py-3 rounded-xl bg-[#16845B] hover:bg-[#16845B]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-tabular",
										children: [/* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: "Add" })]
									})]
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-slate-300 flex items-start gap-2",
								children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-[#16845B] shrink-0 mt-0.5" }), /* @__PURE__ */ jsxs("span", { children: [
									"Enter 4 digits and tap ",
									/* @__PURE__ */ jsx("strong", { children: "Add" }),
									" or hit ",
									/* @__PURE__ */ jsx("strong", { children: "Enter" }),
									". You can add multiple tickets before tapping Done."
								] })]
							})]
						}),
						activeTab === "upload" && /* @__PURE__ */ jsxs("div", {
							className: "space-y-4 py-2",
							children: [/* @__PURE__ */ jsxs("div", {
								onClick: () => fileInputRef.current?.click(),
								className: "bg-black/30 border-2 border-dashed border-white/20 hover:border-[#C8A45D] rounded-2xl p-8 text-center space-y-3 cursor-pointer transition-colors",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "w-12 h-12 rounded-full bg-[#16845B]/20 border border-[#16845B]/40 flex items-center justify-center text-[#74E3B7] mx-auto",
										children: /* @__PURE__ */ jsx(Upload, { className: "w-6 h-6" })
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-xs font-bold text-white",
											children: "Tap to Choose Ticket Image or Snap Photo"
										}), /* @__PURE__ */ jsx("p", {
											className: "text-[11px] text-slate-400 max-w-xs mx-auto",
											children: "Does not require browser camera streaming permissions. Automatically decodes ticket barcodes and QR codes."
										})]
									}),
									/* @__PURE__ */ jsx("button", {
										type: "button",
										className: "px-4 py-2 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold transition-colors cursor-pointer",
										children: "Browse or Take Photo"
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-slate-300 flex items-start gap-2",
								children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-[#16845B] shrink-0 mt-0.5" }), /* @__PURE__ */ jsx("span", { children: "You can upload or photograph multiple tickets one after another. Each recognized ticket is automatically added to your batch." })]
							})]
						}),
						toastMessage && /* @__PURE__ */ jsx("div", {
							className: `p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${toastMessage.type === "success" ? "bg-[#16845B] text-white" : toastMessage.type === "info" ? "bg-amber-600 text-white" : "bg-rose-600 text-white"}`,
							children: /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [toastMessage.type === "success" ? /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 stroke-[3]" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4" }), /* @__PURE__ */ jsx("span", { children: toastMessage.text })]
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2 pt-1 border-t border-white/10",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between text-xs text-slate-300",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "font-bold uppercase tracking-wider text-[10px] text-[#C8A45D] font-tabular",
									children: [
										"Scanned Tickets (",
										scannedTickets.length,
										")"
									]
								}), scannedTickets.length > 0 && /* @__PURE__ */ jsx("button", {
									onClick: () => setScannedTickets([]),
									className: "text-[11px] text-rose-300 hover:text-rose-200 transition-colors cursor-pointer",
									children: "Clear all"
								})]
							}), scannedTickets.length === 0 ? /* @__PURE__ */ jsx("p", {
								className: "text-xs text-slate-400 py-3 text-center bg-white/5 rounded-xl border border-white/5",
								children: "No tickets scanned yet. Point your camera or type 4 digits to start."
							}) : /* @__PURE__ */ jsx("div", {
								className: "flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-black/40 rounded-xl border border-white/10",
								children: scannedTickets.map((ticket) => /* @__PURE__ */ jsxs("span", {
									className: "inline-flex items-center gap-1.5 bg-[#0B3B32] border border-[#16845B]/60 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg font-tabular",
									children: [/* @__PURE__ */ jsx("span", { children: ticket.ticketNumber }), /* @__PURE__ */ jsx("button", {
										onClick: () => removeTicket(ticket.id),
										"aria-label": `Remove ticket ${ticket.ticketNumber}`,
										className: "text-slate-300 hover:text-white cursor-pointer",
										children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
									})]
								}, ticket.id))
							})]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-black/40",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "text-xs font-bold text-slate-300 font-tabular",
						children: [scannedTickets.length, " scanned"]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("button", {
							onClick: handleClose,
							className: "px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer",
							children: "Cancel"
						}), /* @__PURE__ */ jsxs("button", {
							onClick: handleDone,
							disabled: scannedTickets.length === 0,
							className: "px-6 py-2.5 rounded-xl bg-[#C8A45D] hover:bg-[#C8A45D]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#17201D] font-extrabold text-xs shadow-md transition-all cursor-pointer font-tabular",
							children: [
								"Done (",
								scannedTickets.length,
								")"
							]
						})]
					})]
				})
			]
		})]
	});
}
//#endregion
export { TicketScanner };
