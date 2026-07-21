

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FiCrop, FiZoomIn, FiZoomOut, FiCheck, FiX, FiRotateCw, FiMove } from 'react-icons/fi';
import Modal from './Modal';
import Button from './Button';

const ASPECT_RATIOS = [
  { label: '4:3', value: 4 / 3, name: 'Standar', desc: 'Cocok untuk umum' },
  { label: '1:1', value: 1, name: 'Persegi', desc: 'Cocok untuk ikon' },
  { label: '16:9', value: 16 / 9, name: 'Layar Lebar', desc: 'Cocok untuk video' },
  { label: '3:2', value: 3 / 2, name: 'Foto', desc: 'Cocok untuk foto landscape' },
  { label: '2:3', value: 2 / 3, name: 'Potrait', desc: 'Cocok untuk foto vertikal' },
  { label: 'Bebas', value: null, name: 'Bebas', desc: 'Rasio tanpa batas' },
];

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete, defaultAspect = 4 / 3 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(defaultAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleAspectChange = (ratio) => {
    setAspect(ratio.value);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    setProcessing(true);
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(result);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    }
    setProcessing(false);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(defaultAspect);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atur Foto Barang" size="xl">
      <div className="space-y-4">
        {
}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
          <FiMove className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Geser &amp; zoom foto untuk mengatur area yang ditampilkan</p>
            <p className="text-xs text-blue-600 mt-0.5">Pilih rasio foto sesuai kebutuhan, lalu geser foto ke posisi yang diinginkan</p>
          </div>
        </div>

        {
}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiCrop className="w-4 h-4 inline mr-1 -mt-0.5" />
            Pilih Rasio Foto
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => handleAspectChange(ratio)}
                className={`px-3 py-2 rounded-xl text-center transition-all ${
                  aspect === ratio.value
                    ? 'bg-[#005BAC] text-white shadow-md scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="block text-sm font-bold">{ratio.label}</span>
                <span className="block text-[10px] opacity-75">{ratio.name}</span>
              </button>
            ))}
          </div>
        </div>

        {
}
        <div className="relative w-full bg-gray-900 rounded-xl overflow-hidden" style={{ height: '350px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect || undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropChange}
            style={{
              containerStyle: { borderRadius: '0.75rem' },
            }}
          />
        </div>

        {
}
        <div className="flex items-center gap-3">
          <FiZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005BAC]"
          />
          <FiZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 w-12 text-right font-mono">{Math.round(zoom * 100)}%</span>
        </div>

        {
}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={handleReset} icon={FiRotateCw}>
            Atur Ulang
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} icon={FiX}>
              Batal
            </Button>
            <Button onClick={handleConfirm} loading={processing} icon={FiCheck}>
              Gunakan Foto
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  
  const MAX_DIMENSION = 1200;
  const scale = Math.min(MAX_DIMENSION / pixelCrop.width, MAX_DIMENSION / pixelCrop.height, 1);

  canvas.width = Math.round(pixelCrop.width * scale);
  canvas.height = Math.round(pixelCrop.height * scale);

  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        const file = new File([blob], 'barang-foto.jpg', { type: 'image/jpeg' });
        resolve({ blob, url, file });
      },
      'image/jpeg',
      0.85
    );
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

export default ImageCropModal;
export { getCroppedImg, ASPECT_RATIOS };