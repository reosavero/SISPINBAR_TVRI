// ============================================
// CAMERA UPLOAD COMPONENT - Sistem Peminjaman Barang TVRI
// ============================================
// Reusable component for photo upload with two options:
// 1. Ambil Foto (Kamera) - opens device camera via getUserMedia
// 2. Pilih dari Galeri - opens file picker
// Falls back to <input capture> on unsupported browsers
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { FiCamera, FiUpload, FiX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CameraUpload({
  preview,
  onFileSelect,
  onRemove,
  label = 'Foto',
  required = false,
}) {
  const [showChoices, setShowChoices] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [streamReady, setStreamReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const streamRef = useRef(null);
  const containerRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamReady(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Gagal mengakses kamera. Silakan pilih file dari galeri.');
      setShowCamera(false);
    }
  }, [facingMode]);

  // Start/stop camera when modal opens/closes
  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart camera when facing mode changes
  useEffect(() => {
    if (showCamera && streamRef.current) {
      stopCamera();
      // Small delay to let previous stream fully stop
      const timer = setTimeout(() => startCamera(), 300);
      return () => clearTimeout(timer);
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close choices dropdown on outside click
  useEffect(() => {
    if (!showChoices) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowChoices(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showChoices]);

  // Handle file selection from gallery
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onFileSelect(file, ev.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    setShowChoices(false);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `foto-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
          onFileSelect(file, previewUrl);
          setShowCamera(false);
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const handleChoiceCamera = () => {
    setShowChoices(false);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setShowCamera(true);
    } else {
      // Fallback for browsers without getUserMedia
      cameraInputRef.current?.click();
    }
  };

  const handleChoiceFile = () => {
    setShowChoices(false);
    fileInputRef.current?.click();
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <>
      {/* Upload Area */}
      <div ref={containerRef} className="relative">
        {!preview ? (
          <div
            onClick={() => setShowChoices(true)}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#005BAC] hover:bg-blue-50/30 transition-all group"
          >
            <FiCamera className="w-10 h-10 text-gray-300 group-hover:text-[#005BAC] mx-auto mb-2 transition-colors" />
            <p className="text-sm font-medium text-gray-500 group-hover:text-[#005BAC] transition-colors">
              Klik untuk mengunggah foto
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG, atau WebP
            </p>
          </div>
        ) : (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-64 object-contain rounded-xl border border-gray-200"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
            >
              <FiX className="w-4 h-4" />
            </button>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-xl flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowChoices(true)}
                className="opacity-0 group-hover:opacity-100 bg-white/90 text-[#005BAC] px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md"
              >
                Ganti Foto
              </button>
            </div>
          </div>
        )}

        {/* Choices Dropdown */}
        {showChoices && (
          <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={handleChoiceCamera}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[#005BAC]/10 flex items-center justify-center flex-shrink-0">
                <FiCamera className="w-5 h-5 text-[#005BAC]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Ambil Foto (Kamera)
                </p>
                <p className="text-xs text-gray-500">
                  Buka kamera untuk mengambil foto langsung
                </p>
              </div>
            </button>
            <div className="border-t border-gray-100" />
            <button
              type="button"
              onClick={handleChoiceFile}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <FiUpload className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Pilih dari Galeri
                </p>
                <p className="text-xs text-gray-500">
                  Pilih file foto dari perangkat
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera Modal (Fullscreen Overlay) */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[70vh] object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Switch camera button */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white rounded-full p-2.5 hover:bg-white/30 transition-colors"
                title="Ganti kamera"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={() => {
                  setShowCamera(false);
                  stopCamera();
                }}
                className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white rounded-full p-2.5 hover:bg-white/30 transition-colors"
                title="Tutup kamera"
              >
                <FiX className="w-5 h-5" />
              </button>

              {/* Loading indicator */}
              {!streamReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full" />
                </div>
              )}
            </div>

            {/* Capture button */}
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!streamReady}
                className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-full bg-[#005BAC]" />
              </button>
            </div>
            <p className="text-center text-white/70 text-sm mt-2">
              Tekan tombol untuk mengambil foto
            </p>
          </div>
        </div>
      )}
    </>
  );
}