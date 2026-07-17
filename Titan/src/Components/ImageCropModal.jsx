import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { MdClose } from 'react-icons/md';

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const { width, height, x, y } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

      canvas.toBlob((blob) => {
        onCropComplete(blob);
        onClose();
      }, 'image/jpeg', 0.95);
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 text-white rounded-lg w-[95%] max-w-2xl shadow-lg border border-zinc-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-yellow-400">Crop Profile Photo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        {imageSrc && (
          <>
            <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden mb-4">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2">Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-accent-600"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded bg-accent-600 hover:bg-accent-700 transition text-sm text-white"
              >
                Confirm Crop
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageCropModal;
