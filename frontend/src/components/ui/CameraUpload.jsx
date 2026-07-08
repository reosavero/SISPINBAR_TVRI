// ============================================
// CAMERA UPLOAD COMPONENT - Sistem Peminjaman Barang TVRI
// ============================================
// Reusable component for photo upload - CAMERA ONLY
// Hanya bisa mengakses kamera langsung, BUKAN dari galeri.
// Ini untuk memastikan akuntabilitas bukti foto peminjaman/pengembalian.
//
// Alur kerja:
// 1. User klik area upload → langsung buka kamera
// 2. Kamera terbuka via getUserMedia (desktop/tablet)
//    atau fallback ke <input capture> (mobile)
// 3. User ambil foto → preview ditampilkan
// 4. User bisa ambil ulang foto jika perlu
//
// FIX: Black screen on retake — pastikan stream di-restart
// dengan benar dan video.play() dipanggil setelah srcObject di-set.
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { FiCamera, FiX, FiRefreshCw, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CameraUpload({
  preview,
  onFileSelect,
  onRemove,
  label = 'Foto',
  required = false,
}) {
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [streamReady, setStreamReady] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraInputRef = useRef(null);
  const streamRef = useRef(null);
  const retryCountRef = useRef(0);

  // Stop camera stream completely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load?.();
    }
    setStreamReady(false);
  }, []);

  // Start camera stream via getUserMedia
  const startCamera = useCallback(async () => {
    // Stop any existing stream first
    stopCamera();
    setStreamReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // Wait for video to be ready before playing
        video.onloadedmetadata = () => {
          video.play().then(() => {
            setStreamReady(true);
            retryCountRef.current = 0;
          }).catch((err) => {
            console.error('Video play error:', err);
            // Retry play after a short delay
            setTimeout(() => {
              video.play().then(() => {
                setStreamReady(true);
              }).catch(() => {
                setStreamReady(true); // Still mark as ready even if play fails
              });
            }, 200);
          });
        };
        // Trigger loadedmetadata event
        video.load();
      } else {
        // Video ref not available yet, retry after a short delay
        setTimeout(() => {
          const v = videoRef.current;
          if (v && streamRef.current) {
            v.srcObject = streamRef.current;
            v.onloadedmetadata = () => {
              v.play().then(() => setStreamReady(true)).catch(() => setStreamReady(true));
              v.load();
            };
            v.load();
          }
        }, 100);
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Izin kamera ditolak. Berikan izin kamera di pengaturan browser.');
      } else if (err.name === 'NotFoundError') {
        toast.error('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        toast.error('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
      }
      setShowCamera(false);
    }
  }, [facingMode, stopCamera]);

  // Open camera modal
  const openCamera = useCallback(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setCapturedPreview(null);
      setStreamReady(false);
      setShowCamera(true);
    } else {
      // Fallback for browsers without getUserMedia
      cameraInputRef.current?.click();
    }
  }, []);

  // Start camera when modal opens
  useEffect(() => {
    if (showCamera) {
      // Small delay to ensure video element is rendered in DOM
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
      setCapturedPreview(null);
    }
  }, [showCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart camera when facing mode changes
  useEffect(() => {
    if (showCamera && streamRef.current) {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle file from fallback <input capture>
  const handleFallbackCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onFileSelect(file, ev.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Use actual video dimensions
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, vw, vh);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `bukti-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedPreview(previewUrl);
          onFileSelect(file, previewUrl);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // Retake photo - restart the camera and go back to live view
  const retakePhoto = useCallback(() => {
    setCapturedPreview(null);
    // Stop current stream and restart camera
    // This ensures a fresh stream and avoids black screen
    setTimeout(() => {
      startCamera();
    }, 100);
  }, [startCamera]);

  // Confirm captured photo and close camera
  const confirmPhoto = useCallback(() => {
    setShowCamera(false);
    stopCamera();
  }, [stopCamera]);

  // Switch front/back camera
  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  return (
    <>
      {/* ===== Upload Area / Preview ===== */}
      {!preview ? (
        <div
          onClick={openCamera}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#005BAC] hover:bg-blue-50/30 transition-all group active:scale-[0.98]"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#005BAC]/10 to-[#005BAC]/5 flex items-center justify-center group-hover:from-[#005BAC]/20 group-hover:to-[#005BAC]/10 transition-all">
              <FiCamera className="w-8 h-8 text-[#005BAC]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 group-hover:text-[#005BAC] transition-colors">
                Ambil Foto dari Kamera
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Klik untuk membuka kamera dan ambil foto bukti
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview foto bukti"
            className="w-full max-h-64 object-contain rounded-xl border border-gray-200"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
            title="Hapus foto"
          >
            <FiX className="w-4 h-4" />
          </button>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-xl flex items-center justify-center">
            <button
              type="button"
              onClick={openCamera}
              className="opacity-0 group-hover:opacity-100 bg-white/90 text-[#005BAC] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center gap-2"
            >
              <FiCamera className="w-4 h-4" />
              Ambil Ulang Foto
            </button>
          </div>
          {/* Badge: Camera-only indicator */}
          <div className="absolute bottom-2 left-2 bg-[#005BAC] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
            <FiCamera className="w-3 h-3" />
            FOTO KAMERA
          </div>
        </div>
      )}

      {/* Hidden fallback input for browsers without getUserMedia */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        capture="environment"
        onChange={handleFallbackCapture}
        className="hidden"
      />

      {/* ===== Camera Modal (Fullscreen Overlay) ===== */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {/* Camera Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-red-300 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold">Kamera Aktif</p>
                <p className="text-[10px] text-white/60">
                  {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setShowCamera(false);
              }}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title="Tutup kamera"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Camera View / Captured Preview */}
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            {!capturedPreview ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Loading indicator */}
                {!streamReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center">
                      <div className="animate-spin w-10 h-10 border-3 border-white/20 border-t-white rounded-full mx-auto mb-3" />
                      <p className="text-white/70 text-sm">Membuka kamera...</p>
                    </div>
                  </div>
                )}

                {/* Guide overlay */}
                {streamReady && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner brackets */}
                    <div className="absolute top-[15%] left-[10%] w-12 h-12 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
                    <div className="absolute top-[15%] right-[10%] w-12 h-12 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
                    <div className="absolute bottom-[20%] left-[10%] w-12 h-12 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
                    <div className="absolute bottom-[20%] right-[10%] w-12 h-12 border-b-2 border-r-2 border-white/50 rounded-br-lg" />
                    {/* Center guide text */}
                    <div className="absolute bottom-[8%] left-0 right-0 text-center">
                      <p className="text-white/70 text-xs font-medium bg-black/40 inline-block px-3 py-1.5 rounded-lg backdrop-blur-sm">
                        Arahkan kamera ke barang sebagai bukti
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <img
                  src={capturedPreview}
                  alt="Foto yang diambil"
                  className="w-full h-full object-contain"
                />
                {/* Confirmation overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4 px-6">
                  <p className="text-white text-sm font-semibold text-center mb-3">
                    Foto sudah diambil. Gunakan foto ini?
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors touch-manipulation min-h-[44px]"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      Ambil Ulang
                    </button>
                    <button
                      type="button"
                      onClick={confirmPhoto}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-colors touch-manipulation min-h-[44px]"
                    >
                      <FiCheck className="w-4 h-4" />
                      Gunakan Foto
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Camera Controls */}
          {!capturedPreview && (
            <div className="bg-black/80 px-4 py-6">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {/* Switch camera button */}
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  disabled={!streamReady}
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30 touch-manipulation min-h-[44px]"
                  title="Ganti kamera"
                >
                  <FiRefreshCw className="w-5 h-5 text-white" />
                </button>

                {/* Capture button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!streamReady}
                  className="w-[72px] h-[72px] rounded-full bg-white border-4 border-white shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                >
                  <div className="w-[56px] h-[56px] rounded-full bg-[#005BAC] border-2 border-white/30" />
                </button>

                {/* Spacer to balance layout */}
                <div className="w-12 h-12" />
              </div>
              <p className="text-center text-white/50 text-xs mt-2">
                Tekan tombol untuk mengambil foto
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}