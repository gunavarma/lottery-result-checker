'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  ZapOff,
  Edit2,
  ArrowRight,
  Loader2,
  Ticket,
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

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'denied' | 'unavailable'>('requesting');
  const [processingOcr, setProcessingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const [detectedResult, setDetectedResult] = useState<DetectedTicketResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editSeries, setEditSeries] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraState('requesting');
    setErrorMessage(null);
    setDetectedResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unavailable');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setCameraState('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Check if torch/flashlight is supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        setHasTorch(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
      } else {
        setCameraState('unavailable');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    try {
      const newTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newTorch }],
      });
      setTorchOn(newTorch);
    } catch {
      // Ignore torch error
    }
  };

  // Perform OCR using Tesseract.js (dynamically imported)
  const processImageOcr = async (imageSource: string | HTMLCanvasElement | File) => {
    setProcessingOcr(true);
    setOcrProgress('INITIALIZING OCR ENGINE...');
    setErrorMessage(null);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`READING TICKET... ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      });

      const ret = await worker.recognize(imageSource);
      await worker.terminate();

      const parsed = parseKeralaLotteryTicketOcr(ret.data.text || '');

      if (!parsed.ticketNumber) {
        setErrorMessage('Could not clearly detect ticket numbers. Please position the ticket clearly inside the frame or enter manually.');
        setDetectedResult(null);
      } else {
        setDetectedResult(parsed);
        setEditSeries(parsed.series || '');
        setEditNumber(parsed.ticketNumber || '');
        stopCamera();
      }
    } catch (error: any) {
      console.error('OCR error:', error);
      setErrorMessage('OCR processing failed. Please try capturing again or enter your ticket manually.');
    } finally {
      setProcessingOcr(false);
      setOcrProgress('');
    }
  };

  // Capture frame from live video
  const captureFrame = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    processImageOcr(canvas);
  };

  // Handle uploaded file or gallery image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processImageOcr(file);
  };

  const handleConfirmTicket = () => {
    if (!detectedResult && !editNumber) return;

    const finalSeries = editSeries.trim().toUpperCase() || null;
    const finalNumber = editNumber.trim();
    const fullTicket = finalSeries ? `${finalSeries} ${finalNumber}` : finalNumber;

    onTicketDetected({
      ticketNumber: finalNumber,
      series: finalSeries,
      fullTicket,
      lotterySlug: detectedResult?.detectedLotterySlug || null,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141716]/80 animate-fadeIn font-tabular"
      role="dialog"
      aria-modal="true"
      aria-label="Scan Kerala Lottery Ticket"
    >
      <div className="bg-[#FAF9F5] border-2 border-[#0A3828] p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 relative max-h-[95vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E1E6E1] pb-3">
          <div>
            <span className="text-[10px] font-extrabold text-[#0A3828] uppercase tracking-widest block">
              OPTICAL TICKET RECOGNITION
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#141716] uppercase tracking-tight mt-0.5">
              SCAN KERALA LOTTERY TICKET
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="p-1.5 text-[#646E68] hover:text-[#141716] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. OCR PROCESSING STATE */}
        {processingOcr && (
          <div className="bg-white border border-[#E1E6E1] p-8 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#0A3828] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#141716] uppercase">
                {ocrProgress || 'READING TICKET...'}
              </h3>
              <p className="text-xs text-[#646E68]">
                Extracting series code and 6-digit ticket numbers...
              </p>
            </div>
          </div>
        )}

        {/* 2. DETECTED RESULT CONFIRMATION STATE */}
        {!processingOcr && detectedResult && (
          <div className="bg-white border border-[#127A52] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-[#0A3828] uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#127A52]" />
              <span>SCAN COMPLETE — DETECTED TICKET</span>
            </div>

            {detectedResult.detectedLotteryName && (
              <div className="text-xs text-[#646E68]">
                Detected Scheme: <strong className="text-[#141716] uppercase">{detectedResult.detectedLotteryName}</strong>
              </div>
            )}

            {!isEditing ? (
              <div className="bg-[#FAF9F5] border border-[#E1E6E1] p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#646E68] uppercase font-bold tracking-wider block">
                    TICKET NUMBER
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-ticket-mono text-[#141716] block mt-0.5">
                    {editSeries ? `${editSeries} ` : ''}{editNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-white border border-[#E1E6E1] text-[#0A3828] text-xs font-bold uppercase inline-flex items-center gap-1 hover:bg-[#FAF9F5]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>EDIT</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 bg-[#FAF9F5] p-3 border border-[#E1E6E1]">
                <span className="text-[10px] text-[#646E68] uppercase font-bold tracking-wider block">
                  CORRECT DETECTED CHARACTERS:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <label className="text-[9px] text-[#646E68] uppercase font-bold block mb-1">SERIES</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={editSeries}
                      onChange={(e) => setEditSeries(e.target.value.toUpperCase())}
                      placeholder="KW"
                      className="w-full p-2 bg-white border border-[#E1E6E1] text-xs font-black uppercase text-center focus:border-[#0A3828]"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[9px] text-[#646E68] uppercase font-bold block mb-1">6 DIGITS / 4 DIGITS</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      placeholder="123456"
                      className="w-full p-2 bg-white border border-[#E1E6E1] text-xs font-mono font-black text-center focus:border-[#0A3828]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold text-[#0A3828] underline uppercase pt-1"
                >
                  DONE EDITING
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={startCamera}
                className="py-3 bg-white border border-[#E1E6E1] hover:bg-[#FAF9F5] text-[#141716] font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>SCAN AGAIN</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmTicket}
                className="py-3 bg-[#0A3828] hover:bg-[#072B1E] text-white font-black text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5 border border-[#0A3828]"
              >
                <span>CHECK TICKET</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. ACTIVE LIVE CAMERA SCANNING VIEW */}
        {!processingOcr && !detectedResult && cameraState === 'active' && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-none overflow-hidden aspect-4/3 flex items-center justify-center border-2 border-[#0A3828]">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Scanning Target Box & Line */}
              <div className="absolute inset-x-8 inset-y-12 border-2 border-[#C59B27] pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-white -ml-2.5 -mt-2.5" />
                  <span className="w-4 h-4 border-t-2 border-r-2 border-white -mr-2.5 -mt-2.5" />
                </div>

                {/* Animated Scan Line */}
                <div className="w-full h-0.5 bg-[#C59B27] animate-scan shadow-[0_0_8px_#C59B27]" />

                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-white -ml-2.5 -mb-2.5" />
                  <span className="w-4 h-4 border-b-2 border-r-2 border-white -mr-2.5 -mb-2.5" />
                </div>
              </div>

              {/* Torch Button if supported */}
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  aria-label="Toggle Flashlight"
                >
                  {torchOn ? <Zap className="w-4 h-4 text-[#C59B27]" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              {/* Instructions Overlay */}
              <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
                <span className="text-[10px] font-bold text-white bg-black/70 px-3 py-1 uppercase tracking-wider">
                  Align ticket number inside the gold frame
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Shutter Capture Button */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={captureFrame}
                className="flex-1 py-3.5 bg-[#0A3828] hover:bg-[#072B1E] text-white font-black text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 border border-[#0A3828] cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#C59B27]" />
                <span>CAPTURE & READ TICKET</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-3.5 px-4 bg-white hover:bg-[#FAF9F5] text-[#141716] font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 border border-[#E1E6E1] cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#646E68]" />
                <span>UPLOAD PHOTO</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. CAMERA DENIED / UNAVAILABLE FALLBACK */}
        {!processingOcr && !detectedResult && (cameraState === 'denied' || cameraState === 'unavailable') && (
          <div className="bg-white border border-[#E1E6E1] p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-[#FAF9F5] text-[#646E68] flex items-center justify-center mx-auto border border-[#E1E6E1]">
              <Camera className="w-6 h-6 text-[#C59B27]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#141716] uppercase">
                {cameraState === 'denied' ? 'CAMERA ACCESS REQUIRED' : 'CAMERA UNAVAILABLE ON THIS DEVICE'}
              </h3>
              <p className="text-xs text-[#646E68] max-w-sm mx-auto leading-relaxed">
                {cameraState === 'denied'
                  ? 'Please allow camera permissions in your browser settings to scan physical tickets, or upload a photo directly.'
                  : 'You can upload an image of your physical lottery ticket or enter the ticket number manually.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#0A3828] text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-[#072B1E] transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>UPLOAD TICKET PHOTO</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#E1E6E1] text-[#141716] font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center hover:bg-[#FAF9F5] transition-colors"
              >
                <span>ENTER MANUALLY</span>
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Privacy Note */}
        <div className="text-center pt-2 border-t border-[#E1E6E1]">
          <p className="text-[10px] text-[#646E68]">
            Ticket photos are processed entirely on your device and are never permanently stored.
          </p>
        </div>
      </div>
    </div>
  );
}
