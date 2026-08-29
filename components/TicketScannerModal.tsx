'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScanLine,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  ZapOff,
  SwitchCamera,
  ArrowRight,
  Upload,
  Loader2,
  ShieldAlert,
  HelpCircle,
  Camera,
} from 'lucide-react';
import { parseKeralaLotteryTicketOcr, DetectedTicketResult } from '@/lib/ocr/ticket-ocr';

interface TicketScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketDetected: (ticketData: {
    ticketNumber: string;
    series: string | null;
    fullTicket: string;
    lotterySlug?: string | null;
  }) => void;
}

export function TicketScannerModal({
  isOpen,
  onClose,
  onTicketDetected,
}: TicketScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<any>(null);
  const isAnalyzingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'denied' | 'unavailable'>('requesting');
  const [cameraErrorDetails, setCameraErrorDetails] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const [detectedResult, setDetectedResult] = useState<DetectedTicketResult | null>(null);
  const [editSeries, setEditSeries] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Lazy-load Tesseract worker instance
  const getOcrWorker = async () => {
    if (!workerRef.current) {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      workerRef.current = worker;
    }
    return workerRef.current;
  };

  // Terminate Tesseract worker
  const terminateWorker = async () => {
    if (workerRef.current) {
      try {
        await workerRef.current.terminate();
      } catch {
        // Ignore termination errors
      }
      workerRef.current = null;
    }
  };

  // Stop camera tracks safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop error
        }
      });
      streamRef.current = null;
      setStream(null);
    }
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  // Request & start camera stream with clean single-invocation fallback
  const startCamera = useCallback(async (preferredFacing: 'environment' | 'user' = 'environment', deviceId?: string) => {
    stopCamera();
    setCameraState('requesting');
    setCameraErrorDetails(null);
    setDetectedResult(null);
    setUploadError(null);
    setScanAttempts(0);
    isAnalyzingRef.current = false;
    setIsAnalyzing(false);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unavailable');
      setCameraErrorDetails('Camera API is not supported in this browser or context.');
      return;
    }

    try {
      let mediaStream: MediaStream;

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: preferredFacing },
            },
        audio: false,
      };

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        console.warn('Initial camera constraint attempt failed, trying universal fallback:', firstErr);
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (fallbackErr: any) {
          throw fallbackErr;
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraState('active');

      // Check flashlight/torch capability safely
      try {
        const track = mediaStream.getVideoTracks()[0];
        if (track && typeof (track as any).getCapabilities === 'function') {
          const caps = (track as any).getCapabilities() || {};
          setHasTorch(Boolean(caps.torch));
        }
      } catch {
        setHasTorch(false);
      }

      // Enumerate available video inputs safely
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(inputs);
      } catch {
        // Ignore enumeration errors
      }
    } catch (err: any) {
      console.warn('Camera request error:', err);
      const errMsg = err?.message || err?.name || 'Camera access failed';
      setCameraErrorDetails(errMsg);

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.name === 'SecurityError'
      ) {
        setCameraState('denied');
      } else {
        setCameraState('unavailable');
      }
    }
  }, [stopCamera]);

  // Safely bind media stream to video element
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('muted', 'true');

    const handleLoadedMetadata = () => {
      video.play().catch(() => {});
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [stream]);

  // Handle modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera('environment');
    } else {
      stopCamera();
      terminateWorker();
    }

    return () => {
      stopCamera();
      terminateWorker();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      // Ignore torch error
    }
  };

  // Switch Camera between rear/front or next device
  const handleSwitchCamera = () => {
    if (videoDevices.length > 1) {
      const nextIndex = (currentDeviceIndex + 1) % videoDevices.length;
      setCurrentDeviceIndex(nextIndex);
      startCamera(facingMode, videoDevices[nextIndex].deviceId);
    } else {
      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextMode);
      startCamera(nextMode);
    }
  };

  // Process a frame image source with OCR
  const processFrameSnapshot = async (canvas: HTMLCanvasElement) => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);

    try {
      const worker = await getOcrWorker();
      const ret = await worker.recognize(canvas);
      const rawText = ret?.data?.text || '';

      if (rawText.trim().length > 0) {
        const parsed = parseKeralaLotteryTicketOcr(rawText);

        if (parsed.ticketNumber && (parsed.confidence >= 70 || parsed.ticketNumber.length === 6)) {
          stopCamera();
          setDetectedResult(parsed);
          setEditSeries(parsed.series || '');
          setEditNumber(parsed.ticketNumber);
          return;
        }
      }
    } catch (err) {
      console.warn('Frame scan OCR error:', err);
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
      setScanAttempts((prev) => prev + 1);
    }
  };

  // Continuous Throttled OCR Scanner Loop
  useEffect(() => {
    if (!isOpen || cameraState !== 'active' || detectedResult) {
      return;
    }

    const runFrameScan = async () => {
      if (isAnalyzingRef.current || !videoRef.current || !streamRef.current) return;
      const video = videoRef.current;

      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        // Crop centered scan box (82% width, 45% height) to maximize OCR speed & accuracy
        const cropW = Math.floor(vw * 0.82);
        const cropH = Math.floor(vh * 0.45);
        const cropX = Math.floor((vw - cropW) / 2);
        const cropY = Math.floor((vh - cropH) / 2);

        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          await processFrameSnapshot(canvas);
        }
      } catch {
        // Ignore frame extraction error
      }
    };

    const intervalId = setInterval(runFrameScan, 800);

    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen, cameraState, detectedResult, stopCamera]);

  // Upload Fallback Processing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingUpload(true);
    setUploadError(null);

    try {
      const worker = await getOcrWorker();
      const ret = await worker.recognize(file);
      const rawText = ret?.data?.text || '';
      const parsed = parseKeralaLotteryTicketOcr(rawText);

      if (parsed.ticketNumber) {
        stopCamera();
        setDetectedResult(parsed);
        setEditSeries(parsed.series || '');
        setEditNumber(parsed.ticketNumber);
      } else {
        setUploadError('Could not clearly detect ticket number in the uploaded photo. Please try another image or enter manually.');
      }
    } catch {
      setUploadError('Failed to read image. Please try again or enter your ticket number manually.');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Confirm detected ticket and send to existing TicketChecker
  const handleConfirmTicket = () => {
    const finalSeries = editSeries.trim().toUpperCase() || null;
    const finalNum = editNumber.trim();
    if (!finalNum || finalNum.length < 3) return;

    const fullTicket = finalSeries ? `${finalSeries} ${finalNum}` : finalNum;

    onTicketDetected({
      ticketNumber: finalNum,
      series: finalSeries,
      fullTicket,
      lotterySlug: detectedResult?.detectedLotterySlug || null,
    });

    onClose();
  };

  // Restart camera scanner for "Scan Again"
  const handleScanAgain = () => {
    setDetectedResult(null);
    setEditSeries('');
    setEditNumber('');
    setUploadError(null);
    startCamera(facingMode);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#10201D]/75 backdrop-blur-xs animate-fadeIn font-tabular"
      role="dialog"
      aria-modal="true"
      aria-label="Scan Kerala Lottery Ticket with Camera"
    >
      <div className="bg-white rounded-3xl border border-[#E2E7E3] shadow-2xl p-5 sm:p-7 max-w-lg w-full space-y-5 relative max-h-[94vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3.5">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
              Real Camera Scanner
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#17201D] tracking-tight">
              Scan Kerala Lottery Ticket
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stop scanner and close"
            className="p-2 rounded-xl text-[#68736E] hover:text-[#17201D] hover:bg-[#F7F7F4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. OCR UPLOAD PROCESSING OVERLAY */}
        {isProcessingUpload && (
          <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#0B3B32] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#17201D]">
                Processing Ticket Photo...
              </h3>
              <p className="text-xs text-[#68736E]">
                Extracting series code and ticket digits with OCR.
              </p>
            </div>
          </div>
        )}

        {/* 2. DETECTED TICKET CONFIRMATION STATE */}
        {!isProcessingUpload && detectedResult && (
          <div className="space-y-5">
            <div className="bg-[#16845B]/10 border border-[#16845B]/30 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-[#16845B]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Ticket detected successfully!</span>
            </div>

            {detectedResult.detectedLotteryName && (
              <div className="text-xs text-[#68736E]">
                Detected Scheme: <strong className="text-[#17201D]">{detectedResult.detectedLotteryName}</strong>
              </div>
            )}

            {/* Editable Detected Ticket Fields */}
            <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-5 space-y-3">
              <span className="text-[11px] font-bold text-[#68736E] uppercase tracking-wider block">
                Detected Ticket Number (Editable)
              </span>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-[#17201D] uppercase block">
                    Series Code
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={editSeries}
                    onChange={(e) => setEditSeries(e.target.value.toUpperCase())}
                    placeholder="e.g. KW"
                    className="w-full p-3 rounded-xl border border-[#E2E7E3] bg-white font-mono font-black text-center text-base sm:text-lg text-[#17201D] focus:border-[#0B3B32] focus:ring-2 focus:ring-[#0B3B32]/20 focus:outline-none uppercase"
                  />
                </div>

                <div className="col-span-8 space-y-1">
                  <label className="text-[10px] font-bold text-[#17201D] uppercase block">
                    Digits (4 to 6 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full p-3 rounded-xl border border-[#E2E7E3] bg-white font-mono font-black text-center text-base sm:text-lg text-[#17201D] tracking-wider focus:border-[#0B3B32] focus:ring-2 focus:ring-[#0B3B32]/20 focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#68736E]">
                If any character was misread by OCR, you can adjust it directly before checking.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleScanAgain}
                aria-label="Scan again"
                className="px-4 py-3 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 font-tabular cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[#68736E]" />
                <span>Scan Again</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmTicket}
                disabled={!editNumber || editNumber.length < 3}
                aria-label="Check ticket against database"
                className="px-5 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 font-tabular cursor-pointer"
              >
                <span>Check Ticket</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3. LIVE CAMERA SCANNING VIEW */}
        {!isProcessingUpload && !detectedResult && (cameraState === 'active' || cameraState === 'requesting') && (
          <div className="space-y-4">
            {/* Live Camera Viewport */}
            <div className="relative bg-[#10201D] rounded-2xl overflow-hidden aspect-4/3 w-full border border-[#E2E7E3] flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Center Ticket Scanning Frame */}
              <div className="absolute inset-x-7 inset-y-10 sm:inset-x-12 sm:inset-y-12 border-2 border-[#0B3B32] rounded-xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(16,32,29,0.55)]">
                {/* Frame Corner Accents */}
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-[#C69A3A] -ml-2 -mt-2 rounded-tl-xs" />
                  <span className="w-4 h-4 border-t-2 border-r-2 border-[#C69A3A] -mr-2 -mt-2 rounded-tr-xs" />
                </div>

                {/* Subtle Vertical Scanning Line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#16845B] to-transparent animate-scanner-line opacity-90" />

                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-[#C69A3A] -ml-2 -mb-2 rounded-bl-xs" />
                  <span className="w-4 h-4 border-b-2 border-r-2 border-[#C69A3A] -mr-2 -mb-2 rounded-br-xs" />
                </div>
              </div>

              {/* Camera Controls Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {/* Torch / Flashlight Button */}
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    aria-label="Toggle flashlight"
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    {torchOn ? <Zap className="w-4 h-4 text-[#C69A3A]" /> : <ZapOff className="w-4 h-4" />}
                  </button>
                )}

                {/* Switch Camera Button */}
                {(videoDevices.length > 1 || typeof navigator !== 'undefined') && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    aria-label="Switch camera"
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                    title="Switch camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status / Instruction Floating Badge */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none px-4">
                <div className="bg-[#10201D]/90 backdrop-blur-xs text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-1.5">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#16845B]" />
                      <span>Scanning...</span>
                    </>
                  ) : scanAttempts >= 3 ? (
                    <span>Move the ticket closer and keep it steady</span>
                  ) : (
                    <>
                      <ScanLine className="w-3.5 h-3.5 text-[#C69A3A]" />
                      <span>Align ticket inside frame</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message if any */}
            {uploadError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Hint & Secondary Upload Link */}
            <div className="flex items-center justify-between pt-1 text-xs text-[#68736E]">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Automatic detection in progress</span>
              </span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-semibold text-[#0B3B32] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload photo instead</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. PERMISSION DENIED STATE */}
        {!isProcessingUpload && !detectedResult && cameraState === 'denied' && (
          <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#B54747] border border-[#E2E7E3] flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-[#17201D]">
                Camera Access Needed
              </h3>
              <p className="text-xs text-[#68736E] max-w-sm mx-auto leading-relaxed">
                Your browser or system returned <strong className="text-[#B54747] font-mono">Permission denied</strong>.
              </p>

              <div className="bg-white border border-[#E2E7E3] rounded-xl p-3 text-left text-xs text-[#17201D] space-y-1.5 max-w-sm mx-auto">
                <span className="font-bold text-[#0B3B32] block text-[11px] uppercase tracking-wider">How to Enable:</span>
                <p className="text-[#68736E]">1. In Chrome, click the <strong>tune/padlock/camera icon</strong> in the address bar $\rightarrow$ set Camera to <strong>Allow</strong>.</p>
                <p className="text-[#68736E]">2. If viewing inside an IDE preview, open <strong className="text-[#0B3B32]">http://localhost:3000</strong> directly in Google Chrome.</p>
                <p className="text-[#68736E]">3. On Mac, check <strong>System Settings $\rightarrow$ Privacy &amp; Security $\rightarrow$ Camera</strong>.</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                aria-label="Try camera again"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload or take ticket photo"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#0B3B32] border border-[#E2E7E3] font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#C69A3A]" />
                <span>Snap / Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Enter ticket manually"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] font-bold text-xs transition-colors cursor-pointer"
              >
                <span>Enter Manually</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. CAMERA UNAVAILABLE STATE */}
        {!isProcessingUpload && !detectedResult && cameraState === 'unavailable' && (
          <div className="bg-[#F7F7F4] border border-[#E2E7E3] rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#68736E] border border-[#E2E7E3] flex items-center justify-center mx-auto shadow-xs">
              <ScanLine className="w-6 h-6 text-[#C69A3A]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-[#17201D]">
                Camera Scanning Is Not Available
              </h3>
              <p className="text-xs text-[#68736E] max-w-sm mx-auto leading-relaxed">
                Your browser or device does not currently allow camera streaming. You can upload a photo of your ticket or enter the ticket number manually.
              </p>
              {cameraErrorDetails && (
                <p className="text-[11px] font-mono text-[#68736E] bg-white border border-[#E2E7E3] p-2 rounded-xl max-w-sm mx-auto">
                  {cameraErrorDetails}
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Enter ticket manually"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-[#F7F7F4] text-[#17201D] border border-[#E2E7E3] font-bold text-xs transition-colors cursor-pointer"
              >
                <span>Enter Manually</span>
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Input for Secondary Upload Fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Privacy Note */}
        <div className="text-center pt-2 border-t border-[#E2E7E3]">
          <p className="text-[11px] text-[#68736E]">
            Ticket scanning processes on your device locally. Camera streams are never stored or transmitted.
          </p>
        </div>
      </div>
    </div>
  );
}
