'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  QrCode,
  Hash,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { parseTicketCode, ParsedTicket } from '@/lib/lottery/normalize-ticket';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export interface ScannedTicket {
  id: string;
  ticketNumber: string;
  rawValue?: string;
  type: 'qr' | 'barcode' | 'slip';
  scannedAt: number;
}

interface TicketScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketsScanned: (tickets: ScannedTicket[]) => void;
  initialTickets?: ScannedTicket[];
}

export function TicketScanner({
  open,
  onOpenChange,
  onTicketsScanned,
  initialTickets = [],
}: TicketScannerProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'slip'>('camera');
  const [scannedTickets, setScannedTickets] = useState<ScannedTicket[]>(initialTickets);
  const [fourDigitInput, setFourDigitInput] = useState('');
  const [cameraState, setCameraState] = useState<
    'IDLE' | 'STARTING' | 'SCANNING' | 'ERROR' | 'UNSUPPORTED'
  >('IDLE');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<Map<string, number>>(new Map());
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerId = 'kerala-lottery-scanner-viewport';

  // Trigger brief feedback toast
  const showToast = useCallback((text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Handle incoming raw ticket code from camera or manual slip
  const handleDetectedCode = useCallback(
    (rawValue: string, type: 'qr' | 'barcode' | 'slip' = 'barcode') => {
      const parsed: ParsedTicket = parseTicketCode(rawValue);

      if (!parsed.valid || !parsed.ticketNumber) {
        showToast('Invalid ticket code format', 'warning');
        return false;
      }

      const normalizedNumber = parsed.ticketNumber;

      // Cooldown / debounce duplicate detection (1.5 seconds per code)
      const now = Date.now();
      const lastScanned = lastScannedTimeRef.current.get(normalizedNumber) || 0;
      if (now - lastScanned < 1500) {
        return false;
      }
      lastScannedTimeRef.current.set(normalizedNumber, now);

      // Check if ticket already added to current session
      setScannedTickets((prev) => {
        const isDuplicate = prev.some((t) => t.ticketNumber === normalizedNumber);
        if (isDuplicate) {
          showToast(`Already scanned: ${normalizedNumber}`, 'info');
          return prev;
        }

        const newTicket: ScannedTicket = {
          id: `${normalizedNumber}-${now}-${Math.random().toString(36).slice(2, 6)}`,
          ticketNumber: normalizedNumber,
          rawValue,
          type,
          scannedAt: now,
        };

        showToast(`Ticket added: ${normalizedNumber}`, 'success');
        return [...prev, newTicket];
      });

      return true;
    },
    [showToast]
  );

  // Stop camera tracks cleanly
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping camera scanner:', err);
      } finally {
        scannerRef.current = null;
        setCameraState('IDLE');
      }
    }
  }, []);

  // Initialize camera scanner
  const startCamera = useCallback(async () => {
    if (typeof window === 'undefined' || !open || activeTab !== 'camera') return;

    // Check if secure context
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setCameraState('ERROR');
      setCameraError('Camera access requires HTTPS connection.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('UNSUPPORTED');
      setCameraError('Camera access is not supported on this device/browser.');
      return;
    }

    setCameraState('STARTING');
    setCameraError(null);

    // Stop existing instance before re-creating
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
        Html5QrcodeSupportedFormats.PDF_417,
      ];

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport,
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(minDim * 0.85),
            height: Math.floor(minDim * 0.55),
          };
        },
        aspectRatio: 1.333334,
      };

      const onScanSuccess = (decodedText: string, result: any) => {
        const formatName = result?.result?.format?.formatName || 'BARCODE';
        const type = formatName.includes('QR') ? 'qr' : 'barcode';
        handleDetectedCode(decodedText, type);
      };

      const onScanError = () => {
        // Frame parsed with no barcode found — keep quiet for performance
      };

      // Determine camera device ID or facingMode
      let cameraConfig: any = { facingMode: 'environment' };
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const rearCam = devices.find((d) =>
            /back|rear|environment/i.test(d.label)
          );
          cameraConfig = rearCam ? rearCam.id : devices[0].id;
        }
      } catch {
        // If getCameras fails before permission, fallback to facingMode string
        cameraConfig = { facingMode: 'environment' };
      }

      try {
        await html5QrCode.start(cameraConfig, config, onScanSuccess, onScanError);
      } catch (firstErr) {
        // If environment/rear camera failed (e.g. on laptop with only front camera), fallback to user camera
        console.warn('Initial camera start failed, attempting user camera fallback...', firstErr);
        await html5QrCode.start({ facingMode: 'user' }, config, onScanSuccess, onScanError);
      }

      setCameraState('SCANNING');
    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      setCameraState('ERROR');
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        setCameraError('Camera permission was denied. Please allow camera access in browser settings.');
      } else if (err?.name === 'NotFoundError') {
        setCameraError('No camera detected on this device.');
      } else {
        setCameraError(err?.message || 'Unable to start camera scanner.');
      }
    }
  }, [open, activeTab, handleDetectedCode, stopCamera]);

  // Manage camera lifecycle based on modal visibility and active tab
  useEffect(() => {
    if (open && activeTab === 'camera') {
      // Delay slightly for DOM viewport container to mount
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [open, activeTab, startCamera, stopCamera]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [stopCamera]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Close handler with camera tear down
  const handleClose = async () => {
    await stopCamera();
    onOpenChange(false);
  };

  // Done button handler
  const handleDone = async () => {
    await stopCamera();
    onOpenChange(false);
    onTicketsScanned(scannedTickets);
  };

  // Remove individual ticket
  const removeTicket = (id: string) => {
    setScannedTickets((prev) => prev.filter((t) => t.id !== id));
  };

  // Add 4-digit manual slip ticket
  const handleAddFourDigit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = fourDigitInput.trim();
    if (/^\d{4}$/.test(clean)) {
      handleDetectedCode(clean, 'slip');
      setFourDigitInput('');
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#10201D] text-white rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30">
          <div>
            <h2 id="scanner-modal-title" className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Scan tickets — one after another
            </h2>
            <p className="text-[11px] text-slate-300">
              {scannedTickets.length} ticket{scannedTickets.length === 1 ? '' : 's'} recorded in this batch
            </p>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close scanner"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2 bg-black/20">
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-[#0B3B32] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Barcode / QR</span>
            </button>
            <button
              onClick={() => setActiveTab('slip')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'slip'
                  ? 'bg-[#0B3B32] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>4-digit slip</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
          {/* TAB 1: Camera Barcode / QR Scanner */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {/* Camera Viewport Container */}
              <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center shadow-inner">
                {/* HTML5 QR Code Mount Node */}
                <div id={containerId} className="w-full h-full overflow-hidden" />

                {/* Laser Overlay & Scanning Frame UI (Active during scanning) */}
                {cameraState === 'SCANNING' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                    <div className="relative w-4/5 h-3/5 border-2 border-[#16845B]/80 rounded-xl shadow-[0_0_15px_rgba(22,132,91,0.5)] flex flex-col justify-between p-2">
                      {/* Corner Brackets */}
                      <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#C8A45D]" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#C8A45D]" />
                      <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#C8A45D]" />
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#C8A45D]" />

                      {/* Animated Scanning Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#74E3B7] to-transparent shadow-[0_0_8px_#74E3B7] animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Camera Starting Spinner */}
                {cameraState === 'STARTING' && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <RefreshCw className="w-8 h-8 text-[#C8A45D] animate-spin" />
                    <span className="text-xs text-slate-300 font-medium">
                      Initializing camera...
                    </span>
                  </div>
                )}

                {/* Camera Error Fallback View */}
                {(cameraState === 'ERROR' || cameraState === 'UNSUPPORTED') && (
                  <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-xs">
                      <p className="text-xs font-bold text-white">Camera Access Required</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {cameraError || 'Camera could not be accessed. You can still enter ticket numbers manually.'}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={startCamera}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        Retry Camera
                      </button>
                      <button
                        onClick={() => setActiveTab('slip')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        Use 4-digit slip
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-center text-slate-300">
                Align the barcode or QR code inside the green frame. Scan as many tickets as you want.
              </p>
            </div>
          )}

          {/* TAB 2: Manual 4-digit Slip Input */}
          {activeTab === 'slip' && (
            <div className="space-y-4 py-2">
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-200">
                    Type last 4 digits
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Applicable for 3rd to 8th prizes and daily consolidation slips.
                  </span>
                </label>

                <form onSubmit={handleAddFourDigit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={fourDigitInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setFourDigitInput(val);
                      }}
                      placeholder="e.g. 1234"
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-xl font-mono font-bold tracking-widest text-center text-white placeholder:text-slate-600 focus:outline-none focus:border-[#C8A45D] font-tabular"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={fourDigitInput.trim().length !== 4}
                    className="px-5 py-3 rounded-xl bg-[#16845B] hover:bg-[#16845B]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-tabular"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16845B] shrink-0 mt-0.5" />
                <span>
                  Enter 4 digits and tap <strong>Add</strong> or hit <strong>Enter</strong>. You can add multiple tickets before tapping Done.
                </span>
              </div>
            </div>
          )}

          {/* Feedback Toast Notification */}
          {toastMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
                toastMessage.type === 'success'
                  ? 'bg-[#16845B] text-white'
                  : toastMessage.type === 'info'
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {toastMessage.type === 'success' ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{toastMessage.text}</span>
              </div>
            </div>
          )}

          {/* Scanned Tickets List Section */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[#C8A45D] font-tabular">
                Scanned Tickets ({scannedTickets.length})
              </span>
              {scannedTickets.length > 0 && (
                <button
                  onClick={() => setScannedTickets([])}
                  className="text-[11px] text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {scannedTickets.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-white/5 rounded-xl border border-white/5">
                No tickets scanned yet. Point your camera or type 4 digits to start.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-black/40 rounded-xl border border-white/10">
                {scannedTickets.map((ticket) => (
                  <span
                    key={ticket.id}
                    className="inline-flex items-center gap-1.5 bg-[#0B3B32] border border-[#16845B]/60 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg font-tabular"
                  >
                    <span>{ticket.ticketNumber}</span>
                    <button
                      onClick={() => removeTicket(ticket.id)}
                      aria-label={`Remove ticket ${ticket.ticketNumber}`}
                      className="text-slate-300 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-black/40">
          <span className="text-xs font-bold text-slate-300 font-tabular">
            {scannedTickets.length} scanned
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              disabled={scannedTickets.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[#C8A45D] hover:bg-[#C8A45D]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#17201D] font-extrabold text-xs shadow-md transition-all cursor-pointer font-tabular"
            >
              Done ({scannedTickets.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
